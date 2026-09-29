"use client";

import { useEffect, useRef } from "react";
import { leanFragment, leanVertex } from "./lean-field-shaders";
import { createSculptureLayer } from "./sculpture-layer";
import { createTunnelLayer } from "./tunnel-layer";
import { createXLayer } from "./x-layer";
import { makeGlyphAtlas } from "./matrix-layer";
import { createPost } from "./post";
import { buildBirdLinks } from "./bird-links";
import { createBirdBehaviour, FOLD_FRAME } from "./bird-behaviour";
import { createWorkHelixLayer } from "./work-helix-layer";
import { bustState, scrollState, workState } from "../three/scroll-state";
import { slotRgb, workSlots } from "@/content/work-slots";

const GLYPHS = ["0", "1", "<", ">", "{", "}", "/", "+", "*", "=", ":", ";", ".", "-", "|", "_"];
const BIRD_SAMPLES = 9000;
const INTRO_SECONDS = 3.2;
const BIRD_FRAMES = 16;
const TEX_W = 2048;
const ROWS_PER_FRAME = 5;
const TEX_H = BIRD_FRAMES * ROWS_PER_FRAME;
const POSITION_ELEMENTS = TEX_W * TEX_H * 4;
const NORMAL_ELEMENTS = TEX_W * ROWS_PER_FRAME * 4;

const vertexSource = `#version 300 es
precision highp float;
#define attribute in
#define varying out
#define texture2D texture
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
${leanVertex}`;

const fragmentSource = `#version 300 es
precision highp float;
#define varying in
#define texture2D texture
out vec4 outColor;
#define gl_FragColor outColor
${leanFragment}`;

type Vec3 = [number, number, number];

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL shader allocation failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "WebGL shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

const yieldTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  await yieldTask();
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  await yieldTask();
  const program = gl.createProgram();
  if (!program) throw new Error("WebGL program allocation failed");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  await yieldTask();
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "WebGL program link failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function perspective(out: Float32Array, fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
}

function lookAt(out: Float32Array, eye: Vec3, center: Vec3) {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  let length = Math.hypot(zx, zy, zz) || 1;
  zx /= length;
  zy /= length;
  zz /= length;
  let xx = zz;
  const xy = 0;
  let xz = -zx;
  length = Math.hypot(xx, xz) || 1;
  xx /= length;
  xz /= length;
  const yx = zy * xz;
  const yy = zz * xx - zx * xz;
  const yz = -zy * xx;
  out.set([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

// Model matrix with rotation Ry(yaw)·Rx(pitch)·Rz(roll): roll about the
// body axis, then nose up/down about the wing axis, then heading.
// Model matrix with rotation Ry(yaw)·Rx(pitch)·Rz(roll): roll about the
// body axis, then nose up/down about the wing axis, then heading.
function compose(out: Float32Array, position: Vec3, scale: number, yaw: number, roll: number, pitch = 0) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  const cz = Math.cos(roll), sz = Math.sin(roll);
  // Columns of Ry·Rx·Rz.
  const c0: Vec3 = [cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz];
  const c1: Vec3 = [-cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz];
  const c2: Vec3 = [sy * cx, -sx, cy * cx];
  out.set([
    c0[0] * scale, c0[1] * scale, c0[2] * scale, 0,
    c1[0] * scale, c1[1] * scale, c1[2] * scale, 0,
    c2[0] * scale, c2[1] * scale, c2[2] * scale, 0,
    position[0], position[1], position[2], 1,
  ]);
}

function damp(current: number, target: number, speed: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-speed * delta));
}

