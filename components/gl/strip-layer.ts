// The film strip between the hero and the X: the vertical brand films side
// by side round the inside of a drum, seen from its axis through a wide
// lens, so the film ahead is clearest while the band swings out toward the
// sides, a little taller, smeared and breaking into a cloud of grains. The band is
// never still: a slow wave runs along it and its edges ripple.
// The bird builds it: as it slides in, the bird comes apart grain by grain,
// each grain leaving its own point on the bird's skin for its place on the
// band, and only then does the picture settle under them. The scroll turns the drum film by film
// (three shots each). At its end the picture breaks back into grains, which
// pour into the shape of the X where the X then gathers.
// A panel shows its poster until it turns into view; only the clips in view
// are decoded and uploaded, and with reduced motion only posters are shown.
import { STRIP_SHOTS, type StripFilm } from "@/content/strip";
import { buildProgram } from "./program";

// The band: a panel's uv to its place on the drum (camera space).
const drum = /* glsl */ `
uniform vec3 centre;
uniform float radius;
uniform float height;
uniform float start; // panel's left edge, radians from straight ahead
uniform float arc;
uniform float time;
uniform vec2 tilt; // about x, about y
vec3 turn(vec3 p){
  float cx=cos(tilt.x), sx=sin(tilt.x), cy=cos(tilt.y), sy=sin(tilt.y);
  p=vec3(p.x, p.y*cx-p.z*sx, p.y*sx+p.z*cx);
  return vec3(p.x*cy+p.z*sy, p.y, -p.x*sy+p.z*cy);
}
vec3 band(vec2 uv){
  float a=start+uv.x*arc;
  // Toward the sides the band grows taller and its wave stronger.
  float bend=smoothstep(.2,1.15,abs(a));
  float v=uv.y*2.0-1.0;
  // The sides come closer to the camera; their height is held back with
  // the distance, so they swell only a little.
  float back=-centre.z;
  float h=height*mix(1.0,(back+cos(a))/(back+radius),.78)*(1.0+bend*.28);
  float wave=sin(a*2.6-time*.7)*.045+sin(a*5.3+time*1.1+v*.8)*.022*v;
  float y=v*.5*h+wave*(.5+bend);
  return centre+turn(vec3(radius*sin(a),y,-radius*cos(a)));
}`;

const meshVertex = `#version 300 es
precision highp float;
layout(location=0) in vec2 uv;
uniform mat4 projection;
${drum}
out vec2 vUv;
out vec3 vView;
void main(){
  vUv=uv;
  vec3 p=band(uv);
  vView=p;
  gl_Position=projection*vec4(p,1.0);
}`;

