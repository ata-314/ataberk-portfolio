// The opened work card as a fluid of beads. Every grain of the card's
// picture is a particle simulated on the GPU (offset from its cell and
// velocity, ping-ponged in a float texture): a spring pulls it home, drag
// calms it, and curl noise swirls it in proportion to its speed, so any
// disturbance rolls through the picture like liquid and settles. The cursor
// pushes and drags grains, a click fires a radial impulse, and two slow
// comets rake the surface. Moving grains turn into lit beads stretched
// along their motion; resting ones tile the picture as pixels.
import { nebulaChunk } from "./work-shaders";
import { buildProgramU } from "./program";

const fullscreen = `#version 300 es
precision highp float;
precision highp sampler2D;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;

const simFragment = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uState;
uniform vec2 uGrid;
uniform float uDt,uTime,uAspect,uReset;
uniform vec4 uCursor; // xy position, zw velocity (panel units)
uniform float uCursorOn;
uniform vec4 uImpulse; // xy centre, z strength
uniform vec4 uComet[2]; // xy position, zw velocity
uniform float uCometOn;
out vec4 state;
${nebulaChunk}
vec2 curl(vec2 p){
  float e=.04;
  float a=vnoise(p+vec2(0,e)),b=vnoise(p-vec2(0,e)),c=vnoise(p+vec2(e,0)),d=vnoise(p-vec2(e,0));
  return vec2(a-b,-(c-d))/(2.0*e);
}
void main(){
  ivec2 c=ivec2(gl_FragCoord.xy);
  vec4 s=uReset>.5?vec4(0):texelFetch(uState,c,0);
  vec2 off=s.xy,vel=s.zw;
  vec2 uv=(vec2(c)+.5)/uGrid;
  vec2 home=(uv*2.0-1.0)*vec2(uAspect,1.0);
  vec2 pos=home+off;
  float r=h21(vec2(c)*.37+3.1);
  vec2 acc=-off*(22.0+r*10.0);
  // Cursor: a soft pressure front that parts the beads and drags them with
  // the stroke, like a finger through liquid.
  vec2 d=pos-uCursor.xy;
  float w=exp(-dot(d,d)*16.0)*uCursorOn;
  acc+=d/max(length(d),.02)*w*7.0+uCursor.zw*w*2.6;
  for(int i=0;i<2;i++){
    vec2 dc=pos-uComet[i].xy;
    float wc=exp(-dot(dc,dc)*11.0)*uCometOn;
    acc+=uComet[i].zw*wc*1.6+dc/max(length(dc),.02)*wc*3.0;
  }
  vec2 di=pos-uImpulse.xy;
  float wi=exp(-dot(di,di)*5.0)*uImpulse.z;
  vel+=di/max(length(di),.02)*wi*(2.4+r*1.6);
  float speed=length(vel);
  acc+=curl(pos*2.4+vec2(uTime*.13,-uTime*.09))*min(speed,2.5)*2.2;
  vel+=acc*uDt;
  vel*=exp(-uDt*(3.6+r*1.2));
  off+=vel*uDt;
  state=vec4(off,vel);
}`;

