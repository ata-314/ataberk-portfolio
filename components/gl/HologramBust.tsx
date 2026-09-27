"use client";

import { useEffect, useRef } from "react";
import { bustState } from "../three/scroll-state";

// Holographic bust of the Ataberk Soylu scan for the About section. A small,
// self-contained WebGL2 point cloud (120k face-weighted samples with a baked
// cavity term, see scripts/bake-model.mjs) — the
// hero stage and its bird are untouched. The projection materializes as the
// section scrolls into view, follows the pointer with a damped yaw/pitch so
// the head turns to face the cursor, ripples where the cursor sweeps across
// the surface, and dissolves below the chest line.
const TEX_W = 2048;
const ROWS = 59;
const SAMPLES = 120000;
const HALF_ELEMENTS = TEX_W * ROWS * 4;
// The scan's head is turned slightly against its shoulders; this yaw squares
// the face to the camera at rest.
const FACE_YAW = -0.35;

const VERTEX = `#version 300 es
precision highp float;
uniform mat4 uProj;
uniform float uTime;
uniform float uAppear;
uniform float uSpin;
uniform vec2 uPointer;
uniform vec2 uTouch;
uniform float uTouchVel;
uniform float uSize;
in vec3 aPos;
in vec3 aNrm;
in float aRnd;
in float aCav;
out float vAlpha;
out float vRim;
out float vGlow;
out float vRnd;
out float vLit;
out float vSlice;
out float vTouch;
out float vFacing;
out float vCav;
out float vSweep;
void main() {
  // staggered materialization: every particle drifts in from its own scatter
  float appear = smoothstep(aRnd * 0.45, aRnd * 0.45 + 0.5, uAppear);
  // the head follows the cursor: strong damped yaw plus a subtle pitch, so
  // the projection reads as aware of the pointer rather than decorative
  float yaw = uSpin + uPointer.x * 0.45;
  float cy = cos(yaw);
  float sy = sin(yaw);
  mat2 spin = mat2(cy, -sy, sy, cy);
  vec3 p = aPos;
  p.xz = spin * p.xz;
  vec3 n = aNrm;
  n.xz = spin * n.xz;
  float pitch = -uPointer.y * 0.14;
  float cp = cos(pitch);
  float sp = sin(pitch);
  mat2 tilt = mat2(cp, -sp, sp, cp);
  p.yz = tilt * p.yz;
  n.yz = tilt * n.yz;
  vec3 scatter = normalize(vec3(sin(aRnd * 37.0), cos(aRnd * 61.0) * 0.4, cos(aRnd * 47.0)));
  p += scatter * (1.0 - appear) * (1.2 + aRnd * 2.2);
  // holographic jitter bands + slow float + occasional glitched row shear
  p.x += sin(aPos.y * 60.0 + uTime * 7.0) * 0.0025;
  float rowKey = floor(aPos.y * 34.0);
  float rowHash = fract(sin(rowKey * 12.9898 + floor(uTime * 2.5) * 0.173) * 43758.5453);
  p.x += step(0.985, rowHash) * sin(uTime * 40.0 + rowKey) * 0.008;
  p.y += sin(uTime * 0.7) * 0.03 - (1.0 - appear) * 0.2;
  // pointer sweep: particles near the cursor lift along their normal and
  // brighten — the ripple strength rides how fast the cursor is moving
  vec2 toTouch = p.xy - uTouch;
  float touch = exp(-dot(toTouch, toTouch) * 6.5) * uTouchVel;
  p += n * touch * 0.07;
  // the projection has no lower body: dissolve below the chest line
  float cut = smoothstep(-1.25, -0.45, aPos.y);
  float cutEdge = exp(-pow((aPos.y + 0.72) * 2.6, 2.0));
  vec4 view = vec4(p.x, p.y - 0.28, p.z - 5.3, 1.0);
  gl_Position = uProj * view;
  vec3 viewNormal = normalize(vec3(n.xy, n.z));
  vRim = pow(1.0 - abs(viewNormal.z), 1.6);
  // The bust is a closed scan and blends additively with no depth test, so
  // the back of the head would print through the face: surfaces turned away
  // from the camera fade out, leaving only the visible shell.
  vFacing = smoothstep(-0.2, 0.3, viewNormal.z);
  // Key + fill light carve the form; the baked cavity term darkens sockets,
  // creases and the mouth line — that contrast is what carries the likeness.
  vec3 key = normalize(vec3(-0.4, 0.55, 0.8));
  vec3 fill = normalize(vec3(0.6, -0.1, 0.8));
  vLit = 0.14 + 0.9 * max(dot(viewNormal, key), 0.0) + 0.22 * max(dot(viewNormal, fill), 0.0);
  vCav = aCav;
  // hologram slices locked to the model — fine, shallow bands
  vSlice = 0.9 + 0.1 * sin(aPos.y * 140.0 - uTime * 1.4);
  // a bright scan band travels up the bust every few seconds
  float sweepY = mod(uTime * 0.42, 3.6) - 1.6;
  vSweep = exp(-pow((aPos.y - sweepY) * 7.0, 2.0));
  vAlpha = appear * cut;
  vGlow = cutEdge;
  vRnd = aRnd;
  vTouch = touch;
  gl_PointSize = uSize * (0.62 + aRnd * 0.45 + vRim * 0.25 + touch * 0.4 + vSweep * 0.3) / -view.z;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform float uTime;
uniform float uGain;
in float vAlpha;
in float vRim;
in float vGlow;
in float vRnd;
in float vLit;
in float vSlice;
in float vTouch;
in float vFacing;
in float vCav;
in float vSweep;
out vec4 outColor;
void main() {
  if (vAlpha < 0.01) discard;
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float disc = exp(-r * r * 11.0) - exp(-2.75);
  // projector artifacts, kept shallow so they never blur the features
  float scan = 0.92 + 0.08 * sin(gl_FragCoord.y * 0.55 - uTime * 20.0);
  float flick = 0.97 + 0.03 * sin(uTime * 41.0) * sin(uTime * 11.7 + 2.0);
  // Hologram palette: deep teal in shadow, ice white where the key lands,
  // lime only on the rim, the dissolve edge, the sweep and the pointer.
  float occlusion = 1.0 - clamp(vCav, 0.0, 1.0) * 0.88;
  float ridge = clamp(-vCav, 0.0, 1.0);
  float light = clamp(vLit * occlusion + ridge * 0.18, 0.0, 1.2);
  vec3 deep = vec3(0.06, 0.26, 0.36);
  vec3 pale = vec3(0.82, 0.97, 1.0);
  vec3 lime = vec3(0.784, 1.0, 0.243);
  vec3 color = mix(deep, pale, clamp(light, 0.0, 1.0));
  color = mix(color, lime, clamp(vRim * 0.35, 0.0, 0.4));
  color += lime * vGlow * 1.1;
  color = mix(color, vec3(0.9, 1.0, 0.75), vSweep * 0.5);
  color = mix(color, lime, clamp(vTouch * 0.85, 0.0, 0.8));
  float alpha = disc * vAlpha * vFacing
    * (0.08 + light * 0.55 + vRim * 0.16 + vGlow * 0.3 + vSweep * 0.25 + vTouch * 0.5)
    * scan * flick * vSlice * uGain;
  outColor = vec4(color, alpha);
}`;

