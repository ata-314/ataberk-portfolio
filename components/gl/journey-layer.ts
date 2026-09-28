// The journey behind the page: one continuous world the camera travels
// through as the visitor scrolls. The bird rises out of the data sea into a
// dawn sky, climbs through banks of data cloud, leaves the atmosphere over
// the planet's limb, and then flies out between galaxies built from data —
// spiral arms of code glyphs, dotted data rings and bright cores.
//
// Drawn first every frame (it replaces the clear), then the sea / bird
// sculpture renders over it. Everything here is procedural: no assets.

// Chapter state the stage derives from scroll each frame (all 0..1).
export type JourneyState = {
  reveal: number; // backdrop presence (fades in as the bird leaves the sea)
  rise: number; // climb through the sky
  space: number; // sky → space blend
  travel: number; // flight through the galaxy field
  galaxies: number; // galaxy field presence
  parallax: [number, number]; // pointer, -1..1
};

const backdropVertex = `#version 300 es
precision highp float;
void main() {
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;

// Sky → planet limb → space. Stars are procedural cells in three layers
// that drift with the climb and the flight; the nebula is a slow fbm wash.
const backdropFragment = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float reveal;
uniform float rise;
uniform float space;
uniform float travel;
uniform vec2 parallax;
out vec4 color;
float hash(vec2 p) {p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p) {
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p) {float s=0.0,a=.5;for(int i=0;i<5;i++){s+=a*vnoise(p);p=p*2.03+17.1;a*=.5;}return s;}
float stars(vec2 p,float scale,float threshold) {
  vec2 g=p*scale;
  vec2 cell=floor(g);
  float h=hash(cell);
  if(h<threshold) return 0.0;
  vec2 c=vec2(hash(cell+3.1),hash(cell+7.7))*.8+.1;
  float d=length(fract(g)-c);
  float twinkle=.6+.4*sin(time*(1.0+h*3.0)+h*40.0);
  return smoothstep(.09,0.0,d)*twinkle*(h-threshold)/(1.0-threshold);
}
void main() {
  vec2 uv=gl_FragCoord.xy/resolution;
  vec2 p=(gl_FragCoord.xy-.5*resolution)/resolution.y;
  // Dawn sky over the sea: deep blue overhead, teal toward the horizon, a
  // lime-cyan light line where the sea meets the sky. As the bird climbs
  // the horizon sinks out of the bottom of the frame.
  float horizon=.08-rise*1.1;
  float above=uv.y-horizon;
  vec3 skyTop=vec3(.012,.03,.075);
  vec3 skyMid=vec3(.03,.11,.19);
  vec3 skyLow=vec3(.08,.27,.34);
  vec3 sky=mix(skyLow,skyMid,smoothstep(0.0,.35,above));
  sky=mix(sky,skyTop,smoothstep(.35,1.1,above));
  sky+=vec3(.55,.95,.7)*exp(-abs(above)*22.0)*.35;
  sky+=vec3(.2,.5,.6)*exp(-max(above,0.0)*3.0)*.25;
  // High haze drifting across the sky.
  float haze=fbm(p*vec2(1.2,3.0)+vec2(time*.012,rise*2.0));
  sky+=vec3(.08,.16,.2)*smoothstep(.45,.9,haze)*(1.0-space);
  // Leaving the atmosphere: the planet's curved limb glows beneath,
  // thinning and sinking as space takes over.
  float limbY=-.62-space*.5;
  float limbR=2.6;
  float limb=length(p-vec2(0.0,limbY-limbR))-limbR;
  vec3 atmosphere=vec3(.25,.75,.95)*exp(-abs(limb)*28.0)*.9+vec3(.05,.2,.32)*exp(-max(limb,0.0)*6.0)*.6;
  float limbShow=smoothstep(.05,.45,space)*(1.0-smoothstep(.7,1.0,space));
  // Space: near-black with a violet / teal nebula that drifts with travel.
  vec2 q=p*1.4+vec2(travel*1.6,travel*.6);
  float n=fbm(q+fbm(q*1.7+time*.01));
  vec3 nebula=mix(vec3(.18,.05,.32),vec3(.03,.28,.34),smoothstep(.3,.8,fbm(q*.7+9.0)));
  vec3 deep=vec3(.003,.005,.014)+nebula*smoothstep(.45,.95,n)*.28;
  vec3 col=mix(sky,deep,space);
  col+=atmosphere*limbShow*step(limb,.4)*(1.0-step(limb,-.001)*.85);
  col=mix(col,vec3(.01,.03,.05),step(limb,0.0)*limbShow);
  // Stars: a few already in the dawn sky, a full field in space, drifting
  // down with the climb and outward with the flight.
  vec2 sp=p+parallax*.015+vec2(0.0,rise*.6);
  float field=stars(sp,90.0,.975)*.9+stars(sp+vec2(travel*.35,0.0),160.0,.982)*.7+stars(sp*1.3-vec2(0.0,travel*.2),260.0,.988)*.55;
  col+=vec3(.85,.93,1.0)*field*mix(smoothstep(.55,1.0,uv.y)*.25,1.0,space);
  color=vec4(col*reveal,1.0);
}`;

