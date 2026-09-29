// The X: the last letter of the hero name, handed from the page's code
// glyphs to particles at exactly the pixels it occupies, which then lift
// off the name and assemble into a large volumetric X of light standing in
// the world behind the bird — two crossed bars, dense along their edges,
// hazy inside, slowly turning. In the voyage it comes at the camera: the
// crossing grows past the lens and the flight goes through it into the
// tunnel. Every grain is a code glyph, like the name it came from, and
// keeps mutating; while the X forms its glyphs cascade down into place.
// Additive glyph sprites drawn into the stage's HDR scene.

import { glyphSample } from "./matrix-layer";

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 start; // NDC of the glyph pixel in the name
layout(location=1) in vec3 local; // position in the X structure
layout(location=2) in vec4 seed;  // random, edge weight in w
uniform mat4 view;
uniform mat4 projection;
uniform vec3 centre;
uniform float scale;
uniform float yaw;
uniform float form;
uniform float presence;
uniform float time;
uniform float pixel;
uniform float approach;
uniform float volume; // 0 flat letter → 1 full depth
out vec3 vColor;
out float vAlpha;
out float vGlyph;
float hash(float n) {return fract(sin(n*12.9898)*43758.5453);}
void main() {
  // Each grain leaves the letter on its own beat.
  float m=smoothstep(seed.x*.45,seed.x*.45+.55,form);
  float e=m*m*(3.0-2.0*m);
  vec3 p=local;
  // Gains its depth: the flat letter extrudes into a solid.
  p.z*=mix(.04,1.0,volume);
  // Living matter: a slow shimmer along the bars.
  p+=vec3(sin(time*.9+seed.y*40.0),cos(time*.7+seed.z*33.0),sin(time*.8+seed.x*29.0))*.02*(1.0-seed.w*.6);
  float cy=cos(yaw),sy=sin(yaw);
  p.xz=mat2(cy,-sy,sy,cy)*p.xz;
  vec3 world=centre+p*scale;
  vec4 clip=projection*view*vec4(world,1.0);
  // Before the handoff completes, blend from the glyph's place on screen.
  if(clip.w<.05) {gl_Position=vec4(2.0,2.0,2.0,1.0);vColor=vec3(0);vAlpha=0.0;return;}
  vec2 target=clip.xy/clip.w;
  // Code falls into place: grains come down from above their spot.
  target.y+=(1.0-e)*(.35+seed.z*.6)*step(.001,e);
  vec2 ndc=mix(start,target,e);
  gl_Position=vec4(ndc*clip.w,clip.z,clip.w);
  float depth=max(clip.w,.3);
  vec3 bone=vec3(.97,.97,.93);
  vec3 lime=vec3(.78,1.0,.3);
  vec3 cyan=vec3(.45,.95,1.0);
  vec3 tint=mix(cyan,lime,seed.y);
  vColor=mix(bone,tint,e*(.35+seed.w*.4))*(.8+seed.w*.8)*(1.0+approach*.6);
  vGlyph=floor(hash(seed.x*311.0+floor(time*(1.5+seed.y*6.0)))*64.0);
  // Grains at the lens fade instead of filling the screen.
  vAlpha=presence*smoothstep(.4,1.6,depth);
  gl_PointSize=pixel*mix(7.0,(1.0+seed.z*.8)*(1.0+seed.w*.4)*26.0/depth,e);
}`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D atlas;
in vec3 vColor;
in float vAlpha;
in float vGlyph;
out vec4 color;
${glyphSample}
void main() {
  float a=glyphAlpha(atlas,vGlyph,gl_PointCoord)*vAlpha;
  if(a<.004) discard;
  color=vec4(vColor*a,0.0);
}`;

