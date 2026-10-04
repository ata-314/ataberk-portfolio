"use client";

import { useEffect, useRef } from "react";

// A picture drawn by a small WebGL pass, in the site's matter:
// · intro — the picture gathers from a coarse field of lit grains and
//   resolves into the sharp image;
// · the cursor (or a touch) — a liquid ripple runs from it and the colours
//   split around it;
// · `index` — changing it dissolves to the next picture through a grain
//   noise front with a lime edge.
// The <img> underneath stays for no-WebGL, reduced motion and crawlers.
type Props = { srcs: string[]; index?: number; intro?: boolean; alt: string; className?: string; fit?: "cover" | "top" };

const vs = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv=p*.5+.5; gl_Position=vec4(p,0.,1.); }`;

const fs = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D t0, t1;
uniform vec2 res, a0, a1;
uniform float mixv, intro, time, hover, top;
uniform vec2 mouse;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
vec2 cover(vec2 uv, vec2 img){
  float r=res.x/res.y, ir=img.x/img.y;
  vec2 s = r>ir ? vec2(1., ir/r) : vec2(r/ir, 1.);
  vec2 q=(uv-.5)*s+.5;
  if(top>.5 && r>ir) q.y = uv.y*s.y + (1.-s.y);
  return vec2(q.x, 1.-q.y);
}
vec3 pick(sampler2D t, vec2 uv, vec2 img, float split){
  vec2 c=cover(uv,img);
  return vec3(texture(t,c+vec2(split,0)).r, texture(t,c).g, texture(t,c-vec2(split,0)).b);
}
void main(){
  vec2 uv=vUv;
  vec2 asp=vec2(res.x/res.y,1.);
  // Cursor ripple and colour split.
  vec2 d=(uv-mouse)*asp; float dl=length(d);
  float reach=exp(-dl*4.5)*hover;
  uv += d/max(dl,1e-3)/asp * sin(dl*38.-time*6.)*.006*reach;
  // Colours split only around the cursor; at rest the picture stays clean.
  float split=reach*.01;
  // Intro: a coarse grid of grains that refines into the picture.
  float k=clamp(intro,0.,1.);
  float cells=mix(28.,1400.,k*k*k);
  vec2 g=vec2(cells*res.x/res.y, cells);
  vec2 cell=(floor(uv*g)+.5)/g;
  vec2 suv=mix(cell, uv, smoothstep(.75,1.,k));
  vec3 c0=pick(t0,suv,a0,split), c1=pick(t1,suv,a1,split);
  // Dissolve through a grain noise front with a lime edge.
  float nz=n(uv*vec2(asp.x,1.)*9.)*.7+h(floor(uv*g))*.3;
  float edge=mixv*1.25-.12;
  float m=smoothstep(edge-.06, edge, nz);
  // m is 1 where the front has not reached yet: the leaving picture.
  vec3 c=mix(c0,c1,m);
  float rim=smoothstep(.06,0.,abs(nz-edge))*step(.001,mixv)*step(mixv,.999);
  c+=vec3(.78,1.,.24)*rim*.9;
  // Grains: lit beads while the picture is still gathering.
  float bead=1.-smoothstep(.25,.5,length(fract(uv*g)-.5));
  float lum=dot(c,vec3(.3,.59,.11));
  float coarse=1.-smoothstep(.55,.95,k);
  c=mix(c, c*bead*(1.2+lum)+vec3(.78,1.,.24)*bead*.05, coarse);
  c*=smoothstep(0.,.25,k);
  o=vec4(c,1.);
}`;

export function GlImage({ srcs, index = 0, intro = false, alt, className, fit = "cover" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const target = useRef(index);
  // The render loop reads the chapter to show from here.
  useEffect(() => { target.current = index; }, [index]);

  useEffect(() => {
    const el = wrap.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform1i(u("t0"), 0);
    gl.uniform1i(u("t1"), 1);
    gl.uniform1f(u("top"), fit === "top" ? 1 : 0);

    const tex: { t: WebGLTexture; w: number; h: number; ok: boolean }[] = srcs.map(() => ({ t: gl.createTexture()!, w: 16, h: 10, ok: false }));
    let ready = 0;
    srcs.forEach((src, i) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const x = tex[i];
        gl.bindTexture(gl.TEXTURE_2D, x.t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        x.w = img.naturalWidth;
        x.h = img.naturalHeight;
        x.ok = true;
        if (i === 0) ready = 1;
      };
      img.src = src;
    });

    canvas.className = "gl-image-canvas";
    el.appendChild(canvas);
    // Resizing a canvas clears it; only do so when the size really changes,
    // and draw again at once so no blank frame shows.
    let drawNow = () => {};
    const size = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (w === canvas.width && h === canvas.height) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u("res"), w, h);
      drawNow();
    };
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();

    const st = { from: index, to: index, mix: 1, intro: intro ? 0 : 1, mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5, hover: 0, over: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      st.tx = (e.clientX - r.left) / r.width;
      st.ty = 1 - (e.clientY - r.top) / r.height;
      st.over = 1;
    };
    const onLeave = () => { st.over = 0; };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(el);

    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || !ready) return;
      step(now, dt);
    };
    drawNow = () => { if (ready) step(performance.now(), 0); };
    const step = (now: number, dt: number) => {
      if (target.current !== st.to && st.mix >= 1) {
        st.from = st.to;
        st.to = target.current;
        st.mix = 0;
      }
      st.mix = Math.min(1, st.mix + dt * 1.9);
      if (st.intro < 1) st.intro = Math.min(1, st.intro + dt * 0.55);
      st.mx += (st.tx - st.mx) * 0.12;
      st.my += (st.ty - st.my) * 0.12;
      st.hover += (st.over - st.hover) * 0.08;
      // t0 is the picture arriving, t1 the one leaving.
      const a = tex[st.to], b = tex[st.from];
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a.t);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, b.t);
      gl.uniform2f(u("a0"), a.w, a.h);
      gl.uniform2f(u("a1"), b.w, b.h);
      gl.uniform1f(u("mixv"), a.ok ? st.mix : 0);
      gl.uniform1f(u("intro"), st.intro);
      gl.uniform1f(u("time"), now / 1000);
      gl.uniform1f(u("hover"), st.hover);
      gl.uniform2f(u("mouse"), st.mx, st.my);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      el.dataset.gl = "on";
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      canvas.remove();
      tex.forEach((x) => gl.deleteTexture(x.t));
      gl.deleteProgram(prog);
      delete el.dataset.gl;
    };
    // Textures are loaded once per set of pictures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcs.join("|")]);

  return (
    <div ref={wrap} className={`gl-image ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={srcs[index]} alt={alt} decoding="async" style={fit === "top" ? { objectPosition: "top" } : undefined} />
    </div>
  );
}