// Particles: clouds (soft data dust), galaxies (code glyphs, data rings,
// cores) and space dust streaming past. One program, one kind per draw.
const particleVertex = `#version 300 es
precision highp float;
uniform mat4 projection;
uniform mat4 view;
uniform vec3 eye;
uniform float time;
uniform float kind;
uniform float pixelScale;
uniform float presence;
uniform float perGalaxy;
out vec3 vColor;
out float vAlpha;
out float vGlyph;
out float vSoft;
float h(float n) {return fract(sin(n*12.9898+4.1414)*43758.5453);}
float gauss(float n) {return (h(n)+h(n+.31)+h(n+.73)-1.5)*.9;}
vec3 hue(float t) {return clamp(abs(mod(t*6.0+vec3(0,4,2),6.0)-3.0)-1.0,0.0,1.0);}
mat3 tilt(float a,float b) {
  float ca=cos(a),sa=sin(a),cb=cos(b),sb=sin(b);
  return mat3(1,0,0,0,ca,sa,0,-sa,ca)*mat3(cb,sb,0,-sb,cb,0,0,0,1);
}
void main() {
  float id=float(gl_VertexID);
  vec3 pos;
  vColor=vec3(1);vAlpha=0.0;vGlyph=0.0;vSoft=1.0;
  float size=1.0;
  if(kind<.5) {
    // Cloud banks: flattened clusters of soft data dust stacked through
    // the sky; the camera climbs through them.
    float c=floor(id/220.0);
    vec3 centre=vec3((h(c)-.5)*300.0,10.0+h(c+5.0)*230.0,-14.0-h(c+9.0)*150.0);
    vec3 o=vec3(gauss(id)*26.0*(.6+h(c+2.0)),gauss(id+9.0)*4.5,gauss(id+17.0)*18.0);
    o.x+=sin(time*.05+c)*2.0;
    pos=centre+o;
    float bright=.55+.45*h(id+3.0);
    vColor=mix(vec3(.62,.86,.95),vec3(.85,1.0,.82),h(c+11.0)*.5)*bright;
    vAlpha=.075*presence;
    size=26.0+h(id+5.0)*34.0;
  } else if(kind<1.5) {
    // Galaxies of data: spiral arms of code glyphs around a bright core,
    // with dotted data rings, each tilted, coloured and turning on its own.
    float g=floor(id/perGalaxy);
    float k=id-g*perGalaxy;
    vec3 centre=vec3((h(g+1.0)-.5)*70.0,236.0+(h(g+2.0)-.5)*44.0,-70.0-g*85.0-h(g+3.0)*30.0);
    float radius=16.0+h(g+4.0)*18.0;
    float arms=2.0+floor(h(g+5.0)*3.0);
    float twist=2.2+h(g+6.0)*1.6;
    float spin=time*(.035+h(g+7.0)*.04)*(h(g+8.0)<.5?-1.0:1.0);
    float kindPick=h(k*1.37+g*91.0);
    vec3 local;
    float hueBase=h(g+10.0);
    float t;
    if(kindPick<.12) {
      // Core bulge.
      t=abs(gauss(k))*.18;
      local=vec3(gauss(k+1.0),gauss(k+2.0)*.5,gauss(k+3.0))*radius*.14;
      vColor=mix(vec3(1.0,.95,.85),hue(hueBase)*.6+.4,.3);
    } else if(kindPick<.24) {
      // Data rings: evenly dotted concentric orbits.
      float ring=floor(h(k+4.0)*3.0);
      float r=radius*(.45+ring*.28);
      float a=h(k+5.0)*6.2832+spin*(1.5-ring*.3);
      local=vec3(cos(a)*r,0.0,sin(a)*r);
      t=r/radius;
      vColor=mix(hue(hueBase+.12),vec3(1),.4)*.8;
    } else {
      // Spiral arms of glyphs.
      t=pow(h(k+6.0),.7);
      float arm=floor(h(k+7.0)*arms);
      float a=arm/arms*6.2832+log(1.0+t*6.0)*twist+gauss(k+8.0)*.35*(1.0-t*.5)+spin/(.4+t);
      float r=t*radius;
      local=vec3(cos(a)*r,gauss(k+9.0)*radius*.035,sin(a)*r)+vec3(gauss(k+10.0),0.0,gauss(k+11.0))*radius*.05;
      vColor=mix(hue(hueBase),hue(hueBase+.18),t)*(.75+.5*h(k+12.0));
      vColor=mix(vColor,vec3(1),.25*(1.0-t));
    }
    pos=centre+tilt(.9+h(g+13.0)*.9,h(g+14.0)*6.2832)*local;
    vGlyph=floor(h(k+15.0)*16.0);
    vSoft=kindPick<.12?1.0:0.0;
    vAlpha=presence*(.55+.45*h(k+16.0));
    size=kindPick<.12?9.0:5.5+h(k+17.0)*3.5;
  } else {
    // Space dust: a tube of motes around the flight path that wraps with
    // the camera, so the flight never runs out of passing matter.
    float a=h(id)*6.2832;
    float r=4.0+h(id+1.0)*38.0;
    float z=eye.z-mod(h(id+2.0)*260.0-eye.z*1.0,260.0);
    pos=vec3(eye.x+cos(a)*r,eye.y+sin(a)*r*.7,z);
    vColor=mix(vec3(.6,.8,1.0),vec3(.8,.6,1.0),h(id+3.0));
    vAlpha=presence*.5;
    size=2.0;
  }
  vec4 viewPos=view*vec4(pos,1.0);
  gl_Position=projection*viewPos;
  float dist=-viewPos.z;
  // Fade in from the fog and out right at the lens.
  float fog=1.0-smoothstep(170.0,320.0,dist);
  float near=smoothstep(1.5,7.0,dist);
  vAlpha*=fog*near;
  gl_PointSize=clamp(size*pixelScale*28.0/max(dist,1.0),1.0,kind<.5?140.0:40.0);
  if(dist<.2||vAlpha<.003) gl_Position=vec4(2.0,2.0,2.0,1.0);
}`;

