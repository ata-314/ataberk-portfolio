// The X: the last letter of the hero name, handed from the page's code
// glyphs to particles at exactly the pixels it occupies, then run as a
// stateful GPU simulation (ping-pong RGBA32F position/velocity) so every
// grain keeps its own momentum and the scroll only moves targets, never
// the grains themselves — nothing jumps when the page does.
//
// Chapters, each a target the grains are sprung toward:
// - letter: locked to the glyph pixels while the name is on screen;
// - swarm: as the hero scrolls away they come apart into mutating code
//   glyphs and circle a tilted vortex round the middle of the screen,
//   carried by a drifting flow field;
// - X: as the voyage slides in they spiral in, turning into beads as they
//   settle, and pack a solid X like the igloo penguin — dark grey grains,
//   pale sheens, glints — whose skin keeps flowing;
// - ring: the arms swing out onto a circulating portal ring the bird flies
//   through, then it rushes past the camera.
// The cursor pushes grains away and drags them along its motion; displaced
// grains light up and pour back with an underdamped, liquid wobble.

import { glyphSample } from "./matrix-layer";

const common = /* glsl */ `
float hash(float n) {return fract(sin(n*12.9898)*43758.5453);}
float noise(vec3 p) {
  vec3 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  float n=i.x+i.y*57.0+i.z*113.0;
  return mix(mix(mix(hash(n),hash(n+1.0),f.x),mix(hash(n+57.0),hash(n+58.0),f.x),f.y),
             mix(mix(hash(n+113.0),hash(n+114.0),f.x),mix(hash(n+170.0),hash(n+171.0),f.x),f.y),f.z);
}
vec3 flow(vec3 p) {
  return vec3(noise(p),noise(p+vec3(31.7,17.3,5.1)),noise(p+vec3(11.9,43.1,29.7)))-.5;
}`;

