"use client";

import { useEffect, useRef } from "react";
import { leanFragment, leanVertex } from "./lean-field-shaders";
import { scrollState } from "../three/scroll-state";

const GLYPHS = ["0", "1", "<", ">", "{", "}", "/", "+", "*", "=", ":", ";", ".", "-", "|", "_"];
const BIRD_SAMPLES = 9000;
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
    const count = mobile ? 9000 : 30000;
    const birdCount = mobile ? 2000 : 5000;
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
    const columns = Math.round(Math.sqrt(count * (16 / 9)));
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

    const location = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = new Map<string, WebGLUniformLocation | null>();
    const u = (name: string) => {
      if (!uniforms.has(name)) uniforms.set(name, location(name));
      return uniforms.get(name) ?? null;
    };
    const positionTexture = gl.createTexture();
    const normalTexture = gl.createTexture();
    const videoTexture = gl.createTexture();
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
    setupTexture(2, videoTexture, "uVideoTex");
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.uniform1i(u("uAtlas"), 3);

    let birdReady = 0;
    void fetch("/models/bird-bake.bin")
      .then((response) => {
        if (!response.ok) throw new Error(`bird bake: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (disposed || buffer.byteLength !== (POSITION_ELEMENTS + NORMAL_ELEMENTS) * 2) return;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, positionTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, TEX_W, TEX_H, 0, gl.RGBA, gl.HALF_FLOAT, new Uint16Array(buffer, 0, POSITION_ELEMENTS));
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, TEX_W, ROWS_PER_FRAME, 0, gl.RGBA, gl.HALF_FLOAT, new Uint16Array(buffer, POSITION_ELEMENTS * 2, NORMAL_ELEMENTS));
        birdReady = 1;
      })
      .catch((error) => console.error("bird texture failed:", error));

    // The original full-bleed liquid data painting stays visible while the
    // bird gathers. Decoding/upload pauses early, but the last frame keeps
    // flowing in the shader so video work never competes with the morph.
    const video = document.createElement("video");
    video.src = "/media/hero-source.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    const videoSurface = document.createElement("canvas");
    videoSurface.width = 640;
    videoSurface.height = 360;
    const videoContext = videoSurface.getContext("2d", { alpha: false });
    let videoReady = 0;
    let videoPaused = false;
    let lastVideoUpload = -1;
    video.addEventListener("playing", () => {
      videoReady = 1;
      videoPaused = false;
    });
    void video.play().catch(() => {
      videoReady = 0;
    });

    const pointer: Vec3 = [999, 999, 0];
    const pointerSmooth: Vec3 = [999, 999, 0];
    let pointerActive = 0;
    let waveAge = -1;
    const onPointerMove = (event: PointerEvent) => {
      const aspect = innerWidth / Math.max(innerHeight, 1);
      pointer[0] = (event.clientX / innerWidth * 2 - 1) * (aspect < 1 ? 1.7 : 3.2);
      pointer[1] = -(event.clientY / innerHeight * 2 - 1) * 2;
      pointerActive = mobile ? 0 : 1;
    };
    const onPointerLeave = () => (pointerActive = 0);
    const onPointerDown = (event: PointerEvent) => {
      onPointerMove(event);
      waveAge = 0;
    };
    addEventListener("pointermove", onPointerMove, { passive: true });
    addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    const projection = new Float32Array(16);
    const view = new Float32Array(16);
    const birdMatrix = new Float32Array(16);
    let pixelRatio = 1;
    const resize = () => {
      pixelRatio = Math.min(devicePixelRatio, 1);
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
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1f(u("uTexW"), TEX_W);
    gl.uniform1f(u("uTexH"), TEX_H);
    gl.uniform1f(u("uRowsPerFrame"), ROWS_PER_FRAME);
    gl.uniform1f(u("uFrames"), BIRD_FRAMES);
    gl.uniform1f(u("uMeltScale"), 1);
    gl.uniform3f(u("uColorBase"), 0.953, 0.937, 0.906);
    gl.uniform3f(u("uColorAccent"), 0.784, 1, 0.243);
    gl.uniform3f(u("uColorCyan"), 0.541, 0.902, 1);

    let last = performance.now();
    let time = 0;
    let reveal = 0;
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
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += delta;
      reveal = Math.min(1, reveal + delta / 2.2);
      hero = damp(hero, scrollState.hero.current, 11, delta);
      readyMix = damp(readyMix, birdReady, 5, delta);
      dissolve = damp(dissolve, smoothstep(scrollState.page.current, 0.9, 0.97), 5, delta);
      finale = damp(finale, smoothstep(scrollState.page.current, 0.86, 0.97), 5, delta);
      pointerSmooth[0] = damp(pointerSmooth[0], pointer[0], 7, delta);
      pointerSmooth[1] = damp(pointerSmooth[1], pointer[1], 7, delta);
      if (waveAge >= 0) waveAge = waveAge > 3.5 ? -1 : waveAge + delta;

      const targetVideo = videoReady * (1 - smoothstep(hero, 0.58, 0.82));
      videoMix = damp(videoMix, targetVideo, 8, delta);
      if (hero > 0.16 && !videoPaused) {
        video.pause();
        videoPaused = true;
      } else if (hero < 0.035 && videoPaused) {
        videoPaused = false;
        void video.play().catch(() => (videoReady = 0));
      }
      if (
        videoContext &&
        !videoPaused &&
        video.readyState >= 2 &&
        video.currentTime - lastVideoUpload >= 1 / 20
      ) {
        lastVideoUpload = video.currentTime;
        videoContext.drawImage(video, 0, 0, videoSurface.width, videoSurface.height);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoSurface);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }

      const flight = flightAt(hero, scrollState.page.current, pointerSmooth, pointerActive);
      const directionLength = Math.hypot(...flight.direction) || 1;
      const direction: Vec3 = [flight.direction[0] / directionLength, flight.direction[1] / directionLength, flight.direction[2] / directionLength];
      const yawTarget = (direction[0] >= 0 ? 1 : -1) * 1.07;
      yaw = damp(yaw, yawTarget, 2.5, delta);
      compose(birdMatrix, flight.position, flight.scale, yaw, Math.max(-0.25, Math.min(0.25, -direction[0] * 0.2)));
      flap = (flap + delta) % 1;

      const camera: Vec3 = [Math.sin(hero * Math.PI) * 0.14, -0.02 - hero * 0.03, 8.2 - hero * 1.5 * (1 - finale)];
      lookAt(view, camera, [0, 0.08, 0]);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(u("projectionMatrix"), false, projection);
      gl.uniformMatrix4fv(u("modelViewMatrix"), false, view);
      gl.uniformMatrix4fv(u("uBirdMat"), false, birdMatrix);
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
      gl.uniform1f(u("uSize"), 40 * pixelRatio * (innerHeight / 900));
      gl.uniform3f(u("uBirdDir"), direction[0], direction[1], direction[2]);
      gl.uniform1f(u("uVideoOn"), videoMix);
      gl.uniform3f(u("uVortexA"), -1.35 + Math.sin(time * 0.045) * 0.72, 0.32 + Math.cos(time * 0.038) * 0.5, 0);
      gl.uniform3f(u("uVortexB"), 1.35 + Math.cos(time * 0.042) * 0.72, -0.32 + Math.sin(time * 0.05) * 0.5, 0);
      gl.uniform1f(u("uFlap"), flap);
      gl.uniform1f(u("uBirdReady"), readyMix);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, count);
      if (firstFrame) {
        firstFrame = false;
        onReady?.();
      }
    };
    frameId = requestAnimationFrame(render);

    runtimeCleanup = () => {
      cancelAnimationFrame(frameId);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onPointerMove);
      removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      video.pause();
      video.removeAttribute("src");
      video.load();
      buffers.forEach((buffer) => gl.deleteBuffer(buffer));
      gl.deleteTexture(positionTexture);
      gl.deleteTexture(normalTexture);
      gl.deleteTexture(videoTexture);
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