const particleFragment = `#version 300 es
precision highp float;
uniform sampler2D atlas;
in vec3 vColor;
in float vAlpha;
in float vGlyph;
in float vSoft;
out vec4 color;
void main() {
  vec2 pc=gl_PointCoord;
  float a;
  if(vSoft>.5) {
    vec2 d=pc*2.0-1.0;
    a=exp(-dot(d,d)*3.0);
  } else {
    vec2 cell=vec2(mod(vGlyph,4.0),floor(vGlyph/4.0));
    a=texture(atlas,vec2((cell.x+pc.x)/4.0,1.0-(cell.y+pc.y)/4.0)).a;
  }
  a*=vAlpha;
  if(a<.004) discard;
  // Additive light; destination alpha untouched.
  color=vec4(vColor*a,0.0);
}`;

function perspective(out: Float32Array, fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
}

// View looking down -z from the eye, turned slightly by the pointer.
function viewFrom(out: Float32Array, eye: [number, number, number], yaw: number, pitch: number) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  // Camera basis: right, up, back.
  const r = [cy, 0, -sy];
  const u = [sy * sp, cp, cy * sp];
  const b = [sy * cp, -sp, cy * cp];
  out.set([
    r[0], u[0], b[0], 0,
    r[1], u[1], b[1], 0,
    r[2], u[2], b[2], 0,
    -(r[0] * eye[0] + r[1] * eye[1] + r[2] * eye[2]),
    -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]),
    -(b[0] * eye[0] + b[1] * eye[1] + b[2] * eye[2]),
    1,
  ]);
}

