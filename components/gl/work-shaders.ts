// Shaders for the selected-work helix (see work-helix-layer.ts): glass
// project cards, the beads shed round the diving bird, the
// scene's atmosphere and the particle interior of an opened card.

// Value noise + fbm, and the card "world": a slow ink nebula in the slot's
// three colours. Cards and the opened interior sample the same function, so
// the particles are literally the card's picture coming apart.
export const nebulaChunk = `
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.0,a=.5;mat2 r=mat2(.8,-.6,.6,.8);
  for(int i=0;i<4;i++){v+=a*vnoise(p);p=r*p*2.03+11.7;a*=.5;}return v;}
vec3 nebula(vec2 uv,float aspect,float t,float seed,vec3 deep,vec3 mid,vec3 glow){
  vec2 p=(uv-.5)*vec2(aspect,1.0)*1.7+seed*7.3;
  float n1=fbm(p+vec2(t*.045,-t*.03));
  float n2=fbm(p*1.6+n1*1.9-vec2(t*.035,t*.02));
  float n3=fbm(p*3.2+n2*1.4+t*.025);
  vec3 c=deep*.55;
  c=mix(c,mid*.9,smoothstep(.38,.82,n2));
  c=mix(c,glow,smoothstep(.62,.95,n1*.6+n2*.6)*.8);
  c+=glow*pow(smoothstep(.55,1.0,n3),3.0)*1.3;
  c*=.55+.75*smoothstep(.15,.85,n1);
  // A soft key light drifting across the picture.
  vec2 k=vec2(.5+.28*sin(t*.11+seed*3.0),.55+.2*cos(t*.09+seed));
  c+=mid*.35*exp(-dot(uv-k,uv-k)*7.0);
  return c;
}`;

export const cardVertex = `#version 300 es
precision highp float;
in vec3 aPos; in vec3 aNormal; in vec2 aUv; in float aFace;
uniform mat4 uModel,uView,uProj;
out vec3 vWorld; out vec3 vNormal; out vec2 vUv; out vec3 vLocal; flat out int vFace;
void main(){
  vec4 w=uModel*vec4(aPos,1.0);
  vWorld=w.xyz; vNormal=normalize(mat3(uModel)*aNormal);
  vUv=aUv; vLocal=aPos; vFace=int(aFace+.5);
  gl_Position=uProj*uView*w;
}`;