const quad = `#version 300 es
void main() {
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;

const simFragment = `#version 300 es
precision highp float;
uniform sampler2D posTex;
uniform sampler2D velTex;
uniform sampler2D dataA; // local xyz, seed
uniform sampler2D dataB; // ring angle, tube offsets, seed
uniform sampler2D dataC; // letter NDC xy, seed, edge
uniform mat4 viewProj;
uniform mat4 invViewProj;
uniform vec3 centre;
uniform vec3 camRight;
uniform vec3 camUp;
uniform vec2 cursor;
uniform vec2 cursorVel;
uniform float cursorOn;
uniform float aspect;
uniform float tanHalf;
uniform float letterZ;
uniform float scale;
uniform float yaw;
uniform float radius;
uniform float dissolve;
uniform float gather;
uniform float open;
uniform float rush;
uniform float time;
uniform float dt;
uniform float reset;
layout(location=0) out vec4 outPos;
layout(location=1) out vec4 outVel;
${common}
vec3 unproject(vec2 ndc) {
  vec4 a=invViewProj*vec4(ndc,-1.0,1.0);
  vec4 b=invViewProj*vec4(ndc,1.0,1.0);
  a/=a.w;b/=b.w;
  vec3 d=b.xyz-a.xyz;
  return a.xyz+d*((letterZ-a.z)/(abs(d.z)>1e-5?d.z:1e-5));
}
vec3 place(vec3 p) {
  float c=cos(yaw),s=sin(yaw);
  p.xz=mat2(c,-s,s,c)*p.xz;
  return centre+p*scale;
}
void main() {
  ivec2 px=ivec2(gl_FragCoord.xy);
  vec4 A=texelFetch(dataA,px,0), B=texelFetch(dataB,px,0), C=texelFetch(dataC,px,0);
  vec3 local=A.xyz;
  vec4 seed=vec4(A.w,B.w,C.z,C.w);
  vec3 letter=unproject(C.xy);
  // Swarm: a tilted vortex of orbits round the middle, each grain on its
  // own radius, height and speed.
  float ang=seed.x*6.2832+time*(.45+seed.y*.35);
  float rad=scale*(.8+seed.y*.8)*clamp(aspect*1.6,.65,1.0);
  vec3 orbit=vec3(cos(ang)*rad,(seed.z-.5)*scale*.3+sin(ang*3.0+seed.x*9.0)*scale*.14,sin(ang)*rad*.8);
  float tc=cos(.35),ts=sin(.35);
  orbit.yz=mat2(tc,-ts,ts,tc)*orbit.yz;
  vec3 swarm=centre+orbit;
  // X with a flowing skin, and the circulating ring.
  vec3 wave=flow(local*1.7+vec3(time*.55,-time*.45,time*.3));
  vec3 onX=place(local+wave*.08);
  float a=B.x+open*1.1+time*(.18+seed.y*.22)*open;
  vec3 onRing=place(vec3(cos(a),sin(a),0.0)*(radius+B.y)+vec3(0.0,0.0,B.z)+wave*.06);
  float di=smoothstep(seed.x*.35,seed.x*.35+.65,dissolve);
  float gi=smoothstep(seed.y*.35,seed.y*.35+.65,gather);
  float oi=smoothstep(seed.w*.12+seed.x*.18,seed.w*.12+seed.x*.18+.7,open);
  vec3 target=mix(mix(mix(letter,swarm,di),onX,gi),onRing,oi);
  if(reset>.5) {outPos=vec4(target,1.0);outVel=vec4(0.0);return;}
  vec4 state=texelFetch(posTex,px,0);
  vec3 p=state.xyz;
  vec3 v=texelFetch(velTex,px,0).xyz;
  // Springs: locked on the letter, loose in the swarm, firm but wobbly in
  // the X, locked again while the ring rushes the camera.
  float free=di*(1.0-gi);
  float k=mix(mix(mix(90.0,2.6,di),26.0,gi),90.0,rush);
  float damping=2.0*sqrt(k)*mix(mix(.95,.55,di),.95,rush);
  vec3 acc=(target-p)*k-v*damping;
  acc+=flow(p*.8/scale+vec3(0.0,time*.3,time*.1))*scale*(free*3.2+gi*.5)*(1.0-rush);
  // Cursor: pushes grains aside and drags them along its motion, with a
  // curl so the plume billows.
  vec4 clip=viewProj*vec4(p,1.0);
  vec2 d=(clip.xy/max(clip.w,.05)-cursor)*vec2(aspect,1.0);
  float fall=exp(-dot(d,d)/.02)*cursorOn*(1.0-rush)*step(.02,di+gi);
  vec2 dn=d/max(length(d),1e-3);
  float span=max(clip.w,.3)*tanHalf;
  vec3 drag=(camRight*cursorVel.x*aspect+camUp*cursorVel.y)*span;
  acc+=fall*((camRight*dn.x+camUp*dn.y)*7.0*scale+drag*10.0+flow(p*3.0+time*.8)*18.0);
  v+=acc*dt;
  float speed=length(v);
  if(speed>14.0) v*=14.0/speed;
  p+=v*dt;
  // Code while in flight, beads once settled on the X or the ring.
  float settled=gi*(1.0-smoothstep(.06,.45,length(target-p)/scale));
  float code=state.w+((1.0-settled)-state.w)*min(1.0,dt*3.5);
  outPos=vec4(p,code);
  outVel=vec4(v,length(v));
}`;

const vertex = `#version 300 es
precision highp float;
uniform sampler2D posTex;
uniform sampler2D velTex;
uniform sampler2D dataA;
uniform sampler2D dataB;
uniform sampler2D dataC;
uniform mat4 viewProj;
uniform float p11;
uniform float scale;
uniform float open;
uniform float presence;
uniform float time;
uniform float viewH;
uniform float bead;
uniform int cols;
out vec3 vBead;
out vec3 vCodeColor;
out float vAlpha;
out float vGlint;
out float vCode;
out float vGlyph;
${common}
void main() {
  ivec2 px=ivec2(gl_VertexID%cols,gl_VertexID/cols);
  vec4 state=texelFetch(posTex,px,0);
  float speed=texelFetch(velTex,px,0).w;
  vec4 A=texelFetch(dataA,px,0), B=texelFetch(dataB,px,0), C=texelFetch(dataC,px,0);
  vec4 seed=vec4(A.w,B.w,C.z,C.w);
  vec4 clip=viewProj*vec4(state.xyz,1.0);
  if(clip.w<.05) {gl_Position=vec4(2.0,2.0,2.0,1.0);vAlpha=0.0;return;}
  gl_Position=clip;
  vCode=clamp(state.w,0.0,1.0);
  vGlyph=floor(hash(seed.x*311.0+floor(time*(1.5+seed.y*6.0)))*64.0);
  // Beads: dark grey at rest, pale sheens drifting over the skin, single
  // glints, bigger beads darker; grains on the move light up white.
  float size=mix(.7,1.35,seed.z*seed.z);
  float sheen=smoothstep(.6,.84,noise(A.xyz*2.4+vec3(time*.3,-time*.2,time*.15)));
  float glint=step(.965,hash(seed.x*97.0+floor(time*(1.2+seed.y*2.0))));
  float moving=smoothstep(.35,2.8,speed);
  float base=mix(.16,.42,seed.x)*mix(1.0,.72,smoothstep(1.0,1.35,size));
  vec3 lit=vec3(base)*vec3(.95,.98,1.02)+vec3(.55,.6,.62)*sheen;
  vec3 teal=vec3(.2,1.0,.85);
  vBead=mix(lit,lit*.6+teal*(.35+seed.w*.5),open*.6)+vec3(1.6)*glint*(.6+open)+vec3(.9,.95,1.0)*moving*.9;
  vCodeColor=mix(vec3(.92,.94,.9),vec3(.7,1.0,.55),seed.y*.5)*(.4+seed.z*.35)*(1.0+moving*.8);
  vGlint=glint;
  float depth=max(clip.w,.3);
  // Grains at the lens fade instead of filling the screen.
  vAlpha=presence*smoothstep(.35,1.4,depth);
  float beadPx=bead*scale*size*mix(1.0,1.2,open)*p11*viewH*.5/depth;
  float glyphPx=viewH/900.0*(9.0+seed.z*4.0);
  gl_PointSize=clamp(mix(beadPx,glyphPx,vCode),1.5,64.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D atlas;
in vec3 vBead;
in vec3 vCodeColor;
in float vAlpha;
in float vGlint;
in float vCode;
in float vGlyph;
out vec4 color;
${glyphSample}
void main() {
  if(vAlpha<.01) discard;
  vec2 p=(gl_PointCoord-.5)*2.0;
  float r2=dot(p,p);
  float disc=1.0-step(1.0,r2);
  vec3 n=vec3(p.x,-p.y,sqrt(max(1.0-r2,0.0)));
  float light=(.3+.8*max(dot(n,normalize(vec3(-.4,.6,1.0))),0.0))*(.65+.35*n.z);
  float spec=pow(max(dot(n,normalize(vec3(-.2,.3,1.0))),0.0),28.0);
  vec3 bead=vBead*light+vec3(.9,.95,1.0)*spec*(.35+vGlint);
  // Glyph edges are cut hard: soft edges would write depth and fringe
  // the glyphs behind them.
  float glyph=step(.45,glyphAlpha(atlas,vGlyph,gl_PointCoord));
  float a=mix(disc,glyph,vCode)*vAlpha;
  if(a<.01) discard;
  color=vec4(mix(bead,vCodeColor,vCode)*a,a);
}`;

function invert(out: Float32Array, m: Float32Array) {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  const s = det ? 1 / det : 0;
  out.set([
    (a11 * b11 - a12 * b10 + a13 * b09) * s, (a02 * b10 - a01 * b11 - a03 * b09) * s,
    (a31 * b05 - a32 * b04 + a33 * b03) * s, (a22 * b04 - a21 * b05 - a23 * b03) * s,
    (a12 * b08 - a10 * b11 - a13 * b07) * s, (a00 * b11 - a02 * b08 + a03 * b07) * s,
    (a32 * b02 - a30 * b05 - a33 * b01) * s, (a20 * b05 - a22 * b02 + a23 * b01) * s,
    (a10 * b10 - a11 * b08 + a13 * b06) * s, (a01 * b08 - a00 * b10 - a03 * b06) * s,
    (a30 * b04 - a31 * b02 + a33 * b00) * s, (a21 * b02 - a20 * b04 - a23 * b00) * s,
    (a11 * b07 - a10 * b09 - a12 * b06) * s, (a00 * b09 - a01 * b07 + a02 * b06) * s,
    (a31 * b01 - a30 * b03 - a32 * b00) * s, (a20 * b03 - a21 * b01 + a22 * b00) * s,
  ]);
}

function multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
}

export type XStep = {
  centre: [number, number, number];
  scale: number;
  yaw: number;
  dissolve: number;
  gather: number;
  open: number;
  rush: number;
  cursor: [number, number];
  cursorOn: number;
  aspect: number;
};

export function createXLayer(gl: WebGL2RenderingContext, mobile: boolean, atlas: WebGLTexture | null) {
  const compile = (vs: string, fs: string) => {
    const program = gl.createProgram();
    if (!program) throw new Error("X program allocation failed");
    for (const [type, source] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
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
    return program;
  };
  const uniforms = (program: WebGLProgram, names: string[]) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)]));
  // Float render targets carry the simulation; without them the X is off.
  const simOk = !!gl.getExtension("EXT_color_buffer_float");
  const simProgram = compile(quad, simFragment);
  const renderProgram = compile(vertex, fragment);
  const su = uniforms(simProgram, ["posTex", "velTex", "dataA", "dataB", "dataC", "viewProj", "invViewProj", "centre", "camRight", "camUp", "cursor", "cursorVel", "cursorOn", "aspect", "tanHalf", "letterZ", "scale", "yaw", "radius", "dissolve", "gather", "open", "rush", "time", "dt", "reset"]);
  const ru = uniforms(renderProgram, ["posTex", "velTex", "dataA", "dataB", "dataC", "viewProj", "p11", "scale", "open", "presence", "time", "viewH", "bead", "cols", "atlas"]);

  // The structure: two crossed bars (length L, width W, thickness T) with
  // every grain on a face or edge, so the packed beads read as a solid.
  // Each grain also gets its place on the portal ring: its arm spreads
  // along a quarter of the circle, the bar's cross-section becoming the
  // ring's tube.
  const cols = 128;
  const rows = mobile ? 56 : 128;
  const count = cols * rows;
  const L = 2.3, W = 0.5, T = 0.4, R = 0.95;
  const bead = Math.sqrt((2 * 2 * (L * W + L * T + W * T)) / count) * 1.3;
  const dataA = new Float32Array(count * 4);
  const dataB = new Float32Array(count * 4);
  const dataC = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const bar = i % 2 ? 1 : -1;
    const x = (Math.random() - 0.5) * L;
    let y = (Math.random() - 0.5) * W, z = (Math.random() - 0.5) * T;
    let edge = 0.4;
    const kind = Math.random();
    if (kind < 0.25) {
      y = (Math.random() < 0.5 ? -0.5 : 0.5) * W;
      z = (Math.random() < 0.5 ? -0.5 : 0.5) * T;
      edge = 1;
    } else if (kind < 0.25 + 0.75 * W / (W + T)) {
      z = (Math.random() < 0.5 ? -0.5 : 0.5) * T;
    } else {
      y = (Math.random() < 0.5 ? -0.5 : 0.5) * W;
    }
    const a = bar * Math.PI / 4;
    const ca = Math.cos(a), sa = Math.sin(a);
    dataA.set([x * ca - y * sa, x * sa + y * ca, z, Math.random()], i * 4);
    const arm = x >= 0 ? a : a + Math.PI;
    dataB.set([arm + (Math.abs(x) / (L / 2) - 0.5) * (Math.PI / 2) * 0.98, y * 0.55, z * 0.6, Math.random()], i * 4);
    dataC.set([0, 0, Math.random(), edge], i * 4);
  }
  // Uploads go through unit 12, which only this layer binds, so the other
  // layers' persistent bindings are never disturbed.
  gl.activeTexture(gl.TEXTURE12);
  const makeTexture = (data: Float32Array | null) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cols, rows, 0, gl.RGBA, gl.FLOAT, data);
    return texture;
  };
  const texA = makeTexture(dataA), texB = makeTexture(dataB), texC = makeTexture(dataC);
  const targets = [0, 1].map(() => {
    const pos = makeTexture(null), vel = makeTexture(null), fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pos, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, vel, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    return { pos, vel, fbo };
  });
  const live = simOk && targets.every((t) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
    return gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const emptyVao = gl.createVertexArray();

  let read = 0;
  let sampled = false;
  let resetPending = false;
  const viewProj = new Float32Array(16);
  const invViewProj = new Float32Array(16);
  const cursorPrev = [0, 0];
  const cursorVel = [0, 0];
  let cursorPrimed = false;
  let lastScale = 1;
  let lastOpen = 0;

  const bindData = (u: Record<string, WebGLUniformLocation | null>) => {
    [[texA, "dataA"], [texB, "dataB"], [texC, "dataC"]].forEach(([texture, name], i) => {
      gl.activeTexture(gl.TEXTURE10 + i);
      gl.bindTexture(gl.TEXTURE_2D, texture as WebGLTexture);
      gl.uniform1i(u[name as string], 10 + i);
    });
    gl.activeTexture(gl.TEXTURE13);
    gl.bindTexture(gl.TEXTURE_2D, targets[read].pos);
    gl.uniform1i(u.posTex, 13);
    gl.activeTexture(gl.TEXTURE15);
    gl.bindTexture(gl.TEXTURE_2D, targets[read].vel);
    gl.uniform1i(u.velTex, 15);
  };

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
      for (let i = 0; i < count; i++) {
        const k = Math.floor(Math.random() * (ink.length / 2)) * 2;
        dataC[i * 4] = (ink[k] / canvas.width) * 2 - 1;
        dataC[i * 4 + 1] = 1 - (ink[k + 1] / canvas.height) * 2;
      }
      gl.activeTexture(gl.TEXTURE12);
      gl.bindTexture(gl.TEXTURE_2D, texC);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols, rows, gl.RGBA, gl.FLOAT, dataC);
      sampled = true;
      resetPending = true;
      return true;
    },
    // Advances the simulation one frame. Leaves the default framebuffer
    // bound; the caller restores its viewport.
    step(view: Float32Array, projection: Float32Array, time: number, delta: number, o: XStep) {
      multiply(viewProj, projection, view);
      lastScale = o.scale;
      lastOpen = o.open;
      if (!live || !sampled) return;
      invert(invViewProj, viewProj);
      const dt = Math.max(1 / 240, Math.min(delta, 1 / 30));
      // Cursor velocity in NDC per second, eased so a flick carries on.
      for (let i = 0; i < 2; i++) {
        const moved = cursorPrimed && o.cursorOn > 0.5 ? (o.cursor[i] - cursorPrev[i]) / dt : 0;
        cursorVel[i] += (Math.max(-6, Math.min(6, moved)) - cursorVel[i]) * Math.min(1, dt * 12);
        cursorPrev[i] = o.cursor[i];
      }
      cursorPrimed = o.cursorOn > 0.5;
      const write = 1 - read;
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[write].fbo);
      gl.viewport(0, 0, cols, rows);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(simProgram);
      bindData(su);
      gl.uniformMatrix4fv(su.viewProj, false, viewProj);
      gl.uniformMatrix4fv(su.invViewProj, false, invViewProj);
      gl.uniform3f(su.centre, ...o.centre);
      gl.uniform3f(su.camRight, view[0], view[4], view[8]);
      gl.uniform3f(su.camUp, view[1], view[5], view[9]);
      gl.uniform2f(su.cursor, o.cursor[0], o.cursor[1]);
      gl.uniform2f(su.cursorVel, cursorVel[0], cursorVel[1]);
      gl.uniform1f(su.cursorOn, o.cursorOn);
      gl.uniform1f(su.aspect, o.aspect);
      gl.uniform1f(su.tanHalf, 1 / projection[5]);
      gl.uniform1f(su.letterZ, -2.8);
      gl.uniform1f(su.scale, o.scale);
      gl.uniform1f(su.yaw, o.yaw);
      gl.uniform1f(su.radius, R);
      gl.uniform1f(su.dissolve, o.dissolve);
      gl.uniform1f(su.gather, o.gather);
      gl.uniform1f(su.open, o.open);
      gl.uniform1f(su.rush, o.rush);
      gl.uniform1f(su.time, time);
      gl.uniform1f(su.dt, dt);
      gl.uniform1f(su.reset, resetPending ? 1 : 0);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      read = write;
      resetPending = false;
    },
    render(time: number, viewH: number, projection: Float32Array, presence: number) {
      if (!live || !sampled || presence < 0.005) return;
      gl.useProgram(renderProgram);
      bindData(ru);
      gl.activeTexture(gl.TEXTURE14);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(ru.atlas, 14);
      gl.uniformMatrix4fv(ru.viewProj, false, viewProj);
      gl.uniform1f(ru.p11, projection[5]);
      gl.uniform1f(ru.scale, lastScale);
      gl.uniform1f(ru.open, lastOpen);
      gl.uniform1f(ru.presence, presence);
      gl.uniform1f(ru.time, time);
      gl.uniform1f(ru.viewH, viewH);
      gl.uniform1f(ru.bead, bead);
      gl.uniform1i(ru.cols, cols);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      // Premultiplied, so grains fade in and out without dark discs.
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.bindVertexArray(null);
      gl.disable(gl.DEPTH_TEST);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    },
    dispose() {
      [texA, texB, texC, ...targets.flatMap((t) => [t.pos, t.vel])].forEach((t) => gl.deleteTexture(t));
      targets.forEach((t) => gl.deleteFramebuffer(t.fbo));
      gl.deleteVertexArray(emptyVao);
      gl.deleteProgram(simProgram);
      gl.deleteProgram(renderProgram);
    },
  };
}
