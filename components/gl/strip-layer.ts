// The film strip between the hero and the X: the vertical brand films set
// round the inside of a drum, the camera inside it near the back wall, so
// the film ahead sits furthest and clearest while the ones at the sides
// swing in close, large, smeared and grainy, like the edges of a lens.
// The scroll turns the drum film by film (three shots each). It assembles
// grain by grain as it slides in, spinning down into the first film; at the
// end the camera backs out through the wall, the drum tips and spins up into
// a ring of films at the size of the X, and comes apart into grains while the
// X gathers in its place.
// A panel shows its poster until it turns into view; only the clips in view
// are decoded and uploaded, and with reduced motion only posters are shown.
import { STRIP_SHOTS, type StripFilm } from "@/content/strip";
import { buildProgram } from "./program";

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 uv;
uniform mat4 projection;
uniform vec3 centre;
uniform float radius;
uniform float height;
uniform float start; // panel's first edge, radians from straight ahead
uniform float arc;
uniform vec2 tilt; // about x, about y
out vec2 vUv;
out vec3 vView;
out float vFacing;
vec3 turn(vec3 p){
  float cx=cos(tilt.x), sx=sin(tilt.x), cy=cos(tilt.y), sy=sin(tilt.y);
  p=vec3(p.x, p.y*cx-p.z*sx, p.y*sx+p.z*cx);
  return vec3(p.x*cy+p.z*sy, p.y, -p.x*sy+p.z*cy);
}
void main(){
  vUv=uv;
  float a=start+uv.x*arc;
  vec3 local=vec3(radius*sin(a),(uv.y-.5)*height,-radius*cos(a));
  vec3 p=centre+turn(local);
  // Inner face toward the camera: the normal points at the axis.
  vec3 n=turn(vec3(-sin(a),0.0,cos(a)));
  vFacing=dot(n,-p);
  vView=p;
  gl_Position=projection*vec4(p,1.0);
}`;

const fragment = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec3 vView;
in float vFacing;
uniform sampler2D picture;
uniform vec2 resolution;
uniform float time;
uniform float seed;
uniform float solid; // 1 whole, 0 gone to grains
uniform float edgeBlur;
out vec4 color;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){
  // Grain cells across the panel: each goes at its own moment, shrinking
  // to a round bead and lighting up on the way.
  vec2 grid=vec2(44.0,78.0);
  vec2 cell=floor(vUv*grid);
  float n=h21(cell+seed*17.0);
  float t=(1.0-solid)*1.3-.15+(1.0-vUv.y)*.15*(1.0-solid);
  float life=clamp((n-t)/.18,0.0,1.0);
  vec2 lc=fract(vUv*grid)-.5;
  if(life<1.0 && length(lc)>life*.62) discard;
  if(life<=0.0) discard;
  // Toward the screen's sides the picture smears sideways, softens and
  // breaks into grain.
  vec2 ndc=gl_FragCoord.xy/resolution*2.0-1.0;
  float side=smoothstep(.18,1.0,abs(ndc.x))*edgeBlur;
  float lod=side*4.5;
  vec2 tuv=vec2(vUv.x,1.0-vUv.y);
  vec3 pic=vec3(0.0);
  float spread=side*.07;
  for(int i=-3;i<=3;i++){
    float k=float(i)/3.0;
    pic+=texture(picture,tuv+vec2(k*spread,k*k*spread*.15),lod).rgb*(1.0-abs(k)*.4);
  }
  pic/=4.6;
  float grain=h21(gl_FragCoord.xy+fract(time*7.3)*91.0)-.5;
  pic*=1.0-side*.55;
  pic+=grain*(.035+side*.22);
  // The backs of the screens, seen once the camera is outside the drum.
  if(vFacing<0.0) pic=vec3(dot(pic,vec3(.3,.59,.11)))*.22+vec3(.02,.025,.03);
  // Beads about to go light up, bone with a hint of lime.
  pic=mix(pic,vec3(.86,1.0,.6),(1.0-life)*.55);
  // Panels crossing the camera fade before the near plane.
  float a=smoothstep(.12,.45,-vView.z);
  color=vec4(pic*a,a);
}`;

const UNIFORMS = ["projection", "centre", "radius", "height", "start", "arc", "tilt", "picture", "resolution", "time", "seed", "solid", "edgeBlur"];

export type StripFrame = {
  time: number;
  // 0 → 1 while the section slides in and through its lead-in.
  enter: number;
  // Film position (see stripPosition), 0..films-1.
  position: number;
  // 0 → 1 while the section leaves and the next one slides in.
  leave: number;
  aspect: number;
  width: number;
  height: number;
};

