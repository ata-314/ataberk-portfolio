// AI Systems stages drawn in the page's own matter: grains of light, the
// same stuff the bird, the bust and the sea are made of. One small 2D
// canvas engine, four scenes. Type stays in the DOM (crisp, translatable);
// a scene only tells the DOM where its labels sit via data-anchor elements.
//
//   0 Brand Brain   a sphere of memory fed by four clusters; banned
//                   phrases (coral) strike the core and fall away
//   1 Creative team one packet of grains runs four stations and changes
//                   shape at each: brief, moodboard, post, approved post,
//                   then a delivery package
//   2 Web agent     grains rise and assemble a site in a browser frame,
//                   then the Lighthouse rings fill
//   3 Review        a post of grains is scanned; the banned phrase flares
//                   coral and re-forms lime, rewritten

type Col = { r: number; g: number; b: number; css: string };
const col = (r: number, g: number, b: number): Col => ({ r, g, b, css: `rgb(${r} ${g} ${b})` });
const LIME = col(200, 255, 62);
const CYAN = col(138, 230, 255);
const BONE = col(243, 239, 231);
const CORAL = col(255, 112, 92);

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { x: number; y: number; c: Col; a: number };
type Seg = [x0: number, y0: number, x1: number, y1: number, c: Col, a?: number];
type Box = [x: number, y: number, w: number, h: number, c: Col, a?: number];

// n points spread along segments, weighted by length.
function strokes(segs: Seg[], n: number, r: () => number): Pt[] {
  const lens = segs.map(([x0, y0, x1, y1]) => Math.hypot(x1 - x0, y1 - y0));
  const total = lens.reduce((s, l) => s + l, 0) || 1;
  const out: Pt[] = [];
  segs.forEach((s, i) => {
    const k = Math.max(1, Math.round((lens[i] / total) * n));
    for (let j = 0; j < k; j++) {
      const u = (j + r() * 0.6) / k;
      out.push({ x: mix(s[0], s[2], u), y: mix(s[1], s[3], u), c: s[4], a: s[5] ?? 0.85 });
    }
  });
  return out;
}

// n points scattered inside boxes, weighted by area.
function fills(boxes: Box[], n: number, r: () => number): Pt[] {
  const areas = boxes.map((b) => b[2] * b[3]);
  const total = areas.reduce((s, a) => s + a, 0) || 1;
  const out: Pt[] = [];
  boxes.forEach((b, i) => {
    const k = Math.max(1, Math.round((areas[i] / total) * n));
    for (let j = 0; j < k; j++) out.push({ x: b[0] + r() * b[2], y: b[1] + r() * b[3], c: b[4], a: b[5] ?? 0.75 });
  });
  return out;
}

// Gaussian cloud; with a clip box, points falling outside are redrawn.
function gauss(cx: number, cy: number, sx: number, sy: number, n: number, c: Col, r: () => number, a = 0.7, clip?: [number, number, number, number]): Pt[] {
  const out: Pt[] = [];
  for (let tries = 0; out.length < n && tries < n * 20; tries++) {
    const ang = r() * Math.PI * 2, rad = Math.sqrt(-2 * Math.log(r() + 1e-6)) * 0.5;
    const x = cx + Math.cos(ang) * rad * sx, y = cy + Math.sin(ang) * rad * sy;
    if (clip && (x < clip[0] || y < clip[1] || x > clip[2] || y > clip[3])) continue;
    out.push({ x, y, c, a });
  }
  return out;
}

// Resample a point list to exactly n entries (repeating or thinning).
function fit(pts: Pt[], n: number, r: () => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) out.push(pts[Math.floor(r() * pts.length)]);
  return out;
}

type Env = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  mobile: boolean;
  place: (name: string, x: number, y: number) => void;
};
type Scene = { draw: (t: number, dt: number) => void; phase?: (t: number) => number };

