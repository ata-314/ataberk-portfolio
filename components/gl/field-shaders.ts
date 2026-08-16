// CODE BECOMES FORM — one matter, many forms.
// Simplex noise: Ashima Arts / Ian McEwan (webgl-noise), MIT license.

const simplex = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
vec3 curl(vec3 p) {
  const float e = 0.12;
  float nx1 = snoise(p + vec3(0.0, e, 0.0));
  float nx2 = snoise(p - vec3(0.0, e, 0.0));
  float ny1 = snoise(p + vec3(0.0, 0.0, e));
  float ny2 = snoise(p - vec3(0.0, 0.0, e));
  float nz1 = snoise(p + vec3(e, 0.0, 0.0));
  float nz2 = snoise(p - vec3(e, 0.0, 0.0));
  return normalize(vec3(nx1 - nx2, ny1 - ny2, nz1 - nz2) / (2.0 * e));
}
`;

export const fieldVertex = /* glsl */ `
${simplex}

uniform float uTime;
uniform float uReveal;       // opening: 0 dark -> 1 formed
uniform float uHero;         // hero runway progress 0..1
uniform float uDissolve;     // wingtip-first dissolve at hero end
uniform float uFinale;       // contact: matter returns, free
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uPointerVel;
uniform vec3 uWaveOrigin;
uniform float uWaveAge;
uniform float uSize;
uniform mat4 uBirdMat;       // bird local -> world (path + orientation + scale)
uniform vec3 uBirdDir;       // travel direction (trail axis)
uniform vec3 uVortexA;       // moving vortex centers of the data field
uniform vec3 uVortexB;
uniform sampler2D uPosTex;   // baked bird frames
uniform sampler2D uNrmTex;   // baked rest-pose surface normals
uniform float uTexW;
uniform float uTexH;
uniform float uRowsPerFrame;
uniform float uFrames;
uniform float uFlap;

attribute vec3 aHome;        // volumetric field home (lobed, layered)
attribute float aSeed;
attribute float aGlyph;
attribute float aBird;       // >=0: index into bake texture, -1: field-only

varying float vGlyph;
varying float vEnergy;
varying float vDepth;
varying float vAlpha;

vec3 birdLocal(float idx, float frame) {
  float row = frame * uRowsPerFrame + floor(idx / uTexW);
  float col = mod(idx, uTexW);
  return texture2D(uPosTex, vec2((col + 0.5) / uTexW, (row + 0.5) / uTexH)).xyz;
}
vec3 birdNormal(float idx) {
  float row = floor(idx / uTexW);
  float col = mod(idx, uTexW);
  return texture2D(uNrmTex, vec2((col + 0.5) / uTexW, (row + 0.5) / uRowsPerFrame)).xyz;
}

// Fluid data field: large swell + fine ripple + two roaming vortices +
// lateral current with soft edge-turn. Not a terrain, not a sine sheet.
vec3 fluidField(vec3 home, float seed, float calm) {
  vec3 swell = curl(home * 0.22 + uTime * 0.045 + seed * 0.03) * 0.85;
  vec3 ripple = curl(home * 1.1 - uTime * 0.09) * 0.22;
  // Vortices: tangential swirl around two moving centers (xy plane)
  vec2 dA = home.xy - uVortexA.xy;
  float rA = length(dA) + 1e-3;
  vec2 swirlA = vec2(-dA.y, dA.x) / rA * exp(-rA * 0.55) * 1.1;
  vec2 dB = home.xy - uVortexB.xy;
  float rB = length(dB) + 1e-3;
  vec2 swirlB = vec2(dB.y, -dB.x) / rB * exp(-rB * 0.6) * 0.9;
  // Lateral current, turning softly at the stage edges
  float edge = smoothstep(3.2, 4.6, abs(home.x));
  vec3 lateral = vec3(0.35 * (1.0 - edge * 2.0), edge * 0.25 * sign(home.y + 0.001), 0.0);
  vec3 f = swell + ripple + vec3(swirlA + swirlB, 0.0) * 0.6 + lateral * 0.4;
  return home + f * (0.75 + 0.25 * sin(uTime * 0.06 + seed)) * calm;
}

