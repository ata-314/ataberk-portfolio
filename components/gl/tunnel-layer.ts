import { buildProgram } from "./program";
// The voxel tunnel the bird flies into after the opening: a square corridor
// whose walls are a relief of dark metal blocks and fine structural beams.
// Every block carries a thin lit edge; rings of light travel along the
// corridor toward us; a sparse scatter of blocks glows from inside; streaks
// of light rush past near the walls; and far down the corridor a bright
// portal hazes the depth with its colour. It assembles out of the dark —
// blocks slide in from beyond the walls and grow — while the swelling word
// is still on screen, and on the way out it accelerates, stretches and
// flares. Light shifts from teal-green through lime to neon pink and blue
// as the flight goes deeper. Shares the stage's camera and depth, so the
// bird's grains sit inside it.

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 corner;
layout(location=1) in vec3 offset;
layout(location=2) in vec3 size;
layout(location=3) in float seed; // 0..1 block, 2..3 streak, 4 portal
layout(location=4) in vec3 normal;
uniform mat4 view;
uniform mat4 projection;
uniform float travel;
uniform float length_;
uniform float time;
uniform float build;
uniform float exit_;
out vec3 vNormal;
out vec3 vLocal;
out float vSeed;
out float vDepth;
out vec3 vWorld;
out float vKind;
void main() {
  float kind=seed>=3.5?2.0:seed>=1.5?1.0:0.0;
  float s=fract(seed);
  vec3 p=offset;
  vec3 sz=size;
  if(kind<1.5) {
    // Stream toward the camera and wrap; streaks run faster.
    float speed=kind>0.5?2.6:1.0;
    p.z=mod(p.z+travel*speed+time*kind*4.0,length_)-length_+6.0;
    // Assembly: blocks further down and later in their seed arrive last,
    // sliding in from beyond the walls and growing.
    float depthOrder=clamp(-p.z/length_,0.0,1.0);
    float k=smoothstep(s*.35+depthOrder*.4,s*.35+depthOrder*.4+.25,build);
    vec2 outward=normalize(p.xy+vec2(1e-3));
    p.xy+=outward*(1.0-k)*2.5*(1.0-kind);
    sz*=mix(vec3(0.0),vec3(1.0),k);
    // Leaving: everything stretches along the flight.
    sz.z*=1.0+exit_*exit_*(kind>0.5?4.0:2.5);
  }
  vec3 world=p+corner*sz;
  vNormal=normal;
  vLocal=corner;
  vSeed=s;
  vKind=kind;
  vWorld=world;
  vec4 v=view*vec4(world,1.0);
  vDepth=-v.z;
  gl_Position=projection*v;
}`;

const fragment = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vLocal;
in float vSeed;
in float vDepth;
in vec3 vWorld;
in float vKind;
uniform float presence;
uniform float hue; // 0 teal/green → 1 neon pink / blue
uniform float time;
uniform float exit_;
out vec4 color;
vec3 palette(float t,float s) {
  vec3 teal=vec3(.1,1.0,.85), lime=vec3(.75,1.0,.25), pink=vec3(1.0,.25,.6), red=vec3(1.0,.2,.25), blue=vec3(.35,.55,1.0);
  vec3 a=mix(teal,lime,step(.55,s));
  vec3 b=mix(pink,red,step(.6,s));
  vec3 c=mix(a,b,smoothstep(.35,.7,t));
  return mix(c,blue,smoothstep(.85,1.0,t)*step(.5,s));
}
void main() {
  vec3 tint=palette(hue,.3);
  if(vKind>1.5) {
    // Portal: a soft bright square of the corridor's colour at its end.
    vec2 q=abs(vLocal.xy)*2.0;
    float glow=pow(1.0-max(q.x,q.y),1.5);
    color=vec4(mix(tint,vec3(1.0),.35)*(.6+glow*2.2)*presence,1.0);
    return;
  }
  if(vKind>0.5) {
    // Streak: a bright line of light rushing past.
    color=vec4(mix(palette(hue,vSeed),vec3(1.0),.35)*(.8+exit_*2.2)*presence,1.0);
    return;
  }
  vec3 n=vNormal;
  vec3 toCentre=normalize(vec3(-vWorld.x,-vWorld.y,0.0)+vec3(0.0,0.0,.35));
  float diffuse=max(dot(n,toCentre),0.0)*.55+max(dot(n,normalize(vec3(.2,1.0,.4))),0.0)*.12;
  vec3 tangent=abs(vLocal)*(1.0-abs(n));
  float edge=smoothstep(.44,.5,max(tangent.x,max(tangent.y,tangent.z)));
  // Rings of light travelling along the corridor toward the camera.
  float phase=fract(vWorld.z*.07+time*.45);
  float pulse=exp(-pow((phase-.5)*16.0,2.0));
  vec3 metal=vec3(.03,.045,.055)*(.35+diffuse*1.4)+tint*.015;
  float lit=step(.955,vSeed);
  float flicker=.55+.45*step(.3,fract(sin(floor(time*6.0+vSeed*50.0))*43758.5));
  vec3 glow=palette(hue,fract(vSeed*7.31))*(1.0+vSeed*.8)*flicker*lit;
  vec3 edges=palette(hue,fract(vSeed*3.7))*edge*(.12+pulse*1.3);
  vec3 c=metal+glow*(1.0+pulse)+edges+metal*pulse*6.0;
  c+=vec3(1.0)*exit_*exit_*.4*edge;
  // Aerial perspective: the depth fills with the portal's coloured haze,
  // and the lens-side blocks fade in.
  float fog=exp(-max(vDepth-6.0,0.0)*.03);
  vec3 haze=tint*.16;
  float near=smoothstep(.5,2.5,vDepth);
  color=vec4(mix(haze,c,fog)*near*presence,1.0);
}`;