const renderVertex = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D uState;
uniform vec2 uGrid,uResolution;
uniform vec4 uRect;
uniform float uTime,uAssemble,uAspect,uSeed,uCellPx;
uniform vec3 uDeep,uMid,uGlow;
uniform vec4 uComet[2];
uniform float uCometOn;
uniform sampler2D uShot; uniform float uShotOn;
out vec3 vColor; out float vAlpha; out float vBead; out vec2 vDir; out float vStretch;
${nebulaChunk}
void main(){
  float id=float(gl_VertexID);
  vec2 cell=vec2(mod(id,uGrid.x),floor(id/uGrid.x));
  vec4 s=texelFetch(uState,ivec2(cell),0);
  vec2 uv=(cell+.5)/uGrid;
  vec2 home=(uv*2.0-1.0)*vec2(uAspect,1.0);
  float r1=h21(cell+uSeed),r2=h21(cell.yx+3.1);
  vec2 off=s.xy,vel=s.zw;
  float speed=length(vel);
  float disturb=clamp(length(off)*2.6+speed*.5,0.0,1.0);
  vec3 p=vec3(home+off,disturb*(.35+r2*.4)+speed*.05);
  // Ragged border: a few edge grains hang loose and drift.
  vec2 e=abs(uv*2.0-1.0);
  float fray=smoothstep(.9,1.0,max(e.x,e.y))*step(.55,r1);
  p.xy+=vec2(r2-.5,r1-.5)*fray*.12+sign(home)*fray*r2*.05*(1.0+sin(uTime*.7+r1*20.0));
  // Assembly: a wipe across the card from scattered, lifted grains.
  float gate=smoothstep(uv.x*.55+r1*.12,uv.x*.55+r1*.12+.35,uAssemble);
  vec2 away=normalize(vec2(r1-.5,r2-.5)+1e-3);
  p.xy+=away*(1.0-gate)*(1.1+r2*1.3);
  p.z+=(1.0-gate)*(.7+r1);
  float persp=1.0/max(1.0-p.z*.3,.25);
  vec2 ndc=uRect.xy+p.xy/vec2(uAspect,1.0)*uRect.zw*persp;
  gl_Position=vec4(ndc,0.0,1.0);
  // Streak along the screen-space motion.
  vec2 vpx=vel/vec2(uAspect,1.0)*uRect.zw*uResolution*.5;
  vDir=length(vpx)>1e-4?normalize(vpx):vec2(1,0);
  vStretch=1.0+min(speed*.55,1.8)*disturb;
  float hot=0.0;
  for(int i=0;i<2;i++){vec2 dc=home+off-uComet[i].xy;hot+=exp(-dot(dc,dc)*45.0)*uCometOn;}
  gl_PointSize=uCellPx*(1.1+disturb*.55+min(hot,1.0)*.45)*persp*vStretch;
  // A live product's screen: every grain is one of its pixels.
  vec3 pic=uShotOn>.5?textureLod(uShot,vec2(uv.x,1.0-uv.y),.8).rgb*1.45+uDeep*.05:nebula(uv,uAspect,uTime,uSeed,uDeep,uMid,uGlow);
  vec3 col=pic*(1.0+disturb*.7+min(speed,2.0)*.25);
  col=mix(col,col*vec3(.75,.95,1.15)+vec3(.04,.09,.13),disturb*.5);
  col=mix(col,vec3(.85,.97,1.0)*1.6,min(hot,1.0)*.45);
  vColor=col;
  vAlpha=gate;
  vBead=max(disturb,min(hot,1.0));
}`;

const renderFragment = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec3 vColor; in float vAlpha; in float vBead; in vec2 vDir; in float vStretch;
out vec4 color;
void main(){
  vec2 c=gl_PointCoord*2.0-1.0;
  c.y=-c.y;
  // Rest: a soft square pixel. Moving: a round bead squeezed across its
  // motion into a streak, sphere-lit with one highlight.
  vec2 q=abs(c);
  float sq=1.0-smoothstep(.62,1.0,max(q.x,q.y));
  vec2 m=vec2(dot(c,vDir),dot(c,vec2(-vDir.y,vDir.x))*vStretch);
  float r2=dot(m,m);
  float disc=1.0-smoothstep(.5,1.0,r2);
  vec3 n=vec3(m.x,m.y,sqrt(max(1.0-r2,0.0)));
  vec3 l=normalize(vec3(-.4,.55,.75));
  float light=max(dot(n,l),0.0);
  float spec=pow(max(dot(reflect(-l,n),vec3(0,0,1)),0.0),20.0);
  vec3 bead=vColor*(.4+.85*light)+vec3(1.0)*spec*.9;
  float a=mix(sq,disc,vBead)*vAlpha;
  color=vec4(mix(vColor,bead,vBead),a);
}`;

const program = (gl: WebGL2RenderingContext, vs: string, fs: string) => buildProgramU(gl, vs, fs, "Inside");

const comet = (i: number, t: number, aspect: number): [number, number] => {
  const w = 0.2 + i * 0.07;
  return [Math.sin(t * w * 2.1 + i * 2.4) * 0.95 * aspect, Math.sin(t * w * 3.3 + i * 4.1 + Math.sin(t * w * 0.7) * 1.3) * 0.72];
};

