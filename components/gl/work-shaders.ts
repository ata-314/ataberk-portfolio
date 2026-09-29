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
out vec3 vWorld; out vec3 vNormal; out vec3 vNormalV; out vec2 vUv; out vec3 vLocal; flat out int vFace;
void main(){
  vec4 w=uModel*vec4(aPos,1.0);
  vWorld=w.xyz; vNormal=normalize(mat3(uModel)*aNormal);
  vNormalV=mat3(uView)*vNormal;
  vUv=aUv; vLocal=aPos; vFace=int(aFace+.5);
  gl_Position=uProj*uView*w;
}`;

// Glass cards. The scene behind (a blurred, mip-mapped grab of the frame so
// far) is refracted through the slab — bent hardest across the bevel, split
// into colour at the rim — then tinted and lit, with the slot's colour
// world floating inside the glass. Under the cursor the colours ripple out
// in rings and are dragged along with its motion; the project's name hangs
// in the glass as a flickering, channel-split hologram.
export const cardFragment = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec3 vNormalV; in vec2 vUv; in vec3 vLocal; flat in int vFace;
uniform vec3 uCam; uniform vec3 uDeep,uMid,uGlow;
uniform vec2 uHalf; uniform float uRadius,uAspect;
uniform float uTime,uSeed,uAlpha,uHover,uDim,uSweep,uSolid;
uniform sampler2D uTitles; uniform float uRow,uRows,uTitleOn;
uniform vec3 uAxisX,uAxisY;
uniform sampler2D uScene; uniform vec2 uResolution; uniform float uGlass;
uniform vec2 uCursorUv,uCursorVel; uniform float uCursorLight;
out vec4 color;
${nebulaChunk}
float sdRound(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
// Title cell: 4:1, centred on the face; outside it, nothing.
float title(vec2 tuv,float lod){
  if(tuv.x<0.0||tuv.x>1.0||tuv.y<0.0||tuv.y>1.0) return 0.0;
  return textureLod(uTitles,vec2(tuv.x,(uRow+1.0-tuv.y)/uRows),lod).a;
}
vec3 behind(vec2 suv,vec2 bend,float lod){
  vec3 c;
  c.r=textureLod(uScene,suv-bend*1.06,lod).r;
  c.g=textureLod(uScene,suv-bend,lod).g;
  c.b=textureLod(uScene,suv-bend*.94,lod).b;
  return c;
}
void main(){
  vec3 N=normalize(vNormal);
  vec3 V=normalize(uCam-vWorld);
  float fres=pow(1.0-abs(dot(N,V)),3.0);
  float d=sdRound(vLocal.xy,uHalf,uRadius);
  vec2 suv=gl_FragCoord.xy/uResolution;
  vec2 nv=normalize(vNormalV).xy;
  vec3 tint=mix(vec3(.82,.95,1.0),uMid,.18);
  vec3 c; float a;
  if(vFace==2){
    // The slab's edge: dense glass, strongly bent light, a travelling gleam.
    vec3 b=uGlass>.5?behind(suv,nv*.03,2.0):vec3(0);
    float band=.5+.5*sin(vLocal.x*9.0+vLocal.y*7.0+uTime*.6);
    c=b*tint*.7+mix(uMid*.2,vec3(.55,.95,.92),.4)*(.25+.8*fres)+vec3(.85,1.0,.96)*pow(band,8.0)*.3;
    a=uGlass>.5?1.0:.9;
  } else {
    vec2 uv=vUv;
    // Cursor ripples: rings travel out from the pointed spot and the
    // colours are carried along with the pointer's motion.
    vec2 g=(vUv-uCursorUv)*vec2(uAspect,1.0);
    float gd=length(g);
    float reach=exp(-gd*3.2)*uCursorLight;
    float wave=sin(gd*26.0-uTime*4.5)*reach;
    uv+=(g/max(gd,1e-3))/vec2(uAspect,1.0)*wave*.022;
    uv-=uCursorVel*exp(-gd*5.0)*uCursorLight*.05;
    float swirl=reach*.35*sin(uTime*.8);
    vec2 r=uv-uCursorUv;
    uv=uCursorUv+mat2(cos(swirl),-sin(swirl),sin(swirl),cos(swirl))*r;
    vec3 pic=nebula(uv,uAspect,uTime,uSeed,uDeep,uMid,uGlow);
    pic*=1.0+wave*.35;
    float inner=smoothstep(-.08,0.0,d);
    float rim=exp(-abs(d+.006)*240.0);
    // Refraction: the face bends a little, the bevel a lot.
    vec2 bend=nv*(.012+inner*inner*.07);
    float lum=dot(pic,vec3(.3,.5,.2));
    if(vFace==1){
      vec3 b=uGlass>.5?behind(suv,bend,3.2):vec3(0);
      c=b*tint*.55+uDeep*.25+pic*.12;
      a=uGlass>.5?1.0:.85;
    } else {
      vec3 b=uGlass>.5?mix(behind(suv,bend,3.4),behind(suv,bend,1.2),inner*.6):vec3(0);
      // The colour world lives inside the glass: strong where it is bright,
      // letting the frosted world behind breathe through the dark parts.
      float body=mix(.55,.85,uSolid)*(.55+.6*smoothstep(.04,.4,lum));
      c=b*tint*(1.0-body*.6)+pic*body*(.95+.3*uHover);
      c+=vec3(.55,1.0,.94)*inner*.16+vec3(.88,1.0,.98)*rim*(.9+uHover*.35);
      float s=uv.x*.9+uv.y*.45-uSweep;
      c+=vec3(.9,1.0,1.0)*exp(-s*s*40.0)*.16;
      // Hologram title, floating a little above the glass (parallax from
      // the view angle), split into channels, scanned and flickering.
      if(uTitleOn>.5){
        vec2 par=vec2(dot(V,uAxisX),dot(V,uAxisY))*-.03;
        vec2 tuv=(vUv+par-.5)/vec2(.84,.339)+.5;
        float row=floor(tuv.y*18.0);
        float tear=step(.93,h21(vec2(row,floor(uTime*6.0)+uSeed)));
        tuv.x+=tear*(h21(vec2(row,floor(uTime*11.0)))-.5)*.05;
        float ca=.0035+tear*.01;
        vec3 ink=vec3(title(tuv+vec2(ca,0),0.0),title(tuv,0.0),title(tuv-vec2(ca,0),0.0));
        float halo=title(tuv,3.5);
        float scan=.72+.28*sin(gl_FragCoord.y*1.25-uTime*9.0);
        float flicker=.9+.1*sin(uTime*23.0+uSeed*9.0)*sin(uTime*7.3);
        vec3 holo=mix(vec3(.62,1.0,.96),uGlow,.22);
        c+=holo*ink*scan*flicker*1.7+holo*halo*.35;
      }
      c+=vec3(.45,.85,1.0)*fres*.55;
      vec2 q=uv-.5; c*=1.0-dot(q,q)*.7;
      a=uGlass>.5?1.0:min(.98,mix(.55,.97,inner)*(.8+.35*smoothstep(.05,.45,lum)));
    }
  }
  c*=uDim;
  color=vec4(c,a*uAlpha);
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

// The far background: the hero's particle sea stood on end as a curved
// wall behind the helix. Grains ride slow, layered waves (displaced toward
// the camera), light up along the crests and in bands that stream with the
// flight — up while the bird dives, down while it climbs.
export const dataVertex = `#version 300 es
precision highp float;
uniform mat4 uView,uProj;
uniform vec2 uGrid;
uniform float uTime,uTravel,uAmount,uDpr;
out vec3 vColor; out float vAlpha;
float h11(float x){return fract(sin(x*127.1)*43758.5453);}
void main(){
  float id=float(gl_VertexID);
  vec2 cell=vec2(mod(id,uGrid.x),floor(id/uGrid.x));
  vec2 j=vec2(h11(id*.37),h11(id*.71+3.0))-.5;
  vec2 g=(cell+.5+j*.8)/uGrid;
  float u=g.x*2.0-1.0;
  float span=11.0;
  float v=(g.y-.5)*span;
  float t=uTime*.18, tr=uTravel*1.2;
  // Layered travelling waves across the sheet.
  float h=sin(u*3.1+v*.55-t*1.3+tr*.4)*.55
         +sin(u*6.3-v*.9+t*1.7+tr*.7)*.25
         +sin(u*1.4+v*1.3+t*.8-tr*.5)*.35
         +sin(u*11.0+v*2.3-t*2.4+tr)*.08;
  float ang=u*1.75;
  float radius=9.0-h*1.1;
  vec3 p=vec3(sin(ang)*radius,v+sin(u*2.0+t)*.25,-cos(ang)*radius-1.5);
  vec4 view=uView*vec4(p,1.0);
  gl_Position=uProj*view;
  float crest=smoothstep(.15,.95,h);
  float band=pow(.5+.5*sin(v*2.2-tr*3.0+u*2.4+h*2.0),6.0);
  float lit=crest*.75+band*.55;
  gl_PointSize=max(1.0,(1.3+lit*1.4+h11(id)*.6)*uDpr*1.4);
  vec3 deep=vec3(.03,.2,.22), mid=vec3(.35,.78,.42), peak=vec3(.78,1.0,.24);
  vec3 col=mix(deep,mid,smoothstep(0.0,.6,lit));
  col=mix(col,peak,smoothstep(.55,1.1,lit));
  col=mix(col,vec3(.95,.97,.9)*1.4,smoothstep(1.0,1.3,lit)*.6);
  float edge=(1.0-smoothstep(.55,1.0,abs(u)))*(1.0-smoothstep(span*.32,span*.5,abs(v)));
  vColor=col;
  vAlpha=(.12+lit*.75)*edge*uAmount;
}`;

export const dataFragment = `#version 300 es
precision highp float;
in vec3 vColor; in float vAlpha;
out vec4 color;
void main(){
  vec2 q=gl_PointCoord*2.0-1.0;
  float a=(1.0-smoothstep(.35,1.0,dot(q,q)))*vAlpha;
  color=vec4(vColor*a,a);
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