export function createJourneyLayer(gl: WebGL2RenderingContext, atlas: WebGLTexture | null, mobile: boolean) {
  const compile = (vertexSource: string, fragmentSource: string) => {
    const program = gl.createProgram();
    if (!program) throw new Error("Journey program allocation failed");
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Journey shader allocation failed");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Journey shader failed");
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Journey link failed");
    return program;
  };
  const backdrop = compile(backdropVertex, backdropFragment);
  const particles = compile(particleVertex, particleFragment);
  const bu = Object.fromEntries(["resolution", "time", "reveal", "rise", "space", "travel", "parallax"].map((n) => [n, gl.getUniformLocation(backdrop, n)]));
  const pu = Object.fromEntries(["projection", "view", "eye", "time", "kind", "pixelScale", "presence", "perGalaxy", "atlas"].map((n) => [n, gl.getUniformLocation(particles, n)]));
  const vao = gl.createVertexArray();
  const projection = new Float32Array(16);
  const view = new Float32Array(16);
  const scale = mobile ? 0.35 : 1;
  const CLOUDS = Math.round(40000 * scale);
  const GALAXIES = 8;
  const PER_GALAXY = Math.round(11000 * scale);
  const DUST = Math.round(5000 * scale);

  return {
    render(w: number, h: number, time: number, state: JourneyState) {
      gl.bindVertexArray(vao);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.useProgram(backdrop);
      gl.uniform2f(bu.resolution, w, h);
      gl.uniform1f(bu.time, time);
      gl.uniform1f(bu.reveal, state.reveal);
      gl.uniform1f(bu.rise, state.rise);
      gl.uniform1f(bu.space, state.space);
      gl.uniform1f(bu.travel, state.travel);
      gl.uniform2f(bu.parallax, state.parallax[0], state.parallax[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (state.reveal < 0.01) return;

      // Camera: climbs through the cloud banks, then flies forward through
      // the galaxy field, weaving gently and leaning with the pointer.
      const eye: [number, number, number] = [
        Math.sin(state.travel * 9.0) * 14 + state.parallax[0] * 1.5,
        state.rise * 236 + Math.sin(state.travel * 6.0) * 6 + state.parallax[1] * 1.0,
        -state.travel * 760,
      ];
      perspective(projection, (60 * Math.PI) / 180, w / Math.max(h, 1), 0.1, 400);
      viewFrom(view, eye, state.parallax[0] * 0.04 + Math.cos(state.travel * 9.0) * 0.12, state.parallax[1] * 0.03);
      gl.useProgram(particles);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
      gl.uniformMatrix4fv(pu.projection, false, projection);
      gl.uniformMatrix4fv(pu.view, false, view);
      gl.uniform3f(pu.eye, eye[0], eye[1], eye[2]);
      gl.uniform1f(pu.time, time);
      gl.uniform1f(pu.pixelScale, h / 900);
      gl.uniform1f(pu.perGalaxy, PER_GALAXY);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(pu.atlas, 3);
      const draw = (kind: number, presence: number, count: number) => {
        if (presence < 0.01) return;
        gl.uniform1f(pu.kind, kind);
        gl.uniform1f(pu.presence, presence * state.reveal);
        gl.drawArrays(gl.POINTS, 0, count);
      };
      draw(0, 1 - state.space, CLOUDS);
      draw(1, state.galaxies, GALAXIES * PER_GALAXY);
      draw(2, state.space, DUST);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    },
    dispose() {
      gl.deleteProgram(backdrop);
      gl.deleteProgram(particles);
      gl.deleteVertexArray(vao);
    },
  };
}
