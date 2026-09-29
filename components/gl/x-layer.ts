// The X: the last letter of the hero name, handed from the page's code
// glyphs to particles at exactly the pixels it occupies. As the hero
// scrolls away the letter comes apart into its code — mutating glyphs that
// drift like water in toward the middle of the screen — and as the voyage slides in the
// whole cloud pours down as one stream and rejoins, each glyph turning into
// a bead as it lands, into a solid X of beads like the igloo penguin: dark
// grey grains, pale sheens, single glints. Assembled, the surface keeps
// flowing — waves travel along the bars and small plumes peel off and pour
// back. Then it opens like a portal: each arm swings out onto a quarter of
// a ring that keeps circulating, and the bird flies through into the
// tunnel while the ring rushes past the camera.

import { glyphSample } from "./matrix-layer";

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 start; // NDC of the glyph pixel in the name
layout(location=1) in vec3 local; // position in the X structure
layout(location=2) in vec4 seed;  // random, edge weight in w
layout(location=3) in vec3 ring;  // angle on the portal ring, tube offsets
uniform mat4 view;
uniform mat4 projection;
uniform vec3 centre;
uniform float scale;
uniform float yaw;
uniform float dissolve; // 0 letter → 1 code cloud round its place
uniform float gather;   // 0 cloud → 1 poured down and rejoined as the X
uniform float open;     // 0 X → 1 portal ring
uniform float presence;
uniform float time;
uniform float viewH;
uniform float bead;     // packed bead diameter in local units
uniform float radius;   // portal ring radius in local units
out vec3 vColor;
out float vAlpha;
out float vGlint;
out float vCode;
out float vGlyph;
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
}
void main() {
  // Liquid surface: waves travel along the bars, the skin swells and
  // slides, and a few grains peel off in plumes and pour back.
  vec3 p=local;
  vec3 wave=flow(local*1.7+vec3(time*.55,-time*.45,time*.3));
  p+=wave*.11+flow(local*4.2-vec3(time*.8,time*.6,-time*.5))*.035;
  float plume=pow(max(sin(time*.35+seed.y*6.283+local.x*1.3),0.0),8.0)*step(.8,seed.z);
  p+=normalize(wave+vec3(0.0,0.0,.3))*plume*.45;
  // Portal: arms swing out onto the ring, which keeps circulating.
  float o=smoothstep(seed.w*.12+seed.x*.18,seed.w*.12+seed.x*.18+.7,open);
  o=o*o*(3.0-2.0*o);
  float a=ring.x+open*1.1+time*(.18+seed.y*.22)*open;
  vec3 tube=vec3(ring.y,ring.z,0.0)+flow(vec3(a*2.0,time*.6,seed.x*3.0))*.12;
  vec3 onRing=vec3(cos(a),sin(a),0.0)*(radius+tube.x)+vec3(0.0,0.0,tube.y);
  p=mix(p,onRing,o);
  float cy=cos(yaw),sy=sin(yaw);
  p.xz=mat2(cy,-sy,sy,cy)*p.xz;
  vec4 clip=projection*view*vec4(centre+p*scale,1.0);
  if(clip.w<.05) {gl_Position=vec4(2.0,2.0,2.0,1.0);vAlpha=0.0;return;}
  vec2 target=clip.xy/clip.w;
  // The code cloud: every glyph leaves the letter on its own beat and
  // drifts on a slow current in toward the middle of the screen.
  float d=smoothstep(seed.x*.3,seed.x*.3+.7,dissolve);
  d=d*d*(3.0-2.0*d);
  vec2 drift=(flow(vec3(start*3.0+seed.yz*.6,time*.3+seed.x))*2.0).xy*vec2(.34,.3);
  vec2 cloud=mix(start,start*.45+vec2(.08,-.15),d*.8)+drift*d;
  // Pouring down: one stream bending on the same current, grains keeping
  // their neighbours, and the X fills from its centre outward.
  float lead=seed.x*.3+length(local.xy)*.12;
  float g=smoothstep(lead,lead+.55,gather);
  vec2 bend=flow(vec3(cloud*1.6,time*.4)).xy*.5*vec2(1.0,.4);
  vec2 mid=mix(cloud,target,.5)+bend;
  vec2 ndc=mix(mix(cloud,mid,g),mix(mid,target,g),g);
  gl_Position=vec4(ndc*clip.w,clip.z,clip.w);
  // Glyphs while in flight, beads once landed.
  float landed=smoothstep(.8,1.0,g);
  vCode=1.0-landed;
  vGlyph=floor(hash(seed.x*311.0+floor(time*(1.5+seed.y*6.0)))*64.0);
  float size=mix(.7,1.35,seed.z*seed.z);
  float sheen=smoothstep(.6,.84,noise(local*2.4+vec3(time*.3,-time*.2,time*.15)));
  float glint=step(.965,hash(seed.x*97.0+floor(time*(1.2+seed.y*2.0))));
  float base=mix(.16,.42,seed.x)*mix(1.0,.72,smoothstep(1.0,1.35,size));
  vec3 lit=vec3(base)*vec3(.95,.98,1.02)+vec3(.55,.6,.62)*(sheen+plume*.8);
  vec3 teal=vec3(.2,1.0,.85);
  vec3 beadColor=mix(lit,lit*.6+teal*(.35+seed.w*.5),open*.6)+vec3(1.6)*glint*(.6+open);
  vec3 code=mix(vec3(.92,.94,.9),vec3(.7,1.0,.55),seed.y*.5)*(.7+seed.z*.6);
  vColor=mix(beadColor,code,vCode);
  vGlint=glint*(1.0-vCode);
  float depth=max(clip.w,.3);
  // Grains at the lens fade instead of filling the screen.
  vAlpha=presence*smoothstep(.35,1.4,depth);
  float px=bead*scale*size*mix(1.0,1.25,o)*projection[1][1]*viewH*.5/depth;
  float glyphPx=viewH/900.0*(9.0+seed.z*4.0);
  gl_PointSize=clamp(mix(px,glyphPx,vCode),1.5,64.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D atlas;
in vec3 vColor;
in float vAlpha;
in float vGlint;
in float vCode;
in float vGlyph;
out vec4 color;
${glyphSample}
void main() {
  vec2 p=(gl_PointCoord-.5)*2.0;
  float r2=dot(p,p);
  if(vAlpha<.01) discard;
  if(vCode>.5) {
    float a=glyphAlpha(atlas,vGlyph,gl_PointCoord)*vAlpha;
    if(a<.01) discard;
    color=vec4(vColor*a,a);
    return;
  }
  if(r2>1.0) discard;
  vec3 n=vec3(p.x,-p.y,sqrt(1.0-r2));
  float light=(.3+.8*max(dot(n,normalize(vec3(-.4,.6,1.0))),0.0))*(.65+.35*n.z);
  float spec=pow(max(dot(n,normalize(vec3(-.2,.3,1.0))),0.0),28.0);
  color=vec4((vColor*light+vec3(.9,.95,1.0)*spec*(.35+vGlint))*vAlpha,vAlpha);
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
  const u = Object.fromEntries(["view", "projection", "centre", "scale", "yaw", "dissolve", "gather", "open", "presence", "time", "viewH", "bead", "radius", "atlas"].map((n) => [n, gl.getUniformLocation(program, n)]));

  // The structure: two crossed bars (length L, width W, thickness T) with
  // every grain on a face or edge, so the packed beads read as a solid.
  // Each grain also gets its place on the portal ring: its arm spreads
  // along a quarter of the circle, the bar's cross-section becoming the
  // ring's tube.
  const count = mobile ? 7000 : 16000;
  const L = 2.3, W = 0.5, T = 0.4, R = 0.95;
  const area = 2 * 2 * (L * W + L * T + W * T);
  const bead = Math.sqrt(area / count) * 1.3;
  const local = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const ring = new Float32Array(count * 3);
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
    local.set([x * ca - y * sa, x * sa + y * ca, z], i * 3);
    seeds.set([Math.random(), Math.random(), Math.random(), edge], i * 4);
    const arm = x >= 0 ? a : a + Math.PI;
    const along = Math.abs(x) / (L / 2);
    ring.set([arm + (along - 0.5) * (Math.PI / 2) * 0.98, y * 0.55, z * 0.6], i * 3);
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const startBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, startBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(count * 2), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const buffers = [startBuffer];
  for (const [index, data, size] of [[1, local, 3], [2, seeds, 4], [3, ring, 3]] as const) {
    const buffer = gl.createBuffer();
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(index);
    gl.vertexAttribPointer(index, size, gl.FLOAT, false, 0, 0);
  }
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
    render(view: Float32Array, projection: Float32Array, time: number, viewH: number, o: { centre: [number, number, number]; scale: number; yaw: number; dissolve: number; gather: number; open: number; presence: number }) {
      if (o.presence < 0.005) return;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      // Premultiplied, so beads fade in and out without dark discs.
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniformMatrix4fv(u.view, false, view);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform3f(u.centre, o.centre[0], o.centre[1], o.centre[2]);
      gl.uniform1f(u.scale, o.scale);
      gl.uniform1f(u.yaw, o.yaw);
      gl.uniform1f(u.dissolve, o.dissolve);
      gl.uniform1f(u.gather, o.gather);
      gl.uniform1f(u.open, o.open);
      gl.uniform1f(u.presence, o.presence);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.viewH, viewH);
      gl.uniform1f(u.bead, bead);
      gl.uniform1f(u.radius, R);
      gl.activeTexture(gl.TEXTURE14);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(u.atlas, 14);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.disable(gl.DEPTH_TEST);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(null);
    },
    dispose() {
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
