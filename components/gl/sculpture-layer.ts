// Opaque, continuously remade pigment sculpture. A bounded ray-marched
// surface supplies real occlusion; fine surface grain reads as packed matter.
const vertex = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
const fragment = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float activity;
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
  vec2 screen=uv*2.0-1.0;
  float aspect=resolution.x/resolution.y;
  vec3 ro=vec3(0,.15,7.8);
  vec3 rd=normalize(vec3(screen.x*aspect*2.7,screen.y*2.7,-7.0));
  // Wider desktop compositions spread the mass across the frame; on phones
  // it keeps its physical proportions and crops naturally.
  float spread=max(1.0,aspect*.85);
  vec3 bg=mix(vec3(.30,.12,.075),vec3(.88,.79,.64),smoothstep(-1.0,1.0,screen.y));
  bg += .025*sin(screen.y*3.0+screen.x*2.0);
  float distance=3.0;
  vec3 p=ro;
  bool hit=false;
  for(int i=0;i<68;i++) {
    p=ro+rd*distance;
    vec3 sampleP=vec3(p.x/spread,p.y,p.z);
    float d=shape(sampleP);
    if(d<.007) { hit=true; break; }
    distance += max(d*.48,.006);
    if(distance>12.0) break;
  }
  vec3 result=bg;
  if(hit) {
    p.x/=spread;
    vec3 n=normalAt(p);
    vec3 lamp=normalize(vec3(-.65,.9,1.3));
    float diffuse=max(dot(n,lamp),0.0);
    float ao=1.0;
    ao-=max(0.0,.08-shape(p+n*.08))*2.5;
    ao-=max(0.0,.22-shape(p+n*.22))*1.2;
    ao-=max(0.0,.5-shape(p+n*.5))*.65;
    ao=clamp(ao,.16,1.0);
    float shadow=1.0;
    for(int i=1;i<=5;i++) {
      float travel=float(i)*.16;
      shadow=min(shadow,clamp(shape(p+lamp*travel)*5.0/travel,.15,1.0));
    }
    float t=time*.035;
    float pigment=noise(p*.85+vec3(.0,-t,t*.4));
    float marble=noise(p*2.4+pigment*3.0);
    float band=sin(p.y*1.3-p.x*.8+pigment*5.0+t);
    vec3 clay=vec3(.92,.24,.10);
    vec3 teal=vec3(.14,.58,.55);
    vec3 cream=vec3(1.0,.93,.79);
    vec3 cobalt=vec3(.025,.11,.23);
    vec3 material=mix(clay,teal,smoothstep(-.6,.0,band));
    material=mix(material,cream,smoothstep(.12,.56,band+marble*.32));
    material=mix(material,cobalt,smoothstep(.58,.8,pigment)*.75);
    // Pigment grains cling to the surface, instead of glowing sprites
    // floating over it. Their coordinates move with the sculpture.
    float grain=hash(floor(p*290.0));
    float dust=hash(floor(p*135.0+vec3(11)));
    material*=.73+.4*grain;
    material=mix(material,cream,step(.9,dust)*.22);
    float lighting=.34+.9*diffuse*shadow;
    result=material*lighting*ao;
    result+=cream*pow(max(dot(reflect(-lamp,n),-rd),0.0),28.0)*.12*shadow;
    result+=vec3(.025,.065,.075)*(1.0-diffuse)*ao;
    result=pow(max(result,vec3(0)),vec3(.88));
  }
  // Lower third stays quiet behind the identity and links.
  float lower=smoothstep(-.95,.45,screen.y);
  result*=mix(.23,1.0,lower);
  float vignette=1.0-.18*pow(length(screen*vec2(.65,.6)),2.0);
  color=vec4(result*vignette,1.0);
}`;
const composite = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 color;
uniform sampler2D scene;
uniform float opacity;
void main(){color=vec4(texture(scene,uv).rgb,opacity);}`;

export function createSculptureLayer(gl: WebGL2RenderingContext, mobile: boolean) {
  const makeProgram = (source: string) => {
    const program=gl.createProgram();
    if(!program) throw new Error("Sculpture program allocation failed");
    const shaders: WebGLShader[]=[];
    try {
      for(const [type,code] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,source]] as const) {
        const shader=gl.createShader(type);
        if(!shader) throw new Error("Sculpture shader allocation failed");
        shaders.push(shader); gl.shaderSource(shader,code); gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Sculpture shader failed");
        gl.attachShader(program,shader);
      }
      gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Sculpture link failed");
      return program;
    } catch(error) { gl.deleteProgram(program); throw error; }
    finally { shaders.forEach(shader=>gl.deleteShader(shader)); }
  };
  const surface=makeProgram(fragment);
  const blit=makeProgram(composite);
  const vao=gl.createVertexArray();
  const texture=gl.createTexture();
  const target=gl.createFramebuffer();
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const u=Object.fromEntries(["resolution","time","pointer","activity"].map(name=>[name,gl.getUniformLocation(surface,name)]));
  const scene=gl.getUniformLocation(blit,"scene");
  const opacity=gl.getUniformLocation(blit,"opacity");
  let width=0,height=0;
  let quality=1, frames=0, slowFrames=0;
  let lastTime=0;
  return {
    render(w: number,h: number,time: number,alpha: number,px: number,py: number,activity: number) {
      if(alpha<.002) return;
      // Adapt once enough frames have accumulated; never chase isolated
      // startup or scroll stalls and never grow GPU work during interaction.
      const interval=time-lastTime;
      lastTime=time;
      if(interval>0 && interval<.1) {
        frames++; if(interval>.032) slowFrames++;
        if(frames===100) {
          if(slowFrames>45) quality=Math.max(.7,quality*.85);
          frames=0; slowFrames=0;
        }
      }
      const scale=Math.min(1,(mobile?620:1150)*quality/Math.max(w,h));
      const nextW=Math.max(1,Math.round(w*scale)), nextH=Math.max(1,Math.round(h*scale));
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER,target);
      if(width!==nextW || height!==nextH) {
        width=nextW; height=nextH;
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error("Sculpture target unavailable");
      }
      gl.bindVertexArray(vao); gl.disable(gl.BLEND);
      gl.viewport(0,0,width,height); gl.useProgram(surface);
      gl.uniform2f(u.resolution,width,height); gl.uniform1f(u.time,time);
      gl.uniform2f(u.pointer,px,py); gl.uniform1f(u.activity,activity);
      gl.drawArrays(gl.TRIANGLES,0,3);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,w,h);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(blit); gl.uniform1i(scene,4); gl.uniform1f(opacity,alpha);
      gl.drawArrays(gl.TRIANGLES,0,3);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
    },
    dispose() {
      gl.deleteProgram(surface); gl.deleteProgram(blit); gl.deleteVertexArray(vao);
      gl.deleteTexture(texture); gl.deleteFramebuffer(target);
    },
  };
}