const GRAIN = 1.7;
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, c: Col, a: number, s = GRAIN) {
  if (a <= 0.01) return;
  if (ctx.fillStyle !== c.css) ctx.fillStyle = c.css;
  ctx.globalAlpha = Math.min(1, a);
  ctx.fillRect(x - s / 2, y - s / 2, s, s);
}

/* 0 — Brand Brain */
function brain({ ctx, w, h, mobile, place }: Env): Scene {
  const r = rng(11);
  const cx = w / 2, cy = h * 0.45, R = Math.min(w, h) * (mobile ? 0.21 : 0.23);
  const sats = [
    { x: 0.16, y: 0.2, c: CYAN },
    { x: 0.84, y: 0.2, c: null },
    { x: 0.16, y: 0.7, c: CORAL, banned: true },
    { x: 0.84, y: 0.7, c: LIME },
  ].map((s) => ({ ...s, px: s.x * w, py: s.y * h }));
  sats.forEach((s, i) => place(`sat-${i}`, s.px, s.py + (mobile ? 30 : 38)));
  place("core", cx, cy + R + (mobile ? 20 : 28));
  const palette = [LIME, CYAN, BONE];
  const N = mobile ? 1100 : 1700;
  const sphere = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.39996;
    return [Math.cos(th) * rr, y, Math.sin(th) * rr, r()] as const;
  });
  const clusters = sats.map(() => Array.from({ length: mobile ? 110 : 160 }, () => [r() * 6.28, r(), r() * 6.28]));
  const flyers: { s: (typeof sats)[number]; t: number; sp: number; off: number; c: Col }[] = [];
  return {
    draw(t, dt) {
      const ry = t * 0.22, cY = Math.cos(ry), sY = Math.sin(ry), cT = Math.cos(0.38), sT = Math.sin(0.38);
      const breathe = 1 + Math.sin(t * 1.3) * 0.015;
      for (const [x, y, z, k] of sphere) {
        const X = x * cY + z * sY, Z = -x * sY + z * cY, Y = y * cT - Z * sT, Z2 = y * sT + Z * cT;
        const p = (1 / (1.9 - Z2 * 0.6)) * breathe;
        dot(ctx, cx + X * R * p, cy + Y * R * p, k < 0.72 ? LIME : CYAN, 0.16 + (Z2 + 1) * 0.34);
      }
      sats.forEach((s, si) => {
        clusters[si].forEach((g, gi) => {
          g[0] += dt * (0.5 + g[1] * 0.8);
          const rr = (mobile ? 6 : 8) + g[1] * (mobile ? 16 : 22);
          dot(ctx, s.px + Math.cos(g[0] + g[2]) * rr, s.py + Math.sin(g[0] + g[2]) * rr * 0.75, s.c ?? palette[gi % 3], 0.3 + g[1] * 0.5);
        });
        if (dt > 0 && Math.random() < dt * 7) flyers.push({ s, t: 0, sp: 0.4 + Math.random() * 0.3, off: (Math.random() - 0.5) * 50, c: s.c ?? palette[(Math.random() * 3) | 0] });
      });
      for (let i = flyers.length - 1; i >= 0; i--) {
        const f = flyers[i];
        f.t += dt * f.sp;
        const mx = (f.s.px + cx) / 2 + f.off, my = (f.s.py + cy) / 2 - 24;
        // Banned grains reach the core's skin, then fall back and fade.
        let u = f.t;
        if (f.s.banned && u > 0.74) u = 0.74 - (u - 0.74) * 1.3;
        const v = 1 - u;
        const x = v * v * f.s.px + 2 * v * u * mx + u * u * cx, y = v * v * f.s.py + 2 * v * u * my + u * u * cy;
        const fade = f.s.banned ? 1 - clamp01((f.t - 0.74) * 3) : 1 - clamp01((f.t - 0.82) * 8);
        dot(ctx, x, y, f.c, 0.95 * fade, 2.1);
        if (fade <= 0) flyers.splice(i, 1);
      }
    },
  };
}