void main() {
  float seed01 = fract(aSeed * 5.3);

  vec3 field = fluidField(aHome, aSeed, 1.0 - uFinale * 0.15);
  // Crest lighting: rising matter glows faintly
  float crest = smoothstep(0.3, 0.9, field.y - aHome.y);

  // ── Opening: characters emerge from darkness and gather ──
  float form = clamp((uReveal - seed01 * 0.35) / 0.65, 0.0, 1.0);
  form = form * form * (3.0 - 2.0 * form);
  vec3 emerge = aHome * (1.8 + fract(aSeed * 2.7) * 1.5);
  vec3 p = mix(emerge, field, form);
  float appear = form;

  float energy = crest * 0.28;
  float alpha = 1.0;

  if (aBird >= 0.0) {
    float isFlow = step(0.78, fract(aSeed * 3.1));   // ~22% free flow layer
    float delay = seed01 * 0.04;

    // Baked skeletal flight — the model's own clip, no artificial deformation
    float ff = uFlap * uFrames;
    float f0 = floor(ff);
    vec3 bl = mix(birdLocal(aBird, f0), birdLocal(aBird, mod(f0 + 1.0, uFrames)), fract(ff));
    vec3 nrm = birdNormal(aBird);
    // Anatomy landmarks in bird-local space (wingspan along x after bake)
    float wingtip = smoothstep(1.0, 1.65, abs(bl.x));
    float tail = smoothstep(0.55, 1.0, bl.z) * (1.0 - wingtip);

    // ── Gathering: currents bend toward the anchor, wide rising spiral ──
    float gather = smoothstep(0.18, 0.42, uHero - delay * 0.4);
    vec3 anchor = uBirdMat[3].xyz;
    float ang = gather * (4.0 + seed01 * 5.0) + aSeed;
    float rad = mix(2.6, 0.7, gather) * (1.0 - gather * 0.4);
    vec3 spiral = mix(field, anchor + vec3(cos(ang) * rad, (gather - 0.35) * 2.6 * (0.4 + seed01), sin(ang) * rad * 0.7), gather);

    // ── Formation: wings first, then body/head/tail fill (staggered);
    //    every particle locked to the surface by hero ≈ 0.63 ──
    float wingFirst = mix(0.03, 0.0, wingtip);       // wing outlines lead
    float morph = smoothstep(0.42, 0.56, uHero - delay - wingFirst);
    vec3 birdWorld = (uBirdMat * vec4(bl, 1.0)).xyz;

    // Curved approach: arc via curl, annealing to ZERO as the model locks
    float arc = morph * (1.0 - morph) * 4.0;
    vec3 path = mix(spiral, birdWorld, morph);
    path += curl(bl * 0.8 + aSeed) * arc * 0.55;

    // Core layer: locked to the surface — residual noise ≤ ~1.5% of span
    float anneal = smoothstep(0.75, 1.0, morph);
    vec3 coreJitter = curl(bl * 2.0 + uTime * 0.25) * mix(0.18, 0.045, anneal);
    // Flow layer: free energy at wingtips/tail, never breaking the silhouette
    float flowAmp = isFlow * (0.3 + wingtip * 0.9 + tail * 0.6);
    vec3 flowMotion = nrm * (0.12 + 0.25 * sin(uTime * 1.4 + aSeed)) * flowAmp
                    - uBirdDir * flowAmp * (0.3 + fract(aSeed * 4.3) * 0.9) * smoothstep(0.62, 0.9, uHero);

    p = path + mix(coreJitter * (1.0 - isFlow * 0.5), flowMotion + coreJitter * 0.4, isFlow);

    energy += gather * 0.3 + isFlow * morph * 0.3 + wingtip * morph * 0.15;
    alpha = mix(alpha, mix(1.0, 0.75, isFlow), morph);

    // ── Pointer on the bird: local, along the surface normal, springs back ──
    float dB2 = length(p - uPointer);
    float touch = smoothstep(1.15, 0.0, dB2) * uPointerActive * morph;
    p += nrm * touch * mix(0.10, 0.38, isFlow) * (0.6 + uPointerVel);
    energy += touch * 0.5;

    // ── Dissolve to Work: wingtips release first, traces stream away ──
    float dHere = smoothstep(0.0, 1.0, uDissolve - (1.0 - max(wingtip, tail * 0.7)) * 0.25);
    vec3 release = normalize(nrm + vec3(0.0, 0.35, 0.0)) * dHere * (1.8 + seed01 * 3.0)
                 - uBirdDir * dHere * 2.2;
    p += release;
    alpha *= 1.0 - dHere * 0.96;
  } else {
    // Field matter recedes while the bird holds the stage; returns for finale
    float recede = smoothstep(0.34, 0.6, uHero);
    p += vec3(sign(aHome.x) * recede * 2.2, -recede * 1.4, -recede * 2.0);
    alpha *= 1.0 - recede * 0.94;
    // Field pointer: pressure + short orbit + speed trails
    vec3 toP = p - uPointer;
    float d = length(toP.xy);
    float press = smoothstep(2.0, 0.0, d) * uPointerActive * (1.0 - recede);
    vec2 away = normalize(toP.xy + 1e-4);
    vec2 orbit = vec2(-away.y, away.x) * step(0.55, fract(aSeed * 6.7));
    p.xy += (away * 0.35 + orbit * 0.3) * press * (0.6 + uPointerVel * 0.9);
    energy += press * (0.35 + uPointerVel * 0.8);
  }

  // ── Finale: everything is matter again, free and calm ──
  vec3 finaleP = fluidField(aHome * 1.12, aSeed, 0.8);
  p = mix(p, finaleP, uFinale);
  alpha = max(alpha, uFinale * 0.85);

  // ── Click wave: short surface shiver, never an explosion ──
  if (uWaveAge >= 0.0) {
    float ring = exp(-pow((length(p.xy - uWaveOrigin.xy) - uWaveAge * 3.0) * 1.9, 2.0)) * exp(-uWaveAge * 1.6);
    p += vec3(normalize(p.xy - uWaveOrigin.xy + 1e-4) * ring * 0.22, 0.0);
    energy += ring * 0.9;
  }

  vGlyph = aGlyph;
  vEnergy = clamp(energy, 0.0, 1.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = clamp((-mv.z - 3.0) / 10.0, 0.0, 1.0);
  vAlpha = alpha * appear;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.55 + 0.9 * fract(aSeed * 7.31)) * (1.0 / -mv.z);
}
`;

export const fieldFragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uColorBase;
uniform vec3 uColorAccent;
uniform vec3 uColorCyan;

varying float vGlyph;
varying float vEnergy;
varying float vDepth;
varying float vAlpha;

void main() {
  if (vAlpha < 0.01) discard;
  // Glyph cell lookup on the 4×4 atlas
  vec2 cell = vec2(mod(vGlyph, 4.0), floor(vGlyph / 4.0));
  vec2 uv = (cell + gl_PointCoord) / 4.0;
  float glyph = texture2D(uAtlas, uv).a;
  if (glyph < 0.12) discard;

  // Depth-graded matter: near = warm bone, far = cool steel/cyan whisper.
  vec3 color = mix(uColorBase, uColorCyan, vDepth * 0.35 + 0.08);
  color = mix(color, uColorAccent, smoothstep(0.35, 0.95, vEnergy));

  float fade = 1.0 - vDepth * 0.5;
  gl_FragColor = vec4(color, glyph * vAlpha * fade * (0.72 + 0.28 * vEnergy));
}
`;
