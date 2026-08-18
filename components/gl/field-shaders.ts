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
uniform sampler2D uVideoTex; // hero source video (data-painting mode)
uniform float uVideoOn;
uniform float uMeltScale;    // 1 = breathing cycle; 0 = image locked (debug)
uniform float uTexW;
uniform float uTexH;
uniform float uRowsPerFrame;
uniform float uFrames;
uniform float uFlap;
uniform float uBirdReady;   // async bake fades in without rebuilding geometry

attribute vec3 aHome;        // volumetric field home (lobed, layered)
attribute vec2 aGrid;        // shuffled video-pixel mapping (data painting)
attribute float aSeed;
attribute float aGlyph;
attribute float aBird;       // >=0: index into bake texture, -1: field-only

varying float vGlyph;
varying float vEnergy;
varying float vDepth;
varying float vAlpha;
varying float vBird;   // 1 = bird glyph, 0 = fluid dot
varying vec3 vVid;     // video pixel color
varying float vVidMix; // how strongly the fragment uses the video color
varying float vShade;  // sculpted light/shadow from the video relief
varying float vSpec;   // key-light specular kiss

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

// Fluid data sculpture — billowing volumetric mass in the spirit of
// large-scale data art: domain-warped curl layers boil slowly, two roaming
// vortices stir the volume, edges stay wispy. Never a terrain or sheet.
vec3 fluidField(vec3 home, float seed, float calm) {
  // Broad, slow currents carry the volume; high-frequency noise stays quiet
  // so motion reads as liquid continuity instead of restless turbulence.
  vec3 q = home * 0.4 + curl(home * 0.2 + uTime * 0.018) * 0.72;
  vec3 billow = curl(q + uTime * 0.036 + seed * 0.02) * 0.96;
  vec3 medium = curl(home * 0.58 - uTime * 0.026) * 0.3;
  vec3 fine = curl(home * 1.45 + uTime * 0.065) * 0.08;
  vec2 dA = home.xy - uVortexA.xy;
  float rA = length(dA) + 1e-3;
  vec2 swirlA = vec2(-dA.y, dA.x) / rA * exp(-rA * 0.5) * 1.2;
  vec2 dB = home.xy - uVortexB.xy;
  float rB = length(dB) + 1e-3;
  vec2 swirlB = vec2(dB.y, -dB.x) / rB * exp(-rB * 0.55) * 1.0;
  vec3 f = billow + medium + fine + vec3(swirlA + swirlB, 0.0) * 0.55;
  return home + f * (0.68 + 0.12 * sin(uTime * 0.04 + seed)) * calm;
}