/* 1 — Creative team relay */
const TEAM_LOOP = 7.2, TEAM_STEP = 1.35, TEAM_DELIVER = 5.65;
function team({ ctx, w, h, mobile, place }: Env): Scene {
  const r = rng(23);
  const sy = h * 0.22, py = h * (mobile ? 0.62 : 0.6);
  const xs = [0.14, 0.38, 0.62, 0.86].map((f) => f * w);
  const S = Math.min(w * (mobile ? 0.3 : 0.2), h * 0.4, 150);
  xs.forEach((x, i) => place(`role-${i}`, x, sy + (mobile ? 28 : 32)));
  const N = mobile ? 520 : 900;
  // Shapes in unit space (-.5 .. .5), scaled by S at draw time.
  const brief = strokes([
    [-0.45, -0.34, 0.45, -0.34, BONE], [-0.45, -0.17, 0.25, -0.17, LIME, 1], [-0.45, 0, 0.4, 0, BONE],
    [-0.45, 0.17, 0.15, 0.17, BONE], [-0.45, 0.34, 0.3, 0.34, BONE],
  ], N, r);
  const mood = fills([[-0.48, -0.48, 0.45, 0.45, LIME], [0.03, -0.48, 0.45, 0.45, CYAN], [-0.48, 0.03, 0.45, 0.45, BONE, 0.6], [0.03, 0.03, 0.45, 0.45, LIME, 0.45]], N, r);
  const frame: Seg[] = [[-0.48, -0.48, 0.48, -0.48, BONE, 0.5], [0.48, -0.48, 0.48, 0.48, BONE, 0.5], [0.48, 0.48, -0.48, 0.48, BONE, 0.5], [-0.48, 0.48, -0.48, -0.48, BONE, 0.5]];
  const postParts = () => [
    ...strokes(frame, N * 0.3, r),
    ...gauss(0.14, -0.16, 0.5, 0.4, N * 0.22, CYAN, r, 0.7, [-0.45, -0.45, 0.45, 0.45]),
    ...gauss(-0.14, 0.06, 0.55, 0.45, N * 0.28, LIME, r, 0.7, [-0.45, -0.45, 0.45, 0.45]),
    ...strokes([[-0.38, 0.27, 0.22, 0.27, BONE, 1], [-0.38, 0.37, 0.02, 0.37, BONE, 1]], N * 0.2, r),
  ];
  const post = fit(postParts(), N, r);
  const approved = fit([...postParts().slice(0, Math.floor(N * 0.82)), ...strokes([[0.1, 0.12, 0.2, 0.24, LIME, 1], [0.2, 0.24, 0.42, -0.02, LIME, 1]], N * 0.18, r)], N, r);
  const cube = strokes([
    [0, -0.46, 0.44, -0.24, LIME, 1], [0.44, -0.24, 0, -0.02, LIME, 1], [0, -0.02, -0.44, -0.24, LIME, 1], [-0.44, -0.24, 0, -0.46, LIME, 1],
    [-0.44, -0.24, -0.44, 0.24, CYAN], [0, -0.02, 0, 0.46, CYAN], [0.44, -0.24, 0.44, 0.24, CYAN],
    [-0.44, 0.24, 0, 0.46, CYAN], [0, 0.46, 0.44, 0.24, CYAN],
  ], N, r);
  const shapes = [fit(brief, N, r), fit(mood, N, r), post, approved, fit(cube, N, r)];
  const grains = Array.from({ length: N }, (_, i) => ({ x: xs[0] + shapes[0][i].x * S, y: py + shapes[0][i].y * S, k: 5 + r() * 6 }));
  const phaseAt = (t: number) => {
    const lt = t % TEAM_LOOP;
    return lt >= TEAM_DELIVER ? 4 : Math.min(3, Math.max(0, Math.floor((lt - 0.15) / TEAM_STEP)));
  };
  let lastPhase = -1;
  const rings = xs.map(() => Array.from({ length: mobile ? 40 : 56 }, () => [r() * 6.28, r()]));
  return {
    phase: phaseAt,
    draw(t, dt) {
      const k = phaseAt(t);
      const tx = k === 4 ? w / 2 : xs[k];
      if (k !== lastPhase) { lastPhase = k; place("pkt", tx, py + S * 0.5 + (mobile ? 18 : 22)); }
      // Rail between the stations, lit up to the current one.
      for (let x = xs[0]; x <= xs[3]; x += mobile ? 6 : 7) {
        const lit = k === 4 || x <= xs[k] + 1;
        dot(ctx, x, sy, lit ? LIME : BONE, lit ? 0.7 : 0.16, 1.4);
      }
      // Stations: small orbits of grains, lime once the packet has visited.
      xs.forEach((x, i) => {
        const lit = k === 4 || i <= k, here = k === i;
        rings[i].forEach((g) => {
          g[0] += dt * (here ? 1.6 : 0.5);
          const rr = (mobile ? 7 : 9) + g[1] * (mobile ? 6 : 8) + (here ? Math.sin(t * 4) * 1.5 : 0);
          dot(ctx, x + Math.cos(g[0]) * rr, sy + Math.sin(g[0]) * rr, lit ? LIME : BONE, lit ? (here ? 0.95 : 0.6) : 0.28);
        });
      });
      const shape = shapes[k];
      grains.forEach((g, i) => {
        const p = shape[i];
        const f = 1 - Math.exp(-dt * g.k);
        g.x += (tx + p.x * S - g.x) * f;
        g.y += (py + p.y * S - g.y) * f;
        dot(ctx, g.x, g.y, p.c, p.a * 0.95, mobile ? 1.6 : 1.8);
      });
    },
  };
}

