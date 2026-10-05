// The showreel inside the voxel tunnel: one projected hologram per film, set
// along the corridor and alternating sides. The reel advances by stops (see
// reelStops): at every stop the flight hangs in front of a hologram, which
// faces the camera at a comfortable viewing distance, sized to the frame
// (half the height on desktop, about half the width on phones).
// A slit in the wall projects a fan of light, and as the flight approaches
// the picture unfolds in it from the wall-side edge, led by a bright front;
// once passed it folds back into the slit. It is alive while it plays: scan
// lines run down it, an interference band sweeps through now and then, the
// projection drifts and flickers slightly, motes of dust drift through the
// beam and two faint ghost layers float behind the picture.
// The cursor (or a touch) plays with it: the hologram turns a little toward
// the cursor (so the ghost layers part with parallax), the picture ripples
// and splits into colour around it, and a click or tap breaks it into
// slices that flash and snap back, flaring the beam.
// A hologram shows its poster until its clip is near; only the clips within
// a stop of the camera are decoded and uploaded, and with reduced motion
// only posters are shown.
import type { ReelItem } from "@/content/reel";
import { buildProgram } from "./program";

const palette = `
vec3 palette(float t,float s) {
  vec3 teal=vec3(.1,1.0,.85), lime=vec3(.75,1.0,.25), pink=vec3(1.0,.25,.6), red=vec3(1.0,.2,.25), blue=vec3(.35,.55,1.0);
  vec3 a=mix(teal,lime,step(.55,s));
  vec3 b=mix(pink,red,step(.6,s));
  vec3 c=mix(a,b,smoothstep(.35,.7,t));
  return mix(c,blue,smoothstep(.85,1.0,t)*step(.5,s));
}`;

const pictureVertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 uv;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 centre;
uniform vec2 size;
uniform float yaw;
uniform vec2 tilt; // turn toward the cursor (about y, about x)
uniform float layer; // 0 the picture, 1..2 ghosts behind it
uniform float time;
out vec2 vUv;
out float vDepth;
void main(){
  vUv=uv;
  vec2 lp=(uv-.5)*size;
  float depth=-layer*.09*max(size.x,size.y);
  float z=depth-lp.x*tilt.x+lp.y*tilt.y+sin(time*.9+lp.y*1.3)*.012;
  float cy=cos(yaw), sy=sin(yaw);
  vec3 world=centre+vec3(lp.x*cy+z*sy,lp.y+sin(time*.7)*.01,-lp.x*sy+z*cy);
  vec4 v=view*vec4(world,1.0);
  vDepth=-v.z;
  gl_Position=projection*v;
}`;

const pictureFragment = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in float vDepth;
uniform sampler2D picture;
uniform vec2 size;
uniform float side;
uniform float appear;
uniform float focus;
uniform float presence;
uniform float hue;
uniform float time;
uniform float pass; // 0 veil behind, 1 light
uniform float layer;
uniform vec3 cursor; // uv, how much it is over
uniform float burst; // 1 at a click, fading
uniform float burstAge;
out vec4 color;
${palette}
float h11(float x){return fract(sin(x*127.1)*43758.5453);}
void main(){
  vec3 tint=palette(hue,.3);
  float f=side>0.0?1.0-vUv.x:vUv.x;
  // Unfolds from the wall-side edge, led by a bright front.
  float reveal=appear*1.15;
  if(f>reveal) discard;
  float front=smoothstep(.06,0.0,reveal-f)*step(appear,.999);
  float fog=exp(-max(vDepth-6.0,0.0)*.03)*smoothstep(.4,2.0,vDepth)*presence;
    // In focus the effects step back so the film reads clearly; they come
  // back while it unfolds and wherever the cursor plays.
  float calm=focus*(1.0-cursor.z*.6);
  if(pass<.5){ color=vec4(0.0,0.0,0.0,mix(.7,1.0,focus)*fog*(1.0-front)); return; }
  vec2 uv=vUv;
  // Drift, torn lines (more of them near the cursor) and the click's slices.
  uv.x+=sin(vUv.y*22.0+time*2.6)*.0016*(1.0-calm);
  float line=floor(vUv.y*90.0);
  vec2 aspect=vec2(size.x/size.y,1.0);
  vec2 toCursor=(vUv-cursor.xy)*aspect;
  float d=length(toCursor);
  float near=exp(-d*7.0)*cursor.z;
  float tearOdds=mix(.965,.995,calm)-near*.25;
  uv.x+=step(tearOdds,h11(line+floor(time*9.0)))*(h11(line*3.1)-.5)*(.04+near*.08);
  float slice=floor(vUv.y*26.0);
  uv.x+=(h11(slice+floor(burstAge*18.0))-.5)*.22*burst;
  // Ripple running out from the cursor.
  uv+=toCursor/max(d,1e-3)/aspect*sin(d*42.0-time*9.0)*.012*near;
  float split=.003*(1.0-calm*.8)+near*.012+burst*.02;
  vec2 tuv=vec2(uv.x,1.0-uv.y);
  vec3 pic=vec3(texture(picture,tuv+vec2(split,0.0)).r,texture(picture,tuv).g,texture(picture,tuv-vec2(split,0.0)).b);
  float lum=dot(pic,vec3(.3,.59,.11));
  // Scan lines running down, and an interference band now and then.
  float scan=1.0-mix(.2,.05,calm)*(.5+.5*sin(vUv.y*size.y*160.0+time*6.0));
  float band=exp(-pow((fract(vUv.y*.6+time*.11)-.5)*14.0,2.0));
  float flicker=1.0-mix(.07,.015,calm)*(.5+.5*sin(time*47.0)*sin(time*13.0));
  vec2 e=abs(vUv-.5)*2.0;
  float rim=smoothstep(.97,1.0,max(e.x,e.y));
  vec3 c;
  if(layer<.5){
    c=mix(pic,tint*lum*1.5,mix(.18,.03,calm))*scan*flicker*(.65+.3*focus)*(1.0+band*.3*(1.0-calm)+burst*.45);
    c+=tint*(rim*mix(.5,.3,calm)+front*1.4+band*.05*(1.0-calm)+near*.12);
  } else {
    // Ghosts: the picture's light only, thinner the further back.
    c=(tint*lum*(layer<1.5?.22:.1)*scan+tint*rim*.2)*(1.0-calm*.5);
  }
  color=vec4(c*fog,0.0);
}`;

const fanVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in float along;
uniform mat4 view;
uniform mat4 projection;
out float vAlong;
out float vDepth;
void main(){
  vAlong=along;
  vec4 v=view*vec4(position,1.0);
  vDepth=-v.z;
  gl_Position=projection*v;
}`;

const fanFragment = `#version 300 es
precision highp float;
in float vAlong;
in float vDepth;
uniform float hue;
uniform float strength;
uniform float time;
out vec4 color;
${palette}
void main(){
  float pulse=.85+.15*sin(time*3.1)+.1*sin(time*17.0);
  float i=(pow(1.0-vAlong,2.2)*.22+.012)*strength*pulse*smoothstep(.4,2.0,vDepth);
  color=vec4(palette(hue,.3)*i,0.0);
}`;

// Dust in the beam: each mote has a place across the fan and drifts from
// the slit toward the picture, twinkling.
const moteVertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 seed;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 slit[2];
uniform vec3 quad[4]; // picture corners: wall-top, free-top, wall-bottom, free-bottom
uniform float time;
uniform float viewportH;
uniform float strength;
out float vGlow;
void main(){
  float t=fract(seed.z+time*(.04+seed.x*.05));
  vec3 s=mix(slit[1],slit[0],seed.y);
  vec3 top=mix(quad[0],quad[1],seed.x), bottom=mix(quad[2],quad[3],seed.x);
  vec3 p=mix(s,mix(bottom,top,seed.y),t);
  p+=vec3(sin(time*.7+seed.x*30.0),cos(time*.5+seed.y*40.0),sin(time*.6+seed.z*20.0))*.03;
  vec4 v=view*vec4(p,1.0);
  float depth=-v.z;
  gl_Position=projection*v;
  gl_PointSize=max(1.0,.022*projection[1][1]*viewportH*.5/depth);
  vGlow=strength*sin(t*3.1416)*(.5+.5*sin(time*4.0+seed.x*90.0))*smoothstep(.4,2.0,depth);
}`;

