// Brand Brain as a brain of beads: a procedural point cloud (two folded
// hemispheres split by the longitudinal fissure, temporal lobes, a ridged
// cerebellum and the stem) drawn as small lit spheres on a 2D canvas,
// depth-sorted, turning slowly. A synapse wave now and then runs across
// the surface. Beads are pre-rendered sprites, so a frame is drawImage
// calls only.

type Bead = { x: number; y: number; z: number; tone: number; size: number };

const TONES: [number, number, number][] = [
  [200, 255, 62], // lime
  [138, 230, 255], // cyan
  [243, 239, 231], // bone
];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cortex folds: ridged interference of a few warped sines.
function folds(x: number, y: number, z: number) {
  const a = Math.sin(x * 9 + Math.sin(z * 6) * 1.6 + Math.sin(y * 5) * 0.8);
  const b = Math.sin(z * 8 + Math.sin(y * 7) * 1.4 + Math.sin(x * 4) * 0.9);
  const c = Math.sin(y * 10 + Math.sin(x * 5 + z * 3) * 1.2);
  return 1 - Math.abs(a * 0.45 + b * 0.35 + c * 0.2);
}

function buildBrain(count: number): Bead[] {
  const r = rng(7);
  const out: Bead[] = [];
  const hemis = Math.round(count * 0.82);
  // Hemispheres: Fibonacci directions on an ellipsoid, flattened on the
  // medial face and underneath, pushed out along the folds.
  for (let i = 0; i < hemis; i++) {
    // Each hemisphere gets its own even Fibonacci sphere.
    const half = Math.ceil(hemis / 2);
    const side = i < half ? -1 : 1;
    const j = i < half ? i : i - half;
    const yy = 1 - (2 * (j + 0.5)) / half;
    const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
    const th = j * 2.399963;
    const dx = Math.cos(th) * rr, dz = Math.sin(th) * rr;
    let dy = yy;
    if (dy < -0.3) dy = -0.3 + (dy + 0.3) * 0.5; // flat underside
    // Ellipsoid per hemisphere; the medial face is clamped flat against the
    // fissure, so the two halves meet down the middle.
    let x = 0.3 + dx * 0.36, y = dy * 0.62;
    const z = dz * 0.92;
    // Temporal lobe: the lower outer side bulges, forward of centre.
    const temporal = Math.exp(-((dy + 0.4) ** 2) / 0.06 - ((dz - 0.2) ** 2) / 0.2) * Math.max(0, dx);
    x += temporal * 0.08;
    y -= temporal * 0.07;
    y *= 1 + Math.max(0, dz) * 0.07; // frontal lobe a touch taller
    const f = folds(x * 1.6 + side * 0.4, y * 1.6, z * 1.6);
    const push = 1 + (f - 0.55) * 0.16;
    x = Math.max(0.018, x * push);
    out.push({
      x: side * x,
      y: y * push + 0.06,
      z: z * push,
      tone: dz > 0.25 ? 0 : dz < -0.5 ? 1 : r() < 0.15 ? 2 : r() < 0.6 ? 0 : 1,
      // Gyri read bright and full, sulci small and dim.
      size: 0.45 + f * 0.85,
    });
  }
  // Cerebellum: a ridged half-ellipsoid tucked under the back.
  const cere = Math.round(count * 0.13);
  for (let i = 0; i < cere; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1);
    const dx = Math.sin(v) * Math.cos(u), dy = Math.cos(v), dz = Math.sin(v) * Math.sin(u);
    const ridge = 1 + 0.06 * Math.abs(Math.sin(dy * 22));
    out.push({ x: dx * 0.48 * ridge, y: -0.42 + dy * 0.2 * ridge, z: -0.66 + dz * 0.26 * ridge, tone: 1, size: 0.7 });
  }
  // Stem.
  const stem = count - hemis - cere;
  for (let i = 0; i < stem; i++) {
    const u = r() * Math.PI * 2, t = r();
    const rad = 0.13 - t * 0.03;
    out.push({ x: Math.cos(u) * rad, y: -0.3 - t * 0.55, z: -0.28 - t * 0.12 + Math.sin(u) * rad, tone: 2, size: 0.7 });
  }
  return out;
}

