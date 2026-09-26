// The evolving sculpture is sampled directly into independent GPU points.
// Empty space between luminous grains remains black; there is no solid skin.
const vertex = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform vec2 grid;
uniform vec2 pointer;
uniform float time;
uniform float activity;
uniform float opacity;
uniform float pixelScale;
out vec3 tint;
out float alpha;
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(.11,.27,.43));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x+p.y+p.z));
}
float noise(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
    mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
    mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float smin(float a,float b,float k) {
  float h=clamp(.5+.5*(b-a)/k,0.0,1.0);
  return mix(b,a,h)-k*h*(1.0-h);
}
float shape(vec3 p) {
  float t=time*.24;
  vec3 q=p;
  q.x += .20*sin(p.y*1.3+t*.7)+.12*sin(p.z*2.0-t);
  q.y += .34*sin(p.x*1.4-t*.8);
  q.z += .24*sin(p.y*1.5+p.x*.7+t*.6);
  // Large lobes rise, lean and merge; no repeating sheet or uniform wave.
  float d=length((q-vec3(.1,-.8,0))/vec3(1.8,.95,1.0))-.98;
  d=smin(d,length(q-vec3(-1.15,.15,.0))-.98,.65);
  d=smin(d,length((q-vec3(.75,.4,.1))/vec3(.92,1.4,1.0))-.92,.58);
  d=smin(d,length(q-vec3(-.2+.22*sin(t*.8),1.45+.18*sin(t*.6),-.4))-.8,.55);
  d=smin(d,length(q-vec3(1.65,-.2,-.3))-.85,.55);
  vec3 flow=q*1.65+vec3(t*.24,-t*.38,t*.12);
  float n=noise(flow);
  // Nested folds deform the actual surface, so foreground ridges hide
  // recessed matter and catch the key light on their lip.
  float fold=sin(q.y*5.1 + q.x*2.4 + n*8.0 + t);
  float fine=noise(flow*3.1+vec3(n*2.0));
  float sediment=noise(flow*8.0+fine*2.0);
  d += fold*.14 + (n-.5)*.43 + (fine-.5)*.19 + (sediment-.5)*.055;
  float touch=exp(-dot(p.xy-pointer,p.xy-pointer)*1.5)*activity;
  d -= touch*.15*sin(p.y*4.0+p.x*2.0-t*3.0);
  return d;
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(.006,0);
  return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),
    shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));
}