/* 2 — Web development agent */
function web({ ctx, w, h, mobile, place }: Env): Scene {
  const r = rng(37);
  const x0 = w * (mobile ? 0.06 : 0.38), x1 = w * 0.95, y0 = h * 0.08, y1 = h * (mobile ? 0.64 : 0.66);
  const bw = x1 - x0, bh = y1 - y0;
  place("url", x0 + 14, y0 + 13);
  place("live", x1 - 12, y0 + 13);
  const heroY = y0 + 52, heroH = bh * 0.42, cardY = heroY + heroH + 12, cardH = y1 - 10 - cardY, cardW = (bw - 24 - 16) / 3;
  const groups: { start: number; pts: Pt[] }[] = [
    { start: 0.2, pts: strokes([[x0, y0, x1, y0, BONE, 0.55], [x1, y0, x1, y1, BONE, 0.55], [x1, y1, x0, y1, BONE, 0.55], [x0, y1, x0, y0, BONE, 0.55]], (bw + bh) / 2.2, r) },
    { start: 0.7, pts: strokes([[x0, y0 + 26, x1, y0 + 26, BONE, 0.3]], bw / 5, r) },
    { start: 1.1, pts: strokes([[x0 + 12, y0 + 39, x0 + 52, y0 + 39, BONE, 1], [x1 - 80, y0 + 39, x1 - 62, y0 + 39, BONE, 0.6], [x1 - 54, y0 + 39, x1 - 36, y0 + 39, BONE, 0.6], [x1 - 28, y0 + 39, x1 - 12, y0 + 39, BONE, 0.6]], 60, r) },
    {
      start: 1.6,
      pts: fills([[x0 + 12, heroY, bw - 24, heroH, LIME]], (bw * heroH) / (mobile ? 34 : 28), r).map((p) => {
        const u = (p.x - x0) / bw;
        return { ...p, c: u + (r() - 0.5) * 0.5 > 0.55 ? CYAN : LIME, a: 0.25 + 0.5 * Math.pow(r(), 2) };
      }),
    },
    { start: 2.3, pts: strokes([[x0 + 24, heroY + heroH - 30, x0 + 24 + bw * 0.5, heroY + heroH - 30, BONE, 1], [x0 + 24, heroY + heroH - 18, x0 + 24 + bw * 0.32, heroY + heroH - 18, BONE, 1]], bw * 0.5, r) },
    {
      start: 2.8,
      pts: [0, 1, 2].flatMap((i) => {
        const cx = x0 + 12 + i * (cardW + 8);
        return strokes([[cx, cardY, cx + cardW, cardY, BONE, 0.4], [cx + cardW, cardY, cx + cardW, cardY + cardH, BONE, 0.4], [cx + cardW, cardY + cardH, cx, cardY + cardH, BONE, 0.4], [cx, cardY + cardH, cx, cardY, BONE, 0.4]], (cardW + cardH) / 3, r);
      }),
    },
  ];
  const scores = [96, 100, 100, 100];
  const ry = h * (mobile ? 0.83 : 0.84), rad = mobile ? 15 : 17;
  scores.forEach((s, i) => {
    const cx = x0 + bw * ((i + 0.5) / 4);
    place(`ring-${i}`, cx, ry);
    const pts: Pt[] = [];
    for (let d = 0; d < 360; d += 4) {
      const on = d < (s / 100) * 360, ang = -Math.PI / 2 + (d * Math.PI) / 180;
      pts.push({ x: cx + Math.cos(ang) * rad, y: ry + Math.sin(ang) * rad, c: on ? LIME : BONE, a: on ? 1 : 0.15 });
    }
    groups.push({ start: 3.8 + i * 0.12, pts });
  });
  const flat = groups.flatMap((g) => g.pts.map((p, j) => ({ ...p, st: g.start + (j / g.pts.length) * 0.5, fx: p.x + (r() - 0.5) * 60, fy: h + 10 + r() * 40, ph: r() * 6.28 })));
  return {
    draw(t) {
      for (const p of flat) {
        if (t < p.st) continue;
        const u = clamp01((t - p.st) / 0.8), e = easeOut(u);
        dot(ctx, mix(p.fx, p.x, e), mix(p.fy, p.y, e), p.c, p.a * Math.min(1, u * 2) * (0.85 + 0.15 * Math.sin(t * 2 + p.ph)));
      }
    },
  };
}