// Half-float decode through a 65536-entry lookup table: builds in ~1ms and
// turns the 288k-element bake parse into plain array reads. The previous
// per-value function-call decode was a visible main-thread stall right when
// the About section approached.
function buildHalfLut() {
  const lut = new Float32Array(65536);
  for (let h = 0; h < 65536; h++) {
    const sign = h & 0x8000 ? -1 : 1;
    const exponent = (h >> 10) & 0x1f;
    const fraction = h & 0x3ff;
    if (exponent === 0) lut[h] = sign * fraction * 2 ** -24;
    else if (exponent === 31) lut[h] = fraction ? NaN : sign * Infinity;
    else lut[h] = sign * (1 + fraction / 1024) * 2 ** (exponent - 15);
  }
  return lut;
}

export function HologramBust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (!gl) return;
    let disposed = false;
    let frameId = 0;
    let visible = false;
    let cleanup = () => {};

    void (async () => {
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("hologram shader alloc failed");
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const message = gl.getShaderInfoLog(shader) ?? "hologram shader failed";
          gl.deleteShader(shader);
          throw new Error(message);
        }
        return shader;
      };
      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? "hologram link failed");
      }

      const response = await fetch("/models/ataberk-bake.bin");
      if (!response.ok) throw new Error(`hologram bake: ${response.status}`);
      const buffer = await response.arrayBuffer();
      if (disposed) return;
      const lut = buildHalfLut();
      const halves = new Uint16Array(buffer);
      const positions = new Float32Array(SAMPLES * 3);
      const normals = new Float32Array(SAMPLES * 3);
      const randoms = new Float32Array(SAMPLES);
      const cavities = new Float32Array(SAMPLES);
      for (let i = 0; i < SAMPLES; i++) {
        positions[i * 3] = lut[halves[i * 4]];
        positions[i * 3 + 1] = lut[halves[i * 4 + 1]];
        positions[i * 3 + 2] = lut[halves[i * 4 + 2]];
        randoms[i] = lut[halves[i * 4 + 3]];
        normals[i * 3] = lut[halves[HALF_ELEMENTS + i * 4]];
        normals[i * 3 + 1] = lut[halves[HALF_ELEMENTS + i * 4 + 1]];
        normals[i * 3 + 2] = lut[halves[HALF_ELEMENTS + i * 4 + 2]];
        cavities[i] = lut[halves[HALF_ELEMENTS + i * 4 + 3]];
      }

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      const buffers: WebGLBuffer[] = [];
      const attribute = (name: string, data: Float32Array, size: number) => {
        const location = gl.getAttribLocation(program, name);
        const glBuffer = gl.createBuffer();
        if (!glBuffer || location < 0) return;
        buffers.push(glBuffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
      };
      attribute("aPos", positions, 3);
      attribute("aNrm", normals, 3);
      attribute("aRnd", randoms, 1);
      attribute("aCav", cavities, 1);

      const u = (name: string) => gl.getUniformLocation(program, name);
      const projection = new Float32Array(16);
      let pixelRatio = 1;
      const mobile = window.matchMedia("(pointer: coarse)").matches;
      const resize = () => {
        pixelRatio = Math.min(devicePixelRatio, mobile ? 1.25 : 2);
        const width = Math.round(canvas.clientWidth * pixelRatio);
        const height = Math.round(canvas.clientHeight * pixelRatio);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          gl.viewport(0, 0, width, height);
        }
        const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
        const f = 1 / Math.tan((35 * Math.PI) / 360);
        projection.fill(0);
        projection[0] = f / aspect;
        projection[5] = f;
        projection[10] = -1.02;
        projection[11] = -1;
        projection[14] = -0.202;
      };
      resize();
      addEventListener("resize", resize);

      // Pointer state: position for the head-turn, velocity for the ripple.
      const pointer = [0, 0];
      const pointerSmooth = [0, 0];
      let touchVel = 0;
      const section = canvas.closest("section") ?? canvas;
      const onPointerMove = (event: PointerEvent) => {
        const rect = section.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
        const ny = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
        touchVel = Math.min(1.2, touchVel + Math.hypot(nx - pointer[0], ny - pointer[1]) * 2.2);
        pointer[0] = nx;
        pointer[1] = ny;
      };
      if (!mobile && !reduced) {
        section.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
      }

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frameId && !disposed && !reduced) frameId = requestAnimationFrame(render);
      });
      observer.observe(canvas);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.disable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);

      const drawCount = mobile ? 60000 : SAMPLES;
      const drawFrame = (time: number, appear: number, spin: number, fade = 1) => {
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u("uProj"), false, projection);
        gl.uniform1f(u("uTime"), time);
        gl.uniform1f(u("uAppear"), appear);
        gl.uniform1f(u("uSpin"), spin);
        gl.uniform2f(u("uPointer"), pointerSmooth[0], pointerSmooth[1]);
        // touch ripple center mapped into the bust's own coordinate space
        gl.uniform2f(u("uTouch"), pointerSmooth[0] * 1.05, pointerSmooth[1] * 1.1);
        gl.uniform1f(u("uTouchVel"), touchVel);
        // small viewports get bigger, brighter points: fewer pixels per point
        // would otherwise leave the bust too faint on phones
        const compact = Math.max(canvas.clientHeight / 640, 0.95);
        gl.uniform1f(u("uSize"), (mobile ? 13 : 11) * pixelRatio * compact);
        gl.uniform1f(u("uGain"), (mobile ? 1.35 : 1) * fade);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // samples are area-weighted random, so a prefix is a uniform subset
        gl.drawArrays(gl.POINTS, 0, drawCount);
      };

      let last = performance.now();
      let time = 0;
      let appear = 0;
      const render = (now: number) => {
        frameId = 0;
        if (disposed || !visible) return;
        frameId = requestAnimationFrame(render);
        const delta = Math.min(Math.max(now - last, 0) / 1000, 0.05);
        last = now;
        time += delta;
        // scroll progress of the section through the viewport drives both the
        // materialization and the turntable, so motion stays scroll-coupled
        const rect = canvas.getBoundingClientRect();
        const vh = Math.max(innerHeight, 1);
        const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
        const appearTarget = progress < 0.08 ? 0 : Math.min(1, (progress - 0.08) / 0.3);
        appear += (appearTarget - appear) * (1 - Math.exp(-3.5 * delta));
        pointerSmooth[0] += (pointer[0] - pointerSmooth[0]) * (1 - Math.exp(-5 * delta));
        pointerSmooth[1] += (pointer[1] - pointerSmooth[1]) * (1 - Math.exp(-5 * delta));
        touchVel *= Math.exp(-2.6 * delta);
        // near-frontal with a gentle scroll-coupled sway: the face is the
        // subject, so it never turns far from the camera
        const spin = FACE_YAW - 0.22 + progress * 0.44 + Math.sin(time * 0.24) * 0.05;
        // Publish the live pose (mirrors the vertex shader) so the stage's
        // bird particles land on exactly these points.
        bustState.yaw = spin + pointerSmooth[0] * 0.45;
        bustState.pitch = -pointerSmooth[1] * 0.14;
        bustState.lift = Math.sin(time * 0.7) * 0.03;
        if (bustState.driven) {
          // The bird's particles form the bust; this canvas takes over only
          // once they have landed, fully materialized (no scatter offset).
          const t = Math.min(1, Math.max(0, (bustState.morph - 0.88) / 0.11));
          drawFrame(time, 1, spin, t * t * (3 - 2 * t));
        } else {
          drawFrame(time, appear, spin);
        }
      };

      if (reduced) {
        // Reduced motion: one still frame of the fully materialized bust
        // instead of an empty canvas.
        drawFrame(0, 1, FACE_YAW);
      } else {
        frameId = requestAnimationFrame(render);
      }

      cleanup = () => {
        if (frameId) cancelAnimationFrame(frameId);
        observer.disconnect();
        removeEventListener("resize", resize);
        section.removeEventListener("pointermove", onPointerMove as EventListener);
        buffers.forEach((glBuffer) => gl.deleteBuffer(glBuffer));
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
      };
    })().catch((error) => console.error("hologram bust failed:", error));

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} data-bust-canvas className="h-full w-full" />;
}