const moteFragment = `#version 300 es
precision highp float;
in float vGlow;
uniform float hue;
out vec4 color;
${palette}
void main(){
  float d=length(gl_PointCoord-.5)*2.0;
  float a=smoothstep(1.0,0.0,d)*vGlow;
  color=vec4(mix(palette(hue,.3),vec3(1.0),.5)*a*.8,0.0);
}`;

const UNIFORMS = ["view", "projection", "centre", "size", "yaw", "tilt", "layer", "time", "picture", "side", "appear", "focus",
  "presence", "hue", "pass", "cursor", "burst", "burstAge", "strength", "slit", "quad", "viewportH"];

async function compile(gl: WebGL2RenderingContext, vs: string, fs: string, name: string) {
  const program = await buildProgram(gl, vs, fs, name);
  return { program, u: Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) };
}

export type ReelStops = { position: number; index: number; focus: number };

// Reel progress (0..1) to a position in stops: stop 0 is before the first
// screen, stop i+1 holds screen i, stop n+1 is past the last. Each stop is
// held for the middle of its share of the scroll and eased between.
export function reelStops(progress: number, count: number) {
  const x = Math.max(0, Math.min(1, progress)) * (count + 1);
  const k = Math.min(Math.floor(x), count);
  const f = Math.max(0, Math.min(1, (x - k - 0.3) / 0.4));
  return k + f * f * (3 - 2 * f);
}

type Vec3 = [number, number, number];

