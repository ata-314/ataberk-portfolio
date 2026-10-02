// Brand Brain as a fluid brain of beads: a procedural point cloud (two
// folded hemispheres meeting at a flat medial face, temporal lobes, a
// ridged cerebellum, the stem) drawn as small lit spheres on a 2D canvas,
// depth-sorted. The surface is liquid: travelling waves swell it, every
// bead hangs on a damped spring in screen space, the pointer parts the
// beads like a hand through water and a synapse wave lifts the surface as
// it passes. Leader lines tie the DOM labels to their regions live.

type Bead = { x: number; y: number; z: number; tone: number; size: number };

const TONES: [number, number, number][] = [
  [200, 255, 62], // lime
  [138, 230, 255], // cyan
  [243, 239, 231], // bone
  [255, 112, 92], // coral, the banned region
];

// Regions the labels point at, in brain space (z forward).
export const REGIONS = {
  voice: [0, -0.05, 0.62], // frontal (Broca)
  patterns: [0, 0.55, -0.15], // parietal top
  banned: [0, -0.38, 0.12], // temporal
  palette: [0, 0.1, -0.85], // occipital (vision)
} as const;

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
  const hemis = Math.round(count * 0.84);
  const half = Math.ceil(hemis / 2);
  for (let i = 0; i < hemis; i++) {
    // Each hemisphere gets its own even Fibonacci sphere.
    const side = i < half ? 1 : -1;
    const j = i < half ? i : i - half;
    const yy = 1 - (2 * (j + 0.5)) / half;
    const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
    const th = j * 2.399963;
    const dx = Math.cos(th) * rr, dz = Math.sin(th) * rr;
    let dy = yy;
    if (dy < -0.3) dy = -0.3 + (dy + 0.3) * 0.5; // flat underside
    // The medial face is clamped flat against the fissure.
    let x = 0.3 + dx * 0.36, y = dy * 0.62;
    const z = dz * 0.92;
    const temporal = Math.exp(-((dy + 0.4) ** 2) / 0.06 - ((dz - 0.2) ** 2) / 0.2) * Math.max(0, dx);
    x += temporal * 0.08;
    y -= temporal * 0.07;
    y *= 1 + Math.max(0, dz) * 0.07;
    const f = folds(x * 1.6 + side * 0.4, y * 1.6, z * 1.6);
    const push = 1 + (f - 0.55) * 0.16;
    x = Math.max(0.018, x * push);
    const banned = temporal > 0.35 && r() < 0.5;
    out.push({
      x: side * x, y: y * push + 0.06, z: z * push,
      tone: banned ? 3 : dz > 0.25 ? 0 : dz < -0.5 ? 1 : r() < 0.15 ? 2 : r() < 0.6 ? 0 : 1,
      size: 0.45 + f * 0.85,
    });
  }
  const cere = Math.round(count * 0.12);
  for (let i = 0; i < cere; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1);
    const dx = Math.sin(v) * Math.cos(u), dy = Math.cos(v), dz = Math.sin(v) * Math.sin(u);
    const ridge = 1 + 0.06 * Math.abs(Math.sin(dy * 22));
    out.push({ x: dx * 0.48 * ridge, y: -0.42 + dy * 0.2 * ridge, z: -0.66 + dz * 0.26 * ridge, tone: 1, size: 0.7 });
  }
  for (let i = out.length; i < count; i++) {
    const u = r() * Math.PI * 2, t = r(), rad = 0.13 - t * 0.03;
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

type Label = { el: HTMLElement; region: keyof typeof REGIONS };

export function mountBrain(canvas: HTMLCanvasElement, labels: Label[], opts: { still: boolean }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { run() {}, destroy() {} };
  const host = canvas.parentElement as HTMLElement;
  let w = 0, h = 0, small = false, beads: Bead[] = [];
  const sprites = TONES.map((t) => sprite(t, 32));
  let screen = new Float32Array(0), off = new Float32Array(0), vel = new Float32Array(0);
  let order: number[] = [];
  let targets: number[] = [];
  let anchors: { x: number; y: number; left: boolean }[] = [];
  let t = 0, last = 0, raf = 0, running = false;
  const ptr = { x: -9999, y: -9999, vx: 0, vy: 0, on: 0 };

  const measure = () => {
    const c = canvas.getBoundingClientRect();
    anchors = labels.map(({ el }) => {
      const r = el.getBoundingClientRect();
      const left = r.left + r.width / 2 < c.left + c.width / 2;
      return { x: (left ? r.right + 10 : r.left - 10) - c.left, y: r.top + 9 - c.top, left };
    });
  };
  const build = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2) return false;
    w = rect.width; h = rect.height; small = w < 420;
    const dpr = Math.min(devicePixelRatio || 1, small ? 1.75 : 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = small ? 2600 : 4200;
    if (beads.length !== n) {
      beads = buildBrain(n);
      screen = new Float32Array(n * 4);
      off = new Float32Array(n * 2);
      vel = new Float32Array(n * 2);
      order = beads.map((_, i) => i);
      // Each label points at the outermost bead nearest its region.
      targets = labels.map(({ region }) => {
        const [, ry, rz] = REGIONS[region];
        let best = 0, bd = Infinity;
        beads.forEach((b, i) => {
          if (b.x < 0.1) return; // right hemisphere, the side we face
          const d = (b.y - ry) ** 2 + (b.z - rz) ** 2 - b.x * 0.25;
          if (d < bd) { bd = d; best = i; }
        });
        return best;
      });
    }
    measure();
    return true;
  };

  const step = (dt: number) => {
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * (small ? 0.29 : 0.34);
    const cx = w / 2, cy = h * 0.5;
    const yaw = -1.45 + Math.sin(t * 0.32) * 0.55 + Math.sin(t * 0.13) * 0.2;
    const pitch = 0.18 + Math.sin(t * 0.27) * 0.08;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cyc = t / 2.6, seed = Math.floor(cyc), phase = cyc - seed;
    const ox = Math.sin(seed * 12.9) * 0.4, oy = Math.cos(seed * 7.3) * 0.3, oz = Math.sin(seed * 3.1) * 0.7;
    const front = phase * 2.2;
    const breathe = 1 + Math.sin(t * 1.1) * 0.012;
    const reach = small ? 46 : 70, reach2 = reach * reach;
    ptr.on += ((ptr.x > -999 ? 1 : 0) - ptr.on) * Math.min(1, dt * 6);
    const k = 46, damping = 7.5;
    for (let i = 0; i < beads.length; i++) {
      const b = beads[i];
      // Liquid surface: two travelling waves and the synapse front swell
      // the bead outward along its own direction from the centre.
      const d = Math.hypot(b.x - ox, b.y - oy, b.z - oz);
      const pulse = Math.exp(-((d - front) ** 2) / 0.014) * (1 - phase);
      const swell = breathe + Math.sin(b.z * 7 - t * 2.4 + b.y * 3) * 0.022 + Math.sin(b.y * 9 + t * 1.7 + b.x * 4) * 0.016 + pulse * 0.07;
      const x = b.x * swell, y = b.y * swell, z = b.z * swell;
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const p = 3.2 / (3.2 - z2);
      const sx = cx + x1 * R * p, sy = cy - y2 * R * p;
      // Spring offset in screen space; the pointer parts the beads.
      const o = i * 2;
      let fx = -off[o] * k - vel[o] * damping, fy = -off[o + 1] * k - vel[o + 1] * damping;
      if (ptr.on > 0.01) {
        const ddx = sx + off[o] - ptr.x, ddy = sy + off[o + 1] - ptr.y, dd = ddx * ddx + ddy * ddy;
        if (dd < reach2) {
          const fall = 1 - Math.sqrt(dd) / reach, inv = 1 / (Math.sqrt(dd) + 4);
          const push = fall * fall * 2600 * ptr.on * (z2 > -0.2 ? 1 : 0.4);
          fx += ddx * inv * push + ptr.vx * fall * 9;
          fy += ddy * inv * push + ptr.vy * fall * 9;
        }
      }
      vel[o] += fx * dt; vel[o + 1] += fy * dt;
      off[o] += vel[o] * dt; off[o + 1] += vel[o + 1] * dt;
      const q = i * 4;
      screen[q] = sx + off[o];
      screen[q + 1] = sy + off[o + 1];
      screen[q + 2] = z2;
      screen[q + 3] = pulse;
    }
    ptr.vx *= 0.85; ptr.vy *= 0.85;
    // Leader lines, under the beads.
    ctx.lineWidth = 1;
    anchors.forEach((a, li) => {
      const q = targets[li] * 4, tx = screen[q], ty = screen[q + 1];
      const elbow = a.x + (a.left ? 18 : -18);
      ctx.strokeStyle = labels[li].region === "banned" ? "rgb(255 112 92 / .55)" : "rgb(243 239 231 / .32)";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(elbow, a.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(tx, ty, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });
    order.sort((a, b) => screen[a * 4 + 2] - screen[b * 4 + 2]);
    const base = small ? 3.6 : 4.4;
    for (const i of order) {
      const q = i * 4, z = screen[q + 2], pulse = screen[q + 3];
      const depth = (z + 1) / 2;
      const o = i * 2, moving = Math.min(1, Math.hypot(vel[o], vel[o + 1]) / 260);
      const s = base * beads[i].size * (0.7 + depth * 0.5) * (1 + pulse * 0.6 + moving * 0.35);
      ctx.globalAlpha = Math.min(1, (0.22 + depth * 0.7) * (0.45 + beads[i].size * 0.55) + pulse + moving * 0.3);
      ctx.drawImage(sprites[pulse > 0.55 ? 2 : beads[i].tone], screen[q] - s / 2, screen[q + 1] - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  };

  const frame = (now: number) => {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    t += dt;
    step(dt);
    raf = requestAnimationFrame(frame);
  };
  const onMove = (e: PointerEvent) => {
    const c = canvas.getBoundingClientRect();
    const x = e.clientX - c.left, y = e.clientY - c.top;
    if (ptr.x > -999) { ptr.vx = (x - ptr.x) * 8; ptr.vy = (y - ptr.y) * 8; }
    ptr.x = x; ptr.y = y;
  };
  const onLeave = () => { ptr.x = ptr.y = -9999; };
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);
  if (build()) {
    if (opts.still) { t = 2; step(0); } else step(0);
  }
  const ro = new ResizeObserver(() => { if (build() && !running) step(0); });
  ro.observe(canvas);
  return {
    run(on: boolean) {
      if (opts.still || on === running) return;
      running = on;
      if (on) { last = performance.now(); raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    },
  };
}
