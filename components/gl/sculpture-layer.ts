const field = /* glsl */ `float hash(vec3 p) {
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
  float t=fieldTime*.38;
  vec3 q=p;
  q.x += .42*sin(p.y*1.1+t*.8)+.21*sin(p.z*1.6-t);
  q.y += .48*sin(p.x*1.1-t*.8)+.18*cos(p.z*1.3+t);
  q.z += .36*sin(p.y*1.2+p.x*.7+t*.6);
  // Large lobes rise, lean and merge; no repeating sheet or uniform wave.
  float d=length((q-vec3(.1,-.6,0))/vec3(2.4,1.05,1.0))-.98;
  d=smin(d,length(q-vec3(-1.15,.15,.0))-.98,.65);
  d=smin(d,length((q-vec3(.75,.4,.1))/vec3(.92,1.4,1.0))-.92,.58);
  d=smin(d,length(q-vec3(-.2+.22*sin(t*.8),1.45+.18*sin(t*.6),-.4))-.8,.55);
  d=smin(d,length(q-vec3(1.65,-.2,-.3))-.85,.55);
  vec3 flow=q*1.65+vec3(t*.24,-t*.38,t*.12);
  float n=noise(flow);
  // Nested folds deform the actual surface, so foreground ridges hide
  // recessed matter and catch the key light on their lip.
  float fold=sin(q.y*3.8 + q.x*1.7 + n*6.0 + t);
  float fine=noise(flow*3.1+vec3(n*2.0));
  float sediment=noise(flow*8.0+fine*2.0);
  d += fold*.19 + (n-.5)*.4 + (fine-.5)*.09 + (sediment-.5)*.018;
  float touch=exp(-dot(p.xy-pointer,p.xy-pointer)*1.5)*activity;
  d -= touch*.15*sin(p.y*4.0+p.x*2.0-t*3.0);
  return d;
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(.006,0);
  return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),
    shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));
}
`;

