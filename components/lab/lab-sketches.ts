// Lab sketches: small live drawings of the systems behind this site, in the
// site's own matter (grains of light on a 2D canvas, additive). The bird and
// the bust are drawn from the very bakes the home stage uploads to the GPU
// (/models/bird-bake.bin, /models/ataberk-bake.bin), so what you see here is
// the real data, not an illustration of it.
//
//   bird       9,000 baked skin samples flapping through 16 frames
//   bust       the 120,000-point scan with a depth scan line sweeping it
//   voyage     code grains gather into the X, open into the portal, rush
//              past as the tunnel
//   helix      the selected-work cards turning on a helix of grains
//   forensics  the Mali bug: neighbour indices cut to 16 bits scatter the
//              bird into a cloud; at full precision it re-forms

export type SketchKind = "bird" | "bust" | "voyage" | "helix" | "forensics";

const LIME = [200, 255, 62];
const CYAN = [138, 230, 255];
const BONE = [243, 239, 231];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (u: number) => u * u * (3 - 2 * u);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function halfToFloat(h: number) {
  const s = h & 0x8000 ? -1 : 1;
  const e = (h >> 10) & 0x1f;
  const f = h & 0x3ff;
  if (e === 0) return s * 2 ** -14 * (f / 1024);
  if (e === 31) return 0;
  return s * 2 ** (e - 15) * (1 + f / 1024);
}

