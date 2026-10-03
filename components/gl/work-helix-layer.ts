// Selected work as a helix of glass cards, the bird flying far behind it.
//
// Scroll turns the helix and carries it past the camera, so the bird reads
// as falling (or, scrolling back, climbing) through it. The cards are real
// glass — they refract a blurred grab of the scene behind them. Only scroll
// turns the helix; a hovered card tilts under the cursor and ripples its
// colours in waves round the point. A particle current (the
// hero's data sea, stood on end) flows in the far background, and each
// card carries its project's name as a hologram inside the glass.
// Clicking a card flies it to the front, darkens the world and hands it to
// a fluid of beads (work-inside.ts) the cursor and clicks can stir.
import {
  atmosphereFragment,
  cardFragment,
  cardVertex,
  fullscreenVertex,
  veilFragment,
} from "./work-shaders";
import { createGlyphFace } from "./glyph-face";
import { createWorkInside } from "./work-inside";
import { createSeaLayer } from "./sea-layer";

type Vec3 = [number, number, number];

const CARD_W = 1;
const CARD_H = 0.62;
const CARD_D = 0.018;
const CARD_R = 0.055;
const STEP_ANGLE = Math.PI / 3;
const STEP_Y = 0.95;
// Share of the pinned runway the cards use; the tail is the backdrop's exit.
export const CARDS_END = 0.7;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const make = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "work shader");
    return s;
  };
  const p = gl.createProgram()!;
  const v = make(gl.VERTEX_SHADER, vs);
  const f = make(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "work link");
  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
    return cache.get(name) ?? null;
  };
  return { p, u };
}

// Rounded-rectangle slab: front (+z) and back faces as fans, side walls
// between the two outlines. Attributes: position, normal, uv, face id.
function cardGeometry() {
  const outline: [number, number][] = [];
  const hw = CARD_W / 2, hh = CARD_H / 2, seg = 8;
  const corners: [number, number, number][] = [
    [hw - CARD_R, hh - CARD_R, 0],
    [-hw + CARD_R, hh - CARD_R, Math.PI / 2],
    [-hw + CARD_R, -hh + CARD_R, Math.PI],
    [hw - CARD_R, -hh + CARD_R, Math.PI * 1.5],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = start + (i / seg) * (Math.PI / 2);
      outline.push([cx + Math.cos(a) * CARD_R, cy + Math.sin(a) * CARD_R]);
    }
  }
  const data: number[] = [];
  const push = (x: number, y: number, z: number, n: Vec3, face: number, mirror = false) => {
    const u = x / CARD_W + 0.5;
    data.push(x, y, z, n[0], n[1], n[2], mirror ? 1 - u : u, y / CARD_H + 0.5, face);
  };
  const z = CARD_D / 2;
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = outline[i];
    const [bx, by] = outline[(i + 1) % n];
    // Front fan (counter-clockwise seen from +z).
    push(0, 0, z, [0, 0, 1], 0);
    push(ax, ay, z, [0, 0, 1], 0);
    push(bx, by, z, [0, 0, 1], 0);
    // Back fan (reversed winding).
    push(0, 0, -z, [0, 0, -1], 1, true);
    push(bx, by, -z, [0, 0, -1], 1, true);
    push(ax, ay, -z, [0, 0, -1], 1, true);
    // Side wall.
    const ex = bx - ax, ey = by - ay;
    const len = Math.hypot(ex, ey) || 1;
    const nn: Vec3 = [ey / len, -ex / len, 0];
    push(ax, ay, z, nn, 2);
    push(ax, ay, -z, nn, 2);
    push(bx, by, -z, nn, 2);
    push(ax, ay, z, nn, 2);
    push(bx, by, -z, nn, 2);
    push(bx, by, z, nn, 2);
  }
  return new Float32Array(data);
}

function mulVec(m: Float32Array, x: number, y: number, z: number): [number, number, number, number] {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
    m[3] * x + m[7] * y + m[11] * z + m[15],
  ];
}