export async function createStripLayer(gl: WebGL2RenderingContext, mobile: boolean, films: StripFilm[]) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const program = await buildProgram(gl, vertex, fragment, "Film strip");
  const u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)]));

  // One curved panel: a ribbon of columns, bent on the drum in the shader.
  const COLUMNS = 24;
  const ribbon: number[] = [];
  for (let i = 0; i < COLUMNS; i++) {
    const a = i / COLUMNS, b = (i + 1) / COLUMNS;
    ribbon.push(a, 0, b, 0, b, 1, a, 0, b, 1, a, 1);
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ribbon), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // Panels go round the drum film by film, its shots side by side.
  type Panel = { src: string; texture: WebGLTexture; video: HTMLVideoElement | null; shown: number; playing: boolean; ready: boolean };
  const upload = (p: Panel, source: TexImageSource) => {
    gl.activeTexture(gl.TEXTURE12);
    gl.bindTexture(gl.TEXTURE_2D, p.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    p.ready = true;
  };
  const panels: Panel[] = films.flatMap((film) => Array.from({ length: STRIP_SHOTS }, (_, s) => {
    const texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE12);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 9, 11, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { src: `/strip/${film.slug}-${s + 1}`, texture, video: null, shown: -1, playing: false, ready: false };
  }));
  const count = panels.length;
  const STEP = (Math.PI * 2) / count;
  const GAP = 0.035;
  const RADIUS = 1;
  // Height from the panel's arc, kept at the films' 9:16.
  const HEIGHT = RADIUS * STEP * (1 - GAP) * (16 / 9);
  let disposed = false;

  let postersRequested = false;
  const prepare = () => {
    if (postersRequested) return;
    postersRequested = true;
    for (const p of panels) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (!disposed && p.shown < 0) upload(p, img);
      };
      img.src = `${p.src}.jpg`;
    }
  };
  const startVideo = (p: Panel) => {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.src = `${p.src}.mp4`;
    p.video = video;
  };

  const projection = new Float32Array(16);
  const perspective = (fov: number, aspect: number) => {
    const f = 1 / Math.tan(fov / 2), near = 0.05, far = 30;
    projection.fill(0);
    projection[0] = f / aspect;
    projection[5] = f;
    projection[10] = (far + near) / (near - far);
    projection[11] = -1;
    projection[14] = (2 * far * near) / (near - far);
  };
  const ease = (x: number) => x * x * (3 - 2 * x);
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  // The drum leans a little with the cursor (NDC).
  const tilt: [number, number] = [0, 0];
  const pointer = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / Math.max(innerWidth, 1)) * 2 - 1;
    pointer.y = 1 - (e.clientY / Math.max(innerHeight, 1)) * 2;
  };
  addEventListener("pointermove", onMove, { passive: true });
  let lastTime = -1;

  return {
    prepare,
    // How much the strip holds the screen (for the layers it covers).
    hold(f: Pick<StripFrame, "enter" | "leave">) {
      return clamp(f.enter * 1.6) * (1 - clamp(f.leave / 0.55));
    },
    render(f: StripFrame) {
      const delta = lastTime < 0 ? 1 / 60 : Math.min(0.05, Math.max(0, f.time - lastTime));
      lastTime = f.time;
      const present = f.enter > 0.001 && f.leave < 0.999;
      const enter = ease(clamp(f.enter));
      const out = ease(clamp(f.leave / 0.8));
      // Straight ahead holds the middle shot of the film in position; it
      // spins down into the first film and up again on the way out.
      const turn = (f.position * STRIP_SHOTS + 1.5) * STEP - (1 - enter) * (1 - enter) * 2.4 + out * out * 3.2;
      // The camera backs out through the wall; the drum tips toward us.
      const back = 0.78 + out * out * 4.3;
      const narrow = f.aspect < 1;
      const fov = (narrow ? 50 : 68) * (Math.PI / 180);
      perspective(fov, f.aspect);
      const k = Math.min(1, delta * 3);
      tilt[0] += (pointer.y * 0.04 - tilt[0]) * k;
      tilt[1] += (-pointer.x * 0.07 - tilt[1]) * k;

      // Decode only the panels turned into view; pause the rest.
      const view = narrow ? 0.75 : 1.35;
      const angles = panels.map((_, i) => {
        let a = (i + 0.5) * STEP - turn;
        a -= Math.round(a / (Math.PI * 2)) * Math.PI * 2;
        return a;
      });
      for (let i = 0; i < count; i++) {
        const p = panels[i];
        const want = present && !reduced && out < 0.3 && Math.abs(angles[i]) < view;
        if (want && !p.video) startVideo(p);
        if (want && !p.playing && p.video) {
          p.playing = true;
          p.video.play().catch(() => { p.playing = false; });
        } else if (!want && p.playing && p.video) {
          p.playing = false;
          p.video.pause();
        }
        if (p.playing && p.video && p.video.readyState >= 2 && p.video.currentTime !== p.shown) {
          p.shown = p.video.currentTime;
          upload(p, p.video);
        }
      }
      if (!present) return;

      // Grains: in as it slides in, out as the ring spins up.
      const solid = clamp(f.enter * 1.25) * (1 - ease(clamp((f.leave - 0.3) / 0.45)));
      if (solid < 0.002) return;
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform3f(u.centre, 0, (narrow ? 0.1 : 0.13) + out * 0.02, -back);
      gl.uniform1f(u.radius, RADIUS);
      gl.uniform1f(u.height, HEIGHT);
      gl.uniform1f(u.arc, STEP * (1 - GAP));
      gl.uniform2f(u.tilt, tilt[0] + out * 0.42, tilt[1]);
      gl.uniform2f(u.resolution, f.width, f.height);
      gl.uniform1f(u.time, f.time);
      gl.uniform1f(u.solid, solid);
      gl.uniform1f(u.edgeBlur, 1 - out);
      gl.uniform1i(u.picture, 12);
      gl.activeTexture(gl.TEXTURE12);
      // Far to near: the panels across the drum first.
      const order = panels.map((_, i) => i).sort((a, b) => Math.cos(angles[b]) - Math.cos(angles[a]));
      for (const i of order) {
        if (!panels[i].ready) continue;
        gl.bindTexture(gl.TEXTURE_2D, panels[i].texture);
        gl.uniform1f(u.start, angles[i] - STEP * (1 - GAP) * 0.5);
        gl.uniform1f(u.seed, i);
        gl.drawArrays(gl.TRIANGLES, 0, COLUMNS * 6);
      }
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(null);
    },
    dispose() {
      disposed = true;
      removeEventListener("pointermove", onMove);
      for (const p of panels) {
        p.video?.pause();
        p.video?.removeAttribute("src");
        p.video?.load();
        gl.deleteTexture(p.texture);
      }
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
