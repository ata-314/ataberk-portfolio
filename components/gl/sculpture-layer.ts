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
  float t=fieldTime*.34;
  // A continuous relief grows out of the dark backing, across the viewport.
  vec2 q=p.xy;
  vec2 drift=vec2(t*.38,-t*.44);
  float broad=noise(vec3(q*.65+drift,t*.18));
  q+=vec2(sin(q.y*.85+t*.6),cos(q.x*.75-t*.5))*.42;
  q+=vec2(broad-.5,noise(vec3(q*.7-drift,4.0+t*.12))-.5)*.8;
  float mass=noise(vec3(q*.85+drift,t*.22));
  float fold=sin(q.y*2.7+q.x*1.1+broad*7.0+t*.65);
  float curl=noise(vec3(q*2.4+vec2(fold,broad),t*.3));
  float detail=noise(vec3(q*6.5+curl,t*.2));
  float height=-1.75+mass*2.8+fold*.58+(curl-.5)*.8+(detail-.5)*.09;
  // Project the cursor ray onto this depth so the response stays under it.
  float aspect=resolution.x/resolution.y;
  float spread=max(1.0,aspect*1.05);
  vec2 cursor=vec2(pointer.x*aspect*2.5/spread,pointer.y*2.5)*(7.8-p.z)/7.0+vec2(0,.15);
  vec2 offset=p.xy-cursor;
  float radius=length(offset);
  float influence=exp(-radius*radius*2.2)*activity;
  height+=influence*(.48+.17*sin(radius*7.0-fieldTime*1.8));
  return (p.z-height)*.42;
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
// Pointer wake: recent cursor positions in NDC (xy) with a decaying
// strength (z). burst: click origin (xy) and age in seconds (z, -1 idle).
uniform vec4 trail[8];
uniform vec3 burst;
// 1 on the additive glow pass that haloes the formed bird.
uniform float glowPass;
out vec3 tint;
out float alpha;
${field}
float grainRandom(uint value) {
  value ^= value >> 16u;
  value *= 0x7feb352du;
  value ^= value >> 15u;
  value *= 0x846ca68bu;
  value ^= value >> 16u;
  return float(value >> 8u) / 16777216.0;
}