// Column-major model matrix: translate · Ry(yaw) · Rx(tilt) · scale.
function modelMatrix(out: Float32Array, p: Vec3, yaw: number, tilt: number, s: number) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(tilt), sx = Math.sin(tilt);
  out.set([
    cy * s, 0, -sy * s, 0,
    sy * sx * s, cx * s, cy * sx * s, 0,
    sy * cx * s, -sx * s, cy * cx * s, 0,
    p[0], p[1], p[2], 1,
  ]);
}

const smooth = (x: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (c: number, t: number, k: number, d: number) => c + (t - c) * (1 - Math.exp(-k * d));

export type WorkFrame = {
  view: Float32Array;
  projection: Float32Array;
  camera: Vec3;
  time: number;
  delta: number;
  width: number; // drawing buffer px
  height: number;
  amount: number; // 0..1 how present the section is
  progress: number; // 0..1 along the pinned runway
  enter: number; // -1 below, 0 pinned, +1 above: helix slides with the page
  bird: Vec3;
  birdLength: number; // world length of the bird's body along the fall
  flow: number; // +1 diving (beads trail up), -1 climbing
  travel: number; // integrated flight distance, drives the streams
  speed: number; // 0..1 scroll speed
  open: number; // requested open card, -1 none
  hover: number;
  cursor: [number, number]; // NDC
  cursorOn: number;
};

export function createWorkHelixLayer(
  gl: WebGL2RenderingContext,
  mobile: boolean,
  slots: { deep: Vec3; mid: Vec3; glow: Vec3; screen?: string; face?: string; video?: string }[],
  titles: () => string[],
) {
  const count = slots.length;
  const card = compile(gl, cardVertex, cardFragment);
  const sea = createSeaLayer(gl, mobile);
  const atmosphere = compile(gl, fullscreenVertex, atmosphereFragment);
  const veil = compile(gl, fullscreenVertex, veilFragment);
  const inside = createWorkInside(gl, mobile, CARD_W / CARD_H);

  const cardVao = gl.createVertexArray();
  gl.bindVertexArray(cardVao);
  const geometry = cardGeometry();
  const cardBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cardBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
  const stride = 9 * 4;
  const attr = (name: string, size: number, offset: number) => {
    const loc = gl.getAttribLocation(card.p, name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4);
  };
  attr("aPos", 3, 0);
  attr("aNormal", 3, 3);
  attr("aUv", 2, 6);
  attr("aFace", 1, 8);
  const cardVerts = geometry.length / 9;

  const emptyVao = gl.createVertexArray();
  gl.bindVertexArray(null);
  // Live-product screens: loaded per card once; until (or unless) one lands
  // the card keeps its colour world.
  const screens: (WebGLTexture | null)[] = slots.map(() => null);
  let disposed = false;
  slots.forEach((s, i) => {
    if (!s.screen) return;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (disposed) return;
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE11);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      screens[i] = tex;
    };
    img.src = s.screen;
  });
  // Living faces: the canvas is redrawn and re-uploaded while its card is on
  // screen, at most ~24 fps (15 on phones).
  const faces = slots.map((s, i) => {
    if (!s.face) return null;
    const face = createGlyphFace(s.face, mobile);
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE11);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([5, 8, 6, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    screens[i] = tex;
    return { face, tex, at: -1 };
  });
  // Project films: a muted loop per card, decoded only while its card is
  // drawn (paused shortly after it leaves), uploaded at the face's rate
  // when the decoder has a new frame. Until its first frame lands the card
  // keeps its colour world; with reduced motion it holds that first frame.
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const videos = slots.map((s) => (s.video ? { src: s.video, el: null as HTMLVideoElement | null, tex: null as WebGLTexture | null, at: -1, shown: -1, seen: -1 } : null));
  const refreshVideo = (i: number, time: number) => {
    const v = videos[i];
    if (!v) return;
    v.seen = time;
    if (!v.el) {
      const el = document.createElement("video");
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      el.preload = "auto";
      el.setAttribute("playsinline", "");
      el.src = v.src;
      v.el = el;
    }
    if (!reduced && v.el.paused) v.el.play().catch(() => {});
    if (v.el.readyState < 2 || v.el.currentTime === v.shown || time - v.at < (mobile ? 1 / 15 : 1 / 24)) return;
    v.at = time;
    v.shown = v.el.currentTime;
    if (!v.tex) {
      v.tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE11);
      gl.bindTexture(gl.TEXTURE_2D, v.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      screens[i] = v.tex;
    }
    gl.activeTexture(gl.TEXTURE11);
    gl.bindTexture(gl.TEXTURE_2D, v.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v.el);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  const pauseHidden = (time: number) => {
    for (const v of videos) if (v?.el && !v.el.paused && time - v.seen > 0.4) v.el.pause();
  };
  const refreshFace = (i: number, time: number) => {
    const f = faces[i];
    if (!f || time - f.at < (mobile ? 1 / 15 : 1 / 24)) return;
    f.at = time;
    f.face.draw(time);
    gl.activeTexture(gl.TEXTURE11);
    gl.bindTexture(gl.TEXTURE_2D, f.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, f.face.canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  // Hologram titles: one 4:1 canvas cell per card, redrawn when the names
  // (or the display font) change.
  const titleTex = gl.createTexture();
  let titleKey = "";
  let titleReady = 0;
  const drawTitles = (names: string[]) => {
    const cellW = 1024, cellH = 256;
    const canvas = document.createElement("canvas");
    canvas.width = cellW;
    canvas.height = cellH * count;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const family = getComputedStyle(document.body).getPropertyValue("--font-audiowide").trim() || "sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    names.slice(0, count).forEach((raw, i) => {
      // Capitals for the hologram, except camel-cased brand names (ModdTeam)
      // whose own casing is the mark.
      const name = /[a-z][A-Z]/.test(raw) ? raw : raw.toUpperCase();
      let size = 112;
      const font = () => `400 ${size}px ${family}`;
      ctx.font = font();
      // One line if it fits, else two balanced lines; shrink to fit.
      let lines = [name];
      if (ctx.measureText(name).width > cellW * 0.9 && name.includes(" ")) {
        const words = name.split(" ");
        let best = [name, ""], score = Infinity;
        for (let k = 1; k < words.length; k++) {
          const a = words.slice(0, k).join(" "), b = words.slice(k).join(" ");
          const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
          if (w < score) { score = w; best = [a, b]; }
        }
        lines = best;
      }
      const widest = () => Math.max(...lines.map((l) => ctx.measureText(l).width));
      while (widest() > cellW * 0.9 && size > 40) { size -= 4; ctx.font = font(); }
      if (lines.length === 2) while (size * 2.1 > cellH * 0.92 && size > 40) { size -= 4; ctx.font = font(); }
      const lh = size * 1.02;
      lines.forEach((l, k) => ctx.fillText(l, cellW / 2, i * cellH + cellH / 2 + (k - (lines.length - 1) / 2) * lh));
    });
    gl.activeTexture(gl.TEXTURE15);
    gl.bindTexture(gl.TEXTURE_2D, titleTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    titleReady = 1;
  };
  const syncTitles = () => {
    const names = titles();
    const key = names.join("|");
    if (!names.length || key === titleKey) return;
    titleKey = key;
    drawTitles(names);
    // Redraw once the display font has actually loaded.
    void document.fonts?.ready.then(() => titleKey === key && drawTitles(names));
  };

  // Glass: a half-resolution, mip-mapped grab of the frame drawn so far.
  let grab: { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number; float: boolean } | null = null;
  const grabScene = (source: WebGLFramebuffer | null, f: WorkFrame) => {
    const w = Math.max(1, f.width >> 1), h = Math.max(1, f.height >> 1);
    const float = !!source;
    if (!grab || grab.w !== w || grab.h !== h || grab.float !== float) {
      if (grab) {
        gl.deleteTexture(grab.tex);
        gl.deleteFramebuffer(grab.fbo);
      }
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE12);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const levels = Math.floor(Math.log2(Math.max(w, h))) + 1;
      gl.texStorage2D(gl.TEXTURE_2D, levels, float ? gl.RGBA16F : gl.RGBA8, w, h);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      grab = { tex, fbo, w, h, float };
    }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, grab.fbo);
    gl.blitFramebuffer(0, 0, f.width, f.height, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, source);
    gl.activeTexture(gl.TEXTURE12);
    gl.bindTexture(gl.TEXTURE_2D, grab.tex);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  const radius = mobile ? 1.35 : 2.6;
  const scale = mobile ? 1.45 : 2.5;
  const models = Array.from({ length: count }, () => new Float32Array(16));
  const alphas = new Float32Array(count);
  const dims = new Float32Array(count);
  const depths = new Float32Array(count);
  const hovers = new Float32Array(count);
  const sweeps = new Float32Array(count);
  const quads = Array.from({ length: count }, () => new Float32Array(8));
  const pickable = new Uint8Array(count);
  const order: number[] = [];
  let frame: WorkFrame | null = null;
  // The backdrop's arrival (0 absent → 1 whole), led by the scroll.
  let reveal = 0;
  let revealShown = 0;
  let openT = 0;
  let shown = -1; // card currently opened or closing
  let focus = 0;
  const openRect = new Float32Array(4);
  // Cursor response: the hovered card tilts under the pointer and carries
  // a glare at the pointed spot. The helix itself only turns with scroll.
  const restModel = new Float32Array(16);
  const cursorUv: [number, number] = [0.5, 0.5];
  const cursorVel: [number, number] = [0, 0];
  let lastHover = -1;

  // The cards turn through the runway up to CARDS_END; the rest is the
  // backdrop's exit.
  const cardsAlong = (f: WorkFrame) => Math.min(1, f.progress / CARDS_END) * (count - 1);
  const helixPose = (i: number, f: WorkFrame) => {
    const along = cardsAlong(f);
    const angle = (i - along) * STEP_ANGLE;
    const y = (along - i) * STEP_Y + f.enter * 6.5 + 0.05;
    const pos: Vec3 = [Math.sin(angle) * radius, y, Math.cos(angle) * radius];
    // Tangent to the cylinder, square to the axis: an even spiral stair.
    return { pos, yaw: angle, tilt: 0, y };
  };

  // Where an opened card sits: square to the camera, filling the frame.
  const openPose = (f: WorkFrame) => {
    const dist = 3.1;
    const aspect = f.width / Math.max(f.height, 1);
    const halfH = dist * Math.tan(Math.PI / 8);
    const w = Math.min(halfH * aspect * 2 * (mobile ? 0.9 : 0.6), (halfH * 2 * 0.62) / CARD_H);
    const pos: Vec3 = [f.camera[0], f.camera[1] + halfH * (mobile ? 0.12 : 0.06), f.camera[2] - dist];
    return { pos, s: w / CARD_W };
  };

  const project = (m: Float32Array, f: WorkFrame, x: number, y: number) => {
    const w = mulVec(m, x, y, 0);
    const v = mulVec(f.view, w[0], w[1], w[2]);
    const c = mulVec(f.projection, v[0], v[1], v[2]);
    return [c[0] / c[3], c[1] / c[3], c[3]] as const;
  };

  // Where the cursor ray meets card i, in its uv (may fall outside 0..1).
  const cursorOnCard = (i: number, f: WorkFrame): [number, number] | null => {
    const v = f.view, m = models[i];
    const t = Math.tan(Math.PI / 8), aspect = f.width / Math.max(f.height, 1);
    const dv = [f.cursor[0] * t * aspect, f.cursor[1] * t, -1];
    const dir = [
      v[0] * dv[0] + v[1] * dv[1] + v[2] * dv[2],
      v[4] * dv[0] + v[5] * dv[1] + v[6] * dv[2],
      v[8] * dv[0] + v[9] * dv[1] + v[10] * dv[2],
    ];
    const n = [m[8], m[9], m[10]];
    const denom = dir[0] * n[0] + dir[1] * n[1] + dir[2] * n[2];
    if (Math.abs(denom) < 1e-5) return null;
    const o = [m[12] - f.camera[0], m[13] - f.camera[1], m[14] - f.camera[2]];
    const hit = (o[0] * n[0] + o[1] * n[1] + o[2] * n[2]) / denom;
    const rel = [f.camera[0] + dir[0] * hit - m[12], f.camera[1] + dir[1] * hit - m[13], f.camera[2] + dir[2] * hit - m[14]];
    const s2 = m[0] * m[0] + m[1] * m[1] + m[2] * m[2];
    const lx = (rel[0] * m[0] + rel[1] * m[1] + rel[2] * m[2]) / s2;
    const ly = (rel[0] * m[4] + rel[1] * m[5] + rel[2] * m[6]) / s2;
    return [lx / CARD_W + 0.5, ly / CARD_H + 0.5];
  };

  const pick = (clientX: number, clientY: number, cssW: number, cssH: number) => {
    if (!frame || openT > 0.02) return -1;
    const x = (clientX / cssW) * 2 - 1;
    const y = 1 - (clientY / cssH) * 2;
    for (let k = order.length - 1; k >= 0; k--) {
      const i = order[k];
      if (!pickable[i]) continue;
      const q = quads[i];
      let sign = 0, inside = true;
      for (let e = 0; e < 4; e++) {
        const ax = q[e * 2], ay = q[e * 2 + 1];
        const bx = q[((e + 1) % 4) * 2], by = q[((e + 1) % 4) * 2 + 1];
        const s = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
        if (s === 0) continue;
        if (sign === 0) sign = s;
        else if (s !== sign) { inside = false; break; }
      }
      if (inside) return i;
    }
    return -1;
  };

  const update = (f: WorkFrame) => {
    pauseHidden(f.time);
    frame = f;
    syncTitles();
    // Arrival follows the scroll, starting before the section: the sea
    // gathers as the section rises from the bottom of the screen and is
    // whole by the time it pins; after the last card it thins away. The
    // shown value trails the target both ways so it never snaps.
    const arrive = smooth(f.enter, -0.95, -0.05);
    const depart = 1 - smooth(f.progress, CARDS_END + 0.01, 0.96);
    const target = Math.min(arrive, depart);
    revealShown = damp(revealShown, target, 1.3, f.delta);
    reveal = Math.min(revealShown, 1 - smooth(f.progress, 0.975, 0.998));
    const wantOpen = f.open >= 0 && f.amount > 0.5;
    if (wantOpen && shown !== f.open && openT < 0.02) shown = f.open;
    if (wantOpen && shown === f.open) openT = Math.min(1, openT + f.delta / 1.6);
    else openT = Math.max(0, openT - f.delta / 1.15);
    if (openT === 0 && !wantOpen) shown = -1;

    const along = cardsAlong(f);
    focus = Math.max(0, Math.min(count - 1, Math.round(along)));
    const fly = smooth(openT, 0, 0.55);
    const flyE = fly < 0.5 ? 4 * fly * fly * fly : 1 - Math.pow(-2 * fly + 2, 3) / 2;
    const op = openPose(f);
    const hoverUv = f.hover >= 0 && openT < 0.02 ? cursorOnCard(f.hover, f) : null;
    if (hoverUv) {
      if (lastHover !== f.hover) cursorUv.splice(0, 2, hoverUv[0], hoverUv[1]);
      const px = cursorUv[0], py = cursorUv[1];
      cursorUv[0] = damp(cursorUv[0], hoverUv[0], 14, f.delta);
      cursorUv[1] = damp(cursorUv[1], hoverUv[1], 14, f.delta);
      const dt = Math.max(f.delta, 1 / 240);
      cursorVel[0] = damp(cursorVel[0], Math.max(-3, Math.min(3, (cursorUv[0] - px) / dt)), 6, f.delta);
      cursorVel[1] = damp(cursorVel[1], Math.max(-3, Math.min(3, (cursorUv[1] - py) / dt)), 6, f.delta);
    }
    lastHover = hoverUv ? f.hover : -1;
    order.length = 0;
    for (let i = 0; i < count; i++) {
      const pose = helixPose(i, f);
      hovers[i] = damp(hovers[i], f.hover === i && openT < 0.02 ? 1 : 0, 8, f.delta);
      const lift = hovers[i] * 0.22;
      const pos: Vec3 = [pose.pos[0] * (1 + lift / radius), pose.pos[1], pose.pos[2] * (1 + lift / radius)];
      let s = scale * (1 + hovers[i] * 0.03);
      // The hovered card turns a little under the pointer, like a pane
      // pressed at that spot.
      const h = hovers[i];
      let yaw = pose.yaw - (cursorUv[0] - 0.5) * 0.28 * h;
      let tilt = pose.tilt + (cursorUv[1] - 0.5) * 0.22 * h;
      if (i === shown) {
        const arc = Math.sin(flyE * Math.PI) * 0.6;
        pos[0] = mix(pos[0], op.pos[0], flyE);
        pos[1] = mix(pos[1], op.pos[1], flyE) + arc * 0.2;
        pos[2] = mix(pos[2], op.pos[2], flyE) + arc;
        s = mix(s, op.s, flyE);
        yaw = mix(yaw, 0, flyE);
        tilt = mix(tilt, 0, flyE);
      }
      modelMatrix(models[i], pos, yaw, tilt, s);
      const band = 1 - smooth(Math.abs(pose.y), mobile ? 1.9 : 2.4, mobile ? 3.4 : 4.2);
      alphas[i] = f.amount * (i === shown ? 1 : band);
      const view = mulVec(f.view, pos[0], pos[1], pos[2]);
      depths[i] = view[2];
      dims[i] = mix(0.55, 1.08, smooth(-view[2], 9.5, 4.5)) * (i === shown ? mix(1, 1.12, flyE) : 1);
      sweeps[i] = ((yaw * 0.5 + pos[1] * 0.12) % 2 + 2) % 2 - 0.3;
      // Picking uses the card's rest pose, not the hover lift and tilt, so
      // a card turning under the pointer can't slip out from under it and
      // flicker between hovered and not.
      modelMatrix(restModel, pose.pos, pose.yaw, pose.tilt, scale);
      const q = quads[i];
      const hw = CARD_W / 2, hh = CARD_H / 2;
      const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
      let behind = false;
      corners.forEach(([cx, cy], e) => {
        const p = project(restModel, f, cx, cy);
        if (p[2] <= 0) behind = true;
        q[e * 2] = p[0];
        q[e * 2 + 1] = p[1];
      });
      const nx = models[i][8], nz = models[i][10];
      const toCam = [f.camera[0] - pos[0], f.camera[2] - pos[2]];
      pickable[i] = !behind && alphas[i] > 0.35 && nx * toCam[0] + nz * toCam[1] > 0 ? 1 : 0;
      order.push(i);
    }
    order.sort((a, b) => depths[a] - depths[b]);
    if (shown >= 0) {
      const tl = project(models[shown], f, -CARD_W / 2, CARD_H / 2);
      const br = project(models[shown], f, CARD_W / 2, -CARD_H / 2);
      openRect[0] = (tl[0] + br[0]) / 2;
      openRect[1] = (tl[1] + br[1]) / 2;
      openRect[2] = Math.abs(br[0] - tl[0]) / 2;
      openRect[3] = Math.abs(tl[1] - br[1]) / 2;
    }
  };

  const toPanel = (x: number, y: number): [number, number] => [
    ((x - openRect[0]) / Math.max(openRect[2], 1e-3)) * (CARD_W / CARD_H),
    (y - openRect[1]) / Math.max(openRect[3], 1e-3),
  ];

  const beginCards = (f: WorkFrame) => {
    gl.useProgram(card.p);
    gl.bindVertexArray(cardVao);
    gl.uniformMatrix4fv(card.u("uView"), false, f.view);
    gl.uniformMatrix4fv(card.u("uProj"), false, f.projection);
    gl.uniform3fv(card.u("uCam"), f.camera);
    gl.uniform2f(card.u("uHalf"), CARD_W / 2, CARD_H / 2);
    gl.uniform1f(card.u("uRadius"), CARD_R);
    gl.uniform1f(card.u("uAspect"), CARD_W / CARD_H);
    gl.uniform1f(card.u("uTime"), f.time);
    gl.uniform2f(card.u("uResolution"), f.width, f.height);
    gl.uniform1i(card.u("uScene"), 12);
    gl.activeTexture(gl.TEXTURE15);
    gl.bindTexture(gl.TEXTURE_2D, titleTex);
    gl.uniform1i(card.u("uTitles"), 15);
    gl.uniform1i(card.u("uShot"), 11);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.disable(gl.DEPTH_TEST);
  };
  const endCards = () => {
    gl.disable(gl.CULL_FACE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  };

  // Cards refract one grab of the scene per pass (behind the bird, in
  // front of it): per-card grabs cost frames and made scrolling judder.
  const drawCards = (list: number[], f: WorkFrame, target: WebGLFramebuffer | null, alphaScale: number) => {
    let grabbed = false;
    for (const i of list) {
      const a = alphas[i] * alphaScale;
      if (a < 0.003) continue;
      if (!grabbed) {
        grabScene(target, f);
        grabbed = true;
        beginCards(f);
      }
      const s = slots[i];
      refreshFace(i, f.time);
      refreshVideo(i, f.time);
      gl.activeTexture(gl.TEXTURE12);
      gl.bindTexture(gl.TEXTURE_2D, grab!.tex);
      gl.uniform1f(card.u("uGlass"), 1);
      gl.uniformMatrix4fv(card.u("uModel"), false, models[i]);
      gl.uniform3fv(card.u("uDeep"), s.deep);
      gl.uniform3fv(card.u("uMid"), s.mid);
      gl.uniform3fv(card.u("uGlow"), s.glow);
      gl.uniform1f(card.u("uSeed"), i * 1.37 + 0.4);
      gl.uniform1f(card.u("uAlpha"), a);
      gl.uniform1f(card.u("uHover"), hovers[i]);
      gl.uniform1f(card.u("uRow"), i);
      gl.uniform1f(card.u("uRows"), count);
      gl.activeTexture(gl.TEXTURE11);
      gl.bindTexture(gl.TEXTURE_2D, screens[i]);
      gl.uniform1f(card.u("uShotOn"), screens[i] ? 1 : 0);
      gl.uniform1f(card.u("uClear"), videos[i] ? 1 : 0);
      gl.uniform1f(card.u("uTitleOn"), titleReady);
      gl.uniform3f(card.u("uAxisX"), models[i][0] / s0(i), models[i][1] / s0(i), models[i][2] / s0(i));
      gl.uniform3f(card.u("uAxisY"), models[i][4] / s0(i), models[i][5] / s0(i), models[i][6] / s0(i));
      gl.uniform1f(card.u("uDim"), dims[i]);
      gl.uniform1f(card.u("uSweep"), sweeps[i]);
      gl.uniform1f(card.u("uSolid"), i === shown ? smooth(openT, 0.05, 0.4) : 0);
      gl.uniform2f(card.u("uCursorUv"), cursorUv[0], cursorUv[1]);
      gl.uniform2f(card.u("uCursorVel"), cursorVel[0], cursorVel[1]);
      gl.uniform1f(card.u("uCursorLight"), hovers[i]);
      gl.drawArrays(gl.TRIANGLES, 0, cardVerts);
    }
    if (grabbed) endCards();
  };

  const s0 = (i: number) => Math.hypot(models[i][0], models[i][1], models[i][2]) || 1;
  const birdDepth = (f: WorkFrame) => mulVec(f.view, f.bird[0], f.bird[1], f.bird[2])[2];
  const hide = () => 1 - smooth(openT, 0.1, 0.5);

  // Atmosphere, the particle sea and the cards behind the bird.
  const renderBack = (target: WebGLFramebuffer | null) => {
    const f = frame;
    if (!f) return;
    // The sea outlives the section by its sinking animation.
    sea.render({
      view: f.view, projection: f.projection, camera: f.camera, time: f.time, delta: f.delta,
      width: f.width, height: f.height, travel: f.travel,
      cursor: f.cursor, cursorOn: openT < 0.05 ? f.cursorOn : 0,
      reveal, amount: hide(),
    }, target);
    if (f.amount < 0.003) return;
    gl.useProgram(atmosphere.p);
    gl.bindVertexArray(emptyVao);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    // Faint: the particle sea carries the backdrop now.
    gl.uniform1f(atmosphere.u("uAmount"), f.amount * 0.35);
    gl.uniform1f(atmosphere.u("uTime"), f.time);
    gl.uniform1f(atmosphere.u("uAspect"), f.width / Math.max(f.height, 1));
    gl.uniform2f(atmosphere.u("uAxis"), 0.5, 0.5);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const bz = birdDepth(f);
    drawCards(order.filter((i) => i !== shown && depths[i] < bz), f, target, hide());
  };

  // Cards in front of the bird, then the opened card.
  const renderFront = (target: WebGLFramebuffer | null) => {
    const f = frame;
    if (!f || f.amount < 0.003) return;
    const bz = birdDepth(f);
    drawCards(order.filter((i) => i !== shown && depths[i] >= bz), f, target, hide());

    // The inside fluid runs only while a card is (nearly) open.
    const [px, py] = toPanel(f.cursor[0], f.cursor[1]);
    inside.step(f.delta, f.time, shown >= 0 && openT > 0.4, { x: px, y: py, on: openT > 0.85 ? f.cursorOn : 0 }, target);
    gl.viewport(0, 0, f.width, f.height);
    if (shown < 0) return;
    const s = slots[shown];
    gl.useProgram(veil.p);
    gl.bindVertexArray(emptyVao);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.uniform1f(veil.u("uAmount"), smooth(openT, 0.12, 0.6) * f.amount);
    gl.uniform1f(veil.u("uTime"), f.time);
    gl.uniform1f(veil.u("uAspect"), f.width / Math.max(f.height, 1));
    gl.uniform3fv(veil.u("uTint"), s.mid);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    drawCards([shown], f, target, 1 - smooth(openT, 0.5, 0.78));

    const assemble = smooth(openT, 0.45, 0.95);
    if (assemble < 0.002) return;
    refreshFace(shown, f.time);
    refreshVideo(shown, f.time);
    inside.render({
      rect: openRect, width: f.width, height: f.height, time: f.time, assemble,
      seed: shown * 1.37 + 0.4, deep: s.deep, mid: s.mid, glow: s.glow,
      screen: screens[shown],
    });
  };

  return {
    update,
    renderBack,
    renderFront,
    pick,
    // A click inside the opened card fires a burst from that point.
    burst(x: number, y: number) {
      if (openT < 0.85) return;
      const [px, py] = toPanel(x, y);
      inside.burst(px, py);
    },
    get focus() { return focus; },
    get openAmount() { return openT; },
    dispose() {
      [card, atmosphere, veil].forEach((x) => gl.deleteProgram(x.p));
      sea.dispose();
      disposed = true;
      screens.forEach((t) => t && gl.deleteTexture(t));
      videos.forEach((v) => {
        v?.el?.pause();
        v?.el?.removeAttribute("src");
        v?.el?.load();
      });
      gl.deleteTexture(titleTex);
      inside.dispose();
      if (grab) {
        gl.deleteTexture(grab.tex);
        gl.deleteFramebuffer(grab.fbo);
      }
      gl.deleteBuffer(cardBuffer);
      gl.deleteVertexArray(cardVao);
      gl.deleteVertexArray(emptyVao);
    },
  };
}