const meshFragment = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec3 vView;
uniform sampler2D picture;
uniform vec2 resolution;
uniform float time;
uniform float solid;
out vec4 color;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){
  // The picture holds the middle; toward the sides it smears sideways,
  // softens and gives way to the grains.
  vec2 ndc=gl_FragCoord.xy/resolution*2.0-1.0;
  float side=smoothstep(.12,.95,abs(ndc.x));
  float lod=side*5.0;
  vec2 tuv=vec2(vUv.x,1.0-vUv.y);
  vec3 pic=vec3(0.0);
  float spread=side*.08;
  for(int i=-3;i<=3;i++){
    float k=float(i)/3.0;
    pic+=texture(picture,tuv+vec2(k*spread,0.0),lod).rgb*(1.0-abs(k)*.4);
  }
  pic/=4.6;
  float grain=h21(gl_FragCoord.xy+fract(time*7.3)*91.0)-.5;
  pic*=1.0-side*.35;
  pic+=grain*(.03+side*.16);
  // A hairline seam between shots.
  pic*=mix(.35,1.0,smoothstep(0.0,.006,min(vUv.x,1.0-vUv.x)));
  // Stippled fade into the grain cloud at the sides.
  float keep=1.0-smoothstep(.55,.98,abs(ndc.x))*.85;
  float a=solid*smoothstep(.12,.45,-vView.z);
  if(h21(gl_FragCoord.xy*.71+floor(time*24.0))>keep) a=0.0;
  color=vec4(pic*a,a);
}`;

const pointVertex = `#version 300 es
precision highp float;
precision highp sampler2D;
layout(location=0) in vec2 uv;
layout(location=1) in vec4 seed;
uniform mat4 projection;
uniform sampler2D picture;
uniform float enter; // 0 → 1: grains fly in from the bird and the swarm
uniform float settle; // the picture under them
uniform float leave; // 0 → 1: grains pour into the X
uniform vec2 bird; // NDC, where the bird is when its shape is not loaded
uniform sampler2D birdPositions; // the baked bird: 16 flap frames, 5 rows each
uniform mat4 birdMatrix;
uniform mat4 stageViewProj;
uniform float birdFrame;
uniform float birdShape;
uniform vec2 xCentre; // NDC, and the X's unit axes in NDC
uniform vec2 xAxisX;
uniform vec2 xAxisY;
uniform float aspect;
uniform float pointScale;
${drum}
out vec3 vColor;
out float vAlpha;
float ease(float x){x=clamp(x,0.0,1.0);return x*x*(3.0-2.0*x);}
void main(){
  vec3 p=band(uv);
  vec4 clip=projection*vec4(p,1.0);
  vec2 home=clip.xy/max(clip.w,1e-3);
  float side=smoothstep(.18,.98,abs(home.x));
  // The grain cloud at the sides: grains drift off the band and billow up
  // and down past its edges.
  float t=time*(.35+seed.z*.4);
  vec2 drift=vec2(sin(t+seed.x*40.0),cos(t*1.3+seed.y*40.0));
  home+=drift*vec2(.02,.03)*side*side+vec2(0.0,(uv.y-.5)*.12*side*side*(.6+seed.w*.8));
  vec2 tuv=vec2(uv.x,1.0-uv.y);
  vec3 pic=textureLod(picture,tuv,1.0+side*4.5).rgb;
  // In: every grain starts on a point of the bird's skin, flapping with
  // it, and leaves it at its own moment, swirling on the way.
  float k=0.0;
  vec2 from;
  if(birdShape>.5){
    int i=int(fract(seed.x*7.31+seed.y*3.17+seed.w*1.93)*9000.0);
    ivec2 c=ivec2(i%2048,i/2048);
    int f=int(floor(birdFrame))%16;
    vec3 a=texelFetch(birdPositions,ivec2(c.x,f*5+c.y),0).xyz;
    vec3 b=texelFetch(birdPositions,ivec2(c.x,((f+1)%16)*5+c.y),0).xyz;
    vec4 bc=stageViewProj*birdMatrix*vec4(mix(a,b,fract(birdFrame)),1.0);
    from=bc.xy/max(bc.w,1e-3)+(seed.zw-.5)*.004;
  } else {
    float r=sqrt(seed.z)*.16, ang=seed.w*6.2832;
    from=bird+vec2(cos(ang)*r/aspect,sin(ang)*r);
  }
  // The band unrolls out of the bird: the nearer a grain's place on the
  // band, the sooner it leaves.
  vec2 path=home-from;
  k=ease((enter-.01-length(path*vec2(aspect,1.0))*.08-seed.x*.1)/.28);
  vec2 pos=from+path*k+vec2(-path.y,path.x)*sin(k*3.1416)*.06*(seed.z-.5);
  // Out: into the X, a grain on one of its two bars.
  float q=ease((leave-.03-seed.x*.3)/.42);
  float bar=seed.y<.5?-1.0:1.0;
  vec2 onBar=vec2((seed.z-.5)*2.3,(seed.w-.5)*.5);
  float ca=cos(bar*.7854), sa=sin(bar*.7854);
  onBar=vec2(onBar.x*ca-onBar.y*sa,onBar.x*sa+onBar.y*ca);
  vec2 onX=xCentre+xAxisX*onBar.x+xAxisY*onBar.y;
  vec2 toX=onX-pos;
  pos=mix(pos,onX,q)+vec2(-toX.y,toX.x)*sin(q*3.1416)*.25*(seed.x-.5);
  // Seen: everywhere while flying, then only at the sides once the picture
  // has settled under them; all of them again as it breaks.
  float steady=smoothstep(.4,.85,abs(home.x))*.65;
  float alpha=mix(1.0,steady,settle*k);
  alpha=max(alpha,smoothstep(0.0,.12,leave));
  alpha*=(1.0-smoothstep(.55,.85,leave))*step(.001,enter);
  alpha*=mix(smoothstep(.1,.4,-p.z),1.0,q)*(1.0-smoothstep(1.25,1.6,abs(start+uv.x*arc)));
  // Bird colours on the bird, the films' once on the band.
  vec3 plumage=mix(mix(vec3(.3,.9,.78),vec3(.62,.95,.45),seed.z),vec3(.66,.52,1.0),smoothstep(.55,1.0,seed.w));
  vColor=mix(mix(plumage,pic,smoothstep(.15,.85,k)),vec3(.62,.64,.68),q*.75);
  vAlpha=alpha;
  gl_Position=vec4(pos,0.0,1.0);
  gl_PointSize=pointScale*(.7+seed.w*.8)*(1.0+side*.6);
}`;

const pointFragment = `#version 300 es
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 color;
void main(){
  float d=length(gl_PointCoord-.5)*2.0;
  float a=smoothstep(1.0,.5,d)*vAlpha;
  if(a<.01) discard;
  color=vec4(vColor*a,a);
}`;

const UNIFORMS = ["projection", "centre", "radius", "height", "start", "arc", "tilt", "picture", "resolution", "time", "solid",
  "enter", "settle", "leave", "bird", "xCentre", "xAxisX", "xAxisY", "aspect", "pointScale",
  "birdPositions", "birdMatrix", "stageViewProj", "birdFrame", "birdShape"];

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
  // Where the bird is, and the X's centre and unit axes, in NDC.
  bird: [number, number];
  // The bird's shape: its baked positions, pose, the stage camera and the
  // flap frame (0..16); null until the bake has loaded.
  birdPositions: WebGLTexture | null;
  birdMatrix: Float32Array;
  stageViewProj: Float32Array;
  birdFrame: number;
  xCentre: [number, number];
  xAxisX: [number, number];
  xAxisY: [number, number];
};

export async function createStripLayer(gl: WebGL2RenderingContext, mobile: boolean, films: StripFilm[]) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [mesh, points] = await Promise.all([
    buildProgram(gl, meshVertex, meshFragment, "Film strip"),
    buildProgram(gl, pointVertex, pointFragment, "Film strip grains"),
  ]);
  const um = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(mesh, n)]));
  const up = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(points, n)]));

  // One curved panel: a ribbon of columns, bent on the drum in the shader.
  const COLUMNS = 24;
  const ribbon: number[] = [];
  for (let i = 0; i < COLUMNS; i++) {
    const a = i / COLUMNS, b = (i + 1) / COLUMNS;
    ribbon.push(a, 0, b, 0, b, 1, a, 0, b, 1, a, 1);
  }
  const meshVao = gl.createVertexArray();
  gl.bindVertexArray(meshVao);
  const meshBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ribbon), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // The grains of one panel (the same set is drawn on every panel): a place
  // on it and four seeds.
  const GRAINS = mobile ? 4500 : 10000;
  let rand = 24681;
  const r = () => ((rand = (rand * 1664525 + 1013904223) >>> 0) / 4294967296);
  const grainData = new Float32Array(GRAINS * 6);
  for (let i = 0; i < GRAINS; i++) grainData.set([r(), r(), r(), r(), r(), r()], i * 6);
  const pointVao = gl.createVertexArray();
  gl.bindVertexArray(pointVao);
  const pointBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, grainData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8);
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
  const RADIUS = 1;
  // Height from the panel's arc, kept at the films' 9:16.
  const HEIGHT = RADIUS * STEP * (16 / 9);
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

  const shared = (u: Record<string, WebGLUniformLocation | null>, f: StripFrame, narrow: boolean) => {
    gl.uniformMatrix4fv(u.projection, false, projection);
    gl.uniform3f(u.centre, 0, narrow ? 0.08 : 0.12, -0.5);
    gl.uniform1f(u.radius, RADIUS);
    gl.uniform1f(u.height, HEIGHT);
    gl.uniform1f(u.arc, STEP);
    gl.uniform2f(u.tilt, tilt[0], tilt[1]);
    gl.uniform1f(u.time, f.time);
    gl.uniform1i(u.picture, 12);
  };

  return {
    prepare,
    // How much the strip holds the screen (for the layers it replaces).
    hold(f: Pick<StripFrame, "enter" | "leave">) {
      return clamp(f.enter * 25) * (1 - clamp((f.leave - 0.45) / 0.35));
    },
    render(f: StripFrame) {
      const delta = lastTime < 0 ? 1 / 60 : Math.min(0.05, Math.max(0, f.time - lastTime));
      lastTime = f.time;
      const present = f.enter > 0.001 && f.leave < 0.999;
      const enter = ease(clamp(f.enter));
      // Straight ahead holds the middle shot of the film; it turns into the
      // first film as the grains arrive.
      const turn = (f.position * STRIP_SHOTS + 1.5) * STEP - (1 - enter) * (1 - enter) * 1.2;
      const narrow = f.aspect < 1;
      perspective((narrow ? 64 : 77) * (Math.PI / 180), f.aspect);
      const k = Math.min(1, delta * 3);
      tilt[0] += (pointer.y * 0.04 - tilt[0]) * k;
      tilt[1] += (-pointer.x * 0.07 - tilt[1]) * k;

      // Decode only the panels turned into view; pause the rest.
      const view = narrow ? 0.75 : 1.4;
      const angles = panels.map((_, i) => {
        let a = (i + 0.5) * STEP - turn;
        a -= Math.round(a / (Math.PI * 2)) * Math.PI * 2;
        return a;
      });
      for (let i = 0; i < count; i++) {
        const p = panels[i];
        const want = present && !reduced && f.leave < 0.4 && Math.abs(angles[i]) < view;
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

      // The picture settles once the grains are in, and breaks as they leave.
      const settle = ease(clamp((f.enter - 0.42) / 0.26));
      const solid = settle * (1 - ease(clamp((f.leave - 0.02) / 0.16)));
      // Far to near: the panels across the drum first; only those in view.
      const order = panels.map((_, i) => i)
        .filter((i) => Math.abs(angles[i]) < (narrow ? 1.0 : 1.6) && panels[i].ready)
        .sort((a, b) => Math.cos(angles[b]) - Math.cos(angles[a]));
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE12);
      if (solid > 0.002) {
        gl.useProgram(mesh);
        gl.bindVertexArray(meshVao);
        shared(um, f, narrow);
        gl.uniform2f(um.resolution, f.width, f.height);
        gl.uniform1f(um.solid, solid);
        for (const i of order) {
          gl.bindTexture(gl.TEXTURE_2D, panels[i].texture);
          gl.uniform1f(um.start, angles[i] - STEP * 0.5);
          gl.drawArrays(gl.TRIANGLES, 0, COLUMNS * 6);
        }
      }
      gl.useProgram(points);
      gl.bindVertexArray(pointVao);
      shared(up, f, narrow);
      gl.uniform1f(up.enter, f.enter);
      gl.uniform1f(up.settle, settle);
      gl.uniform1f(up.leave, f.leave);
      gl.uniform2f(up.bird, f.bird[0], f.bird[1]);
      gl.uniform2f(up.xCentre, f.xCentre[0], f.xCentre[1]);
      gl.uniform2f(up.xAxisX, f.xAxisX[0], f.xAxisX[1]);
      gl.uniform2f(up.xAxisY, f.xAxisY[0], f.xAxisY[1]);
      gl.uniform1f(up.aspect, f.aspect);
      gl.uniform1f(up.pointScale, Math.max(1.5, (f.height / 900) * 2.1));
      gl.uniform1f(up.birdShape, f.birdPositions ? 1 : 0);
      if (f.birdPositions) {
        // The bake stays on unit 0, where the bird layer reads it too.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, f.birdPositions);
        gl.uniform1i(up.birdPositions, 0);
        gl.uniformMatrix4fv(up.birdMatrix, false, f.birdMatrix);
        gl.uniformMatrix4fv(up.stageViewProj, false, f.stageViewProj);
        gl.uniform1f(up.birdFrame, f.birdFrame);
        gl.activeTexture(gl.TEXTURE12);
      }
      for (const i of order) {
        gl.bindTexture(gl.TEXTURE_2D, panels[i].texture);
        gl.uniform1f(up.start, angles[i] - STEP * 0.5);
        gl.drawArrays(gl.POINTS, 0, GRAINS);
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
      gl.deleteBuffer(meshBuffer);
      gl.deleteBuffer(pointBuffer);
      gl.deleteVertexArray(meshVao);
      gl.deleteVertexArray(pointVao);
      gl.deleteProgram(mesh);
      gl.deleteProgram(points);
    },
  };
}
