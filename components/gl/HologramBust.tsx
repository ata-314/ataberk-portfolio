"use client";

import { useEffect, useRef } from "react";

// Holographic bust of the Ataberk Soylu scan for the About section. A small,
// self-contained WebGL2 point cloud (9k samples from the offline bake) — the
// hero stage and its bird are untouched. The projection materializes as the
// section scrolls into view, turns with scroll depth, dissolves below the
// chest line, and yields slightly to the pointer.
const TEX_W = 2048;
const ROWS = 18;
const SAMPLES = 36000;
const HALF_ELEMENTS = TEX_W * ROWS * 4;

const VERTEX = `#version 300 es
precision highp float;
uniform mat4 uProj;
uniform float uTime;
uniform float uAppear;
uniform float uSpin;
uniform vec2 uPointer;
uniform float uSize;
in vec3 aPos;
in vec3 aNrm;
in float aRnd;
out float vAlpha;
out float vRim;
out float vGlow;
out float vRnd;
out float vLit;
out float vSlice;
void main() {
  // staggered materialization: every particle drifts in from its own scatter
  float appear = smoothstep(aRnd * 0.45, aRnd * 0.45 + 0.5, uAppear);
  float yaw = uSpin + uPointer.x * 0.3;
  float cy = cos(yaw);
  float sy = sin(yaw);
  mat2 spin = mat2(cy, -sy, sy, cy);
  vec3 p = aPos;
  p.xz = spin * p.xz;
  vec3 n = aNrm;
  n.xz = spin * n.xz;
  vec3 scatter = normalize(vec3(sin(aRnd * 37.0), cos(aRnd * 61.0) * 0.4, cos(aRnd * 47.0)));
  p += scatter * (1.0 - appear) * (1.2 + aRnd * 2.2);
  // holographic jitter bands + slow float
  p.x += sin(aPos.y * 60.0 + uTime * 7.0) * 0.006;
  p.y += sin(uTime * 0.7) * 0.03 - (1.0 - appear) * 0.2 + uPointer.y * 0.05;
  // the projection has no lower body: dissolve below the chest line
  float cut = smoothstep(-1.25, -0.45, aPos.y);
  float cutEdge = exp(-pow((aPos.y + 0.72) * 2.6, 2.0));
  vec4 view = vec4(p.x, p.y - 0.28, p.z - 5.3, 1.0);
  gl_Position = uProj * view;
  vec3 viewNormal = normalize(vec3(n.xy, n.z));
  vRim = pow(1.0 - abs(viewNormal.z), 1.6);
  // a key light carves the face: features read through shading, not just rim
  vec3 key = normalize(vec3(-0.35, 0.5, 0.85));
  vLit = 0.3 + 0.7 * max(dot(viewNormal, key), 0.0);
  // hologram slices locked to the model: fine horizontal bands that ride the
  // surface as it turns, with a slow upward crawl
  vSlice = 0.62 + 0.38 * sin(aPos.y * 130.0 - uTime * 1.6);
  vAlpha = appear * cut;
  vGlow = cutEdge;
  vRnd = aRnd;
  gl_PointSize = uSize * (0.6 + aRnd * 0.5 + vRim * 0.35) / -view.z;
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
out vec4 outColor;
void main() {
  if (vAlpha < 0.01) discard;
  float r = length(gl_PointCoord - 0.5);
  if (r > 0.5) discard;
  float disc = exp(-r * r * 11.0) - exp(-2.75);
  // projector artifacts: rolling scanlines and a soft flicker
  float scan = 0.78 + 0.22 * sin(gl_FragCoord.y * 0.55 - uTime * 20.0);
  float flick = 0.93 + 0.07 * sin(uTime * 41.0) * sin(uTime * 11.7 + 2.0);
  // deep cyan in shadow, pale blue-white where the key light lands, lime on
  // the rim and the dissolve edge — shading is what makes the face legible
  vec3 deep = vec3(0.1, 0.34, 0.5);
  vec3 pale = vec3(0.74, 0.95, 1.0);
  vec3 lime = vec3(0.784, 1.0, 0.243);
  vec3 color = mix(deep, pale, vLit);
  color = mix(color, lime, clamp(vRim * 0.55 + 0.08 * sin(vRnd * 6.28318 + uTime * 0.4), 0.0, 0.75));
  color += lime * vGlow * 1.2;
  float alpha = disc * vAlpha * (0.12 + vLit * 0.2 + vRim * 0.32 + vGlow * 0.35) * scan * flick * vSlice * uGain;
  outColor = vec4(color, alpha);
}`;

function halfToFloat(h: number) {
  const sign = h & 0x8000 ? -1 : 1;
  const exponent = (h >> 10) & 0x1f;
  const fraction = h & 0x3ff;
  if (exponent === 0) return sign * fraction * 2 ** -24;
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * (1 + fraction / 1024) * 2 ** (exponent - 15);
}

export function HologramBust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      const halves = new Uint16Array(buffer);
      const positions = new Float32Array(SAMPLES * 3);
      const normals = new Float32Array(SAMPLES * 3);
      const randoms = new Float32Array(SAMPLES);
      for (let i = 0; i < SAMPLES; i++) {
        positions[i * 3] = halfToFloat(halves[i * 4]);
        positions[i * 3 + 1] = halfToFloat(halves[i * 4 + 1]);
        positions[i * 3 + 2] = halfToFloat(halves[i * 4 + 2]);
        randoms[i] = halfToFloat(halves[i * 4 + 3]);
        normals[i * 3] = halfToFloat(halves[HALF_ELEMENTS + i * 4]);
        normals[i * 3 + 1] = halfToFloat(halves[HALF_ELEMENTS + i * 4 + 1]);
        normals[i * 3 + 2] = halfToFloat(halves[HALF_ELEMENTS + i * 4 + 2]);
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

      const u = (name: string) => gl.getUniformLocation(program, name);
      const projection = new Float32Array(16);
      let pixelRatio = 1;
      const mobile = window.matchMedia("(pointer: coarse)").matches;
      const resize = () => {
        pixelRatio = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
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

      const pointer = [0, 0];
      const pointerSmooth = [0, 0];
      const section = canvas.closest("section") ?? canvas;
      const onPointerMove = (event: PointerEvent) => {
        const rect = section.getBoundingClientRect();
        pointer[0] = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
        pointer[1] = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
      };
      section.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frameId && !disposed) frameId = requestAnimationFrame(render);
      });
      observer.observe(canvas);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.disable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);

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

        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u("uProj"), false, projection);
        gl.uniform1f(u("uTime"), time);
        gl.uniform1f(u("uAppear"), appear);
        // front-facing with a scroll-coupled sway rather than a full turn, so
        // the silhouette always reads as the scan
        gl.uniform1f(u("uSpin"), -0.45 + progress * 0.95 + Math.sin(time * 0.24) * 0.07);
        gl.uniform2f(u("uPointer"), pointerSmooth[0], pointerSmooth[1]);
        // small viewports get bigger, brighter points: fewer pixels per point
        // would otherwise leave the bust too faint on phones
        const compact = Math.max(canvas.clientHeight / 640, 0.95);
        gl.uniform1f(u("uSize"), 15 * pixelRatio * compact);
        gl.uniform1f(u("uGain"), mobile ? 1.4 : 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // samples are area-weighted random, so a prefix is a uniform subset
        gl.drawArrays(gl.POINTS, 0, mobile ? 16000 : SAMPLES);
      };
      frameId = requestAnimationFrame(render);

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

  return <canvas ref={canvasRef} className="h-full w-full" />;
}
