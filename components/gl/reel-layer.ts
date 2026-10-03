// The showreel inside the voxel tunnel: one screen per film, set along the
// corridor and alternating sides. The reel advances by stops (see reelStops):
// at every stop the flight hangs in front of a screen, which faces the
// camera at a comfortable viewing distance, sized to the frame (half the
// height on desktop, about half the width on phones) and kept clear of the
// walls. Screens are bezelled in the tunnel's current light, come out of the
// corridor's haze as they approach and brighten in focus. A screen shows its
// poster until its clip is near; only the clips within a stop of the camera
// are decoded and uploaded, and with reduced motion only posters are shown.
import type { ReelItem } from "@/content/reel";

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 corner;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 centre;
uniform vec2 size; // screen size including the bezel
uniform float yaw;
out vec2 vLocal;
out float vDepth;
void main() {
  vec2 p=corner*size;
  vec3 world=centre+vec3(p.x*cos(yaw),p.y,-p.x*sin(yaw));
  vLocal=p;
  vec4 v=view*vec4(world,1.0);
  vDepth=-v.z;
  gl_Position=projection*v;
}`;

const fragment = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vLocal;
in float vDepth;
uniform sampler2D picture;
uniform vec2 screen; // picture size (world units)
uniform float bezel;
uniform float presence;
uniform float focus;
uniform float hue;
uniform float time;
out vec4 color;
vec3 palette(float t,float s) {
  vec3 teal=vec3(.1,1.0,.85), lime=vec3(.75,1.0,.25), pink=vec3(1.0,.25,.6), red=vec3(1.0,.2,.25), blue=vec3(.35,.55,1.0);
  vec3 a=mix(teal,lime,step(.55,s));
  vec3 b=mix(pink,red,step(.6,s));
  vec3 c=mix(a,b,smoothstep(.35,.7,t));
  return mix(c,blue,smoothstep(.85,1.0,t)*step(.5,s));
}
float box(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
void main() {
  vec3 tint=palette(hue,.3);
  vec2 half_=screen*.5;
  float outer=box(vLocal,half_+bezel,bezel*1.2);
  if(outer>0.0) discard;
  float inner=box(vLocal,half_,bezel*.5);
  vec2 uv=vLocal/screen+.5;
  uv.y=1.0-uv.y;
  // A touch of contrast against the post pass's bloom and haze.
  vec3 pic=pow(texture(picture,uv).rgb,vec3(1.18));
  // Fine scan lines and a soft vignette keep it a screen in the corridor.
  float scan=.94+.06*sin(vLocal.y*420.0);
  vec2 e=abs(uv-.5)*2.0;
  float vignette=1.0-.35*pow(max(e.x,e.y),3.0);
  vec3 c=pic*scan*vignette*(.5+.42*focus);
  // Bezel: dark metal with a lit inner edge and a travelling glint.
  float rim=smoothstep(.006,0.0,abs(inner));
  float glint=exp(-pow(fract((vLocal.x+vLocal.y)*.18-time*.25)*2.0-1.0,2.0)*40.0);
  vec3 frame=vec3(.03,.04,.05)+tint*(.25+.75*focus)*(rim*1.4+glint*.35);
  c=inner>0.0?frame:c+tint*rim*.6;
  // Aerial perspective, as on the walls: the screens surface from the haze.
  float fog=exp(-max(vDepth-6.0,0.0)*.03);
  float near=smoothstep(.4,2.0,vDepth);
  color=vec4(mix(tint*.16,c,fog)*near*presence,1.0);
}`;

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

export function createReelLayer(gl: WebGL2RenderingContext, mobile: boolean, items: ReelItem[]) {
  const program = gl.createProgram();
  if (!program) throw new Error("Reel program allocation failed");
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Reel shader allocation failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Reel shader failed");
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Reel link failed");
  const u = Object.fromEntries(["view", "projection", "centre", "size", "yaw", "picture", "screen", "bezel", "presence", "focus", "hue", "time"]
    .map((n) => [n, gl.getUniformLocation(program, n)]));

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Same corridor as the tunnel layer (half-width 3.4).
  const WALL = 3.4;
  const SPACING = 16;
  const VIEW = mobile ? 8.5 : 6.2;
  type Screen = {
    item: ReelItem;
    texture: WebGLTexture;
    video: HTMLVideoElement | null;
    shown: number;
    playing: boolean;
    side: number;
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
    return { item, texture, video: null, shown: -1, playing: false, side: i % 2 ? 1 : -1 };
  });
  let disposed = false;
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

  // Where each screen hangs when it is in focus, for the current frame.
  const place = (s: Screen, fovY: number, aspect: number) => {
    const tanV = Math.tan(fovY / 2);
    const hw = tanV * aspect * VIEW, hh = tanV * VIEW;
    const a = s.item.aspect;
    let h = Math.min(0.95 * hh, ((mobile || aspect < 1 ? 1.05 : 0.6) * hw) / a);
    let w = h * a;
    const wallRoom = WALL - 0.6 - w * 0.48;
    let x = Math.min(wallRoom, hw - w / 2 - 0.06 * hw);
    if (x < 0) {
      // Very narrow frames: shrink rather than cross the flight line.
      const k = Math.max(0.5, (hw * 0.94) / w);
      w *= k;
      h *= k;
      x = Math.max(0, hw - w / 2 - 0.06 * hw);
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
    render(view: Float32Array, projection: Float32Array, camera: [number, number, number], time: number,
      presence: number, hue: number, position: number, fovY: number, aspect: number) {
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
      if (presence < 0.01) return;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.uniformMatrix4fv(u.view, false, view);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform1f(u.presence, presence);
      gl.uniform1f(u.hue, hue);
      gl.uniform1f(u.time, time);
      gl.uniform1i(u.picture, 12);
      gl.activeTexture(gl.TEXTURE12);
      const zFocus = camera[2] - VIEW;
      for (let i = 0; i < screens.length; i++) {
        const s = screens[i];
        const z = zFocus - (i + 1 - position) * SPACING;
        if (z > camera[2] - 0.4 || z < -95) continue;
        const p = place(s, fovY, aspect);
        const bezel = Math.max(p.w, p.h) * 0.018;
        const near = 1 - Math.min(1, Math.abs(position - (i + 1)) / 0.6);
        gl.uniform3f(u.centre, p.x, 0.06 + Math.sin(time * 0.5 + i) * 0.04, z);
        gl.uniform2f(u.size, p.w + bezel * 2, p.h + bezel * 2);
        gl.uniform2f(u.screen, p.w, p.h);
        gl.uniform1f(u.bezel, bezel);
        gl.uniform1f(u.yaw, p.yaw);
        gl.uniform1f(u.focus, near * near * (3 - 2 * near));
        gl.bindTexture(gl.TEXTURE_2D, s.texture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.bindVertexArray(null);
    },
    dispose() {
      disposed = true;
      for (const s of screens) {
        s.video?.pause();
        s.video?.removeAttribute("src");
        s.video?.load();
        gl.deleteTexture(s.texture);
      }
      gl.deleteBuffer(quad);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
