// Selected work as a helix of glass cards round the diving bird.
//
// Scroll turns the helix and lifts it past the camera, so the bird — held
// in the middle, nose down, wings folded — reads as falling through it.
// Clicking a card flies it to the front, the world behind it goes dark and
// the card comes apart into its own picture as particles, raked by comets
// of light; the cursor parts it into beads and a click bursts them. Beads
// peel off the bird and trail its flight throughout.
import {
  atmosphereFragment,
  beadFragment,
  beadVertex,
  cardFragment,
  cardVertex,
  fullscreenVertex,
  insideFragment,
  insideVertex,
  veilFragment,
} from "./work-shaders";

type Vec3 = [number, number, number];

const CARD_W = 1;
const CARD_H = 0.62;
const CARD_D = 0.045;
const CARD_R = 0.07;
const STEP_ANGLE = (Math.PI * 2) / 5;
const STEP_Y = 1.05;

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
  travel: number; // integrated flight distance, drives the air motes
  speed: number; // 0..1 scroll speed
  open: number; // requested open card, -1 none
  hover: number;
  cursor: [number, number]; // NDC
  cursorOn: number;
};

export function createWorkHelixLayer(
  gl: WebGL2RenderingContext,
  mobile: boolean,
  slots: { deep: Vec3; mid: Vec3; glow: Vec3 }[],
) {
  const count = slots.length;
  const card = compile(gl, cardVertex, cardFragment);
  const beads = compile(gl, beadVertex, beadFragment);
  const atmosphere = compile(gl, fullscreenVertex, atmosphereFragment);
  const veil = compile(gl, fullscreenVertex, veilFragment);
  const inside = compile(gl, insideVertex, insideFragment);

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

  const beadCount = mobile ? 1400 : 3600;
  const beadVao = gl.createVertexArray();
  gl.bindVertexArray(beadVao);
  const seeds = new Float32Array(beadCount * 4);
  let rs = 0x2545f491;
  const rnd = () => {
    rs ^= rs << 13; rs ^= rs >>> 17; rs ^= rs << 5;
    return (rs >>> 0) / 4294967296;
  };
  for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
  const beadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, beadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const seedLoc = gl.getAttribLocation(beads.p, "aSeed");
  gl.enableVertexAttribArray(seedLoc);
  gl.vertexAttribPointer(seedLoc, 4, gl.FLOAT, false, 0, 0);
  const emptyVao = gl.createVertexArray();
  gl.bindVertexArray(null);

  const radius = mobile ? 1.3 : 2.5;
  const scale = mobile ? 1.5 : 2.55;
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
  let openT = 0;
  let shown = -1; // card currently opened or closing
  let clock = 0;
  let focus = 0;
  const openRect = new Float32Array(4);
  // Cursor wake over the opened card, in panel space: slot 0 is the live
  // cursor, 1..7 a ring of recent stroke samples that fade.
  const trail = new Float32Array(32);
  const trailW = new Float32Array(8);
  let trailSlot = 1;
  let trailLast: [number, number] | null = null;
  let trailClock = 0;
  const burst = new Float32Array([0, 0, 9, 0]);
  const toPanel = (x: number, y: number): [number, number] => [
    ((x - openRect[0]) / Math.max(openRect[2], 1e-3)) * (CARD_W / CARD_H),
    (y - openRect[1]) / Math.max(openRect[3], 1e-3),
  ];
  const openModel = new Float32Array(16);

  // Pose of card i on the helix at the current scroll.
  const helixPose = (i: number, f: WorkFrame) => {
    const along = f.progress * (count - 1);
    const angle = (i - along) * STEP_ANGLE + Math.sin(f.time * 0.21) * 0.035;
    const y = (along - i) * STEP_Y + f.enter * 6.5 + 0.08;
    const pos: Vec3 = [Math.sin(angle) * radius, y, Math.cos(angle) * radius];
    // Side cards turn a little toward the viewer, like screens on a stair.
    return { pos, yaw: angle * 0.78, tilt: -y * 0.06, y };
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

  const pick = (clientX: number, clientY: number, cssW: number, cssH: number) => {
    if (!frame || openT > 0.02) return -1;
    const x = (clientX / cssW) * 2 - 1;
    const y = 1 - (clientY / cssH) * 2;
    // Nearest first.
    for (let k = order.length - 1; k >= 0; k--) {
      const i = order[k];
      if (!pickable[i]) continue;
      const q = quads[i];
      let sign = 0, inside = true;
      for (let e = 0; e < 4; e++) {
        const ax = q[e * 2], ay = q[e * 2 + 1];
        const bx = q[((e + 1) % 4) * 2], by = q[((e + 1) % 4) * 2 + 1];
        const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
        const s = Math.sign(cross);
        if (s === 0) continue;
        if (sign === 0) sign = s;
        else if (s !== sign) { inside = false; break; }
      }
      if (inside) return i;
    }
    return -1;
  };

  const update = (f: WorkFrame) => {
    frame = f;
    const wantOpen = f.open >= 0 && f.amount > 0.5;
    if (wantOpen && shown !== f.open && openT < 0.02) shown = f.open;
    if (wantOpen && shown === f.open) openT = Math.min(1, openT + f.delta / 1.6);
    else openT = Math.max(0, openT - f.delta / 1.15);
    if (openT === 0 && !wantOpen) shown = -1;
    if (openT > 0.75) clock += f.delta;
    else if (openT === 0) clock = 0;

    const along = f.progress * (count - 1);
    focus = Math.max(0, Math.min(count - 1, Math.round(along)));
    const fly = smooth(openT, 0, 0.55);
    const flyE = fly < 0.5 ? 4 * fly * fly * fly : 1 - Math.pow(-2 * fly + 2, 3) / 2;
    const op = openPose(f);
    order.length = 0;
    for (let i = 0; i < count; i++) {
      const pose = helixPose(i, f);
      hovers[i] = damp(hovers[i], f.hover === i && openT < 0.02 ? 1 : 0, 9, f.delta);
      const lift = hovers[i] * 0.18;
      const pos: Vec3 = [
        pose.pos[0] * (1 + lift / radius),
        pose.pos[1],
        pose.pos[2] * (1 + lift / radius),
      ];
      let s = scale * (1 + hovers[i] * 0.035);
      let yaw = pose.yaw, tilt = pose.tilt;
      if (i === shown) {
        // Arc to the front: out toward the camera, then square on.
        const arc = Math.sin(flyE * Math.PI) * 0.6;
        pos[0] = mix(pos[0], op.pos[0], flyE);
        pos[1] = mix(pos[1], op.pos[1], flyE) + arc * 0.2;
        pos[2] = mix(pos[2], op.pos[2], flyE) + arc;
        s = mix(s, op.s, flyE);
        yaw = mix(yaw, 0, flyE);
        tilt = mix(tilt, 0, flyE);
      }
      modelMatrix(models[i], pos, yaw, tilt, s);
      // Cards far above or below the bird fade into the dark.
      const band = 1 - smooth(Math.abs(pose.y), mobile ? 1.9 : 2.3, mobile ? 3.4 : 4.1);
      alphas[i] = f.amount * (i === shown ? 1 : band);
      const view = mulVec(f.view, pos[0], pos[1], pos[2]);
      depths[i] = view[2];
      // Deeper cards sit darker, like the reference's recessed screens.
      dims[i] = mix(0.42, 1.12, smooth(-view[2], 9.5, 4.5)) * (i === shown ? mix(1, 1.15, flyE) : 1);
      sweeps[i] = ((yaw * 0.5 + pos[1] * 0.12) % 2 + 2) % 2 - 0.3;
      // Screen quad for picking.
      const q = quads[i];
      const hw = CARD_W / 2, hh = CARD_H / 2;
      const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
      let behind = false;
      corners.forEach(([cx, cy], e) => {
        const p = project(models[i], f, cx, cy);
        if (p[2] <= 0) behind = true;
        q[e * 2] = p[0];
        q[e * 2 + 1] = p[1];
      });
      // Only cards whose face turns toward the viewer can be picked.
      const nx = models[i][8], nz = models[i][10];
      const toCam = [f.camera[0] - pos[0], f.camera[2] - pos[2]];
      pickable[i] = !behind && alphas[i] > 0.35 && nx * toCam[0] + nz * toCam[1] > 0 ? 1 : 0;
      order.push(i);
    }
    // Far to near.
    order.sort((a, b) => depths[a] - depths[b]);
    // Cursor wake inside the opened card.
    const [cx, cy] = toPanel(f.cursor[0], f.cursor[1]);
    const live = openT > 0.85 ? f.cursorOn : 0;
    for (let k = 1; k < 8; k++) trailW[k] *= Math.exp(-f.delta * 1.8);
    trailClock += f.delta;
    if (trailLast && live > 0.5) {
      const dx = cx - trailLast[0], dy = cy - trailLast[1];
      const moved = Math.hypot(dx, dy);
      if (moved > 0.035 && trailClock > 1 / 40) {
        trailClock = 0;
        trail.set([cx, cy, dx / Math.max(f.delta, 1 / 120), dy / Math.max(f.delta, 1 / 120)], trailSlot * 4);
        trailW[trailSlot] = Math.min(1, 0.35 + moved * 4);
        trailSlot = trailSlot % 7 + 1;
      }
    }
    trailLast = [cx, cy];
    trail.set([cx, cy, 0, 0], 0);
    trailW[0] = damp(trailW[0], live * 0.55, 8, f.delta);
    burst[2] += f.delta;
    if (openT < 0.5) burst[3] = 0;
    if (shown >= 0) {
      openModel.set(models[shown]);
      const tl = project(openModel, f, -CARD_W / 2, CARD_H / 2);
      const br = project(openModel, f, CARD_W / 2, -CARD_H / 2);
      openRect[0] = (tl[0] + br[0]) / 2;
      openRect[1] = (tl[1] + br[1]) / 2;
      openRect[2] = Math.abs(br[0] - tl[0]) / 2;
      openRect[3] = Math.abs(tl[1] - br[1]) / 2;
    }
  };

  const drawCard = (i: number, f: WorkFrame, alphaScale = 1) => {
    const a = alphas[i] * alphaScale;
    if (a < 0.003) return;
    const s = slots[i];
    gl.uniformMatrix4fv(card.u("uModel"), false, models[i]);
    gl.uniform3fv(card.u("uDeep"), s.deep);
    gl.uniform3fv(card.u("uMid"), s.mid);
    gl.uniform3fv(card.u("uGlow"), s.glow);
    gl.uniform1f(card.u("uSeed"), i * 1.37 + 0.4);
    gl.uniform1f(card.u("uAlpha"), a);
    gl.uniform1f(card.u("uHover"), hovers[i]);
    gl.uniform1f(card.u("uGlitch"), hovers[i] > 0.05 ? 0.5 + 0.5 * Math.sin(f.time * 3) : 0);
    gl.uniform1f(card.u("uDim"), dims[i]);
    gl.uniform1f(card.u("uSweep"), sweeps[i]);
    gl.uniform1f(card.u("uSolid"), i === shown ? smooth(openT, 0.05, 0.4) : 0);
    gl.drawArrays(gl.TRIANGLES, 0, cardVerts);
  };

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

  const birdDepth = (f: WorkFrame) => mulVec(f.view, f.bird[0], f.bird[1], f.bird[2])[2];
  // Everything behind the bird, drawn before its grains.
  const renderBack = () => {
    const f = frame;
    if (!f || f.amount < 0.003) return;
    gl.useProgram(atmosphere.p);
    gl.bindVertexArray(emptyVao);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.uniform1f(atmosphere.u("uAmount"), f.amount);
    gl.uniform1f(atmosphere.u("uTime"), f.time);
    gl.uniform1f(atmosphere.u("uAspect"), f.width / Math.max(f.height, 1));
    gl.uniform2f(atmosphere.u("uAxis"), 0.5, 0.5);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const bz = birdDepth(f);
    beginCards(f);
    for (const i of order) if (i !== shown && depths[i] < bz) drawCard(i, f, 1 - smooth(openT, 0.1, 0.5));
    endCards();
  };

  // Everything in front of the bird, then the opened card's interior.
  const renderFront = () => {
    const f = frame;
    if (!f || f.amount < 0.003) return;
    const bz = birdDepth(f);
    beginCards(f);
    for (const i of order) if (i !== shown && depths[i] >= bz) drawCard(i, f, 1 - smooth(openT, 0.1, 0.5));
    endCards();

    gl.useProgram(beads.p);
    gl.bindVertexArray(beadVao);
    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.uniformMatrix4fv(beads.u("uView"), false, f.view);
    gl.uniformMatrix4fv(beads.u("uProj"), false, f.projection);
    gl.uniform1f(beads.u("uTime"), f.time);
    gl.uniform1f(beads.u("uPx"), f.height / (2 * Math.tan(Math.PI / 8)));
    gl.uniform1f(beads.u("uAmount"), f.amount * (1 - smooth(openT, 0.1, 0.5)));
    gl.uniform1f(beads.u("uFlow"), f.flow);
    gl.uniform1f(beads.u("uTravel"), f.travel);
    gl.uniform1f(beads.u("uSpeed"), f.speed);
    gl.uniform1f(beads.u("uLen"), f.birdLength);
    gl.uniform3fv(beads.u("uBird"), f.bird);
    gl.drawArrays(gl.POINTS, 0, beadCount);

    if (shown < 0) return;
    const veilA = smooth(openT, 0.12, 0.6);
    const s = slots[shown];
    gl.useProgram(veil.p);
    gl.bindVertexArray(emptyVao);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.uniform1f(veil.u("uAmount"), veilA * f.amount);
    gl.uniform1f(veil.u("uTime"), f.time);
    gl.uniform1f(veil.u("uAspect"), f.width / Math.max(f.height, 1));
    gl.uniform3fv(veil.u("uTint"), s.mid);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // The glass card hands over to its particles as it arrives.
    beginCards(f);
    drawCard(shown, f, 1 - smooth(openT, 0.5, 0.78));
    endCards();

    const assemble = smooth(openT, 0.45, 0.95);
    if (assemble < 0.002) return;
    const cols = mobile ? 120 : 210;
    const rows = Math.round(cols * CARD_H / CARD_W);
    gl.useProgram(inside.p);
    gl.bindVertexArray(emptyVao);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.uniform2f(inside.u("uGrid"), cols, rows);
    gl.uniform4fv(inside.u("uRect"), openRect);
    gl.uniform1f(inside.u("uTime"), f.time);
    gl.uniform1f(inside.u("uClock"), clock + 2.0);
    gl.uniform1f(inside.u("uAssemble"), assemble * 1.5);
    gl.uniform1f(inside.u("uComets"), smooth(clock, 0.1, 1.2) * smooth(openT, 0.8, 1));
    gl.uniform1f(inside.u("uPanelAspect"), CARD_W / CARD_H);
    gl.uniform1f(inside.u("uSeed"), shown * 1.37 + 0.4);
    gl.uniform1f(inside.u("uCellPx"), (openRect[2] * f.width) / cols);
    gl.uniform3fv(inside.u("uDeep"), s.deep);
    gl.uniform3fv(inside.u("uMid"), s.mid);
    gl.uniform3fv(inside.u("uGlow"), s.glow);
    gl.uniform4fv(inside.u("uTrail"), trail);
    gl.uniform1fv(inside.u("uTrailW"), trailW);
    gl.uniform4fv(inside.u("uBurst"), burst);
    gl.drawArrays(gl.POINTS, 0, cols * rows);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  };

  return {
    update,
    renderBack,
    renderFront,
    pick,
    // A click inside the opened card bursts its beads from that point.
    burst(x: number, y: number) {
      if (openT < 0.85) return;
      const [px, py] = toPanel(x, y);
      burst.set([px, py, 0, 1]);
    },
    get focus() { return focus; },
    get openAmount() { return openT; },
    dispose() {
      [card, beads, atmosphere, veil, inside].forEach((x) => gl.deleteProgram(x.p));
      gl.deleteBuffer(cardBuffer);
      gl.deleteBuffer(beadBuffer);
      gl.deleteVertexArray(cardVao);
      gl.deleteVertexArray(beadVao);
      gl.deleteVertexArray(emptyVao);
    },
  };
}