function sprite(rgb: [number, number, number], px: number) {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const g = c.getContext("2d")!;
  const [r, gg, b] = rgb;
  const grad = g.createRadialGradient(px * 0.36, px * 0.32, px * 0.04, px / 2, px / 2, px / 2);
  grad.addColorStop(0, "rgb(255 255 255)");
  grad.addColorStop(0.28, `rgb(${r} ${gg} ${b})`);
  grad.addColorStop(0.8, `rgb(${Math.round(r * 0.35)} ${Math.round(gg * 0.35)} ${Math.round(b * 0.35)})`);
  grad.addColorStop(1, `rgb(${Math.round(r * 0.2)} ${Math.round(gg * 0.2)} ${Math.round(b * 0.2)} / 0)`);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(px / 2, px / 2, px / 2, 0, Math.PI * 2);
  g.fill();
  return c;
}

export function mountBrain(canvas: HTMLCanvasElement, opts: { still: boolean }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { run() {}, destroy() {} };
  let w = 0, h = 0, small = false, beads: Bead[] = [];
  const sprites = TONES.map((t) => sprite(t, 32));
  let order: number[] = [];
  let screen = new Float32Array(0);
  let t = 0, last = 0, raf = 0, running = false;

  const build = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2) return false;
    w = rect.width; h = rect.height; small = w < 420;
    const dpr = Math.min(devicePixelRatio || 1, small ? 1.75 : 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!beads.length || (small !== (beads.length < 3400))) beads = buildBrain(small ? 2600 : 4200);
    screen = new Float32Array(beads.length * 4);
    order = beads.map((_, i) => i);
    return true;
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.34;
    const cx = w / 2, cy = h * 0.5;
    // Turn: a slow full revolution, pitched a little toward the viewer.
    // Mostly a side and three-quarter view: that is when it reads as a brain.
    const yaw = -1.45 + Math.sin(t * 0.2) * 0.6, pitch = 0.2;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // Synapse wave: every 3.2 s a front sweeps from a random-ish origin.
    const cyc = t / 3.2, seed = Math.floor(cyc), phase = cyc - seed;
    const ox = Math.sin(seed * 12.9) * 0.6, oy = Math.cos(seed * 7.3) * 0.3, oz = Math.sin(seed * 3.1) * 0.8;
    const front = phase * 2.2;
    for (let i = 0; i < beads.length; i++) {
      const b = beads[i];
      const x1 = b.x * cyw + b.z * syw, z1 = -b.x * syw + b.z * cyw;
      const y2 = b.y * cp - z1 * sp, z2 = b.y * sp + z1 * cp;
      const p = 3.2 / (3.2 - z2);
      const d = Math.hypot(b.x - ox, b.y - oy, b.z - oz);
      const pulse = Math.exp(-((d - front) ** 2) / 0.012) * (1 - phase);
      const o = i * 4;
      screen[o] = cx + x1 * R * p;
      screen[o + 1] = cy - y2 * R * p;
      screen[o + 2] = z2;
      screen[o + 3] = pulse;
    }
    order.sort((a, b) => screen[a * 4 + 2] - screen[b * 4 + 2]);
    const base = small ? 3.6 : 4.4;
    for (const i of order) {
      const o = i * 4, z = screen[o + 2], pulse = screen[o + 3];
      const depth = (z + 1) / 2; // 0 back .. 1 front
      const s = base * beads[i].size * (0.7 + depth * 0.5) * (1 + pulse * 0.6);
      ctx.globalAlpha = Math.min(1, (0.22 + depth * 0.7) * (0.45 + beads[i].size * 0.55) + pulse);
      ctx.drawImage(sprites[pulse > 0.35 ? 2 : beads[i].tone], screen[o] - s / 2, screen[o + 1] - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  };

  const frame = (now: number) => {
    t += Math.min(0.05, (now - last) / 1000);
    last = now;
    draw();
    raf = requestAnimationFrame(frame);
  };
  if (build()) draw();
  const ro = new ResizeObserver(() => { if (build()) draw(); });
  ro.observe(canvas);
  return {
    run(on: boolean) {
      if (opts.still || on === running) return;
      running = on;
      if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); },
  };
}