export async function createWorkInside(gl: WebGL2RenderingContext, mobile: boolean, aspect: number) {
  const cols = mobile ? 120 : 200;
  const rows = Math.round(cols / aspect);
  // Float render targets are needed for the simulation; without them the
  // card still opens as a still picture.
  const canSim = !!gl.getExtension("EXT_color_buffer_float");
  const [sim, draw] = await Promise.all([
    canSim ? program(gl, fullscreen, simFragment) : null,
    program(gl, renderVertex, renderFragment),
  ]);
  const vao = gl.createVertexArray();
  const targets = [0, 1].map(() => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cols, rows, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  });
  let read = 0;
  let reset = true;
  let clock = 0;
  const cursor = new Float32Array(4);
  let cursorOn = 0;
  let last: [number, number] | null = null;
  const impulse = new Float32Array(4);
  const comets = new Float32Array(8);
  let cometOn = 0;

  return {
    // Advance the fluid. Inputs are in panel units (height spans -1..1).
    step(
      dt: number,
      time: number,
      live: boolean,
      pointer: { x: number; y: number; on: number },
      output: WebGLFramebuffer | null,
    ) {
      if (!live) {
        reset = true;
        clock = 0;
        last = null;
        cometOn = 0;
        return;
      }
      clock += dt;
      const h = Math.min(Math.max(dt, 1 / 240), 1 / 30);
      const vx = last ? (pointer.x - last[0]) / h : 0;
      const vy = last ? (pointer.y - last[1]) / h : 0;
      last = [pointer.x, pointer.y];
      cursor[2] += (Math.max(-6, Math.min(6, vx)) - cursor[2]) * 0.5;
      cursor[3] += (Math.max(-6, Math.min(6, vy)) - cursor[3]) * 0.5;
      cursor[0] = pointer.x;
      cursor[1] = pointer.y;
      cursorOn += (pointer.on - cursorOn) * (1 - Math.exp(-dt * 8));
      cometOn = Math.min(1, Math.max(0, (clock - 0.4) / 1.5)) * 0.8;
      for (let i = 0; i < 2; i++) {
        const t = clock + 2 + i * 0.5;
        const a = comet(i, t, aspect), b = comet(i, t - 0.02, aspect);
        comets.set([a[0], a[1], (a[0] - b[0]) / 0.02, (a[1] - b[1]) / 0.02], i * 4);
      }
      if (!sim) return;
      gl.disable(gl.BLEND);
      gl.useProgram(sim.p);
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, cols, rows);
      gl.uniform2f(sim.u("uGrid"), cols, rows);
      gl.uniform1f(sim.u("uAspect"), aspect);
      gl.uniform1f(sim.u("uTime"), time);
      gl.uniform4fv(sim.u("uCursor"), cursor);
      gl.uniform1f(sim.u("uCursorOn"), cursorOn);
      gl.uniform4fv(sim.u("uComet"), comets);
      gl.uniform1f(sim.u("uCometOn"), cometOn);
      gl.uniform1i(sim.u("uState"), 13);
      // Two substeps keep the stiff spring stable at low frame rates.
      for (let k = 0; k < 2; k++) {
        const write = 1 - read;
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets[write].fbo);
        gl.activeTexture(gl.TEXTURE13);
        gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
        gl.uniform1f(sim.u("uDt"), h / 2);
        gl.uniform1f(sim.u("uReset"), reset ? 1 : 0);
        gl.uniform4fv(sim.u("uImpulse"), k === 0 ? impulse : [0, 0, 0, 0]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        read = write;
        reset = false;
      }
      impulse[2] = 0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, output);
    },
    burst(x: number, y: number) {
      impulse.set([x, y, 1, 0]);
    },
    render(opts: {
      rect: Float32Array;
      width: number;
      height: number;
      time: number;
      assemble: number;
      seed: number;
      deep: [number, number, number];
      mid: [number, number, number];
      glow: [number, number, number];
      screen?: WebGLTexture | null;
    }) {
      gl.viewport(0, 0, opts.width, opts.height);
      gl.useProgram(draw.p);
      gl.bindVertexArray(vao);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.activeTexture(gl.TEXTURE13);
      gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
      gl.uniform1i(draw.u("uState"), 13);
      gl.uniform2f(draw.u("uGrid"), cols, rows);
      gl.uniform2f(draw.u("uResolution"), opts.width, opts.height);
      gl.uniform4fv(draw.u("uRect"), opts.rect);
      gl.uniform1f(draw.u("uTime"), opts.time);
      gl.uniform1f(draw.u("uAssemble"), opts.assemble * 1.5);
      gl.uniform1f(draw.u("uAspect"), aspect);
      gl.uniform1f(draw.u("uSeed"), opts.seed);
      gl.uniform1f(draw.u("uCellPx"), (opts.rect[2] * opts.width) / cols);
      gl.uniform3fv(draw.u("uDeep"), opts.deep);
      gl.uniform3fv(draw.u("uMid"), opts.mid);
      gl.uniform3fv(draw.u("uGlow"), opts.glow);
      gl.activeTexture(gl.TEXTURE11);
      gl.bindTexture(gl.TEXTURE_2D, opts.screen ?? null);
      gl.uniform1i(draw.u("uShot"), 11);
      gl.uniform1f(draw.u("uShotOn"), opts.screen ? 1 : 0);
      gl.uniform4fv(draw.u("uComet"), comets);
      gl.uniform1f(draw.u("uCometOn"), cometOn);
      gl.drawArrays(gl.POINTS, 0, cols * rows);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    },
    dispose() {
      if (sim) gl.deleteProgram(sim.p);
      gl.deleteProgram(draw.p);
      gl.deleteVertexArray(vao);
      targets.forEach((t) => {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      });
    },
  };
}