/* 3 — Pre-publish review */
function review({ ctx, w, h, mobile, place }: Env): Scene {
  const r = rng(53);
  const S = mobile ? Math.min(w * 0.42, h * 0.52) : Math.min(h * 0.6, w * 0.36);
  const x0 = w * (mobile ? 0.05 : 0.08), y0 = (h - S - 34) / 2, capY = y0 + S + 18;
  place("pin-1", x0 + 0.46 * S, y0 + 0.66 * S);
  place("pin-2", x0 + 0.8 * S, y0 + 0.13 * S);
  place("pin-3", x0 + 0.2 * S - 10, capY);
  place("pin-4", x0 + 0.2 * S, y0 + 0.1 * S);
  place("list", x0 + S + (mobile ? 16 : 40), h / 2);
  const inner: [number, number, number, number] = [x0 + 4, y0 + 4, x0 + S - 4, y0 + S - 4];
  const parts: Pt[] = [
    ...strokes([[x0, y0, x0 + S, y0, BONE, 0.5], [x0 + S, y0, x0 + S, y0 + S, BONE, 0.5], [x0 + S, y0 + S, x0, y0 + S, BONE, 0.5], [x0, y0 + S, x0, y0, BONE, 0.5]], S * 1.4, r),
    ...gauss(x0 + 0.68 * S, y0 + 0.32 * S, S * 0.42, S * 0.36, (S * S) / 70, CYAN, r, 0.55, inner),
    ...gauss(x0 + 0.34 * S, y0 + 0.56 * S, S * 0.5, S * 0.42, (S * S) / 55, LIME, r, 0.6, inner),
    ...strokes([[x0 + 0.08 * S, y0 + 0.78 * S, x0 + 0.72 * S, y0 + 0.78 * S, BONE, 1], [x0 + 0.08 * S, y0 + 0.87 * S, x0 + 0.5 * S, y0 + 0.87 * S, BONE, 1]], S * 0.9, r),
    ...gauss(x0 + 0.1 * S, y0 + 0.1 * S, 6, 6, 24, BONE, r, 0.9),
    ...[LIME, CYAN, BONE].flatMap((c, i) => fills([[x0 + 0.88 * S, y0 + 0.07 * S + i * 0.07 * S, 0.05 * S, 0.05 * S, c, 0.9]], 14, r)),
    ...strokes([[x0, capY, x0 + 0.16 * S, capY, BONE, 0.45], [x0 + 0.54 * S, capY, x0 + S, capY, BONE, 0.45], [x0, capY + 10, x0 + 0.62 * S, capY + 10, BONE, 0.45]], S * 0.6, r),
  ];
  const banned = strokes([[x0 + 0.22 * S, capY, x0 + 0.5 * S, capY, BONE, 0.6]], S * 0.2, r).map((p) => ({ ...p, j: r() }));
  const all = parts.map((p) => ({ ...p, st: 0.1 + r() * 0.9, fx: p.x + (r() - 0.5) * 40, fy: h + 20 + r() * 40 }));
  const scanFrom = 1.2, scanTo = 3.0, flagAt = 2.85, fixAt = 3.5, fixedAt = 4.0;
  return {
    draw(t) {
      for (const p of all) {
        if (t < p.st) continue;
        const u = clamp01((t - p.st) / 0.9), e = easeOut(u);
        dot(ctx, mix(p.fx, p.x, e), mix(p.fy, p.y, e), p.c, p.a * Math.min(1, u * 2));
      }
      // The scan: a bright line sweeping the post and its caption.
      const su = clamp01((t - scanFrom) / (scanTo - scanFrom));
      if (su > 0 && su < 1) {
        const yy = mix(y0 - 4, capY + 14, su);
        for (let x = x0 - 8; x <= x0 + S + 8; x += 3) dot(ctx, x, yy + Math.sin(x * 0.3 + t * 8) * 0.6, CYAN, 0.9, 1.6);
      }
      // The banned phrase: plain, then flagged coral, then lifted and re-set lime.
      for (const p of banned) {
        if (t < 0.6) continue;
        let c = BONE, a = 0.6, yy = p.y;
        if (t >= flagAt && t < fixAt) { c = CORAL; a = 1; }
        else if (t >= fixAt && t < fixedAt) {
          const u = (t - fixAt) / (fixedAt - fixAt);
          c = u < 0.5 ? CORAL : LIME;
          yy = p.y - Math.sin(u * Math.PI) * (6 + p.j * 10);
          a = 0.9;
        } else if (t >= fixedAt) { c = LIME; a = 0.95; }
        dot(ctx, p.x, yy, c, a, 1.9);
      }
    },
  };
}