void main() {
  float id=float(gl_VertexID);
  float seed=hash(vec3(id,.7,3.1));
  vec2 cell=vec2(mod(id,grid.x),floor(id/grid.x));
  vec2 jitter=vec2(hash(vec3(id,4.1,2.0)),hash(vec3(id,7.3,1.0)))-.5;
  vec2 screen=((cell+.5+jitter*.95)/grid)*2.0-1.0;
  float aspect=resolution.x/resolution.y;
  vec3 ro=vec3(0,.15,7.8);
  vec3 rd=normalize(vec3(screen.x*aspect*2.7,screen.y*2.7,-7.0));
  float spread=max(1.0,aspect*.85);
  float distance=3.0;
  vec3 p=ro;
  bool hit=false;
  for(int i=0;i<76;i++) {
    p=ro+rd*distance;
    float d=shape(vec3(p.x/spread,p.y,p.z));
    if(d<.009) {hit=true;break;}
    distance+=max(d*.48,.006);
    if(distance>12.0) break;
  }
  tint=vec3(0); alpha=0.0; gl_PointSize=1.0;
  gl_Position=vec4(2.0,2.0,2.0,1.0);
  if(!hit) return;
  vec3 local=vec3(p.x/spread,p.y,p.z);
  vec3 n=normalAt(local);
  float light=max(dot(n,normalize(vec3(-.65,.9,1.3))),0.0);
  float rim=pow(1.0-abs(dot(n,-rd)),2.0);
  float region=noise(local*.85+vec3(0,-time*.03,time*.01));
  float band=sin(local.y*1.3-local.x*.8+region*5.0+time*.035);
  vec3 blue=vec3(.035,.23,1.0);
  vec3 cyan=vec3(.03,.9,1.0);
  vec3 violet=vec3(.57,.10,1.0);
  tint=mix(violet,blue,smoothstep(-.7,.1,band));
  tint=mix(tint,cyan,smoothstep(.05,.7,band));
  tint=mix(tint,vec3(.65,.94,1.0),pow(light,5.0)*.35);
  // A narrow moving current carries energy across the form. Every grain
  // has its own phase, depth and size, so the cloud never becomes a mesh.
  float pulse=pow(.5+.5*sin(local.y*3.0-local.x*1.8-time*1.4),14.0);
  float loose=step(.94,seed);
  float drift=.018+loose*.18;
  p+=vec3(sin(time*.35+id*.73),cos(time*.29+id*.51),sin(time*.4+id*.31))*drift;
  p+=vec3(n.x*spread,n.y,n.z)*(seed-.5)*.12;
  vec3 view=p-ro;
  gl_Position=vec4(view.x/(aspect*2.7/7.0),view.y/(2.7/7.0),0.0,-view.z);
  gl_PointSize=clamp((2.2+seed*1.5+rim*.65)*pixelScale*7.0/(-view.z),1.0,7.0*pixelScale);
  alpha=(.6+.65*light+.3*rim+pulse*.3)*opacity;
  alpha*=mix(.48,1.0,smoothstep(-.95,.45,screen.y));
  alpha*=.85+.15*sin(time*.5+seed*30.0);
  tint+=cyan*pulse*.25;
}`;
const fragment = `#version 300 es
precision highp float;
in vec3 tint;
in float alpha;
out vec4 color;
void main() {
  vec2 p=gl_PointCoord-.5;
  float r=length(p);
  if(r>.5 || alpha<.005) discard;
  float core=1.0-smoothstep(.08,.34,r);
  float halo=exp(-r*r*16.0)*.2;
  color=vec4(tint*1.3,(core+halo)*alpha);
}`;

export function createSculptureLayer(gl: WebGL2RenderingContext, mobile: boolean) {
  const program=gl.createProgram();
  if(!program) throw new Error("Particle sculpture allocation failed");
  const shaders: WebGLShader[]=[];
  try {
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const) {
      const shader=gl.createShader(type);
      if(!shader) throw new Error("Particle shader allocation failed");
      shaders.push(shader); gl.shaderSource(shader,source); gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Particle shader failed");
      gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Particle link failed");
  } catch(error) {gl.deleteProgram(program);throw error;}
  finally {shaders.forEach(shader=>gl.deleteShader(shader));}
  const vao=gl.createVertexArray();
  const uniforms=Object.fromEntries(["resolution","grid","pointer","time","activity","opacity","pixelScale"].map(name=>[name,gl.getUniformLocation(program,name)]));
  return {
    render(w: number,h: number,time: number,opacity: number,px: number,py: number,activity: number) {
      if(opacity<.002) return;
      const count=mobile?36000:110000;
      const columns=Math.round(Math.sqrt(count*w/h));
      const rows=Math.ceil(count/columns);
      gl.bindVertexArray(vao); gl.useProgram(program);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
      gl.uniform2f(uniforms.resolution,w,h); gl.uniform2f(uniforms.grid,columns,rows);
      gl.uniform2f(uniforms.pointer,px,py); gl.uniform1f(uniforms.time,time);
      gl.uniform1f(uniforms.activity,activity); gl.uniform1f(uniforms.opacity,opacity);
      gl.uniform1f(uniforms.pixelScale,h/900);
      gl.drawArrays(gl.POINTS,0,columns*rows);
    },
    dispose() {gl.deleteProgram(program);gl.deleteVertexArray(vao);},
  };
}
