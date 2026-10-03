// The showreel inside the voxel tunnel: one sheet per film, set along the
// corridor and alternating sides. The reel advances by stops (see reelStops):
// at every stop the flight hangs in front of a sheet, which faces the camera
// at a comfortable viewing distance, sized to the frame (half the height on
// desktop, about half the width on phones) and kept clear of the walls.
// Each sheet is glass worked like paper: thin and bowed, one outer corner
// curling. It answers the flight like paper in the air it pushes: the
// edge toward the flight line is held, and the free outer edge is blown back
// like a sail while a slow, heavy wave runs from the held edge to the free
// one, growing and quickening with speed, the very edge fluttering only at
// a rush. When the reel stops the sheet swings forward past rest on a soft
// spring and its wave dies away over a few seconds. The cursor (or a touch) plays on the glass: moving over a
// sheet presses a soft dent under it and sends rings across the surface in
// proportion to its speed, and a click or tap sends a strong one. The film sits inside the glass, lensed a
// little by its bend; a clear margin shows the tunnel through it; the edge
// is a thin bright line with a colour fringe, and reflections, fresnel and
// a travelling glint follow the sheet's curvature. Sheets surface from the
// corridor's haze and brighten in focus. A sheet shows its poster until its
// clip is near; only the clips within a stop of the camera are decoded and
// uploaded, and with reduced motion only posters are shown.
import type { ReelItem } from "@/content/reel";

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 corner;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 centre;
uniform vec2 size; // sheet size including the clear margin
uniform float yaw;
uniform float curlSide; // which outer corner curls (+1 right, -1 left)
uniform float billow; // signed push of the air from the reel's motion (spring)
uniform float energy; // how much wave is still running through the paper
uniform float phase; // the wave's travel, advanced with the wind
uniform float time;
uniform vec4 ripples[6]; // local xy, start time, strength
uniform vec4 press; // local xy, depth, radius
out vec2 vLocal;
out vec3 vWorld;
out vec3 vNormal;
out float vDepth;
// Out-of-plane lift of the sheet at a local point, in world units.
float lift(vec2 p) {
  vec2 q=p/size;
  float s=max(size.x,size.y);
  float bow=(.25-q.x*q.x)*size.x*.16;
  // Distance from the held (inner) edge to the free (outer) one, 0..1.
  float u=q.x*curlSide+.5;
  float c=smoothstep(.25,.95,u-.5+q.y);
  // Sail: the free edge blown back by the air of the flight.
  float sail=-billow*s*.24*u*u;
  // Flag wave from the held edge to the free one, slightly diagonal.
  float flag=s*(.008+.075*energy)*pow(u,1.4)*sin(6.2832*(u*.85-phase)+q.y*1.6);
  // At a rush, only the very edge flutters.
  float edge=s*.012*min(energy,1.0)*smoothstep(.65,1.0,u)*sin(q.y*9.0-phase*14.0);
  // Rings sent by the cursor: packets running outward and fading.
  float rings=0.0;
  for(int i=0;i<6;i++) {
    vec4 r=ripples[i];
    float age=time-r.z;
    if(r.w<=0.0||age<0.0||age>3.0) continue;
    float d=length(p-r.xy);
    float front=d-age*s*.75;
    rings+=r.w*s*.05*sin(front*30.0/s)*exp(-front*front/(s*s*.025))*exp(-age*1.1);
  }
  float dent=-press.z*s*.07*exp(-dot(p-press.xy,p-press.xy)/(press.w*press.w+1e-4));
  return bow+c*c*s*(.16+.08*min(energy,1.0))+sail+flag+edge+rings+dent;
}
void main() {
  vec2 p=corner*size;
  float e=max(size.x,size.y)*.01;
  float z=lift(p);
  vec3 n=normalize(vec3(-(lift(p+vec2(e,0.0))-lift(p-vec2(e,0.0)))/(2.0*e),-(lift(p+vec2(0.0,e))-lift(p-vec2(0.0,e)))/(2.0*e),1.0));
  float cy=cos(yaw), sy=sin(yaw);
  vec3 world=centre+vec3(p.x*cy+z*sy,p.y,-p.x*sy+z*cy);
  vNormal=vec3(n.x*cy+n.z*sy,n.y,-n.x*sy+n.z*cy);
  vLocal=p;
  vWorld=world;
  vec4 v=view*vec4(world,1.0);
  vDepth=-v.z;
  gl_Position=projection*v;
}`;

const fragment = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vLocal;
in vec3 vWorld;
in vec3 vNormal;
in float vDepth;
uniform sampler2D picture;
uniform vec2 size;
uniform vec2 screen; // picture size (world units)
uniform vec3 eye;
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
  float s=max(size.x,size.y);
  float sheet=box(vLocal,size*.5,s*.012);
  if(sheet>0.0) discard;
  vec3 n=normalize(vNormal);
  vec3 v=normalize(eye-vWorld);
  if(dot(n,v)<0.0) n=-n;
  float facing=max(dot(n,v),0.0);
  float fresnel=pow(1.0-facing,3.0);
  // A fake surround for the reflection: the portal's glow down the corridor
  // and the lit ceiling, both in the tunnel's light.
  vec3 r=reflect(-v,n);
  vec3 env=tint*(smoothstep(.55,1.0,-r.z)*.55+pow(max(r.y,0.0),3.0)*.35)+vec3(1.0)*pow(max(-r.z,0.0),24.0)*.6;
  float glint=exp(-pow(fract((vLocal.x*.7+vLocal.y)/s*.9-time*.16)*2.0-1.0,2.0)*90.0)*(.4+fresnel*2.0);
  // Edge: a thin glass edge with a colour fringe, lit where it turns
  // toward the light rather than drawn as a frame.
  float w=s*.0035;
  vec3 edge=vec3(smoothstep(w*1.6,0.0,abs(sheet+w*.4)),smoothstep(w*1.6,0.0,abs(sheet)),smoothstep(w*1.6,0.0,abs(sheet-w*.4)));
  edge=edge*mix(vec3(1.0),tint,.4)*(.15+fresnel*1.6+glint*1.4)*(.5+.5*focus);
  float inside=box(vLocal,screen*.5,s*.006);
  vec3 c;
  float alpha;
  if(inside<0.0) {
    // The film behind the glass, lensed slightly by the bend.
    vec2 uv=vLocal/screen+.5+n.xy*vec2(-.035,.035);
    uv.y=1.0-uv.y;
    vec3 pic=pow(texture(picture,clamp(uv,0.0,1.0)).rgb,vec3(1.15));
    vec2 e=abs(uv-.5)*2.0;
    pic*=1.0-.25*pow(max(e.x,e.y),4.0);
    c=pic*(.55+.4*focus)*(1.0-fresnel*.45)+env*(.18+fresnel*.6)+vec3(glint)*.35+tint*smoothstep(s*.008,0.0,abs(inside))*.15;
    alpha=1.0;
  } else {
    // Clear margin: frosted, see-through glass catching the light.
    c=tint*.07+env*(.3+fresnel)+vec3(glint)*.5;
    alpha=.2+fresnel*.4+glint*.3;
  }
  c+=edge;
  alpha=max(alpha,max(edge.g,max(edge.r,edge.b)));
  // Aerial perspective, as on the walls: the sheets surface from the haze.
  float fog=exp(-max(vDepth-6.0,0.0)*.03);
  float near=smoothstep(.4,2.0,vDepth);
  float k=near*presence;
  color=vec4(mix(tint*.16*alpha,c,fog)*k,alpha*k);
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
  const u = Object.fromEntries(["view", "projection", "centre", "size", "yaw", "curlSide", "billow", "energy", "phase", "ripples", "press", "picture", "screen", "eye", "presence", "focus", "hue", "time"]
    .map((n) => [n, gl.getUniformLocation(program, n)]));

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  // A finely divided sheet, so it can bend.
  const COLS = 28, ROWS = 40;
  const grid: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const x0 = x / COLS - 0.5, x1 = (x + 1) / COLS - 0.5, y0 = y / ROWS - 0.5, y1 = (y + 1) / ROWS - 0.5;
      grid.push(x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1);
    }
  }
  const vertexCount = grid.length / 2;
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid), gl.STATIC_DRAW);
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
    // Cursor play: recent rings (x, y, start, strength) and the dent.
    ripples: Float32Array;
    nextRipple: number;
    lastSpawn: number;
    press: number;
    hit: [number, number];
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
    return {
      item, texture, video: null, shown: -1, playing: false, side: i % 2 ? 1 : -1,
      ripples: new Float32Array(24), nextRipple: 0, lastSpawn: 0, press: 0, hit: [0, 0] as [number, number],
    };
  });
  let disposed = false;
  // The pointer in NDC, how fast it moves and whether it has just clicked.
  const canvas = gl.canvas as HTMLCanvasElement;
  const pointer = { x: 0, y: 0, on: false, speed: 0, lastX: 0, lastY: 0, lastT: 0, clicked: false };
  const toNdc = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / Math.max(r.width, 1)) * 2 - 1, 1 - ((e.clientY - r.top) / Math.max(r.height, 1)) * 2];
  };
  const onMove = (e: PointerEvent) => {
    const [x, y] = toNdc(e);
    const t = performance.now() / 1000;
    const dt = Math.max(t - pointer.lastT, 1 / 240);
    const v = Math.hypot(x - pointer.lastX, y - pointer.lastY) / dt;
    pointer.speed = pointer.on && dt < 0.2 ? pointer.speed * 0.6 + v * 0.4 : 0;
    pointer.x = pointer.lastX = x;
    pointer.y = pointer.lastY = y;
    pointer.lastT = t;
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
  let billow = 0;
  let billowVel = 0;
  let energy = 0;
  let phase = 0;
  let lastTime = -1;
  const spawn = (s: Screen, x: number, y: number, time: number, strength: number) => {
    s.ripples.set([x, y, time, strength], s.nextRipple * 4);
    s.nextRipple = (s.nextRipple + 1) % 6;
    s.lastSpawn = time;
  };
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
    // Room for the clear glass margin and the curling corner too.
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
    render(view: Float32Array, projection: Float32Array, camera: [number, number, number], time: number,
      presence: number, hue: number, position: number, fovY: number, aspect: number, velocity: number) {
      // Air: a spring pulled by the reel's signed speed, so the sheets
      // billow while it rushes and swing back past rest when it stops.
      const delta = lastTime < 0 ? 1 / 60 : Math.min(0.05, Math.max(0, time - lastTime));
      lastTime = time;
      // Heavy and soft: low stiffness, light damping, so it swings once past
      // rest and settles. The wave's energy rises with the wind and dies
      // slowly; its travel advances with it, so speed never jumps the phase.
      const wind = Math.min(1.3, Math.abs(velocity) / 28);
      const pull = Math.sign(velocity) * wind;
      billowVel += ((pull - billow) * 14 - billowVel * 3.2) * delta;
      billow += billowVel * delta;
      energy = Math.max(energy * Math.exp(-delta * 0.9), energy + (wind - energy) * Math.min(1, delta * 3));
      phase += delta * (0.22 + energy * 0.9);
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
      // Premultiplied glass over the tunnel; colour only, the target's alpha is kept.
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.uniformMatrix4fv(u.view, false, view);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform1f(u.presence, presence);
      gl.uniform1f(u.hue, hue);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.billow, billow);
      gl.uniform1f(u.energy, energy);
      gl.uniform1f(u.phase, phase);
      // The pointer's ray, from the camera's basis in the view matrix.
      const tanV = Math.tan(fovY / 2);
      const rx = pointer.x * tanV * aspect, ry = pointer.y * tanV;
      const ray = [view[0] * rx + view[1] * ry - view[2], view[4] * rx + view[5] * ry - view[6], view[8] * rx + view[9] * ry - view[10]];
      const clicked = pointer.clicked;
      pointer.clicked = false;
      gl.uniform3f(u.eye, camera[0], camera[1], camera[2]);
      gl.uniform1i(u.picture, 12);
      gl.activeTexture(gl.TEXTURE12);
      const zFocus = camera[2] - VIEW;
      // Far to near, so nearer glass blends over the sheets behind it.
      for (let i = screens.length - 1; i >= 0; i--) {
        const s = screens[i];
        const z = zFocus - (i + 1 - position) * SPACING;
        if (z > camera[2] - 0.4 || z < -95) continue;
        const p = place(s, fovY, aspect);
        const margin = Math.max(p.w, p.h) * 0.045;
        const near = 1 - Math.min(1, Math.abs(position - (i + 1)) / 0.6);
        gl.uniform3f(u.centre, p.x, 0.06 + Math.sin(time * 0.5 + i) * 0.04, z);
        gl.uniform2f(u.size, p.w + margin * 2, p.h + margin * 2);
        gl.uniform2f(u.screen, p.w, p.h);
        gl.uniform1f(u.yaw, p.yaw);
        gl.uniform1f(u.curlSide, s.side);
        gl.uniform1f(u.focus, near * near * (3 - 2 * near));
        // Where the pointer meets this sheet (its flat plane is enough).
        const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
        const cyc = 0.06 + Math.sin(time * 0.5 + i) * 0.04;
        const denom = ray[0] * sy + ray[2] * cy;
        let over = false;
        if (pointer.on && Math.abs(denom) > 1e-4) {
          const t = ((p.x - camera[0]) * sy + (z - camera[2]) * cy) / denom;
          if (t > 0) {
            const dx = camera[0] + ray[0] * t - p.x, dy = camera[1] + ray[1] * t - cyc, dz = camera[2] + ray[2] * t - z;
            const lx = dx * cy - dz * sy;
            over = Math.abs(lx) < p.w / 2 + margin && Math.abs(dy) < p.h / 2 + margin;
            if (over) {
              s.hit = [lx, dy];
              const strength = Math.min(1, pointer.speed * 0.35);
              if (clicked) spawn(s, lx, dy, time, 1.6);
              else if (strength > 0.08 && time - s.lastSpawn > 0.09) spawn(s, lx, dy, time, strength);
            }
          }
        }
        s.press += ((over ? 1 : 0) - s.press) * Math.min(1, delta * 6);
        gl.uniform4fv(u.ripples, s.ripples);
        gl.uniform4f(u.press, s.hit[0], s.hit[1], s.press, Math.max(p.w, p.h) * 0.16);
        gl.bindTexture(gl.TEXTURE_2D, s.texture);
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      }
      pointer.speed *= Math.exp(-delta * 4);
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
      gl.deleteBuffer(quad);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