void main() {
  float seed01 = fract(aSeed * 5.3);

  // ── The matter's resting form ──
  // Video mode (data painting): each particle owns a pixel of the source
  // video; luminance sculpts a flowing relief and feeds its light. The image
  // never reads as a screen — it keeps dissolving through flow.
  vec3 field;
  float crest;
  vec3 vidCol = vec3(0.0);
  float lum = 0.0;
  vShade = 1.0;
  vSpec = 0.0;
  if (uVideoOn > 0.5) {
    vidCol = texture2D(uVideoTex, aGrid).rgb;
    lum = dot(vidCol, vec3(0.299, 0.587, 0.114));
    // Centre-composed painting with feathered edges and a relief lit like a
    // sculpture. Neighbor luminance gives a surface
    // normal; a fixed key light carves highlights and shadow.
    float lumR = dot(texture2D(uVideoTex, aGrid + vec2(0.006, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumU = dot(texture2D(uVideoTex, aGrid + vec2(0.0, 0.010)).rgb, vec3(0.299, 0.587, 0.114));
    vec3 nSurf = normalize(vec3((lum - lumR) * 6.0, (lum - lumU) * 6.0, 1.0));
    vec3 lightDir = normalize(vec3(-0.45, 0.55, 0.75));
    vShade = 0.45 + 0.75 * max(dot(nSurf, lightDir), 0.0);
    vSpec = pow(max(dot(reflect(-lightDir, nSurf), vec3(0.0, 0.0, 1.0)), 0.0), 14.0);

    vec3 sheet = vec3(
      (aGrid.x - 0.5) * 8.6,
      (aGrid.y - 0.5) * 5.1,
      (aGrid.y - 0.5) * -1.5
    );
    sheet.x += sin(aGrid.y * 6.283 + uTime * 0.11) * 0.08;
    sheet.y += sin(aGrid.x * 6.283 - uTime * 0.09) * 0.06;
    sheet.z += lum * 1.9;            // bright pixels surge toward the camera
    // Liquid body: analytic waves keep the data painting fluid without a
    // six-sample simplex curl on every particle and every frame.
    float melt = pow(0.5 + 0.5 * sin(uTime * 0.16), 2.0) * uMeltScale;
    float flowPhase = aGrid.x * 11.0 + aGrid.y * 7.0 + uTime * 0.13 + aSeed * 0.02;
    vec3 flow2 = vec3(
      sin(flowPhase),
      cos(flowPhase * 0.83 + 1.2),
      sin(flowPhase * 0.61 + 2.1)
    ) * (0.035 + (1.0 - lum) * 0.07 + melt * 0.34);
    field = sheet + flow2;
    crest = lum;
  } else {
    field = fluidField(aHome, aSeed, 1.0 - uFinale * 0.15);
    crest = smoothstep(0.3, 0.9, field.y - aHome.y);
  }

  // ── Opening: characters emerge from darkness and gather ──
  float form = clamp((uReveal - seed01 * 0.35) / 0.65, 0.0, 1.0);
  form = form * form * (3.0 - 2.0 * form);
  vec3 emerge = aHome * (1.8 + fract(aSeed * 2.7) * 1.5);
  vec3 p = mix(emerge, field, form);
  float appear = form;

  float energy = crest * 0.28;
  float alpha = 1.0;

  if (aBird >= 0.0 && uBirdReady > 0.001) {
    float isFlow = step(0.78, fract(aSeed * 3.1));   // ~22% free flow layer
    float delay = seed01 * 0.10;                     // long, liquid stagger

    // Baked skeletal flight — the model's own clip, no artificial deformation
    float ff = uFlap * uFrames;
    float f0 = floor(ff);
    vec3 bl = mix(birdLocal(aBird, f0), birdLocal(aBird, mod(f0 + 1.0, uFrames)), fract(ff));
    vec3 nrm = birdNormal(aBird);
    // Anatomy landmarks in bird-local space (wingspan along x after bake)
    float wingtip = smoothstep(1.0, 1.65, abs(bl.x));
    float tail = smoothstep(0.55, 1.0, bl.z) * (1.0 - wingtip);

    // ── Gathering: long overlapping streams — the painting itself flows
    //    toward the anchor, particle by particle ──
    float gather = smoothstep(0.15, 0.48, uHero - fract(aSeed * 6.9) * 0.14)
                 * smoothstep(0.0, 0.55, uBirdReady);
    vec3 anchor = uBirdMat[3].xyz;
    float ang = gather * (4.0 + seed01 * 5.0) + aSeed;
    float rad = mix(2.6, 0.7, gather) * (1.0 - gather * 0.4);
    vec3 spiral = mix(field, anchor + vec3(cos(ang) * rad, (gather - 0.35) * 2.6 * (0.4 + seed01), sin(ang) * rad * 0.7), gather);

    // ── Formation: wings first, then body/head/tail fill (staggered);
    //    every particle locked to the surface by hero ≈ 0.63 ──
    float wingFirst = mix(0.03, 0.0, wingtip);       // wing outlines lead
    float morph = smoothstep(0.38, 0.58, uHero - delay - wingFirst)
                * smoothstep(0.0, 1.0, uBirdReady);
    vec3 birdWorld = (uBirdMat * vec4(bl, 1.0)).xyz;

    // Curved approach: low-cost phase waves stream pigment into anatomy and
    // anneal to zero as the model locks.
    float arc = morph * (1.0 - morph) * 4.0;
    vec3 path = mix(spiral, birdWorld, morph);
    vec3 arcFlow = vec3(
      sin(bl.y * 2.1 + aSeed),
      cos(bl.x * 1.7 + aSeed * 0.7),
      sin((bl.x + bl.z) * 1.3 + aSeed)
    );
    path += arcFlow * arc * 0.48;

    // Core layer: a tiny analytic shimmer replaces another expensive curl.
    float anneal = smoothstep(0.75, 1.0, morph);
    float shimmer = uTime * 0.24 + aSeed;
    vec3 coreJitter = vec3(
      sin(bl.y * 3.0 + shimmer),
      cos(bl.x * 2.6 + shimmer * 0.9),
      sin(bl.z * 2.8 + shimmer * 1.1)
    ) * mix(0.13, 0.035, anneal);
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

    // ── Finale merge: at the very end the bird releases back into matter ──
    float dHere = smoothstep(0.0, 1.0, uDissolve - (1.0 - max(wingtip, tail * 0.7)) * 0.25);
    vec3 release = normalize(nrm + vec3(0.0, 0.35, 0.0)) * dHere * (1.8 + seed01 * 3.0)
                 - uBirdDir * dHere * 2.2;
    p += release;
    alpha *= 1.0 - dHere * 0.9;
  } else {
    // The painting holds the stage while the bird forms over it, then
    // vanishes COMPLETELY before the sections arrive — no residue behind
    // the page. It returns only for the contact finale.
    float recede = smoothstep(0.6, 0.95, uHero);
    p += vec3(sign(aHome.x) * recede * 2.2, -recede * 1.4, -recede * 2.0);
    alpha *= 1.0 - recede;
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
  if (uFinale > 0.001) {
    vec3 finaleP = fluidField(aHome * 1.12, aSeed, 0.8);
    p = mix(p, finaleP, uFinale);
    alpha = max(alpha, uFinale * 0.85);
  }

  // ── Click wave: short surface shiver, never an explosion ──
  if (uWaveAge >= 0.0) {
    float ring = exp(-pow((length(p.xy - uWaveOrigin.xy) - uWaveAge * 3.0) * 1.9, 2.0)) * exp(-uWaveAge * 1.6);
    p += vec3(normalize(p.xy - uWaveOrigin.xy + 1e-4) * ring * 0.22, 0.0);
    energy += ring * 0.9;
  }

  vGlyph = aGlyph;
  vBird = step(0.0, aBird) * smoothstep(0.15, 0.9, uBirdReady);
  vVid = vidCol;
  vVidMix = uVideoOn * (1.0 - vBird) * (1.0 - uFinale);
  // Video mode: color carries the image; brightness shapes gently, true
  // darks recede. The painting feathers evenly on all four sides.
  float feather = smoothstep(0.02, 0.2, aGrid.x)
                * smoothstep(1.0, 0.8, aGrid.x)
                * smoothstep(0.0, 0.1, aGrid.y)
                * smoothstep(1.0, 0.9, aGrid.y);
  alpha *= mix(1.0, (0.25 + lum * 0.78) * feather, vVidMix);
  vEnergy = clamp(energy, 0.0, 1.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vDepth = clamp((-mv.z - 3.0) / 10.0, 0.0, 1.0);
  vAlpha = alpha * appear;
  gl_Position = projectionMatrix * mv;
  // Bird glyphs read as characters; fluid matter stays finer for density.
  // In data-painting mode the field motes grow until they almost tile —
  // the frame fuses into a continuous painting instead of sparse speckle.
  float sizeMul = mix(0.4 + 0.5 * fract(aSeed * 7.31), 0.55 + 0.9 * fract(aSeed * 7.31), vBird);
  sizeMul = mix(sizeMul, 1.5 + 0.5 * fract(aSeed * 7.31), vVidMix);
  gl_PointSize = uSize * sizeMul * (1.0 / -mv.z);
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
varying float vBird;
varying vec3 vVid;
varying float vVidMix;
varying float vShade;
varying float vSpec;

void main() {
  if (vAlpha < 0.01) discard;
  float shape;
  if (vBird > 0.5) {
    // Bird matter = code characters (4×4 atlas)
    vec2 cell = vec2(mod(vGlyph, 4.0), floor(vGlyph / 4.0));
    vec2 uv = (cell + gl_PointCoord) / 4.0;
    shape = texture2D(uAtlas, uv).a;
    if (shape < 0.12) discard;
  } else {
    // Fluid matter = soft luminous motes — dense, sculptural
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    shape = smoothstep(0.5, 0.06, r);
  }

  // Depth-graded matter: near = warm bone, far = cool steel/cyan whisper.
  vec3 color = mix(uColorBase, uColorCyan, vDepth * 0.35 + 0.08);
  // Data-painting mode: vivid pixel color, sculpted by light and shadow
  float vlum = dot(vVid, vec3(0.299, 0.587, 0.114));
  vec3 vivid = clamp(mix(vec3(vlum), vVid, 1.45) * vec3(1.08, 1.04, 0.97), 0.0, 1.0);
  vivid = vivid * vShade + vSpec * vec3(0.5, 0.5, 0.45);
  color = mix(color, vivid, vVidMix * 0.95);
  color = mix(color, uColorAccent, smoothstep(0.35, 0.95, vEnergy));

  float fade = 1.0 - vDepth * 0.5;
  float base = mix(0.5, 0.72, vBird); // fluid slightly softer per-particle
  base = mix(base, 0.85, vVidMix); // data painting: even, luminous surface
  gl_FragColor = vec4(color, shape * vAlpha * fade * (base + 0.28 * vEnergy));
}
`;
