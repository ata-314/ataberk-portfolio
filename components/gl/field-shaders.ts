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
uniform float uDissolve;     // bird dissolves after the Work handoff
uniform float uFinale;       // contact: matter returns, free
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uPointerVel;
uniform vec3 uWaveOrigin;
uniform float uWaveAge;
uniform float uSize;
uniform mat4 uBirdMat;       // bird local -> world (path + banking)
uniform vec3 uBirdDir;       // travel direction (trail axis)
uniform sampler2D uPosTex;   // baked bird frames
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

void main() {
  float seed01 = fract(aSeed * 5.3);

  // ── Field matter: fluid flow ↔ structural order, breathing ──
  float order = 0.28 + 0.22 * sin(uTime * 0.11 + aHome.x * 0.3);
  vec3 lattice = floor(aHome * 1.6 + 0.5) / 1.6;      // loose structural grid
  vec3 base = mix(aHome, lattice, order * (1.0 - uFinale * 0.7));
  vec3 flow = curl(aHome * 0.4 + uTime * 0.05 + aSeed * 0.05)
            * (0.55 + 0.35 * uFinale);
  vec3 field = base + flow * (0.6 + 0.4 * sin(uTime * 0.07 + aSeed));

  // ── Opening: characters emerge from darkness and gather ──
  float form = clamp((uReveal - seed01 * 0.35) / 0.65, 0.0, 1.0);
  form = form * form * (3.0 - 2.0 * form);
  vec3 emerge = aHome * (1.8 + fract(aSeed * 2.7) * 1.5);
  vec3 p = mix(emerge, field, form);
  float appear = form;

  float energy = 0.0;
  float alpha = 1.0;

  if (aBird >= 0.0) {
    // ── Currents: bird-bound glyphs peel off in a rising spiral ──
    float current = smoothstep(0.30, 0.58, uHero);
    float ang = current * (5.0 + seed01 * 4.0) + aSeed;
    float rad = mix(0.0, 1.6 * (1.0 - current), current);
    vec3 spiral = mix(field, uBirdMat[3].xyz + vec3(cos(ang) * rad, (current - 0.5) * 2.2, sin(ang) * rad), current);

    // ── Morph: spiral condenses into the flying form ──
    float ff = uFlap * uFrames;
    float f0 = floor(ff);
    vec3 bl = mix(birdLocal(aBird, f0), birdLocal(aBird, mod(f0 + 1.0, uFrames)), fract(ff));
    vec3 birdWorld = (uBirdMat * vec4(bl, 1.0)).xyz;

    float morph = smoothstep(0.52, 0.82, uHero - seed01 * 0.08);
    // Trailing glyphs: a fraction lags behind the body and gets pulled back
    float lag = step(0.86, fract(aSeed * 9.1)) * morph;
    vec3 trail = birdWorld - uBirdDir * (0.6 + fract(aSeed * 4.3) * 2.0)
               + vec3(snoise(vec3(aSeed, uTime * 0.6, 0.0)) * 0.2);
    birdWorld = mix(birdWorld, trail, lag * (0.5 + 0.5 * sin(uTime * 2.0 + aSeed)));

    p = mix(spiral, birdWorld, morph);
    energy += current * 0.35 + morph * 0.25;

    // ── Handoff: the bird dissolves into thin data traces ──
    vec3 scatterDir = normalize(vec3(fract(aSeed * 7.7) - 0.5, fract(aSeed * 3.9) - 0.2, fract(aSeed * 6.1) - 0.5) + 1e-3);
    p += scatterDir * uDissolve * (2.5 + seed01 * 4.0);
    alpha *= 1.0 - uDissolve;
  } else {
    // Field matter steps aside as the bird takes the stage, returns for the finale
    float recede = smoothstep(0.45, 0.85, uHero);
    p += vec3(sign(aHome.x) * recede * 1.8, -recede * 1.2, -recede * 1.5);
    alpha *= 1.0 - recede * 0.92;
  }

  // ── Finale: everything is matter again, free and calm ──
  vec3 finaleP = aHome * 1.15 + curl(aHome * 0.3 - uTime * 0.04) * 0.9;
  p = mix(p, finaleP, uFinale);
  alpha = max(alpha, uFinale * 0.85);

  // ── Pointer force field: soft, lagged (lag lives in JS), with flow trails ──
  vec3 toP = p - uPointer;
  float d = length(toP.xy);
  float magnet = smoothstep(2.0, 0.0, d) * uPointerActive;
  p.xy += normalize(toP.xy + 1e-4) * magnet * (0.4 + uPointerVel * 0.5);
  energy += magnet * (0.4 + uPointerVel * 0.8);

  // ── Click wave ──
  if (uWaveAge >= 0.0) {
    float ring = exp(-pow((length(p.xy - uWaveOrigin.xy) - uWaveAge * 3.0) * 1.9, 2.0)) * exp(-uWaveAge * 1.4);
    p.xy += normalize(p.xy - uWaveOrigin.xy + 1e-4) * ring * 0.6;
    energy += ring * 1.2;
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