function smoothstep(value: number, min: number, max: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function mix(a: number, b: number, amount: number) {
  return a + (b - a) * amount;
}

function flightAt(hero: number, page: number, pointer: Vec3, pointerActive: number) {
  const keys = [
    { h: 0.38, p: [1.15, 0.75, -0.6] as Vec3, s: 0.72 },
    { h: 0.58, p: [0.65, 0.92, 0] as Vec3, s: 0.92 },
    { h: 0.72, p: [-1.05, 1.02, 0.5] as Vec3, s: 1.04 },
    { h: 0.84, p: [1.28, 0.88, 1.05] as Vec3, s: 1.18 },
    { h: 0.95, p: [0.45, 0.72, 1.82] as Vec3, s: 1.36 },
    { h: 1, p: [0.15, 1.05, 1.65] as Vec3, s: 1.4 },
  ];
  let position: Vec3;
  let scale: number;
  let direction: Vec3;
  if (hero < 0.999) {
    let segment = 0;
    while (segment < keys.length - 2 && hero > keys[segment + 1].h) segment++;
    const first = keys[segment];
    const second = keys[segment + 1];
    const local = smoothstep(hero, first.h, second.h);
    position = [
      mix(first.p[0], second.p[0], local),
      mix(first.p[1], second.p[1], local),
      mix(first.p[2], second.p[2], local),
    ];
    scale = mix(first.s, second.s, local);
    direction = [second.p[0] - first.p[0], second.p[1] - first.p[1], second.p[2] - first.p[2]];
  } else {
    const t = Math.max(0, Math.min(1, page * 1.08));
    position = [Math.sin(t * Math.PI * 4.2) * 2.05, 0.72 + Math.sin(t * Math.PI * 2.4) * 0.5, 0.4 + Math.cos(t * Math.PI * 2) * 0.55];
    direction = [Math.cos(t * Math.PI * 4.2), Math.cos(t * Math.PI * 2.4) * 0.25, -Math.sin(t * Math.PI * 2) * 0.25];
    scale = mix(1.38, 0.86, smoothstep(t, 0, 0.28)) + smoothstep(t, 0.86, 1) * 0.18;
  }
  const follow = smoothstep(hero, 0.54, 0.72) * pointerActive * (1 - smoothstep(page, 0.86, 0.97));
  if (follow > 0.001) {
    // A gentle pull toward the cursor, never away from it, so the cursor
    // can reach the bird and stir its grains.
    const strength = (hero < 0.999 ? 0.14 : 0.2) * follow;
    const target: Vec3 = [pointer[0], pointer[1], position[2]];
    position = [mix(position[0], target[0], strength), mix(position[1], target[1], strength), position[2]];
  }
  return { position, scale, direction };
}

function createAtlas(gl: WebGL2RenderingContext) {
  const cell = 64;
  const canvas = document.createElement("canvas");
  canvas.width = cell * 4;
  canvas.height = cell * 4;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Glyph atlas canvas failed");
  context.fillStyle = "#fff";
  context.font = `${cell * 0.72}px Menlo, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  GLYPHS.forEach((glyph, index) => {
    context.fillText(glyph, (index % 4) * cell + cell / 2, Math.floor(index / 4) * cell + cell / 2);
  });
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

function homePosition(index: number, count: number) {
  const shell = index % 3;
  const t = (index / count) * Math.PI * 2 * 13.37;
  const u = Math.acos(2 * ((index * 0.61803) % 1) - 1);
  const radius = 1.1 + shell * 0.65 + Math.sin(t * 2.7) * 0.25;
  let x = Math.sin(u) * Math.cos(t) * radius * 1.9;
  let y = Math.sin(u) * Math.sin(t) * radius * 0.9 + Math.sin(t * 1.3) * 0.4;
  const z = Math.cos(u) * radius * 1.1;
  x += Math.sin(y * 1.45 + shell) * 0.38;
  y += Math.sin(x * 0.82) * 0.28;
  return [x, y, z] as Vec3;
}

export function RawStage({ onReady }: { onReady?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, powerPreference: "high-performance" });
    if (!gl) return;
    let disposed = false;
    let runtimeCleanup = () => {};
    let frameId = 0;
    let firstFrame = true;
    // During the opening assembly nothing but the field is on screen: the nav
    // and hero copy hide on "flying" and return as the field lands. The
    // safety timer guarantees the copy can never stay hidden if the render
    // loop dies before marking the intro done.
    const skipIntro = window.scrollY > 40;
    document.documentElement.dataset.stageIntro = skipIntro ? "done" : "flying";
    // "settled" follows once the sea has nearly finished surfacing; the hero
    // name waits for it so it arrives after the field, not with it.
    if (skipIntro) document.documentElement.dataset.stageSettled = "true";
    const introSafety = setTimeout(() => {
      document.documentElement.dataset.stageIntro = "done";
      document.documentElement.dataset.stageSettled = "true";
    }, 5000);
    // The bird bake is the largest startup payload; request it alongside
    // shader compilation instead of after it.
    const birdBake = fetch("/models/bird-bake.bin");
    birdBake.catch(() => {});
    void (async () => {
    const program = await createProgram(gl);
    if (disposed) {
      gl.deleteProgram(program);
      return;
    }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.useProgram(program);

    const mobile = window.matchMedia("(pointer: coarse)").matches || innerWidth < 768;
    // Stage size comes from the canvas (sized to the large viewport), not
    // innerHeight: on phones the URL bar resizes the window on every scroll
    // direction change, which used to rescale the field mid-scroll.
    let stageW = innerWidth;
    let stageH = innerHeight;
    const sculpture = createSculptureLayer(gl, mobile);
    // Voyage: after the opening, the bird on black, then the voxel tunnel.
    const tunnel = createTunnelLayer(gl, mobile);
    let workElement: HTMLElement | null = null;
    let workAmount = 0;
    let workProgress = 0;
    let workEnter = -1;
    let workYaw = 0;
    let workLastProgress = 0;
    // Flight through the helix follows the scroll: velocity along the
    // runway, how far the bird has turned to climb (0 diving, 1 climbing),
    // and the distance flown, which drives the air streaming past.
    let workVel = 0;
    let workUp = 0;
    let workUpTarget = 0;
    let workTravel = 0;
    let workGlide = 1;
    // Which way along the body the tail lies in the bake (+1: toward +z).
    const workTailSign = 1;
    workState.pick = (x, y) => work.pick(x, y, stageW, stageH);
    // Film look (bloom, lens ring, grade); blended in only for the tunnel.
    const post = createPost(gl);
    let voyageElement: HTMLElement | null = null;
    let voyageHold = 0;
    let voyage = 0;
    let tunnelIn = 0;
    // The X: the name's last letter handed over as beads, drifting down
    // into the voyage, condensing into a solid X and opening as the portal
    // the bird flies through into the tunnel.
    const glyphAtlas = makeGlyphAtlas(gl);
    const xLayer = createXLayer(gl, mobile, glyphAtlas);
    // Selected work: glass cards on a helix with the bird behind.
    const work = createWorkHelixLayer(gl, mobile, workSlots.map((slot) => ({
      deep: slotRgb(slot.colors[0]),
      mid: slotRgb(slot.colors[1]),
      glow: slotRgb(slot.colors[2]),
    })), glyphAtlas);
    // How far the voyage has slid in: 0 with its top at the screen's foot,
    // 1 once the X has had room to rejoin.
    let xPath = 0;
    let xGather = 0;
    let xSampled = "";
    const xCentre: [number, number, number] = [0, 0.2, -2.8];
    // Voyage chapters (section progress): condense, open, fly in, pass
    // through; inside, the tunnel runs on its own clock, not the scroll.
    let xDense = 0;
    let xOpen = 0;
    let birdEnter = 0;
    let portalThrough = 0;
    let tunnelClock = 0;
    let tunnelSpeed = 0;
    // The ride: seconds since the flight passed the portal, and how far into
    // warp speed it is (0 gliding in → 1 full rush).
    let rideTime = 0;
    let warp = 0;
    let speedShown = -1;
    let exitSent = false;
    gl.bindVertexArray(vao);
    gl.useProgram(program);
    // Sparse grains supply the handoff; the particle sculpture carries entry.
    const count = mobile ? 10000 : 24000;
    const birdCount = mobile ? 2400 : 6000;
    let randomState = 0x9e3779b9;
    const random = () => {
      randomState ^= randomState << 13;
      randomState ^= randomState >>> 17;
      randomState ^= randomState << 5;
      return (randomState >>> 0) / 4294967296;
    };
    const home = new Float32Array(count * 3);
    const grid = new Float32Array(count * 2);
    const seeds = new Float32Array(count);
    const glyphs = new Float32Array(count);
    const birds = new Float32Array(count);
    const columns = Math.round(Math.sqrt(count * Math.max(stageW / Math.max(stageH, 1), 0.3)));
    const rows = Math.ceil(count / columns);
    const permutation = Array.from({ length: count }, (_, index) => index);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }
    for (let i = 0; i < count; i++) {
      const point = homePosition(i, count);
      home.set(point, i * 3);
      seeds[i] = random() * 100;
      glyphs[i] = Math.floor(random() * GLYPHS.length);
      const cell = permutation[i];
      grid[i * 2] = ((cell % columns) + 0.5 + (random() - 0.5) * 0.25) / columns;
      grid[i * 2 + 1] = 1 - (Math.floor(cell / columns) + 0.5 + (random() - 0.5) * 0.25) / rows;
      birds[i] = i < birdCount ? Math.floor((i / birdCount) * BIRD_SAMPLES) : -1;
    }

    const buffers: WebGLBuffer[] = [];
    const attribute = (name: string, data: Float32Array, size: number) => {
      const location = gl.getAttribLocation(program, name);
      const buffer = gl.createBuffer();
      if (!buffer || location < 0) return;
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    };
    attribute("aHome", home, 3);
    attribute("aGrid", grid, 2);
    attribute("aSeed", seeds, 1);
    attribute("aGlyph", glyphs, 1);
    attribute("aBird", birds, 1);

    // Short-lived data links: particles adjacent in grid space are paired
    // into a LINES index buffer and redrawn as a second pass over the fluid
    // painting. The element binding lives on the VAO; drawArrays ignores it.
    const maxLinks = mobile ? 150 : 420;
    const linkIndices: number[] = [];
    const linkBuckets = new Map<number, number>();
    for (let i = 0; i < count && linkIndices.length < maxLinks * 2; i++) {
      const key = Math.floor(grid[i * 2] * 34) * 64 + Math.floor(grid[i * 2 + 1] * 20);
      const partner = linkBuckets.get(key);
      if (partner === undefined) {
        linkBuckets.set(key, i);
      } else {
        linkIndices.push(partner, i);
        linkBuckets.delete(key);
      }
    }
    const linkBuffer = gl.createBuffer();
    if (linkBuffer) {
      buffers.push(linkBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, linkBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(linkIndices), gl.STATIC_DRAW);
    }

    const location = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = new Map<string, WebGLUniformLocation | null>();
    const u = (name: string) => {
      if (!uniforms.has(name)) uniforms.set(name, location(name));
      return uniforms.get(name) ?? null;
    };
    const positionTexture = gl.createTexture();
    const normalTexture = gl.createTexture();
    const atlasTexture = createAtlas(gl);
    const setupTexture = (
      unit: number,
      texture: WebGLTexture | null,
      uniform: string,
      halfFloat = false,
    ) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (halfFloat) {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA16F,
          1,
          1,
          0,
          gl.RGBA,
          gl.HALF_FLOAT,
          new Uint16Array(4),
        );
      } else {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          1,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array(4),
        );
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(u(uniform), unit);
    };
    setupTexture(0, positionTexture, "uPosTex", true);
    setupTexture(1, normalTexture, "uNrmTex", true);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.uniform1i(u("uAtlas"), 3);

    let birdReady = 0;
    const linkTexture = gl.createTexture();
    let linksReady = false;
    try {
      const response = await birdBake;
      if (!response.ok) throw new Error(`bird bake: ${response.status}`);
      const buffer = await response.arrayBuffer();
      if (disposed) return;
      if (buffer.byteLength !== (POSITION_ELEMENTS + NORMAL_ELEMENTS) * 2) {
        throw new Error("bird texture has an unexpected byte length");
      }
      // Upload before the RAF loop exists. Previously this asynchronous upload
      // could land during the first scroll and create a random 50–100ms stall.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, positionTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, TEX_W, TEX_H, 0, gl.RGBA, gl.HALF_FLOAT, new Uint16Array(buffer, 0, POSITION_ELEMENTS));
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, TEX_W, ROWS_PER_FRAME, 0, gl.RGBA, gl.HALF_FLOAT, new Uint16Array(buffer, POSITION_ELEMENTS * 2, NORMAL_ELEMENTS));
      birdReady = 1;
      await yieldTask();
      // Surface neighbours: the grains fill the patches between samples.
      const links = buildBirdLinks(new Uint16Array(buffer, 0, BIRD_SAMPLES * 4), BIRD_SAMPLES, TEX_W);
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, linkTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEX_W, links.rows, 0, gl.RGBA, gl.FLOAT, links.texels);
      linksReady = true;
      await yieldTask();
    } catch (error) {
      console.error("bird texture failed:", error);
    }

    // Bust scan for the bird → bust morph. Fetched after the intro so it never
    // competes with startup; the morph simply stays off until it lands.
    const BUST_W = 2048;
    const BUST_ROWS = 59;
    const BUST_COUNT = 120000;
    const bustTexture = gl.createTexture();
    const bust = {
      texture: bustTexture, ready: false, rows: BUST_ROWS, count: BUST_COUNT,
      rect: new Float32Array(4), aspect: 1, yaw: 0, pitch: 0, lift: 0, morph: 0,
    };
    let bustElement: HTMLElement | null = null;
    let servicesElement: HTMLElement | null = null;
    let orbitElement: HTMLElement | null = null;
    let services = 0;
    const bustLoad = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch("/models/ataberk-bake.bin");
          if (!response.ok) throw new Error(`bust bake: ${response.status}`);
          const buffer = await response.arrayBuffer();
          if (disposed) return;
          if (buffer.byteLength !== BUST_W * BUST_ROWS * 2 * 4 * 2) throw new Error("bust bake: unexpected size");
          gl.activeTexture(gl.TEXTURE5);
          gl.bindTexture(gl.TEXTURE_2D, bustTexture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, BUST_W, BUST_ROWS * 2, 0, gl.RGBA, gl.HALF_FLOAT, new Uint16Array(buffer));
          bust.ready = true;
          bustState.driven = true;
        } catch (error) {
          console.error("bust morph unavailable:", error);
        }
      })();
    }, 3500);

    // The data sea is procedural (see lean-field-shaders), so it is ready as
    // soon as the program is.
    const videoReady = 1;

    const pointer: Vec3 = [999, 999, 0];
    const pointerSmooth: Vec3 = [999, 999, 0];
    let pointerActive = 0;
    let waveAge = -1;

    // Living palette: four Unsupervised-style pigment sets, each a ramp of
    // deep → mid → bright → peak stops. The CPU crossfades between them and
    // uploads the blended ramp every frame.
    const PALETTES: number[][][] = [
      [[0.012, 0.035, 0.09], [0.04, 0.28, 0.42], [0.48, 0.8, 0.85], [1.0, 0.96, 0.87]],
      [[0.025, 0.018, 0.095], [0.2, 0.18, 0.48], [0.65, 0.65, 0.86], [0.98, 0.92, 0.86]],
      [[0.05, 0.025, 0.04], [0.42, 0.19, 0.12], [0.88, 0.58, 0.34], [1.0, 0.95, 0.83]],
      [[0.008, 0.04, 0.06], [0.03, 0.28, 0.3], [0.44, 0.76, 0.69], [0.92, 0.98, 0.89]],
    ];
    const PALETTE_PERIOD = 24;
    const gradient = new Float32Array(12);

    // Edge waves: left, right, bottom, top. Age -1 = idle; a fired wave
    // travels inward from its edge for ~4s. The tide fires them when the
    // fluid body strikes a border; the pointer fires them on contact with
    // the viewport edge.
    const edgeAges = new Float32Array([-1, -1, -1, -1]);
    const edgeCooldownUntil = new Float32Array(4);
    const fireEdgeWave = (edge: number, cooldown: number) => {
      if (time < edgeCooldownUntil[edge]) return;
      edgeCooldownUntil[edge] = time + cooldown;
      edgeAges[edge] = 0;
    };

    // Pointer scan: cursor position in the fluid sheet's own coordinate
    // space at the resting camera plane, plus a sweep strength that charges
    // while the cursor moves and decays in the render loop when it rests.
    // Pointer wake for the sculpture grains: a ring of recent cursor
    // positions in NDC, each with a strength set by stroke speed that decays
    // in the render loop. Works for mouse and touch drags alike.
    // Stamps are laid by a damped follower of the cursor inside the render
    // loop (not by raw events). Each swells in, then fades slowly, and a new
    // stamp always replaces the weakest slot — a still-strong stamp is never
    // yanked away, which was the source of the remaining micro-jumps.
    const WAKE_SLOTS = 16;
    const wake = new Float32Array(WAKE_SLOTS * 4);
    const wakePeak = new Float32Array(WAKE_SLOTS);
    const wakeAge = new Float32Array(WAKE_SLOTS).fill(99);
    let wakeLast: [number, number] | null = null;
    let wakeClock = 0;
    const wakeTarget: [number, number] = [0, 0];
    const wakeFollow: [number, number] = [0, 0];
    let wakeArmed = false;
    const burst = new Float32Array([0, 0, -1]);
    // Cursor presence for the bird scatter: follows the damped wake point
    // and fades in while the pointer is over the page (or a finger is down).
    const hover = new Float32Array(3);
    let hoverTarget = 0;
    const pushWake = (clientX: number, clientY: number) => {
      wakeTarget[0] = (clientX / stageW) * 2 - 1;
      wakeTarget[1] = -((clientY / stageH) * 2 - 1);
      if (!wakeArmed) {
        wakeArmed = true;
        wakeFollow[0] = wakeTarget[0];
        wakeFollow[1] = wakeTarget[1];
      }
    };
    const stepWake = (delta: number) => {
      for (let i = 0; i < WAKE_SLOTS; i++) {
        wakeAge[i] += delta;
        const a = wakeAge[i];
        wake[i * 4 + 2] = wakePeak[i] * (1 - Math.exp(-a * 10)) * Math.exp(-a * 1.3);
      }
      if (!wakeArmed) return;
      wakeFollow[0] = damp(wakeFollow[0], wakeTarget[0], 10, delta);
      wakeFollow[1] = damp(wakeFollow[1], wakeTarget[1], 10, delta);
      wakeClock += delta;
      const [nx, ny] = wakeFollow;
      if (!wakeLast) {
        wakeLast = [nx, ny];
        return;
      }
      const dx = nx - wakeLast[0];
      const dy = ny - wakeLast[1];
      const moved = Math.hypot(dx, dy);
      if (moved < 0.012 || wakeClock < 1 / 45) return;
      wakeClock = 0;
      wakeLast = [nx, ny];
      let slot = 0;
      for (let i = 1; i < WAKE_SLOTS; i++) if (wake[i * 4 + 2] < wake[slot * 4 + 2]) slot = i;
      wakePeak[slot] = Math.min(0.42, 0.14 + moved * 4);
      wakeAge[slot] = 0;
      wake[slot * 4] = nx;
      wake[slot * 4 + 1] = ny;
      // Heading in the shader's aspect-corrected space.
      wake[slot * 4 + 3] = Math.atan2(dy, dx * (stageW / Math.max(stageH, 1)));
    };
    const scanPointer = [0, 0];
    const scanSmooth = [0, 0];
    let scanVelocity = 0;
    const onPointerMove = (event: PointerEvent) => {
      pushWake(event.clientX, event.clientY);
      if (event.pointerType === "mouse" || event.buttons) hoverTarget = 1;
      const aspect = stageW / Math.max(stageH, 1);
      pointer[0] = (event.clientX / stageW * 2 - 1) * (aspect < 1 ? 1.7 : 3.2);
      pointer[1] = -(event.clientY / stageH * 2 - 1) * 2;
      pointerActive = mobile ? 0 : 1;
      if (!mobile) {
        const halfY = 8.2 * Math.tan(Math.PI / 8);
        const sx = (event.clientX / stageW * 2 - 1) * halfY * aspect;
        const sy = -(event.clientY / stageH * 2 - 1) * halfY;
        scanVelocity = Math.min(
          1.4,
          scanVelocity + Math.hypot(sx - scanPointer[0], sy - scanPointer[1]) * 0.55,
        );
        scanPointer[0] = sx;
        scanPointer[1] = sy;
      }
      const margin = 28;
      if (event.clientX <= margin) fireEdgeWave(0, 1.4);
      else if (event.clientX >= stageW - margin) fireEdgeWave(1, 1.4);
      if (event.clientY >= stageH - margin) fireEdgeWave(2, 1.4);
      else if (event.clientY <= margin) fireEdgeWave(3, 1.4);
    };
    const onPointerLeave = () => {
      pointerActive = 0;
      hoverTarget = 0;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") hoverTarget = 0;
    };
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      waveAge = 0;
      burst.set([(event.clientX / stageW) * 2 - 1, -((event.clientY / stageH) * 2 - 1), 0]);
      work.burst((event.clientX / stageW) * 2 - 1, -((event.clientY / stageH) * 2 - 1));
    };
    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pointerdown", onPointerDown, { passive: true });
    addEventListener("pointerup", onPointerUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    const projection = new Float32Array(16);
    const view = new Float32Array(16);
    const birdMatrix = new Float32Array(16);
    let pixelRatio = 1;
    const resize = () => {
      // Full-resolution rendering keeps the droplets pixel-crisp on retina
      // displays; phones trade a little sharpness for fill-rate headroom —
      // the additive field is fill-bound, so DPR is the dominant mobile cost.
      // Standard-density desktop screens render supersampled (≥1.5x) and let
      // the compositor downsample, which rounds off the smallest droplets.
      pixelRatio = mobile
        ? Math.min(devicePixelRatio, 1.5)
        : Math.min(Math.max(devicePixelRatio, 1.5), 2);
      stageW = canvas.clientWidth || innerWidth;
      stageH = canvas.clientHeight || innerHeight;
      const width = Math.round(stageW * pixelRatio);
      const height = Math.round(stageH * pixelRatio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      perspective(projection, Math.PI / 4, stageW / Math.max(stageH, 1), 0.1, 100);
    };
    resize();
    addEventListener("resize", resize);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);
    gl.uniform1f(u("uTexW"), TEX_W);
    gl.uniform1f(u("uTexH"), TEX_H);
    gl.uniform1f(u("uRowsPerFrame"), ROWS_PER_FRAME);
    gl.uniform1f(u("uFrames"), BIRD_FRAMES);
    gl.uniform3f(u("uColorBase"), 0.953, 0.937, 0.906);
    gl.uniform3f(u("uColorAccent"), 0.784, 1, 0.243);
    gl.uniform3f(u("uColorCyan"), 0.541, 0.902, 1);

    let last = performance.now();
    let time = 0;
    let reveal = 0;
    // Opening assembly. Skipped when the page restores an existing
    // scroll position, so mid-page reloads never replay the intro.
    let intro = skipIntro ? 1 : 0;
    let introMarked = false;
    let introSettled = skipIntro;
    let hero = 0;
    let readyMix = 0;
    let videoMix = 0;
    let dissolve = 0;
    let finale = 0;
    let flap = 0;
    let flapPhase = 0;
    const behaviour = createBirdBehaviour();
    // Eased behaviour outputs (see bird-behaviour.ts).
    const eased = { x: 0, y: 0, z: 0, bank: 0, pitch: 0, beat: 1, hold: 0, holdFrame: 0, yawMix: 0 };
    // Grain simulation inputs: last frame's body and the cursor as a 3D ray.
    const prevBird = new Float32Array(16);
    const cursorVel = new Float32Array(3);
    const worldSpan = new Float32Array(2);
    const cursorPoint = new Float32Array(3);
    let cursorPrimed = false;
    let simPrimed = false;
    const simInput = {
      reset: true, dt: 1 / 60, prevMatrix: prevBird,
      cursorVel, splat: hover, hover: 0, worldSpan,
    };
    let yaw = -1.07;
    // Manifesto helix: envelope and the ring in NDC (centre xy, radii zw)
    // around the manifesto copy.
    let orbit = 0;
    const orbitRing = new Float32Array(4);
    const render = (now: number) => {
      if (disposed) return;
      frameId = requestAnimationFrame(render);
      // The rAF timestamp marks the frame's start and can predate the
      // performance.now() captured at setup, so the first delta must clamp at
      // zero — a negative time once indexed PALETTES[-1] and crashed a frame.
      const delta = Math.min(Math.max(now - last, 0) / 1000, 0.05);
      last = now;
      time += delta;
      reveal = Math.min(1, reveal + delta / 0.8);
      // The assembly runs on one short linear clock; each particle applies its
      // own staggered expo-out curve in the shader.
      intro = Math.min(1, intro + delta / INTRO_SECONDS);
      const introEase = 1 - Math.pow(1 - intro, 3);
      if (!introMarked && intro >= 0.5) {
        introMarked = true;
        clearTimeout(introSafety);
        // Hero entrance animations wait on this flag; the copy starts rising
        // while the last particles are still settling into place.
        document.documentElement.dataset.stageIntro = "done";
      }
      if (!introSettled && intro >= 0.85) {
        introSettled = true;
        document.documentElement.dataset.stageSettled = "true";
      }
      hero = damp(hero, scrollState.hero.current, 24, delta);
      // Disperse behind the service grid, then hand back to the bust. The
      // viewport envelope is reversible and independent of page length.
      servicesElement ??= document.querySelector<HTMLElement>("#services");
      let servicesTarget = 0;
      if (servicesElement) {
        const rect = servicesElement.getBoundingClientRect();
        servicesTarget = smoothstep(rect.top / stageH, .95, .2)
          * smoothstep(rect.bottom / stageH, .05, .65);
      }
      services = damp(services, servicesTarget, 7, delta);
      // Morph follows the hologram's place in the viewport: the bird unravels
      // into the bust as it rises into view, holds while it is centred and
      // re-forms as the section leaves.
      if (bust.ready) {
        bustElement ??= document.querySelector<HTMLElement>("[data-bust-canvas]");
        let morphTarget = 0;
        if (bustElement) {
          const r = bustElement.getBoundingClientRect();
          const centre = (r.top + r.height / 2) / Math.max(innerHeight, 1);
          morphTarget = smoothstep(centre, 1.12, 0.5) * smoothstep(centre, -0.2, 0.28);
          bust.rect[0] = (r.left / stageW) * 2 - 1;
          bust.rect[1] = 1 - (r.bottom / stageH) * 2;
          bust.rect[2] = (r.right / stageW) * 2 - 1;
          bust.rect[3] = 1 - (r.top / stageH) * 2;
          bust.aspect = r.width / Math.max(r.height, 1);
        }
        bust.morph = damp(bust.morph, morphTarget, 6, delta);
        bust.yaw = bustState.yaw;
        bust.pitch = bustState.pitch;
        bust.lift = bustState.lift;
        bustState.morph = bust.morph;
      }
      readyMix = damp(readyMix, birdReady, 5, delta);
      dissolve = damp(dissolve, smoothstep(scrollState.page.current, 0.9, 0.97), 5, delta);
      finale = damp(finale, smoothstep(scrollState.page.current, 0.86, 0.97), 5, delta);
      pointerSmooth[0] = damp(pointerSmooth[0], pointer[0], 7, delta);
      pointerSmooth[1] = damp(pointerSmooth[1], pointer[1], 7, delta);
      if (waveAge >= 0) waveAge = waveAge > 3.5 ? -1 : waveAge + delta;
      stepWake(delta);
      hover[0] = wakeFollow[0];
      hover[1] = wakeFollow[1];
      hover[2] = damp(hover[2], wakeArmed ? hoverTarget : 0, 4, delta);
      if (burst[2] >= 0) burst[2] = burst[2] > 2.5 ? -1 : burst[2] + delta;

      // Two superposed slow sines per axis make the tide irregular: the fluid
      // leans, strikes a border, and that edge's wave fires with a cooldown.
      const tideX = Math.sin(time * 0.16) * 0.62 + Math.sin(time * 0.071 + 1.7) * 0.38;
      const tideY = Math.sin(time * 0.118 + 0.8) * 0.5 + Math.sin(time * 0.053) * 0.24;
      if (tideX < -0.86) fireEdgeWave(0, 5.5);
      else if (tideX > 0.86) fireEdgeWave(1, 5.5);
      if (tideY < -0.6) fireEdgeWave(2, 5.5);
      else if (tideY > 0.6) fireEdgeWave(3, 5.5);
      for (let i = 0; i < 4; i++) {
        if (edgeAges[i] >= 0) edgeAges[i] = edgeAges[i] > 4 ? -1 : edgeAges[i] + delta;
      }

      const cyclePos = time / PALETTE_PERIOD;
      const paletteIndex = Math.floor(cyclePos) % PALETTES.length;
      const current = PALETTES[paletteIndex];
      const upcoming = PALETTES[(paletteIndex + 1) % PALETTES.length];
      const fade = smoothstep(cyclePos - Math.floor(cyclePos), 0.62, 1);
      for (let stop = 0; stop < 4; stop++) {
        for (let channel = 0; channel < 3; channel++) {
          gradient[stop * 3 + channel] = mix(current[stop][channel], upcoming[stop][channel], fade);
        }
      }

      // Phones hand the painting off earlier so the sea branch and the bird
      // morph never share a frame budget for long.
      const targetVideo = mobile
        ? videoReady * (1 - smoothstep(hero, 0.1, 0.24))
        : videoReady * (1 - smoothstep(hero, 0.14, 0.38));
      videoMix = damp(videoMix, targetVideo, 12, delta);
      const flight = flightAt(hero, scrollState.page.current, pointerSmooth, pointerActive);
      // Behaviour: a non-repeating sequence of glides, darts, stoops, turns,
      // climbs, flutters and loops over a noise wander, eased per action —
      // fast for reflexes, slow for glides — and only once the bird has
      // formed and is free on the page.
      // Voyage section: its local progress and how much it holds the screen.
      voyageElement ??= document.querySelector<HTMLElement>("[data-voyage]");
      if (voyageElement) {
        const r = voyageElement.getBoundingClientRect();
        voyage = Math.max(0, Math.min(1, -r.top / Math.max(r.height - stageH, 1)));
        xPath = Math.max(0, Math.min(1, (stageH - r.top) / (stageH + 0.18 * (r.height - stageH))));
        // Starts taking the bird as the section slides in, so it is centred
        // by the time the words have risen.
        voyageHold = damp(voyageHold, smoothstep(r.top / stageH, 1.0, 0.25) * smoothstep(r.bottom / stageH, 0.3, 1), 5, delta);
      }
      // The X condenses, opens as a portal, the bird flies in, the ring
      // passes the camera; the tunnel assembles round the opening and hands
      // over to the next scene with a stretch and a flare.
      xDense = damp(xDense, smoothstep(voyage, 0, 0.2), 6, delta);
      xOpen = damp(xOpen, smoothstep(voyage, 0.22, 0.4), 6, delta);
      birdEnter = damp(birdEnter, smoothstep(voyage, 0.34, 0.48), 6, delta);
      portalThrough = damp(portalThrough, smoothstep(voyage, 0.44, 0.56), 6, delta);
      tunnelIn = damp(tunnelIn, smoothstep(voyage, 0.3, 0.44) * (1 - smoothstep(voyage, 0.975, 1)) * voyageHold, 5, delta);
      // Inside, the flight runs by itself like a shot: it glides in at a
      // steady pace for a beat, then accelerates hard into a sustained rush,
      // whatever the page is doing. Scrolling back out of the tunnel resets
      // the ride.
      const riding = portalThrough > 0.5 && tunnelIn > 0.05;
      rideTime = riding ? rideTime + delta : portalThrough < 0.3 ? 0 : rideTime;
      const surge = smoothstep(rideTime, 1.1, 2.8);
      tunnelSpeed = damp(tunnelSpeed, riding ? 12 + 78 * surge * surge : 0, 3, delta);
      tunnelClock += delta * tunnelSpeed;
      warp = Math.max(0, Math.min(1, (tunnelSpeed - 12) / 78)) * tunnelIn;
      // After a stretch at full rush the flight carries the page on to the
      // next section (Voyage runs the scroll; any user input cancels it).
      if (rideTime === 0) exitSent = false;
      if (riding && rideTime > 4.4 && !exitSent && voyageElement) {
        exitSent = true;
        voyageElement.dispatchEvent(new CustomEvent("voyage-exit"));
      }
      if (voyageElement && Math.round(tunnelSpeed) !== speedShown) {
        speedShown = Math.round(tunnelSpeed);
        voyageElement.dataset.speed = String(speedShown);
      }
      const freeFlight = (1 - voyageHold) * smoothstep(hero, 0.6, 0.8) * (1 - orbit) * (1 - bust.morph) * (1 - finale) * (1 - workAmount);
      const travel = flight.direction[0] >= 0 ? 1 : -1;
      const motion = behaviour.step(time, travel);
      const ease = motion.snappy ? 7 : 2.2;
      eased.x = damp(eased.x, motion.x * freeFlight, ease, delta);
      eased.y = damp(eased.y, motion.y * freeFlight, ease, delta);
      eased.z = damp(eased.z, motion.z * freeFlight, ease, delta);
      eased.bank = damp(eased.bank, motion.bank * freeFlight, 7, delta);
      eased.pitch = damp(eased.pitch, motion.pitch * freeFlight, 5, delta);
      eased.yawMix = damp(eased.yawMix, motion.yawMix * freeFlight, 3, delta);
      eased.beat = damp(eased.beat, motion.beat, 5, delta);
      eased.hold = damp(eased.hold, motion.hold * freeFlight, 5, delta);
      eased.holdFrame = motion.hold > 0.01 ? motion.holdFrame : eased.holdFrame;
      flight.position = [flight.position[0] + eased.x, flight.position[1] + eased.y, flight.position[2] + eased.z];
      // Manifesto: the bird comes apart and its grains wind a helix ring
      // around the copy (see the sculpture shader). The stage only measures
      // the copy block and eases the envelope in and out.
      orbitElement ??= document.querySelector<HTMLElement>("[data-orbit]");
      let orbitTarget = 0;
      if (orbitElement && hero > 0.999) {
        const r = orbitElement.getBoundingClientRect();
        const centre = (r.top + r.height / 2) / stageH;
        orbitTarget = smoothstep(centre, 1.1, 0.62) * smoothstep(centre, -0.1, 0.38);
        orbitRing[0] = ((r.left + r.width / 2) / stageW) * 2 - 1;
        orbitRing[1] = 1 - ((r.top + r.height / 2) / stageH) * 2;
        // Wide enough that the coil never crosses the words.
        orbitRing[2] = Math.min(mobile ? 0.86 : 0.84, r.width / stageW + (mobile ? 0.04 : 0.13));
        orbitRing[3] = Math.min(0.8, r.height / stageH + (mobile ? 0.2 : 0.3));
      }
      orbit = damp(orbit, orbitTarget, 2.2, delta);
      // Selected work: pinned runway progress, and how far the section has
      // slid in (-1 below the screen, 0 pinned, +1 gone above).
      workElement ??= document.querySelector<HTMLElement>("[data-work-helix]");
      let workTarget = 0;
      if (workElement && hero > 0.999) {
        const r = workElement.getBoundingClientRect();
        workProgress = Math.max(0, Math.min(1, -r.top / Math.max(r.height - stageH, 1)));
        const enterTarget = r.top > 0 ? -Math.min(1, r.top / stageH) : r.bottom < stageH ? Math.min(1, (stageH - r.bottom) / stageH) : 0;
        workEnter = damp(workEnter, enterTarget, 9, delta);
        workTarget = 1 - smoothstep(Math.abs(enterTarget), 0.25, 0.95);
      }
      workAmount = damp(workAmount, workTarget, 5, delta);
      const directionLength = Math.hypot(...flight.direction) || 1;
      const direction: Vec3 = [flight.direction[0] / directionLength, flight.direction[1] / directionLength, flight.direction[2] / directionLength];
      const turning = motion.turn && freeFlight > 0.5;
      const facing = (direction[0] >= 0 ? 1 : -1) * (turning ? -1 : 1);
      // Behaviour headings (toward the camera, away into the depth, round a
      // banked circle) are measured from the facing side and blended in.
      const yawTarget = mix(facing * 1.07, facing * motion.yaw, eased.yawMix);
      yaw = damp(yaw, yawTarget, motion.snappy ? 7 : eased.yawMix > 0.05 ? 4.5 : 2.5, delta);
      // Nose dips while gliding down.
      // Positive pitch dips the nose; loops and barrel rolls add whole turns.
      const pitch = eased.pitch + motion.spinPitch * freeFlight;
      const roll = Math.max(-0.25, Math.min(0.25, -direction[0] * 0.2)) + eased.bank + motion.spinRoll * freeFlight;
      // Voyage: the bird floats in front of the condensing X, turns and
      // flies into the opened portal; once the ring has passed us it is
      // ahead of the camera in the tunnel, weaving gently.
      if (voyageHold > 0.001) {
        const sway = Math.sin(time * 0.6) * 0.18 * portalThrough;
        const inPortal = birdEnter * birdEnter * (3 - 2 * birdEnter);
        flight.position = [
          mix(flight.position[0], sway, voyageHold),
          mix(flight.position[1], mix(-0.35, 0.12, inPortal) - portalThrough * 0.15 + Math.sin(time * 0.8) * 0.05 * (1 - inPortal * (1 - portalThrough)), voyageHold),
          mix(flight.position[2], mix(-2.6 * inPortal, -0.8 + warp * 0.35, portalThrough), voyageHold),
        ];
        flight.scale = mix(flight.scale, mix(0.72 - inPortal * 0.12, 0.7, portalThrough), voyageHold);
        yaw = mix(yaw, Math.PI + Math.sin(time * 0.4) * 0.2 * portalThrough, Math.max(smoothstep(voyage, 0.26, 0.38), tunnelIn) * voyageHold);
      }
      // Selected work: far behind the helix the bird glides down through
      // the air, nose first with its wings folded, slowly corkscrewing.
      // Scrolling back up turns it head up and it beats its way upward.
      let birdPitch = pitch;
      let birdRoll = roll;
      workVel = damp(workVel, (workProgress - workLastProgress) / Math.max(delta, 1 / 240), 5, delta);
      if (workVel > 0.012) workUpTarget = 0;
      else if (workVel < -0.012) workUpTarget = 1;
      workUp = damp(workUp, workUpTarget, 2.6, delta);
      const workSpeed = Math.min(1, Math.abs(workVel) * 4);
      // Diving, it alternates: a few strong beats downward, then a glide
      // with the wings swept closed.
      const glideWave = 0.5 + 0.5 * Math.sin(time * 0.75);
      workGlide = glideWave * glideWave * (3 - 2 * glideWave);
      workTravel += delta * (1 - 2 * workUp) * (0.16 + workSpeed * 1.3) * workAmount;
      if (workAmount < 0.01) workYaw = yaw;
      if (workAmount > 0.001) {
        const w = workAmount * workAmount * (3 - 2 * workAmount);
        const k = mobile ? 1.5 : 1.4;
        flight.position = [
          mix(flight.position[0], Math.sin(time * 0.37) * 0.1, w),
          mix(flight.position[1], mix(-0.55, 0.05, workUp) * k + Math.sin(time * 0.9) * 0.06, w),
          mix(flight.position[2], -3.1, w),
        ];
        flight.scale = mix(flight.scale, (mobile ? 1.2 : 0.82) * k, w);
        workYaw += delta * mix(0.42, 0.2, workUp) + (workProgress - workLastProgress) * 5.5;
        yaw = mix(yaw, workYaw, w);
        birdPitch = mix(pitch, mix(1.5, -1.3, workUp) + Math.sin(time * 0.6) * 0.05, w);
        birdRoll = mix(roll, Math.sin(time * 0.5) * 0.08, w);
      }
      workLastProgress = workProgress;
      compose(birdMatrix, mobile ? [flight.position[0] * 0.28, flight.position[1] * 0.75, flight.position[2]] : flight.position, flight.scale * (mobile ? 0.55 : 1), yaw, birdRoll, birdPitch);
      // Folded wings hang below the body in the bake; in the dive they are
      // swept back along it instead (a shear of the wing axis toward the
      // tail) so the bird reads as one closed, falling dart.
      if (workAmount > 0.001) {
        const w = workAmount * workAmount * (3 - 2 * workAmount);
        const closed = w * (1 - workUp) * workGlide;
        const press = 1 - 0.72 * closed;
        const sweep = 0.5 * workTailSign * closed;
        for (let i = 0; i < 3; i++) birdMatrix[4 + i] = birdMatrix[4 + i] * press + birdMatrix[8 + i] * sweep;
      }
      // The wing beat runs at the behaviour's rate and eases onto a held
      // frame (wings level to glide, folded to stoop) with a slight sway.
      const holdAmount = Math.max(eased.hold, workAmount * (1 - workUp) * workGlide);
      flapPhase = (flapPhase + delta * eased.beat * (1 + workUp * workAmount * 0.6) * (1 - holdAmount * 0.97)) % 1;
      const holdFrame = (workAmount > 0.5 ? FOLD_FRAME : eased.holdFrame) + Math.sin(time * 1.3) * 0.012;
      const toHold = ((holdFrame - flapPhase + 1.5) % 1) - 0.5;
      flap = (flapPhase + toHold * holdAmount + 1) % 1;

      // A short dolly-in settles the camera as the field assembles.
      const camera: Vec3 = [
        Math.sin(hero * Math.PI) * 0.14,
        -0.02 - hero * 0.03,
        mix(10.4, 8.2 - hero * 1.5 * (1 - finale), introEase),
      ];
      // Warp: the lens widens and the camera shudders at full rush.
      camera[0] += (Math.sin(time * 31) + Math.sin(time * 17.3)) * 0.006 * warp;
      camera[1] += (Math.sin(time * 27 + 1) + Math.sin(time * 13.1)) * 0.005 * warp;
      perspective(projection, (Math.PI / 4) * (1 + warp * 0.32), stageW / Math.max(stageH, 1), 0.1, 100);
      lookAt(view, camera, [0, 0.08, 0]);
      // Cursor velocity where its ray crosses the bird's depth, and the
      // world size of the picture plane there: the flow field is stamped
      // with it in world units.
      {
        let fx = -camera[0], fy = 0.08 - camera[1], fz = -camera[2];
        const fl = Math.hypot(fx, fy, fz) || 1;
        fx /= fl; fy /= fl; fz /= fl;
        const rl = Math.hypot(fz, fx) || 1;
        const rx = -fz / rl, rz = fx / rl;
        const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
        const tanHalf = Math.tan(Math.PI / 8);
        const aspect = stageW / Math.max(stageH, 1);
        const sx = hover[0] * tanHalf * aspect, sy = hover[1] * tanHalf;
        let dx = fx + rx * sx + ux * sy, dy = fy + uy * sy, dz = fz + rz * sx + uz * sy;
        const dl = Math.hypot(dx, dy, dz) || 1;
        dx /= dl; dy /= dl; dz /= dl;
        const depth = (birdMatrix[12] - camera[0]) * fx + (birdMatrix[13] - camera[1]) * fy + (birdMatrix[14] - camera[2]) * fz;
        const along = depth / Math.max(dx * fx + dy * fy + dz * fz, 0.1);
        const px = camera[0] + dx * along, py = camera[1] + dy * along, pz = camera[2] + dz * along;
        const step = Math.max(delta, 1 / 240);
        for (let i = 0; i < 3; i++) {
          const moved = cursorPrimed && hover[2] > 0.5 ? ([px, py, pz][i] - cursorPoint[i]) / step : 0;
          cursorVel[i] = damp(cursorVel[i], Math.max(-8, Math.min(8, moved)), 14, delta);
        }
        cursorPoint.set([px, py, pz]);
        cursorPrimed = hover[2] > 0.5;
        worldSpan[1] = 2 * Math.max(depth, 0.5) * tanHalf;
        worldSpan[0] = worldSpan[1] * aspect;
      }
      const birdVisible = hero > 0.06 && readyMix > 0.5 && finale < 0.98 && services < 0.98;
      simInput.reset = !birdVisible || !simPrimed;
      simInput.dt = Math.max(1 / 240, Math.min(delta, 1 / 30));
      simInput.hover = hover[2];
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(u("projectionMatrix"), false, projection);
      gl.uniformMatrix4fv(u("modelViewMatrix"), false, view);
      gl.uniformMatrix4fv(u("uBirdMat"), false, birdMatrix);
      gl.uniform2f(u("uResolution"), canvas.width, canvas.height);
      gl.uniform1f(u("uTime"), time);
      gl.uniform1f(u("uReveal"), reveal);
      gl.uniform1f(u("uHero"), hero);
      gl.uniform1f(u("uDissolve"), dissolve);
      gl.uniform1f(u("uFinale"), finale);
      gl.uniform3f(u("uPointer"), pointerSmooth[0], pointerSmooth[1], 0);
      gl.uniform1f(u("uPointerActive"), pointerActive);
      gl.uniform1f(u("uPointerVel"), 0.35);
      gl.uniform3f(u("uWaveOrigin"), pointerSmooth[0], pointerSmooth[1], 0);
      gl.uniform1f(u("uWaveAge"), waveAge);
      scanVelocity *= Math.exp(-2.4 * delta);
      scanSmooth[0] = damp(scanSmooth[0], scanPointer[0], 11, delta);
      scanSmooth[1] = damp(scanSmooth[1], scanPointer[1], 11, delta);
      gl.uniform2f(u("uScanPtr"), scanSmooth[0], scanSmooth[1]);
      gl.uniform1f(u("uScanVel"), scanVelocity);
      gl.uniform2f(u("uTide"), tideX, tideY);
      gl.uniform4f(u("uEdgeAges"), edgeAges[0], edgeAges[1], edgeAges[2], edgeAges[3]);
      gl.uniform3f(u("uGradA"), gradient[0], gradient[1], gradient[2]);
      gl.uniform3f(u("uGradB"), gradient[3], gradient[4], gradient[5]);
      gl.uniform3f(u("uGradC"), gradient[6], gradient[7], gradient[8]);
      gl.uniform3f(u("uGradD"), gradient[9], gradient[10], gradient[11]);
      gl.uniform1f(u("uSize"), 40 * pixelRatio * (stageH / 900) * (mobile ? 0.85 : 1));
      gl.uniform1f(u("uMinPoint"), 4.5);
      // Visible half-extent at the resting camera distance, plus 12% bleed.
      const sheetHalfY = 8.2 * Math.tan(Math.PI / 8) * 1.12;
      gl.uniform2f(u("uSheet"), sheetHalfY * (stageW / Math.max(stageH, 1)), sheetHalfY);
      gl.uniform3f(u("uBirdDir"), direction[0], direction[1], direction[2]);
      gl.uniform1f(u("uVideoOn"), videoMix);
      gl.uniform1f(u("uFlap"), flap);
      gl.uniform1f(u("uBirdReady"), readyMix);
      gl.uniform1f(u("uIntro"), intro);
      gl.uniform1f(u("uScanBoost"), 0);
      // The X: sampled from the name while it is on screen, then simulated
      // — it comes apart into code as the hero scrolls away, swarms round
      // the middle, spirals into the bead X as the voyage slides in, opens
      // as the portal and rushes past the camera. The simulation step runs
      // before the scene target is bound.
      if (hero < 0.04 && document.querySelector("[data-hero-name] [data-code-ready]")) {
        const key = `${stageW}x${stageH}`;
        if (xSampled !== key && xLayer.sample(stageW, stageH)) xSampled = key;
      }
      xGather = damp(xGather, smoothstep(xPath, 0.1, 1), 5, delta);
      const pull = portalThrough * portalThrough;
      xCentre[0] = 0;
      xCentre[1] = mix(0.2, mobile ? 0.1 : 0.12, voyageHold);
      xCentre[2] = mix(-2.8, 8.4, pull);
      xLayer.step(view, projection, time, delta, {
        centre: xCentre,
        scale: (mobile ? 1.15 : 1.9) * (0.9 + xDense * 0.2) * (1 + xOpen * 0.35),
        yaw: Math.sin(time * 0.3) * 0.3 * (1 - xOpen),
        dissolve: smoothstep(hero, 0.04, 0.45),
        gather: xGather,
        open: xOpen,
        rush: smoothstep(portalThrough, 0.05, 0.3),
        cursor: [hover[0], hover[1]],
        cursorOn: hover[2],
        aspect: stageW / Math.max(stageH, 1),
      });
      gl.viewport(0, 0, canvas.width, canvas.height);
      work.update({
        view, projection, camera, time, delta,
        width: canvas.width, height: canvas.height,
        amount: workAmount, progress: workProgress, enter: workEnter,
        bird: [birdMatrix[12], birdMatrix[13], birdMatrix[14]],
        birdLength: 2.2 * flight.scale * (mobile ? 0.55 : 1),
        flow: 1 - 2 * workUp, travel: workTravel, speed: workSpeed,
        open: workState.open, hover: workState.hover,
        cursor: [wakeTarget[0], wakeTarget[1]], cursorOn: wakeArmed ? hoverTarget : 0,
      });
      workState.focus = work.focus;
      workState.progress = workProgress;
      const sceneTarget = post ? post.begin(canvas.width, canvas.height) : null;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const tunnelExit = smoothstep(voyage, 0.86, 0.99);
      xLayer.render(time, canvas.height, projection, smoothstep(hero, 0.035, 0.06) * (1 - smoothstep(portalThrough, 0.8, 1)));
      // The corridor rushes toward us on its own clock, and scrolling pushes
      // the flight on or back on top of it; its light cycles teal → pink →
      // blue and back over the ride.
      const scrollTravel = Math.max(0, voyage - 0.5) * 160;
      tunnel.render(view, projection, time, tunnelClock + scrollTravel + tunnelExit * tunnelExit * 140, tunnelIn,
        0.5 - 0.5 * Math.cos(tunnelClock * 0.004), smoothstep(voyage, 0.3, 0.5), Math.max(tunnelExit, warp * 0.45));
      work.renderBack(sceneTarget);
      // The sea surfaces grain by grain in the sculpture shader; only a very
      // short global fade guards the first frame.
      const sculptureAlpha = smoothstep(intro, 0, 0.04);
      sculpture.render(canvas.width, canvas.height, time, sculptureAlpha,
        scanSmooth[0] / (8.2 * Math.tan(Math.PI / 8) * (stageW / stageH)),
        scanSmooth[1] / (8.2 * Math.tan(Math.PI / 8)),
        Math.min(1.4, scanVelocity + pointerActive * .3), {
          hero, ready: readyMix, flap, finale, services,
          matrix: birdMatrix, view, projection,
          positions: positionTexture, normals: normalTexture,
          trail: wake, burst, intro, bust,
          orbit, orbitRing,
          links: linksReady ? linkTexture : null,
          sim: simInput,
        }, sceneTarget);
      if (sceneTarget) gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget);
      gl.viewport(0, 0, canvas.width, canvas.height);
      work.renderFront(sceneTarget);
      post?.finish(time, {
        bloom: 0.8 + warp * 0.35,
        threshold: 0.72,
        aberration: 0.02 + warp * 0.05,
        grain: 0.04,
        grade: [0.0, 0.25, 0.3],
        amount: Math.max(tunnelIn, xOpen * voyageHold, workAmount * 0.9),
        ring: tunnelIn,
      });
      prevBird.set(birdMatrix);
      simPrimed = birdVisible;
      if (firstFrame) {
        firstFrame = false;
        onReady?.();
      }
    };
    frameId = requestAnimationFrame(render);

    runtimeCleanup = () => {
      cancelAnimationFrame(frameId);
      clearTimeout(introSafety);
      delete document.documentElement.dataset.stageIntro;
      delete document.documentElement.dataset.stageSettled;
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onPointerMove);
      removeEventListener("pointerdown", onPointerDown);
      removeEventListener("pointerup", onPointerUp);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      sculpture.dispose();
      tunnel.dispose();
      work.dispose();
      workState.pick = null;
      gl.deleteTexture(glyphAtlas);
      xLayer.dispose();
      post?.dispose();
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteTexture(positionTexture);
      gl.deleteTexture(normalTexture);
      gl.deleteTexture(linkTexture);
      gl.deleteTexture(bustTexture);
      clearTimeout(bustLoad);
      bustState.driven = false;
      bustState.morph = 0;
      gl.deleteTexture(atlasTexture);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    };
    })().catch((error) => console.error("WebGL stage failed:", error));

    return () => {
      disposed = true;
      runtimeCleanup();
    };
  }, [onReady]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