export function createXLayer(gl: WebGL2RenderingContext, mobile: boolean, atlas: WebGLTexture | null) {
  const program = gl.createProgram();
  if (!program) throw new Error("X program allocation failed");
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("X shader allocation failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "X shader failed");
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "X link failed");
  const u = Object.fromEntries(["view", "projection", "centre", "scale", "yaw", "form", "presence", "time", "pixel", "approach", "volume", "atlas"].map((n) => [n, gl.getUniformLocation(program, n)]));

  // The structure: two crossed bars (length L, width W, thickness T),
  // grains mostly on their faces and edges so the form reads, a share
  // inside as haze.
  const count = mobile ? 6000 : 15000;
  const L = 2.3, W = 0.5, T = 0.44;
  const local = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const bar = i % 2 ? 1 : -1;
    const x = (Math.random() - 0.5) * L;
    let y = (Math.random() - 0.5) * W, z = (Math.random() - 0.5) * T;
    const kind = Math.random();
    let edge = 0;
    if (kind < 0.3) {
      // On a long edge.
      y = (Math.random() < 0.5 ? -0.5 : 0.5) * W;
      z = (Math.random() < 0.5 ? -0.5 : 0.5) * T;
      edge = 1;
    } else if (kind < 0.7) {
      // On a face.
      if (Math.random() < 0.6) z = (Math.random() < 0.5 ? -0.5 : 0.5) * T;
      else y = (Math.random() < 0.5 ? -0.5 : 0.5) * W;
      edge = 0.4;
    }
    const a = bar * Math.PI / 4;
    const ca = Math.cos(a), sa = Math.sin(a);
    local.set([x * ca - y * sa, x * sa + y * ca, z], i * 3);
    seeds.set([Math.random(), Math.random(), Math.random(), edge], i * 4);
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const startBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, startBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(count * 2), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const localBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, localBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, local, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  const seedBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  return {
    // Rasterises the last letter of the hero name where it sits on screen
    // and assigns every grain a start pixel inside it.
    sample(stageW: number, stageH: number) {
      const el = document.querySelector<HTMLElement>("[data-hero-name] [data-code-text]");
      const node = el?.firstChild;
      const text = node?.textContent ?? "";
      if (!el || !node || !text) return false;
      const range = document.createRange();
      range.setStart(node, text.length - 1);
      range.setEnd(node, text.length);
      const r = range.getBoundingClientRect();
      if (r.width < 2) return false;
      const style = getComputedStyle(el);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(stageW));
      canvas.height = Math.max(1, Math.round(stageH));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fillStyle = "#fff";
      const m = ctx.measureText(text[text.length - 1]);
      const baseline = r.top + (r.height - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
      ctx.fillText(text[text.length - 1], r.left, baseline);
      const x0 = Math.max(0, Math.floor(r.left)), y0 = Math.max(0, Math.floor(r.top));
      const w = Math.min(canvas.width - x0, Math.ceil(r.width) + 2), h = Math.min(canvas.height - y0, Math.ceil(r.height) + 2);
      if (w <= 0 || h <= 0) return false;
      const data = ctx.getImageData(x0, y0, w, h).data;
      const ink: number[] = [];
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (data[(y * w + x) * 4 + 3] > 100) ink.push(x0 + x, y0 + y);
      if (!ink.length) return false;
      const starts = new Float32Array(count * 2);
      for (let i = 0; i < count; i++) {
        const k = Math.floor(Math.random() * (ink.length / 2)) * 2;
        starts[i * 2] = (ink[k] / canvas.width) * 2 - 1;
        starts[i * 2 + 1] = 1 - (ink[k + 1] / canvas.height) * 2;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, startBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, starts, gl.DYNAMIC_DRAW);
      return true;
    },
    render(view: Float32Array, projection: Float32Array, time: number, o: { centre: [number, number, number]; scale: number; yaw: number; form: number; presence: number; approach: number; pixel: number; volume: number }) {
      if (o.presence < 0.005) return;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
      gl.uniformMatrix4fv(u.view, false, view);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform3f(u.centre, o.centre[0], o.centre[1], o.centre[2]);
      gl.uniform1f(u.scale, o.scale);
      gl.uniform1f(u.yaw, o.yaw);
      gl.uniform1f(u.form, o.form);
      gl.uniform1f(u.presence, o.presence);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.pixel, o.pixel);
      gl.uniform1f(u.approach, o.approach);
      gl.uniform1f(u.volume, o.volume);
      gl.activeTexture(gl.TEXTURE14);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(u.atlas, 14);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(null);
    },
    dispose() {
      [startBuffer, localBuffer, seedBuffer].forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