export async function createReelLayer(gl: WebGL2RenderingContext, mobile: boolean, items: ReelItem[]) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Same corridor as the tunnel layer: walls at ±3.4, blocks up to 0.75 in.
  const WALL = 3.4;
  const WALL_FACE = 2.9;
  const SPACING = 16;
  const VIEW = mobile ? 8.5 : 6.2;
  const MOTES = mobile ? 90 : 180;

  const [picture, fan, motes] = await Promise.all([
    compile(gl, pictureVertex, pictureFragment, "Reel picture"),
    compile(gl, fanVertex, fanFragment, "Reel fan"),
    compile(gl, moteVertex, moteFragment, "Reel motes"),
  ]);

  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // The fan of light: rebuilt per hologram per frame (8 triangles).
  const fanVao = gl.createVertexArray();
  gl.bindVertexArray(fanVao);
  const fanBuffer = gl.createBuffer();
  const fanData = new Float32Array(24 * 4);
  gl.bindBuffer(gl.ARRAY_BUFFER, fanBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fanData.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);

  const moteVao = gl.createVertexArray();
  gl.bindVertexArray(moteVao);
  const moteBuffer = gl.createBuffer();
  let rand = 98765;
  const r = () => ((rand = (rand * 1664525 + 1013904223) >>> 0) / 4294967296);
  gl.bindBuffer(gl.ARRAY_BUFFER, moteBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Array.from({ length: MOTES * 3 }, r)), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  type Screen = {
    item: ReelItem;
    texture: WebGLTexture;
    video: HTMLVideoElement | null;
    shown: number;
    playing: boolean;
    side: number;
    // Cursor play: where it is over the picture (uv), how much, the turn
    // toward it, and the last click.
    hit: [number, number];
    over: number;
    tilt: [number, number];
    clickAt: number;
  };
  // Unit 12 is the reel's own; no other layer samples it.
  const upload = (texture: WebGLTexture, source: TexImageSource) => {
    gl.activeTexture(gl.TEXTURE12);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  };
  const screens: Screen[] = items.map((item, i) => {
    const texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE12);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([6, 8, 10, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { item, texture, video: null, shown: -1, playing: false, side: i % 2 ? 1 : -1, hit: [0.5, 0.5], over: 0, tilt: [0, 0], clickAt: -10 };
  });
  let disposed = false;

  // The pointer in NDC, and whether it has just clicked or tapped.
  const canvas = gl.canvas as HTMLCanvasElement;
  const pointer = { x: 0, y: 0, on: false, clicked: false };
  const onMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    pointer.y = 1 - ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2;
    pointer.on = true;
  };
  const onDown = (e: PointerEvent) => {
    onMove(e);
    pointer.clicked = true;
  };
  const onLeave = () => { pointer.on = false; };
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onDown, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  let lastTime = -1;

  let postersRequested = false;
  const requestPosters = () => {
    if (postersRequested) return;
    postersRequested = true;
    for (const s of screens) {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (!disposed && s.shown < 0) upload(s.texture, img);
      };
      img.src = `/reel/${s.item.slug}.jpg`;
    }
  };
  const startVideo = (s: Screen) => {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.src = `/reel/${s.item.slug}.mp4`;
    s.video = video;
  };

  // Where each hologram settles when it is in focus, for the current frame.
  const place = (s: Screen, fovY: number, aspect: number) => {
    const tanV = Math.tan(fovY / 2);
    const hw = tanV * aspect * VIEW, hh = tanV * VIEW;
    const a = s.item.aspect;
    let h = Math.min(0.95 * hh, ((mobile || aspect < 1 ? 1.05 : 0.68) * hw) / a);
    let w = h * a;
    const wallRoom = WALL - 0.6 - w * 0.48;
    let x = Math.min(wallRoom, hw - w * 0.55 - 0.08 * hw);
    if (x < 0) {
      // Very narrow frames: shrink rather than cross the flight line.
      const k = Math.max(0.5, (hw * 0.94) / w);
      w *= k;
      h *= k;
      x = Math.max(0, hw - w * 0.55 - 0.08 * hw);
    }
    return { x: s.side * x, w, h, yaw: Math.atan2(-s.side * x, VIEW) };
  };

  return {
    count: screens.length,
    spacing: SPACING,
    // Called once the voyage is near: posters are small and load up front.
    prepare: requestPosters,
    // How far the bird should move aside (signed x) for the screens in focus.
    dodge(position: number) {
      let x = 0;
      screens.forEach((s, i) => {
        x -= s.side * (1 - Math.min(1, Math.abs(position - (i + 1)) / 0.45));
      });
      return Math.max(-1, Math.min(1, x));
    },
    // The screen nearest focus and how fully it holds it (for the caption).
    focus(position: number): ReelStops {
      const index = Math.round(position) - 1;
      const focus = index >= 0 && index < screens.length ? 1 - Math.min(1, Math.max(0, (Math.abs(position - index - 1) - 0.08) / 0.3)) : 0;
      return { position, index, focus };
    },
    render(view: Float32Array, projection: Float32Array, camera: Vec3, time: number,
      presence: number, hue: number, position: number, fovY: number, aspect: number) {
      const delta = lastTime < 0 ? 1 / 60 : Math.min(0.05, Math.max(0, time - lastTime));
      lastTime = time;
      // Decode only near the camera; pause everything else.
      for (let i = 0; i < screens.length; i++) {
        const s = screens[i];
        const want = presence > 0.05 && !reduced && Math.abs(position - (i + 1)) < 1.15;
        if (want && !s.video) startVideo(s);
        if (want && !s.playing && s.video) {
          s.playing = true;
          s.video.play().catch(() => { s.playing = false; });
        } else if (!want && s.playing && s.video) {
          s.playing = false;
          s.video.pause();
        }
        // Upload only when the decoder has moved on to a new frame.
        if (s.playing && s.video && s.video.readyState >= 2 && s.video.currentTime !== s.shown) {
          s.shown = s.video.currentTime;
          upload(s.texture, s.video);
        }
      }
      const clicked = pointer.clicked;
      pointer.clicked = false;
      if (presence < 0.01) return;
      // The pointer's ray, from the camera's basis in the view matrix.
      const tanV = Math.tan(fovY / 2);
      const rx = pointer.x * tanV * aspect, ry = pointer.y * tanV;
      const ray = [view[0] * rx + view[1] * ry - view[2], view[4] * rx + view[5] * ry - view[6], view[8] * rx + view[9] * ry - view[10]];
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      const zFocus = camera[2] - VIEW;
      // Far to near, so nearer light blends over the holograms behind it.
      for (let i = screens.length - 1; i >= 0; i--) {
        const s = screens[i];
        const z = zFocus - (i + 1 - position) * SPACING;
        if (z > camera[2] - 0.4 || z < -95) continue;
        const away = Math.abs(position - (i + 1));
        const raw = 1 - Math.min(1, Math.max(0, (away - 0.2) / 0.75));
        const appear = raw * raw * (3 - 2 * raw);
        if (appear < 0.002) continue;
        const p = place(s, fovY, aspect);
        const near = 1 - Math.min(1, away / 0.6);
        const focus = near * near * (3 - 2 * near);
        const cy = 0.06 + Math.sin(time * 0.5 + i) * 0.04;
        const cyaw = Math.cos(p.yaw), syaw = Math.sin(p.yaw);

        // Where the pointer meets this hologram's plane, in picture uv.
        let over = false;
        const denom = ray[0] * syaw + ray[2] * cyaw;
        if (pointer.on && appear > 0.5 && Math.abs(denom) > 1e-4) {
          const t = ((p.x - camera[0]) * syaw + (z - camera[2]) * cyaw) / denom;
          if (t > 0) {
            const dx = camera[0] + ray[0] * t - p.x, dy = camera[1] + ray[1] * t - cy, dz = camera[2] + ray[2] * t - z;
            const u = (dx * cyaw - dz * syaw) / p.w + 0.5, v = dy / p.h + 0.5;
            over = u > -0.08 && u < 1.08 && v > -0.08 && v < 1.08;
            if (over) {
              s.hit = [u, v];
              if (clicked) s.clickAt = time;
            }
          }
        }
        const k = Math.min(1, delta * 5);
        s.over += ((over ? 1 : 0) - s.over) * k;
        s.tilt[0] += ((over ? (s.hit[0] - 0.5) * 0.35 : 0) - s.tilt[0]) * k;
        s.tilt[1] += ((over ? (s.hit[1] - 0.5) * 0.3 : 0) - s.tilt[1]) * k;
        const burstAge = time - s.clickAt;
        const burst = burstAge < 1.5 ? Math.exp(-burstAge * 3.2) : 0;

        // The picture: veil behind, then two ghosts and the picture's light.
        gl.useProgram(picture.program);
        const u = picture.u;
        gl.uniformMatrix4fv(u.view, false, view);
        gl.uniformMatrix4fv(u.projection, false, projection);
        gl.uniform1f(u.presence, presence);
        gl.uniform1f(u.hue, hue);
        gl.uniform1f(u.time, time);
        gl.uniform1i(u.picture, 12);
        gl.uniform3f(u.centre, p.x, cy, z);
        gl.uniform2f(u.size, p.w, p.h);
        gl.uniform1f(u.yaw, p.yaw);
        gl.uniform2f(u.tilt, s.tilt[0], s.tilt[1]);
        gl.uniform1f(u.side, s.side);
        gl.uniform1f(u.appear, appear);
        gl.uniform1f(u.focus, focus);
        gl.uniform3f(u.cursor, s.hit[0], s.hit[1], s.over);
        gl.uniform1f(u.burst, burst);
        gl.uniform1f(u.burstAge, burstAge);
        gl.activeTexture(gl.TEXTURE12);
        gl.bindTexture(gl.TEXTURE_2D, s.texture);
        gl.bindVertexArray(quadVao);
        // Ghosts first, so the veil hides them behind the picture and they
        // show only where the turn parts them from it.
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
        gl.uniform1f(u.pass, 1);
        for (const layer of [2, 1]) {
          gl.uniform1f(u.layer, layer);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.uniform1f(u.pass, 0);
        gl.uniform1f(u.layer, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
        gl.uniform1f(u.pass, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // The fan: from a slit in the wall, behind the picture, to its
        // unfolded part; and the dust drifting through it.
        const reach = Math.min(1, appear * 1.15);
        const corner = (fx: number, fy: number): Vec3 => {
          const lx = (fx - 0.5) * p.w;
          return [p.x + lx * cyaw, cy + (fy - 0.5) * p.h, z - lx * syaw];
        };
        const wallEdge = s.side > 0 ? 1 : 0;
        const freeEdge = wallEdge + (1 - 2 * wallEdge) * reach;
        const slitZ = z - p.w * 0.55;
        const sTop: Vec3 = [s.side * WALL_FACE, cy + p.h * 0.05, slitZ];
        const sBot: Vec3 = [s.side * WALL_FACE, cy - p.h * 0.05, slitZ];
        const A = corner(wallEdge, 1), B = corner(freeEdge, 1), C = corner(wallEdge, 0), D = corner(freeEdge, 0);
        const tris: Vec3[][] = [[sTop, A, B], [sBot, C, D], [sTop, B, D], [sBot, B, D], [sTop, A, C], [sBot, A, C], [sTop, sBot, B], [sTop, sBot, D]];
        let o = 0;
        for (const t of tris) for (const v of t) {
          fanData.set([v[0], v[1], v[2], v === sTop || v === sBot ? 0 : 1], o);
          o += 4;
        }
        const strength = presence * Math.min(1, appear * 3) * (1.2 - 1.0 * focus) * (1 + s.over * 0.25 + burst * 1.2);
        gl.useProgram(fan.program);
        gl.uniformMatrix4fv(fan.u.view, false, view);
        gl.uniformMatrix4fv(fan.u.projection, false, projection);
        gl.uniform1f(fan.u.hue, hue);
        gl.uniform1f(fan.u.time, time + i);
        gl.uniform1f(fan.u.strength, strength);
        gl.bindVertexArray(fanVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, fanBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, fanData);
        gl.drawArrays(gl.TRIANGLES, 0, 24);
        gl.useProgram(motes.program);
        gl.uniformMatrix4fv(motes.u.view, false, view);
        gl.uniformMatrix4fv(motes.u.projection, false, projection);
        gl.uniform3fv(motes.u.slit, [...sTop, ...sBot]);
        gl.uniform3fv(motes.u.quad, [...A, ...B, ...C, ...D]);
        gl.uniform1f(motes.u.time, time + i * 7);
        gl.uniform1f(motes.u.hue, hue);
        gl.uniform1f(motes.u.viewportH, gl.drawingBufferHeight);
        gl.uniform1f(motes.u.strength, strength);
        gl.bindVertexArray(moteVao);
        gl.drawArrays(gl.POINTS, 0, MOTES);
      }
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(null);
    },
    dispose() {
      disposed = true;
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      for (const s of screens) {
        s.video?.pause();
        s.video?.removeAttribute("src");
        s.video?.load();
        gl.deleteTexture(s.texture);
      }
      for (const b of [quadBuffer, fanBuffer, moteBuffer]) gl.deleteBuffer(b);
      for (const v of [quadVao, fanVao, moteVao]) gl.deleteVertexArray(v);
      for (const sh of [picture, fan, motes]) gl.deleteProgram(sh.program);
    },
  };
}