// One persistent population: fluid grains, boundary waves and bird anatomy.
// Scroll changes each grain's position, never its membership or visibility.
const vertex = `#version 300 es
precision highp float;
uniform vec2 resolution;
uniform vec2 grid;
uniform vec2 pointer;
uniform float time;
uniform float fieldTime;
uniform float activity;
uniform float opacity;
uniform float pixelScale;
uniform sampler2D surfaceMap;
uniform sampler2D birdPositions;
uniform sampler2D birdNormals;
uniform mat4 birdMatrix;
uniform mat4 birdView;
uniform mat4 birdProjection;
uniform float hero;
uniform float birdReady;
uniform float flap;
uniform float finale;
uniform vec4 edgeAges;
out vec3 tint;
out float alpha;
${field}

void main() {
  float id=float(gl_VertexID);
  float seed=hash(vec3(id,.7,3.1));
  vec2 cell=vec2(mod(id,grid.x),floor(id/grid.x));
  vec2 jitter=vec2(hash(vec3(id,4.1,2.0)),hash(vec3(id,7.3,1.0)))-.5;
  vec2 screen=((cell+.5+jitter*.95)/grid)*2.0-1.0;
  // Transport the samples themselves through two broad vortices. The
  // density evolves with the currents rather than blinking at fixed pixels.
  vec2 material=screen;
  float t=fieldTime*.16;
  screen.x += .11*sin(material.y*4.0+t)+.06*sin(material.y*7.0-t*.7);
  screen.y += .12*sin(material.x*3.2-t*.8)+.045*cos(material.x*6.0+t);
  // Reflect at the physical screen edges; never teleport to the opposite side.
  screen=1.0-abs(mod(screen+1.0,4.0)-2.0);
  float aspect=resolution.x/resolution.y;
  vec3 ro=vec3(0,.15,7.8);
  vec3 rd=normalize(vec3(screen.x*aspect*2.5,screen.y*2.5,-7.0));
  float spread=max(1.0,aspect*1.05);
  vec4 surface=texture(surfaceMap,screen*.5+.5);
  tint=vec3(0); alpha=0.0; gl_PointSize=1.0;
  gl_Position=vec4(2.0,2.0,2.0,1.0);
  if(surface.b<.98) return;
  float distance=(surface.r+surface.g/255.0)*12.0;
  vec3 p=ro+rd*distance;
  vec3 local=vec3(p.x/spread,p.y,p.z);
  float assembly=smoothstep(.055+seed*.055,.61+seed*.055,hero)*birdReady;
  assembly*=1.0-finale;
  vec3 n=assembly>.999?vec3(0,0,1):normalAt(local);
  float light=max(dot(n,normalize(vec3(-.65,.9,1.3))),0.0);
  float rim=pow(1.0-abs(dot(n,-rd)),2.0);
  float region=noise(local*.85+vec3(0,-fieldTime*.03,fieldTime*.01));
  float band=sin(local.y*1.3-local.x*.8+region*5.0+time*.035);
  float cycle=.5-.5*cos(time*.065);
  vec3 accent=mix(vec3(.02,.75,1.0),vec3(.59,.12,1.0),.5+.5*sin(time*.043));
  vec3 forest=mix(vec3(.035,.15,.045),accent*.18,cycle*.7);
  vec3 lime=mix(vec3(.58,.88,.045),accent,cycle*.85);
  vec3 citron=mix(vec3(.83,1.0,.17),mix(accent,vec3(.7,1.,1.),.4),cycle*.7);
  tint=mix(forest,lime,smoothstep(-.85,.12,band));
  tint=mix(tint,citron,smoothstep(.05,.8,band));
  float cavity=assembly>.999?1.0:clamp(1.0-max(0.0,.2-shape(local+n*.2))*2.4,.3,1.0);
  tint*= (.32+.85*light)*cavity;
  float pulse=pow(.5+.5*sin(local.y*2.0-local.x-time*.8),8.0);
  tint=mix(tint,citron,pulse*.13);
  // Close, unequal grains build mass; a small fraction lifts in the wake.
  float loose=step(.98,seed);
  p+=n*(seed-.5)*(.045+loose*.15);
  p.xy+=vec2(sin(fieldTime*.6+id),cos(fieldTime*.5+id))*.006;
  // A contact wave travels inward from each side and decays in time.
  // The timers come from actual surface contact measured at the viewport.
  vec4 edgeDistance=vec4(screen.x+1.0,1.0-screen.x,screen.y+1.0,1.0-screen.y);
  float wave=0.0;
  for(int i=0;i<4;i++) {
    if(edgeAges[i]>=0.0) {
      float front=edgeDistance[i]-edgeAges[i]*.85;
      float ripple=sin(front*24.0)*exp(-front*front*24.0)*exp(-edgeAges[i]*.8);
      wave+=ripple;
      vec2 inward=i==0?vec2(1,0):i==1?vec2(-1,0):i==2?vec2(0,1):vec2(0,-1);
      p.xy+=inward*ripple*.16*(1.0-assembly);
    }
  }
  p.z+=wave*.22*(1.0-assembly);
  tint+=citron*abs(wave)*.18*(1.0-assembly);
  vec3 view=p-ro;
  vec4 sourceClip=vec4(view.x/(aspect*2.5/7.0),view.y/(2.5/7.0),0.0,-view.z);
  vec2 source=sourceClip.xy/sourceClip.w;
  vec2 destination=source;
  float birdLight=1.0;
  if(assembly>0.0) {
    // Every source ID maps to baked anatomy; repeated samples receive a
    // tiny normal offset so all grains remain separate within the feathers.
    float index=mod(id*37.0,9000.0);
    float frame=flap*16.0;
    float row=floor(index/2048.0);
    float column=(mod(index,2048.0)+.5)/2048.0;
    vec3 a=texture(birdPositions,vec2(column,(floor(frame)*5.0+row+.5)/80.0)).xyz;
    vec3 b=texture(birdPositions,vec2(column,(mod(floor(frame)+1.0,16.0)*5.0+row+.5)/80.0)).xyz;
    vec3 normal=texture(birdNormals,vec2(column,(row+.5)/5.0)).xyz;
    vec3 anatomy=mix(a,b,fract(frame))+normal*(seed-.5)*.028;
    vec4 target=birdProjection*birdView*birdMatrix*vec4(anatomy,1.0);
    destination=target.xy/target.w;
    vec3 worldNormal=normalize(mat3(birdMatrix)*normal);
    birdLight=.65+.85*max(dot(worldNormal,normalize(vec3(-.6,.8,1.0))),0.0);
  }
  vec2 travel=destination-source;
  vec2 arc=vec2(-travel.y,travel.x)*sin(assembly*3.14159265)*.14;
  vec2 position=mix(source,destination,assembly)+arc;
  gl_Position=vec4(position,0.0,1.0);
  float fluidSize=(3.0+seed*1.6)*pixelScale*7.0/(-view.z);
  gl_PointSize=max(1.0,mix(fluidSize,(1.8+seed*.65)*pixelScale,assembly));
  tint=mix(tint,mix(lime*.7+citron*.3,vec3(.8,.96,1.0),.3)*birdLight*1.25,assembly*.8);
  alpha=mix(.8+light*.18,.9,assembly)*opacity;
  alpha*=mix(mix(.6,1.0,smoothstep(-.95,.4,screen.y)),1.0,assembly);
}`;
const fragment = `#version 300 es
precision highp float;
in vec3 tint;
in float alpha;
uniform vec2 resolution;
out vec4 color;
void main() {
  vec2 p=(gl_PointCoord-.5)*2.0;
  float r2=dot(p,p);
  if(r2>1.0 || alpha<.005) discard;
  vec3 n=vec3(p.x,-p.y,sqrt(1.0-r2));
  vec3 lamp=normalize(vec3(-.4,.6,1.0));
  float light=.38+.72*max(dot(n,lamp),0.0);
  float spec=pow(max(dot(n,normalize(vec3(-.2,.3,1.0))),0.0),24.0);
  float edge=1.0-smoothstep(.68,1.0,r2);
  color=vec4(tint*light+vec3(.87,1.0,.58)*spec*.25,edge*alpha);
}`;
const canvasVertex = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  uv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;
// Ray marching is shared by all grains through a small depth map. RGBA8
// packs depth into two channels; no float-render-target extension is needed.
const surfaceFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float fieldTime;
uniform float activity;
out vec4 color;
${field}
void main() {
  vec2 screen=uv*2.0-1.0;
  float aspect=resolution.x/resolution.y;
  vec3 ro=vec3(0,.15,7.8);
  vec3 rd=normalize(vec3(screen.x*aspect*2.5,screen.y*2.5,-7.0));
  float spread=max(1.0,aspect*1.05);
  float distance=3.0;
  float hit=0.0;
  for(int i=0;i<76;i++) {
    vec3 p=ro+rd*distance;
    float d=shape(vec3(p.x/spread,p.y,p.z));
    if(d<.009) {hit=1.0;break;}
    distance+=max(d*.48,.006);
    if(distance>12.0) break;
  }
  float packed=clamp(distance/12.0,0.0,1.0)*255.0;
  color=vec4(floor(packed)/255.0,fract(packed),hit,1.0);
}`;

export type SculptureFlight = {
  hero: number; ready: number; flap: number; finale: number;
  matrix: Float32Array; view: Float32Array; projection: Float32Array;
  positions: WebGLTexture | null; normals: WebGLTexture | null;
};

export function createSculptureLayer(gl: WebGL2RenderingContext, mobile: boolean) {
  const makeProgram=(vertexSource: string,fragmentSource: string) => {
  const program=gl.createProgram();
  if(!program) throw new Error("Particle sculpture allocation failed");
  const shaders: WebGLShader[]=[];
  try {
    for(const [type,source] of [[gl.VERTEX_SHADER,vertexSource],[gl.FRAGMENT_SHADER,fragmentSource]] as const) {
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
    return program;
  };
  const program=makeProgram(vertex,fragment);
  const surfaceProgram=makeProgram(canvasVertex,surfaceFragment);
  const surfaceUniforms=Object.fromEntries(["resolution","pointer","time","fieldTime","activity"].map(name=>[name,gl.getUniformLocation(surfaceProgram,name)]));
  const surfaceMap=gl.getUniformLocation(program,"surfaceMap");
  const texture=gl.createTexture();
  const target=gl.createFramebuffer();
  gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  let mapWidth=0,mapHeight=0;
  const vao=gl.createVertexArray();
  const uniforms=Object.fromEntries(["resolution","grid","pointer","time","fieldTime","activity","opacity","pixelScale","hero","birdReady","flap","finale","birdMatrix","birdView","birdProjection","birdPositions","birdNormals","edgeAges"].map(name=>[name,gl.getUniformLocation(program,name)]));
  let flowTime=0,lastTime=0,lastProbe=-1;
  let sourceX=0,sourceY=0,sourceActivity=0;
  let mapDirty=true;
  const impactAt=new Float32Array([-100,-100,-100,-100]);
  const edgeAges=new Float32Array(4);
  let edgePixels=new Uint8Array(384*4);
  return {
    render(w: number,h: number,time: number,opacity: number,px: number,py: number,activity: number,flight: SculptureFlight) {
      if(opacity<.002) return;
      const delta=Math.max(0,Math.min(time-lastTime,.05)); lastTime=time;
      const flowing=flight.hero<.015 || flight.finale>.98 || flight.ready<.95;
      if(flowing) {
        flowTime+=delta;sourceX=px;sourceY=py;sourceActivity=activity;mapDirty=true;
      }
      const count=mobile?70000:220000;
      const columns=Math.round(Math.sqrt(count*w/h));
      const rows=Math.ceil(count/columns);
      gl.bindVertexArray(vao);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      const scale=Math.min(1,(mobile?256:384)/Math.max(w,h));
      const mw=Math.max(1,Math.round(w*scale)),mh=Math.max(1,Math.round(h*scale));
      gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.bindFramebuffer(gl.FRAMEBUFFER,target);
      if(mw!==mapWidth || mh!==mapHeight) {
        mapWidth=mw;mapHeight=mh;mapDirty=true;
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,mw,mh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error("Fluid depth target unavailable");
      }
      if(mapDirty) {
        gl.viewport(0,0,mw,mh);gl.disable(gl.BLEND);gl.useProgram(surfaceProgram);
        gl.uniform2f(surfaceUniforms.resolution,w,h);gl.uniform2f(surfaceUniforms.pointer,sourceX,sourceY);
        gl.uniform1f(surfaceUniforms.time,time);gl.uniform1f(surfaceUniforms.fieldTime,flowTime);
        gl.uniform1f(surfaceUniforms.activity,sourceActivity);
        gl.drawArrays(gl.TRIANGLES,0,3);mapDirty=false;
        // Only tiny boundary strips are read, at 4 Hz, never the whole image.
        // The B channel is the actual hit mask produced by the surface pass.
        if(flowing && flowTime-lastProbe>.25) {
          lastProbe=flowTime;
          if(edgePixels.length<Math.max(mw,mh)*4) edgePixels=new Uint8Array(Math.max(mw,mh)*4);
          const edges=[[0,0,1,mh],[mw-1,0,1,mh],[0,0,mw,1],[0,mh-1,mw,1]];
          edges.forEach(([x,y,width,height],edge)=>{
            gl.readPixels(x,y,width,height,gl.RGBA,gl.UNSIGNED_BYTE,edgePixels);
            let contacts=0;
            for(let i=0;i<width*height;i++) if(edgePixels[i*4+2]>250) contacts++;
            if(contacts>2 && flowTime-impactAt[edge]>2.4) impactAt[edge]=flowTime;
          });
        }
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.enable(gl.BLEND);
      gl.useProgram(program);gl.uniform1i(surfaceMap,4);
      gl.uniform2f(uniforms.resolution,w,h); gl.uniform2f(uniforms.grid,columns,rows);
      gl.uniform2f(uniforms.pointer,sourceX,sourceY); gl.uniform1f(uniforms.time,time);
      gl.uniform1f(uniforms.fieldTime,flowTime);
      gl.uniform1f(uniforms.activity,sourceActivity); gl.uniform1f(uniforms.opacity,opacity);
      gl.uniform1f(uniforms.pixelScale,h/900);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,flight.positions);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,flight.normals);
      gl.uniform1i(uniforms.birdPositions,0);gl.uniform1i(uniforms.birdNormals,1);
      gl.uniform1f(uniforms.hero,flight.hero);gl.uniform1f(uniforms.birdReady,flight.ready);
      gl.uniform1f(uniforms.flap,flight.flap);gl.uniform1f(uniforms.finale,flight.finale);
      gl.uniformMatrix4fv(uniforms.birdMatrix,false,flight.matrix);
      gl.uniformMatrix4fv(uniforms.birdView,false,flight.view);
      gl.uniformMatrix4fv(uniforms.birdProjection,false,flight.projection);
      for(let i=0;i<4;i++) edgeAges[i]=flowTime-impactAt[i]<3.0?flowTime-impactAt[i]:-1;
      gl.uniform4fv(uniforms.edgeAges,edgeAges);
      // Constant draw count and frozen source mask throughout assembly.
      gl.drawArrays(gl.POINTS,0,columns*rows);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
    },
    dispose() {gl.deleteProgram(program);gl.deleteProgram(surfaceProgram);gl.deleteTexture(texture);gl.deleteFramebuffer(target);gl.deleteVertexArray(vao);},
  };
}