export const cardFragment = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec2 vUv; in vec3 vLocal; flat in int vFace;
uniform vec3 uCam; uniform vec3 uDeep,uMid,uGlow;
uniform vec2 uHalf; uniform float uRadius,uAspect;
uniform float uTime,uSeed,uAlpha,uHover,uDim,uSweep,uGlitch,uSolid;
out vec4 color;
${nebulaChunk}
float sdRound(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
void main(){
  vec3 N=normalize(vNormal);
  vec3 V=normalize(uCam-vWorld);
  float facing=abs(dot(N,V));
  float fres=pow(1.0-facing,3.0);
  float d=sdRound(vLocal.xy,uHalf,uRadius);
  vec3 c; float a;
  if(vFace==2){
    // Thick glass edge: cool, lit along its length, brightest at grazing.
    float band=.5+.5*sin(vLocal.x*9.0+vLocal.y*7.0+uTime*.6);
    c=mix(uMid*.25,vec3(.55,.95,.92),.45)*(.35+.9*fres)+vec3(.8,1.0,.96)*pow(band,8.0)*.35;
    c+=uGlow*uHover*.4;
    a=.9;
  } else {
    vec2 uv=vUv;
    // Hover glitch: a few horizontal slices shift and split channels.
    float slice=step(.82,h21(vec2(floor(uv.y*26.0),floor(uTime*14.0))))*uGlitch;
    uv.x+=slice*(h21(vec2(floor(uv.y*26.0),floor(uTime*9.0)))-.5)*.08;
    vec3 pic=nebula(uv,uAspect,uTime,uSeed,uDeep,uMid,uGlow);
    if(slice>0.0){
      pic.r=nebula(uv+vec2(.012,0),uAspect,uTime,uSeed,uDeep,uMid,uGlow).r;
      pic.b=nebula(uv-vec2(.012,0),uAspect,uTime,uSeed,uDeep,uMid,uGlow).b;
    }
    if(vFace==1) pic=pic*.22+uDeep*.2;
    // Frosted glass over the picture, a bevel that catches light inside the
    // border, a crisp rim line and a specular sweep that travels as the
    // helix turns.
    float inner=smoothstep(-.07,0.0,d);
    float rim=exp(-abs(d+.006)*260.0);
    float scan=.96+.04*sin(uv.y*420.0);
    c=pic*scan*(.82+.3*uHover);
    c=mix(c,vec3(.42,.62,.66)*.28,.12+inner*.25);
    c+=vec3(.5,1.0,.92)*inner*.22+vec3(.85,1.0,.97)*rim*(1.1+uHover*.8);
    float s=uv.x*.9+uv.y*.45-uSweep;
    c+=vec3(.9,1.0,1.0)*exp(-s*s*38.0)*.22;
    c+=vec3(.45,.85,1.0)*fres*.7;
    // Vignette inside the frame, like a lit screen behind glass.
    vec2 q=uv-.5; c*=1.0-dot(q,q)*.9;
    // Glass: the world behind (the bird, far cards) shows through the
    // picture; the bright parts of the picture hold more.
    float lum=dot(pic,vec3(.3,.5,.2));
    a=mix(mix(.5,.97,inner),.97,uSolid)*(.8+.35*smoothstep(.05,.45,lum));
    a=min(a,.98);
  }
  c*=uDim;
  color=vec4(c,a*uAlpha);
}`;

// Beads round the bird, in its own grain palette. Two populations: beads
// shed off its body that peel away and trail behind the flight (upward
// while it dives, downward while it climbs), and fine air motes streaming
// past on the travel clock, so the fall reads as speed through air.
export const beadVertex = `#version 300 es
precision highp float;
in vec4 aSeed;
uniform mat4 uView,uProj;
uniform float uTime,uPx,uAmount,uFlow,uTravel,uSpeed,uLen;
uniform vec3 uBird;
out float vAlpha; out vec3 vColor; out float vMote;
void main(){
  vec4 s=aSeed;
  float t=uTime;
  vec3 p; float size; float life;
  vMote=step(.5,s.w);
  if(s.w<.5){
    // Peel off the body, spin out and fall behind the flight.
    life=fract(s.z+t*(.16+s.x*.2)*(.7+uSpeed*.8));
    float along=(s.x-.5)*uLen;
    float ang=s.y*6.2832+life*(1.2+s.x*1.6)*(fract(s.w*9.1)>.5?1.0:-1.0);
    float r=.06+life*(.35+s.y*.9)+life*life*.5;
    p=uBird+vec3(sin(ang)*r,along+uFlow*life*life*(1.4+s.y*2.2)*(.8+uSpeed),cos(ang)*r*.8);
    size=mix(.018,.045,fract(s.y*7.3))*(1.0-life*.55);
  } else {
    float span=10.0;
    life=fract(s.z+uTravel*(.35+s.x*.5));
    float r=mix(.9,5.2,pow(fract(s.x*3.7+s.y),1.2));
    float ang=s.y*6.2832+t*.03*(fract(s.w*13.0)>.5?1.0:-1.0);
    p=vec3(sin(ang)*r,(life-.5)*span,cos(ang)*r*.85-1.2);
    size=mix(.008,.022,fract(s.y*5.3));
  }
  float edge=smoothstep(0.0,.1,life)*(1.0-smoothstep(.75,1.0,life));
  vec4 view=uView*vec4(p,1.0);
  gl_Position=uProj*view;
  gl_PointSize=clamp(size*uPx/max(-view.z,.3),1.2,40.0);
  float twinkle=.7+.3*sin(t*(2.0+s.x*5.0)+s.y*40.0);
  vAlpha=edge*uAmount*twinkle*smoothstep(.2,1.5,-view.z)*(vMote>.5?.55+uSpeed*.6:1.0);
  float hue=fract(s.y*3.1+s.z);
  vColor=hue<.62?vec3(.953,.937,.906):hue<.9?vec3(.541,.902,1.0):vec3(.784,1.0,.243);
}`;

export const beadFragment = `#version 300 es
precision highp float;
in float vAlpha; in vec3 vColor; in float vMote;
out vec4 color;
void main(){
  vec2 q=gl_PointCoord*2.0-1.0;
  float r2=dot(q,q);
  if(r2>1.0) discard;
  // A lit glass bead: sphere shading, a hot core and one specular point.
  vec3 n=vec3(q.x,-q.y,sqrt(1.0-r2));
  float light=max(dot(n,normalize(vec3(-.4,.55,.75))),0.0);
  float spec=pow(max(dot(reflect(-normalize(vec3(-.4,.55,.75)),n),vec3(0,0,1)),0.0),24.0);
  vec3 c=vColor*(.35+.9*light)+vec3(1.0)*spec*1.4;
  c=mix(c,vColor*1.6,vMote);
  float a=(1.0-smoothstep(.75,1.0,r2))*vAlpha;
  color=vec4(c*a,a);
}`;

// Fullscreen passes share one vertex stage.
export const fullscreenVertex = `#version 300 es
precision highp float;
out vec2 uv;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;

// Atmosphere behind the helix: violet low-left, teal high-right and a
// faint shaft of light down the axis the bird falls along.
export const atmosphereFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform float uAmount,uTime,uAspect;
uniform vec2 uAxis;
out vec4 color;
void main(){
  vec2 p=uv;
  vec3 c=vec3(.26,.1,.48)*exp(-dot((p-vec2(.05,.02))*vec2(uAspect,1.0),(p-vec2(.05,.02))*vec2(uAspect,1.0))*1.4)*.55;
  c+=vec3(.05,.34,.38)*exp(-dot((p-vec2(.95,.95))*vec2(uAspect,1.0),(p-vec2(.95,.95))*vec2(uAspect,1.0))*1.2)*.5;
  float shaft=exp(-pow((p.x-uAxis.x)*uAspect*3.2,2.0));
  float drift=.6+.4*sin(p.y*7.0+uTime*.8)*sin(p.y*3.1-uTime*.5);
  c+=vec3(.3,.55,.7)*shaft*drift*.09;
  color=vec4(c*uAmount,0.0);
}`;

// Darkens the world behind an opened card: near-black teal with slow
// horizontal smoke, like the scene smeared out of focus.
export const veilFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform float uAmount,uTime,uAspect;
uniform vec3 uTint;
out vec4 color;
${nebulaChunk}
void main(){
  float smoke=fbm(vec2(uv.x*uAspect*1.2-uTime*.05,uv.y*7.0));
  vec3 c=vec3(.014,.022,.026)+uTint*smoke*smoke*.05;
  vec2 q=uv-.5; c*=1.0-dot(q,q)*.8;
  color=vec4(c,.94*uAmount);
}`;

// The card, opened: its picture as a grid of pixel grains in front of the
// camera. Comets of light rake across it, blowing grains out of place into
// glowing wakes that settle back; opening assembles the grid with a wipe,
// closing scatters it.
export const insideVertex = `#version 300 es
precision highp float;
uniform vec2 uGrid;
uniform vec4 uRect; // centre xy, half size zw (NDC)
uniform float uTime,uClock,uAssemble,uComets,uAspect,uPanelAspect,uSeed,uCellPx;
uniform vec3 uDeep,uMid,uGlow;
// Cursor wake in panel space: xy position, zw velocity; weights apart.
uniform vec4 uTrail[8];
uniform float uTrailW[8];
uniform vec4 uBurst; // xy centre, z age (s), w strength
out vec3 vColor; out float vAlpha; out float vHot; out float vBead;
${nebulaChunk}
vec2 comet(float i,float t){
  float w=.23+i*.07;
  return vec2(sin(t*w*2.1+i*2.4)*1.25*uPanelAspect,sin(t*w*3.3+i*4.1+sin(t*w*.7)*1.3)*.95);
}
void main(){
  float id=float(gl_VertexID);
  vec2 cell=vec2(mod(id,uGrid.x),floor(id/uGrid.x));
  vec2 uv=(cell+.5)/uGrid;
  vec2 home=(uv*2.0-1.0)*vec2(uPanelAspect,1.0);
  float r1=h21(cell+uSeed),r2=h21(cell.yx+3.1);
  vec3 pic=nebula(uv,uPanelAspect,uTime,uSeed,uDeep,uMid,uGlow);
  vec3 p=vec3(home,0.0);
  float hot=0.0,stir=0.0;
  for(int c=0;c<2;c++){
    for(int k=0;k<7;k++){
      float lag=float(k)*.075;
      vec2 a=comet(float(c),uClock-lag),b=comet(float(c),uClock-lag-.02);
      vec2 vel=(a-b)/.02;
      vec2 dv=home-a;
      float w=exp(-dot(dv,dv)*(7.0+float(k)*1.2))*(1.0-float(k)/7.0)*uComets;
      vec2 side=normalize(vec2(-vel.y,vel.x)+1e-4);
      p.xy+=(normalize(vel+1e-4)*.1+side*sign(dot(dv,side))*.07*(r1-.2))*w;
      p.z+=w*(.22+r2*.3);
      stir+=w;
      if(k==0) hot+=exp(-dot(dv,dv)*40.0)*uComets;
    }
  }
  // The cursor parts the picture into beads: grains near it lift off and
  // roll aside along its stroke, and settle back as the wake fades.
  float bead=0.0;
  for(int i=0;i<8;i++){
    float tw=uTrailW[i];
    if(tw<.002) continue;
    vec2 dv=home-uTrail[i].xy;
    float w=exp(-dot(dv,dv)*14.0)*tw;
    vec2 out2=dv/max(length(dv),1e-3);
    p.xy+=out2*w*(.18+r1*.14)+uTrail[i].zw*w*.035;
    p.z+=w*(.35+r2*.45);
    bead+=w;
  }
  // A click bursts a ring of beads outward from the point.
  if(uBurst.w>0.0){
    vec2 dv=home-uBurst.xy;
    float d=length(dv);
    float ring=exp(-pow((d-uBurst.z*1.9)*5.0,2.0))*exp(-uBurst.z*1.6)*uBurst.w;
    float core=exp(-d*d*9.0)*exp(-uBurst.z*3.0)*uBurst.w;
    p.xy+=dv/max(d,1e-3)*(ring*.3+core*.4)*(.6+r1*.8);
    p.z+=(ring+core)*(.5+r2*.6);
    bead+=ring+core;
    hot+=ring*.6;
  }
  bead=min(bead,1.0);
  stir+=bead*.6;
  // Ragged border: grains near the edge fray loose and drift.
  vec2 e=abs(uv*2.0-1.0);
  float fray=smoothstep(.9,1.0,max(e.x,e.y))*step(.55,r1);
  p.xy+=vec2(r2-.5,r1-.5)*fray*.14+sign(home)*fray*r2*.05*(1.0+sin(uTime*.7+r1*20.0));
  // Grains in a wake jitter off their cells.
  p.xy+=(vec2(r1,r2)-.5)*.09*min(stir,1.0);
  // Assembly: a left-to-right wipe from scattered, lifted grains.
  float gate=smoothstep(uv.x*.55+r1*.12,uv.x*.55+r1*.12+.35,uAssemble);
  vec2 away=normalize(vec2(r1-.5,r2-.5)+1e-3);
  p.xy+=away*(1.0-gate)*(1.2+r2*1.4);
  p.z+=(1.0-gate)*(.8+r1);
  float persp=1.0/max(1.0-p.z*.28,.2);
  vec2 ndc=uRect.xy+p.xy/vec2(uPanelAspect,1.0)*uRect.zw*persp;
  gl_Position=vec4(ndc,0.0,1.0);
  gl_PointSize=uCellPx*(1.12+min(stir,1.0)*.45+min(hot,1.0)*1.3)*persp;
  vec3 col=pic*(1.0+min(stir,1.5)*.9);
  col=mix(col,vec3(.85,.97,1.0)*2.2,min(hot,1.0)*.9);
  col=mix(col,col*vec3(.7,.95,1.2)+vec3(.05,.12,.18),min(stir,1.0)*.5);
  vColor=col;
  vAlpha=gate*(1.0-min(stir,1.0)*.25*r2);
  vHot=min(hot+stir*.3,1.0);
  vBead=max(bead,min(stir,1.0));
}`;

export const insideFragment = `#version 300 es
precision highp float;
in vec3 vColor; in float vAlpha; in float vHot; in float vBead;
out vec4 color;
void main(){
  vec2 c2=gl_PointCoord*2.0-1.0;
  vec2 q=abs(c2);
  // At rest the grains tile the picture as pixels; stirred, each becomes a
  // lit bead with its own highlight.
  float sq=1.0-smoothstep(.62,1.0,max(q.x,q.y));
  float r2=dot(c2,c2);
  float disc=1.0-smoothstep(.55,1.0,r2);
  vec3 n=vec3(c2.x,-c2.y,sqrt(max(1.0-r2,0.0)));
  float light=max(dot(n,normalize(vec3(-.4,.55,.75))),0.0);
  float spec=pow(max(n.z*.6+n.y*.4-n.x*.3,0.0),18.0);
  vec3 beadCol=vColor*(.45+.8*light)+vec3(1.0)*spec*.9;
  vec3 col=mix(vColor,beadCol,vBead);
  float a=mix(sq,disc,max(vBead,vHot))*vAlpha;
  color=vec4(col,a);
}`;