const SCENES = [brain, team, web, review];

export function mountGrains(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  system: number,
  opts: { still: boolean; onPhase?: (phase: number) => void },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { run() {}, destroy() {} };
  let scene: Scene;
  let w = 0, h = 0, t = 0, last = 0, raf = 0, running = false, phase = -1;
  const place = (name: string, x: number, y: number) => {
    const el = root.querySelector<HTMLElement>(`[data-anchor="${name}"]`);
    if (el) { el.style.left = `${x}px`; el.style.top = `${y}px`; }
  };
  const paint = (dt: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    scene.draw(t, dt);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    if (scene.phase && opts.onPhase) {
      const k = scene.phase(t);
      if (k !== phase) { phase = k; opts.onPhase(k); }
    }
  };
  // With reduced motion the story is run through once, off screen, and
  // only its finished frame is shown.
  const settle = () => {
    t = 0;
    for (let i = 0; i < 180; i++) { t += 1 / 30; scene.draw(t, 1 / 30); }
    paint(0);
  };
  const build = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    w = rect.width; h = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, w < 640 ? 1.5 : 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene = SCENES[system]({ ctx, w, h, mobile: w < 520, place });
    return true;
  };
  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    paint(dt);
    raf = requestAnimationFrame(frame);
  };
  const ready = build();
  if (ready && opts.still) settle();
  const ro = new ResizeObserver(() => {
    const before = w;
    if (!build()) return;
    if (opts.still) settle();
    else if (!running && before !== w) paint(0);
  });
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