// Unit cube: 36 corners in [-0.5, 0.5], each followed by its face normal.
function cube() {
  const f = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
    [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, -1], [1, 0, 0]],
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
  ];
  const out: number[] = [];
  for (const [n, u, v] of f) {
    const c = (a: number, b: number) => [0, 1, 2].map((k) => n[k] * 0.5 + u[k] * a * 0.5 + v[k] * b * 0.5);
    const q = [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)];
    for (const i of [0, 1, 2, 0, 2, 3]) out.push(...q[i], ...n);
  }
  return new Float32Array(out);
}

export async function createTunnelLayer(gl: WebGL2RenderingContext, mobile: boolean) {
  const program = await buildProgram(gl, vertex, fragment, "Tunnel");
  const u = Object.fromEntries(["view", "projection", "travel", "length_", "time", "presence", "hue", "build", "exit_"].map((n) => [n, gl.getUniformLocation(program, n)]));

  // Corridor: half-width W, half-height H, length L. Each wall is a grid of
  // blocks pushed inward by a random relief, plus square frames of beams.
  const W = 3.4, H = 2.3, L = 96;
  const inst: number[] = [];
  let rand = 1234567;
  const r = () => ((rand = (rand * 1664525 + 1013904223) >>> 0) / 4294967296);
  const step = mobile ? 0.5 : 0.34;
  const walls: [number, number, number, number][] = [
    // axis fixed (0=x,1=y), side, span of the other axis
    [0, -W, -H, H], [0, W, -H, H], [1, -H, -W, W], [1, H, -W, W],
  ];
  for (let z = 0; z < L; z += step) {
    for (const [axis, side, lo, hi] of walls) {
      for (let a = lo; a < hi; a += step) {
        if (r() < 0.35) continue;
        const depth = 0.04 + Math.pow(r(), 2.6) * 0.75;
        const inward = side > 0 ? -depth / 2 : depth / 2;
        const sa = step * (0.45 + r() * 0.8), sz = step * (0.4 + r() * 2.4);
        const px = axis === 0 ? side + inward : a;
        const py = axis === 1 ? side + inward : a;
        const sx = axis === 0 ? depth : sa;
        const sy = axis === 1 ? depth : sa;
        inst.push(px, py, -z, sx, sy, sz, r());
      }
    }
    // Structural frame every few metres: four long beams.
    if (Math.abs((z % 3) - 0) < step / 2) {
      const t = 0.06;
      inst.push(0, H - 0.2, -z, W * 2, t, t, 0.2, 0, -H + 0.2, -z, W * 2, t, t, 0.2);
      inst.push(W - 0.2, 0, -z, t, H * 2, t, 0.2, -W + 0.2, 0, -z, t, H * 2, t, 0.2);
    }
  }
  // Streaks of light near the walls, and the portal at the far end.
  for (let i = 0; i < (mobile ? 60 : 150); i++) {
    const a = r() * Math.PI * 2;
    const rx = Math.cos(a) * (W - 0.6 - r() * 0.8), ry = Math.sin(a) * (H - 0.5 - r() * 0.6);
    inst.push(rx, ry, -r() * L, 0.018, 0.018, 1.2 + r() * 3.5, 2 + r() * 0.99);
  }
  inst.push(0, 0, -L + 8, W * 2.2, H * 2.2, 0.1, 4);
  const count = inst.length / 7;
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube(), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(4);
  gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 24, 12);
  const instBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(inst), gl.STATIC_DRAW);
  const stride = 7 * 4;
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 12);
  gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3);
  gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 24);
  gl.vertexAttribDivisor(3, 1);
  gl.bindVertexArray(null);

  return {
    render(view: Float32Array, projection: Float32Array, time: number, travel: number, presence: number, hue: number, build: number, exit: number) {
      if (presence < 0.01) return;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.uniformMatrix4fv(u.view, false, view);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform1f(u.travel, travel);
      gl.uniform1f(u.length_, L);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.presence, presence);
      gl.uniform1f(u.hue, hue);
      gl.uniform1f(u.build, build);
      gl.uniform1f(u.exit_, exit);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, count);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(cubeBuffer);
      gl.deleteBuffer(instBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