void renderGrain(float id) {
  float seed=grainRandom(uint(id)+41u);
  vec2 cell=vec2(mod(id,grid.x),floor(id/grid.x));
  vec2 jitter=vec2(grainRandom(uint(id)+83u),grainRandom(uint(id)+307u))-.5;
  vec2 screen=((cell+.5+jitter*.95)/grid)*2.0-1.0;
  // A shared, broad current carries neighboring grains together.
  vec2 material=screen;
  float t=fieldTime*.24;
  screen.x += .12*sin(material.y*1.5+t)*(1.0-material.x*material.x);
  screen.y += .10*cos(material.x*1.4+t)*(1.0-material.y*material.y);
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
  float emergence=smoothstep(-1.05,.45,local.z);
  tint*= (.18+.95*light)*cavity*mix(.012,1.0,emergence);
  float pulse=pow(.5+.5*sin(local.y*2.0-local.x-time*.8),8.0);
  tint=mix(tint,citron,pulse*.07*emergence);
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
      float ripple=sin(front*10.0)*exp(-front*front*12.0)*exp(-edgeAges[i]*1.5);
      wave+=ripple;
      vec2 inward=i==0?vec2(1,0):i==1?vec2(-1,0):i==2?vec2(0,1):vec2(0,-1);
      p.xy+=inward*ripple*.045*(1.0-assembly);
    }
  }
  p.z+=wave*.055*(1.0-assembly);
  tint+=citron*abs(wave)*.06*(1.0-assembly);
  vec3 view=p-ro;
  vec4 sourceClip=vec4(view.x/(aspect*2.5/7.0),view.y/(2.5/7.0),0.0,-view.z);
  vec2 source=sourceClip.xy/sourceClip.w;
  vec2 destination=source;
  float birdLight=1.0;
  float electric=0.0;
  vec3 electricColor=vec3(.6,.97,1.0);
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
    // Electrified body: thin veins crawl over the anatomy in patches, arc
    // pulses race along the wingspan and random grains spark for a frame.
    float vein=noise(anatomy*5.5+vec3(0.0,time*2.6,time*1.7));
    float veinLine=1.0-smoothstep(0.0,.022,abs(vein-.5));
    veinLine*=smoothstep(.5,.7,noise(anatomy*2.0-vec3(time*.9)));
    float span=anatomy.x*1.6+anatomy.z*.9;
    float arc=pow(.5+.5*sin(span*7.0-time*11.0+noise(anatomy*3.0+time)*4.0),60.0);
    float spark=step(.975,grainRandom(uint(id)+uint(floor(time*18.0))*131u));
    electric=clamp(veinLine*.95+arc*.75+spark,0.0,1.4);
    electricColor=mix(vec3(.55,.95,1.0),vec3(.84,1.0,.3),.5+.5*sin(time*3.0+seed*6.28));
    // Sparks leap slightly off the surface.
    destination+=(vec2(grainRandom(uint(id)+uint(time*18.0)),grainRandom(uint(id)+977u+uint(time*18.0)))-.5)*.014*spark;
  }
  // The first gathering already traces the actual anatomy. A loose halo
  // follows the wings and body, then contracts onto the feather samples.
  vec4 centerClip=birdProjection*birdView*birdMatrix*vec4(0,0,0,1);
  vec2 center=centerClip.xy/centerClip.w;
  vec2 looseBird=center+(destination-center)*1.12;
  vec2 featherDrift=vec2(grainRandom(uint(id)+173u),grainRandom(uint(id)+7919u))-.5;
  looseBird+=featherDrift*.09;
  float gather=smoothstep(0.0,.72,assembly);
  float settle=smoothstep(.45,1.0,assembly);
  vec2 travel=looseBird-source;
  vec2 curl=vec2(-travel.y,travel.x)*sin(gather*3.14159265)*.10;
  vec2 position=mix(mix(source,looseBird,gather)+curl,destination,settle);
  // Pointer wake and click shockwave push the fluid grains aside with a
  // slight swirl, and light up whatever they disturb.
  float fluidPart=1.0-assembly;
  float lift=0.0;
  vec2 asp=vec2(aspect,1.0);
  for(int k=0;k<8;k++) {
    vec4 tk=trail[k];
    if(tk.z<.01) continue;
    vec2 d=(position-tk.xy)*asp;
    float r2=dot(d,d);
    float f=tk.z*exp(-r2/.045);
    // Rotate the neighbourhood around the wake point and dilate it slightly:
    // a true rotation keeps density (a plain offset emptied the core).
    float turn=f*(.9+seed*.5)*fluidPart;
    float c=cos(turn),s=sin(turn);
    vec2 moved=mat2(c,s,-s,c)*d*(1.0+f*.12*fluidPart);
    position=tk.xy+moved/asp;
    lift+=f;
  }
  if(burst.z>=0.0) {
    vec2 d=(position-burst.xy)*asp;
    float r=length(d);
    float ring=exp(-pow((r-burst.z*1.3)/.07,2.0))*exp(-burst.z*1.6);
    position+=d/(r+1e-4)/asp*ring*.08*fluidPart;
    lift+=ring*1.4;
  }
  lift=min(lift,1.6)*fluidPart;
  gl_Position=vec4(position,0.0,1.0);
  float fluidSize=(2.2+seed*1.1)*pixelScale*7.0/(-view.z);
  gl_PointSize=max(1.0,mix(fluidSize,(1.8+seed*.65)*pixelScale,assembly));
  // Kept below 1 so the body keeps its hue and lighting; the veins and the
  // halo pass carry the brightness.
  vec3 birdBody=min(mix(lime*.7+citron*.3,vec3(.8,.96,1.0),.18)*birdLight*1.05,vec3(.95));
  tint=mix(tint,birdBody,assembly*.85);
  // Veins burn white-hot at the core and fringe into the electric hue.
  vec3 hot=mix(electricColor,vec3(1.0),.45)*1.6;
  tint=mix(tint,hot,clamp(electric,0.0,1.0)*assembly);
  gl_PointSize*=1.0+electric*.9*assembly;
  // A bright scan sweeps down the relief every six seconds. Depth bends
  // the band around the folds; only actual grains carry the light.
  float sweep=1.55-mod(time*.52,3.1);
  float scanDistance=screen.y+local.z*.065-sweep;
  float core=exp(-pow(scanDistance/.032,2.0));
  float shoulder=exp(-pow(scanDistance/.11,2.0));
  float trail=exp(-max(scanDistance,0.0)*5.5)*smoothstep(-.015,.035,scanDistance);
  float scan=(core+shoulder*.6+trail*.38)*(1.0-assembly);
  vec3 scanColor=mix(vec3(.18,1.0,.65),vec3(.62,.94,1.0),shoulder);
  tint+=scanColor*scan*1.55;
  tint=mix(tint,vec3(.86,1.0,1.0)*2.0,core*.8*(1.0-assembly));
  gl_PointSize*=1.0+shoulder*.6*(1.0-assembly);
  alpha=mix(.8+light*.18,.95,assembly)*opacity;
  alpha*=mix(mix(.6,1.0,smoothstep(-.95,.4,screen.y)),1.0,assembly);
  tint+=mix(citron,vec3(.75,1.0,.95),.35)*lift*.9;
  if(glowPass>.5) {
    // Halo pass: only bird grains, drawn large and soft with additive blend.
    if(assembly<.05) {alpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
    // Halo mostly around live veins and sparks; the body keeps only a faint
    // lime aura (no red/blue, which washed the green body out to grey).
    tint=mix(vec3(.3,.85,.05),electricColor*1.4,clamp(electric,0.0,1.0));
    alpha=(.008+electric*.4)*assembly*opacity;
    gl_PointSize*=3.2;
  }
}
void main() {
  renderGrain(float(gl_VertexID));
}`;
const fragment = `#version 300 es
precision highp float;
in vec3 tint;
in float alpha;
uniform vec2 resolution;
uniform float glowPass;
out vec4 color;
void main() {
  vec2 p=(gl_PointCoord-.5)*2.0;
  float r2=dot(p,p);
  if(r2>1.0 || alpha<.005) discard;
  if(glowPass>.5) {color=vec4(tint,exp(-r2*3.2)*alpha);return;}
  vec3 n=vec3(p.x,-p.y,sqrt(1.0-r2));
  vec3 lamp=normalize(vec3(-.4,.6,1.0));
  float light=.38+.72*max(dot(n,lamp),0.0);
  float spec=pow(max(dot(n,normalize(vec3(-.2,.3,1.0))),0.0),24.0);
  float edge=1.0-smoothstep(.68,1.0,r2);
  color=vec4(tint*light+vec3(.87,1.0,.58)*spec*.35*max(tint.r,max(tint.g,tint.b)),edge*alpha);
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
  trail: Float32Array; burst: Float32Array;
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
  const uniforms=Object.fromEntries(["resolution","grid","pointer","time","fieldTime","activity","opacity","pixelScale","hero","birdReady","flap","finale","birdMatrix","birdView","birdProjection","birdPositions","birdNormals","edgeAges","trail","burst","glowPass"].map(name=>[name,gl.getUniformLocation(program,name)]));
  let flowTime=0,lastTime=0,lastProbe=-1;
  let sourceX=0,sourceY=0,sourceActivity=0;
  let mapDirty=true;
  const impactAt=new Float32Array([-100,-100,-100,-100]);
  const edgeAges=new Float32Array(4);
  const edgeTouching=[false,false,false,false];
  let edgePixels=new Uint8Array(384*4);
  return {
    render(w: number,h: number,time: number,opacity: number,px: number,py: number,activity: number,flight: SculptureFlight) {
      if(opacity<.002) return;
      const delta=Math.max(0,Math.min(time-lastTime,.05)); lastTime=time;
      const flowing=flight.hero<.015 || flight.finale>.98 || flight.ready<.95;
      if(flowing) {
        flowTime+=delta;sourceX=px;sourceY=py;
        sourceActivity+=(activity-sourceActivity)*(1-Math.exp(-5*delta));mapDirty=true;
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
            const touching=contacts>2;
            if(touching && !edgeTouching[edge] && flowTime-impactAt[edge]>4.0) impactAt[edge]=flowTime;
            edgeTouching[edge]=touching;
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
      gl.uniform4fv(uniforms.trail,flight.trail);
      gl.uniform3fv(uniforms.burst,flight.burst);
      gl.uniform1f(uniforms.glowPass,0);
      // Constant draw count and frozen source mask throughout assembly.
      gl.drawArrays(gl.POINTS,0,columns*rows);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
      // Additive halo over the forming bird. A subset of IDs still covers
      // every anatomy sample (index = id*37 mod 9000).
      if(flight.hero>.06 && flight.ready>.5 && flight.finale<.98) {
        gl.uniform1f(uniforms.glowPass,1);
        // Add light only: leave destination alpha untouched, or the halo's
        // accumulated alpha greys the transparent, premultiplied canvas.
        gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ZERO,gl.ONE);
        gl.drawArrays(gl.POINTS,0,Math.min(columns*rows,mobile?3000:6000));
        gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
        gl.uniform1f(uniforms.glowPass,0);
      }
    },
    dispose() {gl.deleteProgram(program);gl.deleteProgram(surfaceProgram);gl.deleteTexture(texture);gl.deleteFramebuffer(target);gl.deleteVertexArray(vao);},
  };
}
