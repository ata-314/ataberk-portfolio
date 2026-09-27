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
// Pointer wake: recent cursor positions in NDC (xy), a swelling-then-
// decaying strength (z) and the cursor's heading in radians (w). burst: click origin (xy) and age in seconds (z, -1 idle).
uniform vec4 trail[16];
uniform vec3 burst;
// 1 on the additive glow pass that haloes the formed bird.
uniform float glowPass;
// Opening emergence clock, 0 → 1 over the intro.
uniform float intro;
// Bird → bust morph: baked scan points (positions rows, then normals rows
// with cavity in w), the bust canvas rect in this canvas's NDC (x0,y0,x1,y1),
// its aspect and live pose, and the morph amount.
uniform sampler2D bustData;
uniform float bustRows;
uniform float bustCount;
uniform vec4 bustRect;
uniform float bustAspect;
uniform float bustYaw;
uniform float bustPitch;
uniform float bustLift;
uniform float morph;
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

// Surface point for a screen position, read from the raymarched depth map with
// texelFetch (the depth is packed in two bytes, so filtering would corrupt it).
vec3 surfacePoint(ivec2 texel, vec3 ro, float aspect, vec3 fallback) {
  ivec2 size=textureSize(surfaceMap,0);
  texel=clamp(texel,ivec2(0),size-1);
  vec4 m=texelFetch(surfaceMap,texel,0);
  if(m.b<.98) return fallback;
  vec2 s=(vec2(texel)+.5)/vec2(size)*2.0-1.0;
  vec3 d=normalize(vec3(s.x*aspect*2.5,s.y*2.5,-7.0));
  return ro+d*(m.r+m.g/255.0)*12.0;
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
  // Normal from neighbouring depth texels: four fetches instead of six full
  // noise-field evaluations per grain per frame.
  vec3 n=vec3(0,0,1);
  if(assembly<.999) {
    ivec2 c=ivec2((screen*.5+.5)*vec2(textureSize(surfaceMap,0)));
    vec3 dx=surfacePoint(c+ivec2(1,0),ro,aspect,p)-surfacePoint(c-ivec2(1,0),ro,aspect,p);
    vec3 dy=surfacePoint(c+ivec2(0,1),ro,aspect,p)-surfacePoint(c-ivec2(0,1),ro,aspect,p);
    vec3 cn=cross(dx,dy);
    if(dot(cn,cn)>1e-10) n=normalize(cn);
    if(n.z<0.0) n=-n;
  }
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
  // Slopes turned away from the camera read as occluded folds.
  float cavity=assembly>.999?1.0:mix(.45,1.0,smoothstep(.15,.85,n.z));
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
  // Opening emergence: the data surfaces from inside the page. A front opens
  // just below centre and spreads outward with a noise-warped, ink-like
  // edge. Behind it each grain rises from deep beneath its own place in the
  // relief — perspective draws it in toward the source — and sways on a
  // decaying current until it settles. Sparse grains glint on the crossing.
  float introAlpha=1.0,introSize=1.0;
  if(intro<1.0) {
    vec2 rel=(material-vec2(0.0,-.18))*vec2(aspect,1.0);
    float reach=length(vec2(aspect,1.18));
    float edgeWarp=noise(vec3(material*vec2(aspect,1.0)*2.6,3.7))-.5;
    float delay=clamp(length(rel)/reach*.5+edgeWarp*.2+seed*.07,0.0,.55);
    float t=clamp((intro-delay)/.45,0.0,1.0);
    float rise=t*t*t*(t*(t*6.0-15.0)+10.0);
    float remain=1.0-rise;
    p.z-=remain*(2.4+seed*2.2);
    p.y-=remain*(.3+seed*.25);
    p.xy+=vec2(sin(seed*23.0+t*5.5),cos(seed*17.0+t*4.6))*.16*remain;
    float crossing=smoothstep(0.0,.2,t)*(1.0-smoothstep(.3,.65,t));
    tint+=citron*crossing*(.12+step(.82,seed)*.9);
    introAlpha=smoothstep(0.0,.35,t);
    introSize=mix(.35,1.0,smoothstep(0.0,.75,t));
  }
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
    // A restrained charge: sparse thin veins crawl over the anatomy, a slow
    // faint pulse runs along the wingspan and a rare grain sparks.
    float vein=noise(anatomy*5.5+vec3(0.0,time*1.3,time*.85));
    float veinLine=1.0-smoothstep(0.0,.012,abs(vein-.5));
    veinLine*=smoothstep(.62,.78,noise(anatomy*2.0-vec3(time*.5)));
    float span=anatomy.x*1.6+anatomy.z*.9;
    float arc=pow(.5+.5*sin(span*7.0-time*4.0+noise(anatomy*3.0+time*.5)*4.0),90.0);
    float spark=step(.996,grainRandom(uint(id)+uint(floor(time*10.0))*131u));
    electric=clamp(veinLine*.55+arc*.3+spark*.5,0.0,.7);
    electricColor=mix(vec3(.55,.95,1.0),vec3(.84,1.0,.3),.5+.5*sin(time*1.2+seed*6.28));
    // Sparks leap slightly off the surface.
    destination+=(vec2(grainRandom(uint(id)+uint(time*18.0)),grainRandom(uint(id)+977u+uint(time*18.0)))-.5)*.006*spark;
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
  // Pointer wake: grains are carried along the cursor's heading, drift
  // apart on their own seeded directions and turn slightly — a soft,
  // liquid dispersal. Click shockwaves push them aside. Both light up and
  // recolour whatever they disturb.
  float fluidPart=1.0-assembly;
  float lift=0.0;
  vec2 asp=vec2(aspect,1.0);
  float scatterAngle=seed*43.98;
  vec2 scatter=vec2(cos(scatterAngle),sin(scatterAngle));
  for(int k=0;k<16;k++) {
    vec4 tk=trail[k];
    if(tk.z<.005) continue;
    vec2 d=(position-tk.xy)*asp;
    float f=tk.z*exp(-dot(d,d)/.035)*fluidPart;
    if(f<.001) continue;
    vec2 heading=vec2(cos(tk.w),sin(tk.w));
    float turn=f*(.25+seed*.2);
    float c=cos(turn),s=sin(turn);
    d=mat2(c,s,-s,c)*d;
    d+=(heading*.05+scatter*(.018+seed*.03))*f;
    position=tk.xy+d/asp;
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
  // Bird → bust: each bird grain flies on a slight arc to one scan point,
  // projected exactly as the hologram canvas projects it, and takes on the
  // bust's lighting. Grains leave in a seeded order so the bird unravels.
  float bustMix=0.0;
  float bustAlpha=1.0;
  vec3 bustTint=vec3(0);
  if(morph>.001 && assembly>0.0) {
    float bi=mod(id,bustCount);
    ivec2 bt=ivec2(int(mod(bi,2048.0)),int(floor(bi/2048.0)));
    vec4 bp=texelFetch(bustData,bt,0);
    vec4 bn=texelFetch(bustData,bt+ivec2(0,int(bustRows)),0);
    vec3 q=bp.xyz;
    vec3 qn=bn.xyz;
    float cy=cos(bustYaw),sy=sin(bustYaw);
    mat2 spin=mat2(cy,-sy,sy,cy);
    q.xz=spin*q.xz; qn.xz=spin*qn.xz;
    float cp=cos(bustPitch),sp=sin(bustPitch);
    mat2 tilt=mat2(cp,-sp,sp,cp);
    q.yz=tilt*q.yz; qn.yz=tilt*qn.yz;
    q.y+=bustLift;
    vec3 bv=vec3(q.x,q.y-.28,q.z-5.3);
    float focal=1.0/tan(35.0*3.14159265/360.0);
    vec2 bndc=vec2(focal/bustAspect*bv.x,focal*bv.y)/(-bv.z);
    vec2 target=mix(bustRect.xy,bustRect.zw,bndc*.5+.5);
    float m=smoothstep(seed*.35,seed*.35+.65,morph)*assembly;
    vec2 travel=(target-position)*asp;
    vec2 arc=vec2(-travel.y,travel.x)/asp*sin(m*3.14159265)*.22*(seed-.5);
    position=mix(position,target,m)+arc;
    bustMix=m;
    vec3 key=normalize(vec3(-.4,.55,.8));
    vec3 fillLight=normalize(vec3(.6,-.1,.8));
    float lit=.14+.9*max(dot(qn,key),0.0)+.22*max(dot(qn,fillLight),0.0);
    float shade=clamp(lit*(1.0-clamp(bn.w,0.0,1.0)*.88)+clamp(-bn.w,0.0,1.0)*.18,0.0,1.0);
    bustTint=mix(vec3(.06,.26,.36),vec3(.82,.97,1.0),shade);
    // Only the visible shell, cut below the chest like the hologram.
    float shell=smoothstep(-.2,.3,qn.z)*smoothstep(-1.25,-.45,bp.y);
    bustAlpha=mix(1.0,shell*(.3+shade*.8),m);
  }
  gl_Position=vec4(position,0.0,1.0);
  float fluidSize=(2.2+seed*1.1)*pixelScale*7.0/(-view.z);
  gl_PointSize=max(1.0,mix(fluidSize*introSize,(1.8+seed*.65)*pixelScale,assembly));
  // Kept below 1 so the body keeps its hue and lighting; the veins and the
  // halo pass carry the brightness.
  vec3 birdBody=min(mix(lime*.7+citron*.3,vec3(.8,.96,1.0),.18)*birdLight*1.05,vec3(.95));
  tint=mix(tint,birdBody,assembly*.85);
  // Veins burn white-hot at the core and fringe into the electric hue.
  vec3 hot=mix(electricColor,vec3(1.0),.25)*1.25;
  tint=mix(tint,hot,clamp(electric,0.0,1.0)*assembly);
  gl_PointSize*=1.0+electric*.4*assembly;
  // A bright scan sweeps down the relief every six seconds. Depth bends
  // the band around the folds; only actual grains carry the light.
  float sweep=1.55-mod(time*.52,3.1);
  float scanDistance=screen.y+local.z*.065-sweep;
  float core=exp(-pow(scanDistance/.032,2.0));
  float shoulder=exp(-pow(scanDistance/.11,2.0));
  float trail=exp(-max(scanDistance,0.0)*5.5)*smoothstep(-.015,.035,scanDistance);
  // The sweep waits until the sea has fully surfaced.
  float scan=(core+shoulder*.6+trail*.38)*(1.0-assembly)*smoothstep(.85,1.0,intro);
  vec3 scanColor=mix(vec3(.18,1.0,.65),vec3(.62,.94,1.0),shoulder);
  tint+=scanColor*scan*1.55;
  tint=mix(tint,vec3(.86,1.0,1.0)*2.0,core*.8*(1.0-assembly)*smoothstep(.85,1.0,intro));
  gl_PointSize*=1.0+shoulder*.6*(1.0-assembly);
  alpha=mix(.8+light*.18,.95,assembly)*opacity*introAlpha;
  alpha*=mix(mix(.6,1.0,smoothstep(-.95,.4,screen.y)),1.0,assembly);
  // Disturbed matter shifts hue: a lingering aqua-to-citron wash that
  // follows the cursor's path and fades back into the sea.
  float wash=clamp(lift*1.4,0.0,1.0);
  vec3 wakeHue=mix(vec3(.38,.95,1.0),vec3(.86,1.0,.34),.5+.5*sin(time*.6+position.x*2.4+seed*1.5));
  tint=mix(tint,wakeHue*(.75+.35*light),wash*.8);
  tint+=wakeHue*min(lift,1.2)*.25;
  if(bustMix>0.0) {
    tint=mix(tint,bustTint,bustMix);
    // Hand-off: once the grains have landed the hologram canvas takes over.
    alpha*=bustAlpha*(1.0-smoothstep(.8,.97,morph));
    gl_PointSize=mix(gl_PointSize,(1.5+seed*.8)*pixelScale,bustMix);
  }
  if(glowPass>.5) {
    // Halo pass: only bird grains, drawn large and soft with additive blend.
    if(assembly<.05) {alpha=0.0;gl_Position=vec4(2.0,2.0,2.0,1.0);return;}
    // Halo mostly around live veins and sparks; the body keeps only a faint
    // lime aura (no red/blue, which washed the green body out to grey).
    tint=mix(vec3(.3,.85,.05),electricColor*1.4,clamp(electric,0.0,1.0));
    alpha=(.006+electric*.18)*assembly*opacity*(1.0-morph);
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
  for(int i=0;i<60;i++) {
    vec3 p=ro+rd*distance;
    float d=shape(vec3(p.x/spread,p.y,p.z));
    if(d<.009) {hit=1.0;break;}
    distance+=max(d*.55,.008);
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
  intro: number;
  bust: {
    texture: WebGLTexture | null; ready: boolean; rows: number; count: number;
    rect: Float32Array; aspect: number; yaw: number; pitch: number; lift: number; morph: number;
  };
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
  const uniforms=Object.fromEntries(["resolution","grid","pointer","time","fieldTime","activity","opacity","pixelScale","hero","birdReady","flap","finale","birdMatrix","birdView","birdProjection","birdPositions","birdNormals","edgeAges","trail","burst","glowPass","intro","bustData","bustRows","bustCount","bustRect","bustAspect","bustYaw","bustPitch","bustLift","morph"].map(name=>[name,gl.getUniformLocation(program,name)]));
  let flowTime=0,lastTime=0,lastProbe=-1;
  let sourceX=0,sourceY=0,sourceActivity=0;
  let mapDirty=true;
  const impactAt=new Float32Array([-100,-100,-100,-100]);
  const edgeAges=new Float32Array(4);
  const edgeTouching=[false,false,false,false];
  let edgePixels=new Uint8Array(0);
  // Edge contact probe reads back asynchronously (PBO + fence): a plain
  // readPixels stalls until the GPU drains, which caused periodic hitches.
  const probeBuffer=gl.createBuffer();
  let probeFence: WebGLSync|null=null;
  let probeEdges: number[][]=[];
  const collectProbe=()=>{
    if(!probeFence) return;
    const status=gl.clientWaitSync(probeFence,0,0);
    if(status!==gl.ALREADY_SIGNALED && status!==gl.CONDITION_SATISFIED) return;
    gl.deleteSync(probeFence);probeFence=null;
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER,probeBuffer);
    gl.getBufferSubData(gl.PIXEL_PACK_BUFFER,0,edgePixels);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
    let offset=0;
    probeEdges.forEach(([,,width,height],edge)=>{
      let contacts=0;
      for(let i=0;i<width*height;i++) if(edgePixels[(offset+i)*4+2]>250) contacts++;
      offset+=width*height;
      const touching=contacts>2;
      if(touching && !edgeTouching[edge] && flowTime-impactAt[edge]>4.0) impactAt[edge]=flowTime;
      edgeTouching[edge]=touching;
    });
  };
  return {
    render(w: number,h: number,time: number,opacity: number,px: number,py: number,activity: number,flight: SculptureFlight) {
      collectProbe();
      if(opacity<.002) return;
      const delta=Math.max(0,Math.min(time-lastTime,.05)); lastTime=time;
      // The bird samples its source positions from the surface map, so the
      // flow must be still while grains gather. It eases to rest over the
      // start of the assembly instead of stopping on the first scroll tick,
      // which read as the field freezing.
      const holdT=Math.min(1,Math.max(0,(flight.hero-.03)/.19));
      const hold=flight.finale>.98 || flight.ready<.95 ? 0 : holdT*holdT*(3-2*holdT);
      const flowing=hold<.999;
      if(flowing) {
        flowTime+=delta*(1-hold);sourceX=px;sourceY=py;
        sourceActivity+=(activity-sourceActivity)*(1-Math.exp(-5*delta));mapDirty=true;
      }
      const count=mobile?70000:220000;
      const columns=Math.round(Math.sqrt(count*w/h));
      const rows=Math.ceil(count/columns);
      gl.bindVertexArray(vao);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      const scale=Math.min(1,(mobile?224:320)/Math.max(w,h));
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
        if(flowing && !probeFence && flowTime-lastProbe>.25) {
          lastProbe=flowTime;
          probeEdges=[[0,0,1,mh],[mw-1,0,1,mh],[0,0,mw,1],[0,mh-1,mw,1]];
          const bytes=(mw+mh)*2*4;
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER,probeBuffer);
          if(edgePixels.length!==bytes) {
            edgePixels=new Uint8Array(bytes);
            gl.bufferData(gl.PIXEL_PACK_BUFFER,bytes,gl.STREAM_READ);
          }
          let offset=0;
          probeEdges.forEach(([x,y,width,height])=>{
            gl.readPixels(x,y,width,height,gl.RGBA,gl.UNSIGNED_BYTE,offset);
            offset+=width*height*4;
          });
          gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
          probeFence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);
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
      gl.uniform1f(uniforms.intro,flight.intro);
      const bust=flight.bust;
      const morph=bust.ready?bust.morph:0;
      gl.uniform1f(uniforms.morph,morph);
      if(morph>0) {
        gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,bust.texture);
        gl.uniform1i(uniforms.bustData,5);
        gl.uniform1f(uniforms.bustRows,bust.rows);gl.uniform1f(uniforms.bustCount,bust.count);
        gl.uniform4fv(uniforms.bustRect,bust.rect);gl.uniform1f(uniforms.bustAspect,bust.aspect);
        gl.uniform1f(uniforms.bustYaw,bust.yaw);gl.uniform1f(uniforms.bustPitch,bust.pitch);
        gl.uniform1f(uniforms.bustLift,bust.lift);
      }
      // Constant draw count and frozen source mask throughout assembly.
      gl.drawArrays(gl.POINTS,0,columns*rows);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
      // Additive halo over the forming bird. A subset of IDs still covers
      // every anatomy sample (index = id*37 mod 9000).
      if(flight.hero>.06 && flight.ready>.5 && flight.finale<.98 && morph<.98) {
        gl.uniform1f(uniforms.glowPass,1);
        // Add light only: leave destination alpha untouched, or the halo's
        // accumulated alpha greys the transparent, premultiplied canvas.
        gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ZERO,gl.ONE);
        gl.drawArrays(gl.POINTS,0,Math.min(columns*rows,mobile?3000:6000));
        gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
        gl.uniform1f(uniforms.glowPass,0);
      }
    },
    dispose() {gl.deleteProgram(program);gl.deleteProgram(surfaceProgram);gl.deleteTexture(texture);gl.deleteFramebuffer(target);gl.deleteBuffer(probeBuffer);if(probeFence) gl.deleteSync(probeFence);gl.deleteVertexArray(vao);},
  };
}
