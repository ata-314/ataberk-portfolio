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
// world floating inside the glass. The cursor casts a glare that follows it
// across the face; a specular band sweeps as the helix turns.
export const cardFragment = `#version 300 es
precision highp float;
in vec3 vWorld; in vec3 vNormal; in vec3 vNormalV; in vec2 vUv; in vec3 vLocal; flat in int vFace;
uniform vec3 uCam; uniform vec3 uDeep,uMid,uGlow;
uniform vec2 uHalf; uniform float uRadius,uAspect;
uniform float uTime,uSeed,uAlpha,uHover,uDim,uSweep,uGlitch,uSolid;
uniform sampler2D uScene; uniform vec2 uResolution; uniform float uGlass;
uniform vec2 uCursorUv; uniform float uCursorLight;
out vec4 color;
${nebulaChunk}
float sdRound(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r;}
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
    float slice=step(.82,h21(vec2(floor(uv.y*26.0),floor(uTime*14.0))))*uGlitch;
    uv.x+=slice*(h21(vec2(floor(uv.y*26.0),floor(uTime*9.0)))-.5)*.06;
    vec3 pic=nebula(uv,uAspect,uTime,uSeed,uDeep,uMid,uGlow);
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
      c+=vec3(.55,1.0,.94)*inner*.16+vec3(.88,1.0,.98)*rim*(.9+uHover*.9);
      float s=uv.x*.9+uv.y*.45-uSweep;
      c+=vec3(.9,1.0,1.0)*exp(-s*s*40.0)*.16;
      // Glare under the cursor: a wide bloom and a hot core.
      vec2 g=(uv-uCursorUv)*vec2(uAspect,1.0);
      float gl2=dot(g,g);
      c+=(uGlow*.55+vec3(.75,.95,1.0))*(exp(-gl2*9.0)*.26+exp(-gl2*90.0)*.45)*uCursorLight;
      c+=vec3(.45,.85,1.0)*fres*.55;
      vec2 q=uv-.5; c*=1.0-dot(q,q)*.7;
      a=uGlass>.5?1.0:min(.98,mix(.55,.97,inner)*(.8+.35*smoothstep(.05,.45,lum)));
    }
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

// Data streaming in the far background: columns of code glyphs wrapped
// round the scene behind the helix, each carrying bright packets with
// fading tails that mutate as they go; the columns run with the flight
// (up while the bird dives, down while it climbs).
export const dataVertex = `#version 300 es
precision highp float;
uniform mat4 uView,uProj;
uniform vec2 uGrid;
uniform float uTime,uTravel,uPx,uAmount;
out float vGlyph; out float vBright; out float vHead; out float vHue;
float h11(float x){return fract(sin(x*127.1)*43758.5453);}
void main(){
  float id=float(gl_VertexID);
  float col=mod(id,uGrid.x), row=floor(id/uGrid.x);
  float cs=h11(col+.5);
  float ang=(col/uGrid.x-.5)*3.9+(cs-.5)*.04;
  float radius=8.5+h11(col*3.1)*3.0;
  float spacing=.3;
  float span=uGrid.y*spacing;
  float y=mod(row*spacing+uTravel*(1.4+cs*.8)+cs*span,span)-span*.5;
  vec3 p=vec3(sin(ang)*radius,y,-cos(ang)*radius-1.0);
  vec4 view=uView*vec4(p,1.0);
  gl_Position=uProj*view;
  gl_PointSize=clamp(.2*uPx/max(-view.z,1.0),2.0,26.0);
  // Packets: a head sliding down the column with a decaying tail.
  float speed=.35+cs*.6;
  float head=fract(uTime*speed*.12+cs*7.0)*uGrid.y;
  float k=mod(head-row+uGrid.y,uGrid.y);
  float tail=exp(-k*.16)*step(.35,h11(col*7.7));
  vHead=step(k,1.0)*step(.35,h11(col*7.7));
  float rate=floor(uTime*(3.0+cs*6.0)+row*.37);
  vGlyph=floor(h11(row*13.1+col*7.3+rate)*64.0);
  float edge=1.0-smoothstep(span*.3,span*.5,abs(y));
  vBright=(tail*.9+.06)*edge*uAmount*smoothstep(.0,.35,1.0-abs(col/uGrid.x-.5)*2.0+.2);
  vHue=cs;
}`;

export const dataFragment = `#version 300 es
precision highp float;
uniform sampler2D uAtlas;
in float vGlyph; in float vBright; in float vHead; in float vHue;
out vec4 color;
void main(){
  vec2 cell=vec2(mod(vGlyph,8.0),floor(vGlyph/8.0));
  float g=texture(uAtlas,(cell+gl_PointCoord)/8.0).a;
  vec3 c=mix(vec3(.25,.75,.85),vec3(.55,.45,1.0),step(.8,vHue));
  c=mix(c,vec3(.85,1.0,1.0)*1.8,vHead);
  float a=g*vBright;
  color=vec4(c*a,a);
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
