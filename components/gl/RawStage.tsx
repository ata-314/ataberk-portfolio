"use client";

import { useEffect, useRef } from "react";
import { leanFragment, leanVertex } from "./lean-field-shaders";
import { createSculptureLayer } from "./sculpture-layer";
import { scrollState } from "../three/scroll-state";

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

function compose(out: Float32Array, position: Vec3, scale: number, yaw: number, bank: number) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cz = Math.cos(bank);
  const sz = Math.sin(bank);
  out.set([
    cy * cz * scale, sz * scale, -sy * cz * scale, 0,
    -cy * sz * scale, cz * scale, sy * sz * scale, 0,
    sy * scale, 0, cy * scale, 0,
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
    const strength = (hero < 0.999 ? 0.42 : 0.68) * follow;
    const target: Vec3 = [pointer[0] + (pointer[0] >= 0 ? -0.65 : 0.65), pointer[1] + 0.28, position[2]];
    direction = [target[0] - position[0], target[1] - position[1], 0];
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
    const sculpture = createSculptureLayer(gl, mobile);
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
    const columns = Math.round(Math.sqrt(count * Math.max(innerWidth / Math.max(innerHeight, 1), 0.3)));
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
    } catch (error) {
      console.error("bird texture failed:", error);
    }

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
    // loop (not by raw events), and each one swells in over ~0.15s before it
    // decays — so grains flow around the cursor instead of snapping.
    const wake = new Float32Array(8 * 4);
    const wakePeak = new Float32Array(8);
    const wakeAge = new Float32Array(8).fill(99);
    let wakeSlot = 0;
    let wakeLast: [number, number] | null = null;
    const wakeTarget: [number, number] = [0, 0];
    const wakeFollow: [number, number] = [0, 0];
    let wakeArmed = false;
    const burst = new Float32Array([0, 0, -1]);
    const pushWake = (clientX: number, clientY: number) => {
      wakeTarget[0] = (clientX / innerWidth) * 2 - 1;
      wakeTarget[1] = -((clientY / innerHeight) * 2 - 1);
      if (!wakeArmed) {
        wakeArmed = true;
        wakeFollow[0] = wakeTarget[0];
        wakeFollow[1] = wakeTarget[1];
      }
    };
    const stepWake = (delta: number) => {
      if (wakeArmed) {
        wakeFollow[0] = damp(wakeFollow[0], wakeTarget[0], 9, delta);
        wakeFollow[1] = damp(wakeFollow[1], wakeTarget[1], 9, delta);
        const [nx, ny] = wakeFollow;
        const moved = wakeLast ? Math.hypot(nx - wakeLast[0], ny - wakeLast[1]) : 0;
        if (!wakeLast || moved >= 0.018) {
          wakeLast = [nx, ny];
          wakePeak[wakeSlot] = Math.min(0.62, 0.22 + moved * 6);
          wakeAge[wakeSlot] = 0;
          wake[wakeSlot * 4] = nx;
          wake[wakeSlot * 4 + 1] = ny;
          wakeSlot = (wakeSlot + 1) % 8;
        }
      }
      for (let i = 0; i < 8; i++) {
        wakeAge[i] += delta;
        const a = wakeAge[i];
        wake[i * 4 + 2] = wakePeak[i] * (1 - Math.exp(-a * 14)) * Math.exp(-a * 1.9);
      }
    };
    const scanPointer = [0, 0];
    const scanSmooth = [0, 0];
    let scanVelocity = 0;
    const onPointerMove = (event: PointerEvent) => {
      pushWake(event.clientX, event.clientY);
      const aspect = innerWidth / Math.max(innerHeight, 1);
      pointer[0] = (event.clientX / innerWidth * 2 - 1) * (aspect < 1 ? 1.7 : 3.2);
      pointer[1] = -(event.clientY / innerHeight * 2 - 1) * 2;
      pointerActive = mobile ? 0 : 1;
      if (!mobile) {
        const halfY = 8.2 * Math.tan(Math.PI / 8);
        const sx = (event.clientX / innerWidth * 2 - 1) * halfY * aspect;
        const sy = -(event.clientY / innerHeight * 2 - 1) * halfY;
        scanVelocity = Math.min(
          1.4,
          scanVelocity + Math.hypot(sx - scanPointer[0], sy - scanPointer[1]) * 0.55,
        );
        scanPointer[0] = sx;
        scanPointer[1] = sy;
      }
      const margin = 28;
      if (event.clientX <= margin) fireEdgeWave(0, 1.4);
      else if (event.clientX >= innerWidth - margin) fireEdgeWave(1, 1.4);
      if (event.clientY >= innerHeight - margin) fireEdgeWave(2, 1.4);
      else if (event.clientY <= margin) fireEdgeWave(3, 1.4);
    };
    const onPointerLeave = () => (pointerActive = 0);
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      waveAge = 0;
      burst.set([(event.clientX / innerWidth) * 2 - 1, -((event.clientY / innerHeight) * 2 - 1), 0]);
    };
    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pointerdown", onPointerDown, { passive: true });
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
      const width = Math.round(innerWidth * pixelRatio);
      const height = Math.round(innerHeight * pixelRatio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      perspective(projection, Math.PI / 4, innerWidth / Math.max(innerHeight, 1), 0.1, 100);
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
    let yaw = -1.07;
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
      readyMix = damp(readyMix, birdReady, 5, delta);
      dissolve = damp(dissolve, smoothstep(scrollState.page.current, 0.9, 0.97), 5, delta);
      finale = damp(finale, smoothstep(scrollState.page.current, 0.86, 0.97), 5, delta);
      pointerSmooth[0] = damp(pointerSmooth[0], pointer[0], 7, delta);
      pointerSmooth[1] = damp(pointerSmooth[1], pointer[1], 7, delta);
      if (waveAge >= 0) waveAge = waveAge > 3.5 ? -1 : waveAge + delta;
      stepWake(delta);
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
      const directionLength = Math.hypot(...flight.direction) || 1;
      const direction: Vec3 = [flight.direction[0] / directionLength, flight.direction[1] / directionLength, flight.direction[2] / directionLength];
      const yawTarget = (direction[0] >= 0 ? 1 : -1) * 1.07;
      yaw = damp(yaw, yawTarget, 2.5, delta);
      compose(birdMatrix, mobile ? [flight.position[0] * 0.28, flight.position[1] * 0.75, flight.position[2]] : flight.position, flight.scale * (mobile ? 0.55 : 1), yaw, Math.max(-0.25, Math.min(0.25, -direction[0] * 0.2)));
      flap = (flap + delta) % 1;

      // A short dolly-in settles the camera as the field assembles.
      const camera: Vec3 = [
        Math.sin(hero * Math.PI) * 0.14,
        -0.02 - hero * 0.03,
        mix(10.4, 8.2 - hero * 1.5 * (1 - finale), introEase),
      ];
      lookAt(view, camera, [0, 0.08, 0]);
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
      gl.uniform1f(u("uSize"), 40 * pixelRatio * (innerHeight / 900) * (mobile ? 0.85 : 1));
      gl.uniform1f(u("uMinPoint"), 4.5);
      // Visible half-extent at the resting camera distance, plus 12% bleed.
      const sheetHalfY = 8.2 * Math.tan(Math.PI / 8) * 1.12;
      gl.uniform2f(u("uSheet"), sheetHalfY * (innerWidth / Math.max(innerHeight, 1)), sheetHalfY);
      gl.uniform3f(u("uBirdDir"), direction[0], direction[1], direction[2]);
      gl.uniform1f(u("uVideoOn"), videoMix);
      gl.uniform1f(u("uFlap"), flap);
      gl.uniform1f(u("uBirdReady"), readyMix);
      gl.uniform1f(u("uIntro"), intro);
      gl.uniform1f(u("uScanBoost"), 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // The sea surfaces grain by grain in the sculpture shader; only a very
      // short global fade guards the first frame.
      const sculptureAlpha = smoothstep(intro, 0, 0.04);
      sculpture.render(canvas.width, canvas.height, time, sculptureAlpha,
        scanSmooth[0] / (8.2 * Math.tan(Math.PI / 8) * (innerWidth / innerHeight)),
        scanSmooth[1] / (8.2 * Math.tan(Math.PI / 8)),
        Math.min(1.4, scanVelocity + pointerActive * .3), {
          hero, ready: readyMix, flap, finale,
          matrix: birdMatrix, view, projection,
          positions: positionTexture, normals: normalTexture,
          trail: wake, burst, intro,
        });
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
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      sculpture.dispose();
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteTexture(positionTexture);
      gl.deleteTexture(normalTexture);
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