// Bakes are fetched once per page and shared by every sketch that needs them.
const bakes = new Map<string, Promise<Float32Array>>();
function loadBake(url: string, floats: number) {
  let p = bakes.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${url}: ${r.status}`))))
      .then((buf) => {
        const src = new Uint16Array(buf, 0, Math.min(floats, buf.byteLength / 2));
        const out = new Float32Array(src.length);
        for (let i = 0; i < src.length; i++) out[i] = halfToFloat(src[i]);
        return out;
      });
    bakes.set(url, p);
  }
  return p;
}

// Bird bake: 16 frames × 5 rows × 2048 texels, RGBA, sample-major per frame.
const BIRD_SAMPLES = 9000;
const BIRD_FRAME = 5 * 2048 * 4;
const birdBake = () => loadBake("/models/bird-bake.bin", 16 * BIRD_FRAME);
// Bust bake: 59 rows × 2048 texels of positions (normals follow; unused).
const BUST_COUNT = 120000;
const bustBake = () => loadBake("/models/ataberk-bake.bin", BUST_COUNT * 4);

type Ctx = CanvasRenderingContext2D;
// What the visitor does to a sketch: drag turns it (radians, with inertia),
// and each card's controls set named params.
export type Input = { yaw: number; pitch: number; dt: number; params: Record<string, string | number> };
type Draw = (ctx: Ctx, w: number, h: number, t: number, io: Input) => void;
type Sketch = { draw: Draw; ready: Promise<void>; phase?: (t: number) => number };

// Colour buckets: grains are binned by tone so each bin is one fillStyle.
function buckets(n: number) {
  return Array.from({ length: n }, () => [] as number[]);
}
function flush(ctx: Ctx, bins: number[][], styles: string[], size: number) {
  for (let b = 0; b < bins.length; b++) {
    const list = bins[b];
    if (!list.length) continue;
    ctx.fillStyle = styles[b];
    for (let i = 0; i < list.length; i += 2) ctx.fillRect(list[i] - size / 2, list[i + 1] - size / 2, size, size);
    list.length = 0;
  }
}
const hueStyles = (n: number, s: number, l: number, a: number, offset = 0) =>
  Array.from({ length: n }, (_, i) => `hsl(${(offset + (i / n) * 300) % 360} ${s}% ${l}% / ${a})`);

function birdSketch(scatter: boolean): Sketch {
  let pos: Float32Array | null = null;
  let scale = 1;
  const BINS = 14;
  const bins = buckets(BINS);
  const palettes: Record<string, string[]> = {
    spectrum: hueStyles(BINS, 90, 66, 0.85, 150),
    lime: Array.from({ length: BINS }, (_, i) => `rgb(${Math.round(mix(LIME[0], CYAN[0], i / BINS))} ${Math.round(mix(LIME[1], CYAN[1], i / BINS))} ${Math.round(mix(LIME[2], CYAN[2], i / BINS))} / 0.85)`),
    violet: Array.from({ length: BINS }, (_, i) => `hsl(${250 + (i / BINS) * 70} 85% 70% / 0.85)`),
  };
  let flapClock = 0, broken = 1;
  // Forensics: each grain's patch corners. Correct links are the sample
  // itself (a tight patch); the 16-bit links land on unrelated samples.
  const rand = rng(7);
  const u = new Float32Array(BIRD_SAMPLES), v = new Float32Array(BIRD_SAMPLES);
  const far1 = new Uint16Array(BIRD_SAMPLES), far2 = new Uint16Array(BIRD_SAMPLES);
  for (let i = 0; i < BIRD_SAMPLES; i++) {
    u[i] = (rand() - 0.5) * 1.1; v[i] = (rand() - 0.5) * 1.1;
    // Index rounded the way a 16-bit float rounds it above 2048.
    const n1 = Math.floor(rand() * BIRD_SAMPLES), n2 = Math.floor(rand() * BIRD_SAMPLES);
    const q = (k: number) => (k < 2048 ? k : k < 4096 ? k & ~1 : k < 8192 ? k & ~3 : k & ~7);
    far1[i] = q(n1); far2[i] = q(n2);
  }
  // The bake is not centred on its origin: centre on frame 0's bounds.
  const centre = [0, 0, 0];
  const ready = birdBake().then((data) => {
    pos = data;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < BIRD_SAMPLES * 4; i += 4) {
      for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], data[i + a]); hi[a] = Math.max(hi[a], data[i + a]); }
    }
    for (let a = 0; a < 3; a++) centre[a] = (lo[a] + hi[a]) / 2;
    scale = 2 / Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2], 1e-6);
  });
  // Forensics cycle: 0 scattered (lowp), 1 re-forming, 2 whole (highp).
  const cycle = (t: number) => (t % 7) / 7;
  const draw: Draw = (ctx, w, h, t, io) => {
    if (!pos) return;
    flapClock += io.dt * 9 * Number(io.params.speed ?? 1);
    const R = Math.min(w * 0.34, h * 0.42);
    const cx = w / 2, cy = h * 0.38;
    const f = scatter ? 4 : ((flapClock % 16) + 16) % 16;
    const f0 = Math.floor(f), f1 = (f0 + 1) % 16, k = f - f0;
    const yaw = (scatter ? 1.2 + Math.sin(t * 0.3) * 0.35 : 1.25 + Math.sin(t * 0.35) * 0.55) + io.yaw;
    const pitch = 0.32 + io.pitch;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    if (scatter) {
      // Precision is the visitor's switch; until they touch it, it cycles.
      const c = cycle(t);
      const auto = c < 0.38 ? 1 : c < 0.55 ? 1 - ease((c - 0.38) / 0.17) : c < 0.9 ? 0 : ease((c - 0.9) / 0.1);
      const p = io.params.precision;
      broken = p === "lowp" ? mix(broken, 1, Math.min(1, io.dt * 3)) : p === "highp" ? mix(broken, 0, Math.min(1, io.dt * 3)) : auto;
    } else broken = 0;
    const styles = palettes[String(io.params.palette ?? "spectrum")] ?? palettes.spectrum;
    const size = w < 420 ? 1.5 : 1.8;
    for (let i = 0; i < BIRD_SAMPLES; i++) {
      const a = f0 * BIRD_FRAME + i * 4, b = f1 * BIRD_FRAME + i * 4;
      let x = mix(pos[a], pos[b], k), y = mix(pos[a + 1], pos[b + 1], k), z = mix(pos[a + 2], pos[b + 2], k);
      if (broken > 0) {
        const p1 = f0 * BIRD_FRAME + far1[i] * 4, p2 = f0 * BIRD_FRAME + far2[i] * 4;
        x += ((pos[p1] - x) * u[i] + (pos[p2] - x) * v[i]) * broken;
        y += ((pos[p1 + 1] - y) * u[i] + (pos[p2 + 1] - y) * v[i]) * broken;
        z += ((pos[p1 + 2] - z) * u[i] + (pos[p2 + 2] - z) * v[i]) * broken;
      }
      x = (x - centre[0]) * scale; y = (y - centre[1]) * scale; z = (z - centre[2]) * scale;
      const rx = x * cyw + z * syw, rz = -x * syw + z * cyw;
      const ry = y * cp - rz * sp, rz2 = y * sp + rz * cp;
      const persp = 1 / (1.5 - rz2 * 0.3);
      const along = clamp01(z * 0.5 + 0.5);
      const bin = Math.min(BINS - 1, Math.floor(((along + t * 0.02) % 1) * BINS));
      bins[bin].push(cx + rx * R * persp * 1.6, cy - ry * R * persp * 1.6);
    }
    flush(ctx, bins, styles, size);
  };
  return { draw, ready, phase: scatter ? () => (broken > 0.5 ? 0 : 1) : undefined };
}

function bustSketch(small: boolean): Sketch {
  let pts: Float32Array | null = null;
  const step = small ? 9 : 5;
  const BINS = 8;
  const bins = buckets(BINS);
  const styles = [
    ...Array.from({ length: 6 }, (_, i) => `rgb(${CYAN.join(" ")} / ${0.18 + i * 0.07})`),
    `rgb(${LIME.join(" ")} / 0.9)`,
    `rgb(${BONE.join(" ")} / 0.95)`,
  ];
  const ready = bustBake().then((data) => {
    const n = Math.floor(BUST_COUNT / step);
    pts = new Float32Array(n * 3);
    let minY = Infinity, maxY = -Infinity, cxs = 0, czs = 0;
    for (let j = 0; j < n; j++) {
      const i = j * step * 4;
      pts[j * 3] = data[i]; pts[j * 3 + 1] = data[i + 1]; pts[j * 3 + 2] = data[i + 2];
      minY = Math.min(minY, data[i + 1]); maxY = Math.max(maxY, data[i + 1]);
      cxs += data[i]; czs += data[i + 2];
    }
    const mx = cxs / n, mz = czs / n, my = (minY + maxY) / 2, s = 2 / (maxY - minY || 1);
    for (let j = 0; j < n; j++) {
      pts[j * 3] = (pts[j * 3] - mx) * s; pts[j * 3 + 1] = (pts[j * 3 + 1] - my) * s; pts[j * 3 + 2] = (pts[j * 3 + 2] - mz) * s;
    }
  });
  const depthStyles = Array.from({ length: 8 }, (_, i) => `hsl(${190 - i * 18} 90% ${55 + i * 3}% / 0.8)`);
  const plainStyles = Array.from({ length: 8 }, (_, i) => `rgb(${BONE.join(" ")} / ${0.2 + i * 0.08})`);
  const draw: Draw = (ctx, w, h, t, io) => {
    if (!pts) return;
    const R = h * 0.42;
    const cx = w / 2, cy = h * 0.53;
    const yaw = Math.sin(t * 0.4) * 0.7 + io.yaw;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const mode = String(io.params.mode ?? "scan");
    const scan = mode === "scan" ? 1 - ((t * 0.35) % 1.3) * 2 : 9;
    const size = small ? 1.3 : 1.5;
    for (let j = 0; j < pts.length; j += 3) {
      const x = pts[j], y = pts[j + 1], z = pts[j + 2];
      const rx = x * cyw + z * syw, rz = -x * syw + z * cyw;
      const d = Math.abs(y - scan);
      const depth = Math.max(0, Math.min(7, Math.floor((rz + 0.7) * 5.5)));
      const bin = mode === "scan" ? (d < 0.015 ? 7 : d < 0.06 ? 6 : Math.max(0, Math.min(5, Math.floor((rz + 0.6) * 4)))) : depth;
      bins[bin].push(cx + rx * R, cy - y * R);
    }
    flush(ctx, bins, mode === "depth" ? depthStyles : mode === "plain" ? plainStyles : styles, size);
  };
  return { draw, ready };
}

function voyageSketch(small: boolean): Sketch {
  const N = small ? 900 : 1500;
  const rand = rng(11);
  const seeds = Array.from({ length: N }, () => ({ a: rand(), b: rand(), c: rand(), d: rand() }));
  const bins = buckets(3);
  const styles = [`rgb(${BONE.join(" ")} / 0.75)`, `rgb(${CYAN.join(" ")} / 0.85)`, `rgb(${LIME.join(" ")} / 0.85)`];
  const draw: Draw = (ctx, w, h, t, io) => {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.36;
    // The timeline slider scrubs the sequence the way scrolling does on the
    // home page; untouched, it plays on its own.
    const scrub = io.params.time;
    const c = typeof scrub === "number" ? scrub : (t % 9) / 9;
    const gather = ease(clamp01(c / 0.25)), open = ease(clamp01((c - 0.42) / 0.16)), rush = clamp01((c - 0.6) / 0.4);
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      // Swarm: loose orbit round the middle.
      const oa = s.a * Math.PI * 2 + t * (0.3 + s.b * 0.4);
      let x = Math.cos(oa) * R * (0.6 + s.c * 0.9), y = Math.sin(oa) * R * (0.4 + s.d * 0.6);
      // X: two thick bars.
      const bar = s.a < 0.5 ? 1 : -1, along = (s.b - 0.5) * 2, across = (s.c - 0.5) * 0.28;
      const xx = (along + across * bar) * R * 0.72, xy = (along * bar - across) * R * 0.72;
      x = mix(x, xx, gather); y = mix(y, xy, gather);
      // Portal: the X opens into a ring.
      const ra = s.a * Math.PI * 2 + t * 0.2, rr = R * (0.92 + (s.d - 0.5) * 0.12);
      x = mix(x, Math.cos(ra) * rr, open); y = mix(y, Math.sin(ra) * rr, open);
      let bin = open > 0.5 ? 1 : 0;
      if (rush > 0) {
        // Tunnel: each grain streams outward from the centre on its own clock.
        const z = (s.c + t * 0.6) % 1, k = 0.15 / (1.05 - z);
        const tx = Math.cos(s.a * Math.PI * 2) * R * k, ty = Math.sin(s.a * Math.PI * 2) * R * k * 0.7;
        const r = ease(rush);
        x = mix(x, tx, r); y = mix(y, ty, r);
        bin = s.b < 0.35 ? 2 : 1;
      }
      bins[bin].push(cx + x, cy + y);
    }
    flush(ctx, bins, styles, small ? 1.6 : 2);
  };
  return { draw, ready: Promise.resolve() };
}

function helixSketch(small: boolean): Sketch {
  const N = small ? 900 : 1600;
  const rand = rng(23);
  const seeds = Array.from({ length: N }, () => ({ a: rand(), b: rand(), c: rand() }));
  const cards = ["#63e6be", "#c8ff3e", "#a78bfa", "#8ae6ff", "#ff9f6e", "#5eead4"];
  const bins = buckets(2);
  const styles = [`rgb(${LIME.join(" ")} / 0.55)`, `rgb(${CYAN.join(" ")} / 0.5)`];
  const draw: Draw = (ctx, w, h, t, io) => {
    const cx = w / 2, cy = h / 2, R = Math.min(w * 0.36, h * 0.6);
    const spin = t * 0.45 + io.yaw * 1.6;
    const proj = (a: number, y: number) => {
      const x = Math.cos(a) * R, z = Math.sin(a);
      const p = 1 / (1.4 - z * 0.35);
      return { x: cx + x * p, y: cy + y * p, z, p };
    };
    // Grain strands of the helix.
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      const a = s.a * Math.PI * 4 + spin, y = (s.a - 0.5) * h * 0.7 + (s.b - 0.5) * 8;
      const q = proj(a + (s.c - 0.5) * 0.15, y);
      bins[s.c < 0.5 ? 0 : 1].push(q.x, q.y);
    }
    flush(ctx, bins, styles, small ? 1.3 : 1.6);
    // Cards on the helix, back ones first.
    const items = cards.map((color, i) => {
      const a = (i / cards.length) * Math.PI * 2 + spin;
      return { color, a, y: (i / cards.length - 0.42) * h * 0.55, z: Math.sin(a) };
    }).sort((p, q) => p.z - q.z);
    for (const it of items) {
      const q = proj(it.a, it.y);
      const cw = R * 0.42 * q.p * Math.max(0.15, Math.abs(Math.cos(it.a + Math.PI / 2))), ch = R * 0.28 * q.p;
      // Glass cards: a tinted pane, a bright top rim, a faint edge.
      const x0 = q.x - cw / 2, y0 = q.y - ch / 2, depth = (it.z + 1) / 2;
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(x0, y0, x0 + cw, y0 + ch);
      g.addColorStop(0, it.color);
      g.addColorStop(1, "rgba(10,10,11,0.2)");
      ctx.globalAlpha = 0.18 + depth * 0.32;
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, cw, ch);
      ctx.globalAlpha = 0.35 + depth * 0.5;
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, cw - 1, ch - 1);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(x0 + cw * 0.15, y0, cw * 0.7, 1);
      ctx.globalCompositeOperation = "lighter";
    }
    ctx.globalAlpha = 1;
  };
  return { draw, ready: Promise.resolve() };
}

export function mountSketch(
  canvas: HTMLCanvasElement,
  kind: SketchKind,
  opts: { still: boolean; onPhase?: (phase: number) => void },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { run() {}, destroy() {}, set() {} };
  let w = 0, h = 0, t = 1.5, last = 0, raf = 0, running = false, phase = -1, alive = true;
  const small = canvas.getBoundingClientRect().width < 420;
  const sketch: Sketch =
    kind === "bird" ? birdSketch(false)
    : kind === "forensics" ? birdSketch(true)
    : kind === "bust" ? bustSketch(small)
    : kind === "voyage" ? voyageSketch(small)
    : helixSketch(small);
  const io: Input = { yaw: 0, pitch: 0, dt: 0, params: {} };
  // Drag to turn: horizontal drags spin, vertical ones tilt a little; a
  // release keeps the spin going and it eases out. Vertical page scrolling
  // still works on touch (touch-action: pan-y on the canvas).
  const drag = { on: false, x: 0, y: 0, v: 0 };
  const size = () => {
    const r = canvas.getBoundingClientRect();
    if (r.width < 2) return false;
    w = r.width; h = r.height;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  };
  const paint = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    sketch.draw(ctx, w, h, t, io);
    ctx.globalCompositeOperation = "source-over";
    if (sketch.phase && opts.onPhase) {
      const p = sketch.phase(t);
      if (p !== phase) { phase = p; opts.onPhase(p); }
    }
  };
  const frame = (now: number) => {
    // rAF timestamps can predate the performance.now() taken in run(), so
    // the first delta clamps at zero (a negative one ran the flap backwards
    // past frame 0 and read outside the bake).
    const dt = Math.max(0, Math.min(1 / 20, (now - last) / 1000));
    last = now;
    t += dt;
    io.dt = dt;
    if (!drag.on) { io.yaw += drag.v * dt; drag.v *= Math.exp(-2.5 * dt); io.pitch *= Math.exp(-1.5 * dt); }
    paint();
    raf = requestAnimationFrame(frame);
  };
  const down = (e: PointerEvent) => {
    drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.v = 0;
    canvas.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!drag.on) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    io.yaw += dx * 0.012;
    io.pitch = Math.max(-0.5, Math.min(0.5, io.pitch + dy * 0.006));
    drag.v = dx * 0.012 * 60;
    if (!running) paint();
  };
  const up = () => { drag.on = false; };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  size();
  // With reduced motion each sketch shows one composed frame.
  if (kind === "forensics" && opts.still) t = 1;
  sketch.ready.then(() => { if (alive && !running) paint(); }).catch(() => {});
  const ro = new ResizeObserver(() => { if (size() && !running) paint(); });
  ro.observe(canvas);
  return {
    run(on: boolean) {
      if (opts.still || on === running) return;
      running = on;
      if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    },
    set(key: string, value: string | number) {
      io.params[key] = value;
      if (!running) { io.dt = 1; paint(); }
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    },
  };
}
