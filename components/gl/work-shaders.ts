// Shaders for the selected-work helix (see work-helix-layer.ts): glass
// project cards, the bubble-and-light swarm round the diving bird, the
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

// Bubbles and lights. Two populations: a swarm on a slow vortex round the
// helix axis that rises as the bird dives (scroll lifts it too), and a
// stream breathed off the bird's body that drifts outward.
export const bubbleVertex = `#version 300 es
precision highp float;
in vec4 aSeed;
uniform mat4 uView,uProj;
uniform float uTime,uRise,uPx,uAmount;
uniform vec3 uBird;
out float vKind; out float vAlpha; out float vHue; out float vSpark;
void main(){
  vec4 s=aSeed;
  float t=uTime;
  vec3 p; float size; float life;
  vKind=step(.72,fract(s.w*7.31));
  if(s.w<.35){
    // Breathed off the bird: born on its body, spiral outward and up.
    life=fract(s.z+t*(.07+s.x*.08));
    float ang=s.y*6.2832+life*2.4*(s.x>.5?1.0:-1.0);
    float r=.12+life*(1.2+s.x*1.8);
    p=uBird+vec3(sin(ang)*r,(life*life)*2.2+(s.x-.5)*.6,cos(ang)*r*.8);
  } else {
    float span=10.0;
    life=fract(s.z+t*(.012+s.x*.018)+uRise*.08);
    float r=mix(.6,4.2,pow(fract(s.x*3.7+s.y),1.4));
    float ang=s.y*6.2832+t*(.05+s.x*.08)*(fract(s.w*13.0)>.5?1.0:-1.0);
    p=vec3(sin(ang)*r,(life-.5)*span,cos(ang)*r*.9-.4);
    p.x+=sin(t*.9+s.y*31.0)*.05;
  }
  float edge=smoothstep(0.0,.12,life)*(1.0-smoothstep(.8,1.0,life));
  vec4 view=uView*vec4(p,1.0);
  gl_Position=uProj*view;
  size=vKind>.5?mix(.012,.03,s.x):mix(.02,.11,pow(fract(s.y*5.3),3.0));
  gl_PointSize=clamp(size*uPx/max(-view.z,.3),1.5,90.0);
  float twinkle=.55+.45*sin(t*(2.0+s.x*5.0)+s.y*40.0);
  vAlpha=edge*uAmount*(vKind>.5?twinkle:1.0)*smoothstep(.2,1.5,-view.z);
  vHue=fract(s.y*3.1+s.z);
  vSpark=twinkle;
}`;

export const bubbleFragment = `#version 300 es
precision highp float;
in float vKind; in float vAlpha; in float vHue; in float vSpark;
out vec4 color;
void main(){
  vec2 q=gl_PointCoord*2.0-1.0;
  float r=length(q);
  if(r>1.0) discard;
  vec3 c; float a;
  if(vKind>.5){
    // A point of light with a soft halo.
    float core=exp(-r*r*14.0), halo=exp(-r*r*3.0)*.35;
    c=mix(vec3(.55,.95,1.0),vec3(1.0,.62,.95),vHue)*(core*2.4+halo);
    a=(core+halo)*vAlpha;
  } else {
    // Soap bubble: thin-film rainbow rim, clear body, one window highlight.
    float ring=smoothstep(.7,.96,r)*(1.0-smoothstep(.96,1.0,r));
    vec3 film=.5+.5*cos(6.2832*(vec3(0.0,.33,.67)+r*1.6+q.y*.6+vHue));
    film=mix(film,vec3(.6,.95,1.0),.25);
    vec2 h=q-vec2(-.38,.4);
    float hl=exp(-dot(h,h)*30.0)*1.6+exp(-dot(q+vec2(-.3,.42),q+vec2(-.3,.42))*80.0)*.6;
    c=film*ring*1.25+vec3(1.0)*hl+film*.035;
    a=(ring*.85+hl*.8+.035)*vAlpha;
  }
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
out vec3 vColor; out float vAlpha; out float vHot;
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
}`;

export const insideFragment = `#version 300 es
precision highp float;
in vec3 vColor; in float vAlpha; in float vHot;
out vec4 color;
void main(){
  vec2 q=abs(gl_PointCoord*2.0-1.0);
  float sq=1.0-smoothstep(.62,1.0,max(q.x,q.y));
  float round=exp(-dot(q,q)*2.5);
  float a=mix(sq,round,vHot)*vAlpha;
  color=vec4(vColor,a);
}`;
