// Lean production shader for the homepage. It keeps the authored states —
// video matter, gathering, glyph bird, pointer response and dissolve — in a
// compact program that compiles quickly on Safari and integrated GPUs.
export const leanVertex = /* glsl */ `
uniform float uTime;
uniform float uReveal;
uniform float uHero;
uniform float uDissolve;
uniform float uFinale;
uniform vec3 uPointer;
uniform float uPointerActive;
uniform float uPointerVel;
uniform vec3 uWaveOrigin;
uniform float uWaveAge;
uniform float uSize;
uniform mat4 uBirdMat;
uniform vec3 uBirdDir;
uniform sampler2D uPosTex;
uniform sampler2D uNrmTex;
uniform float uTexW;
uniform float uTexH;
uniform float uRowsPerFrame;
uniform float uFrames;
uniform float uFlap;
uniform float uBirdReady;

attribute vec3 aHome;
attribute vec2 aGrid;
attribute float aSeed;
attribute float aGlyph;
attribute float aBird;

varying float vGlyph;
varying float vBird;
varying float vAlpha;
varying float vEnergy;
varying float vDepth;

vec3 birdPosition(float index, float frame) {
  float row = frame * uRowsPerFrame + floor(index / uTexW);
  float column = mod(index, uTexW);
  return texture2D(uPosTex, vec2((column + 0.5) / uTexW, (row + 0.5) / uTexH)).xyz;
}

vec3 birdNormal(float index) {
  float row = floor(index / uTexW);
  float column = mod(index, uTexW);
  return texture2D(uNrmTex, vec2((column + 0.5) / uTexW, (row + 0.5) / uRowsPerFrame)).xyz;
}

void main() {
  float seed = fract(aSeed * 5.31);
  float phase = uTime * 0.12 + aSeed;
  vec3 flow = vec3(
    sin(aHome.y * 0.72 + phase) + cos(aHome.z * 0.5 - phase * 0.7),
    cos(aHome.x * 0.65 - phase * 0.82) + sin(aHome.z * 0.55 + phase),
    sin((aHome.x + aHome.y) * 0.43 + phase * 0.65)
  ) * 0.28;
  vec3 field = aHome + flow;
  vec3 point = field;
  float alpha = 1.0;
  float energy = 0.08 + 0.12 * sin(aSeed + uTime * 0.08);
  float bird = step(0.0, aBird) * smoothstep(0.08, 0.85, uBirdReady);
  if (bird > 0.001) {
    float frame = uFlap * uFrames;
    float first = floor(frame);
    float second = mod(first + 1.0, uFrames);
    vec3 local = mix(birdPosition(aBird, first), birdPosition(aBird, second), fract(frame));
    vec3 normal = normalize(birdNormal(aBird));
    float delay = seed * 0.08;
    float gather = smoothstep(0.12, 0.4, uHero - seed * 0.1) * uBirdReady;
    float morph = smoothstep(0.34, 0.57, uHero - delay) * uBirdReady;
    vec3 anchor = uBirdMat[3].xyz;
    float angle = gather * (4.0 + seed * 5.0) + aSeed;
    float radius = mix(2.5, 0.55, gather);
    vec3 spiral = mix(field, anchor + vec3(cos(angle), sin(angle), sin(angle * 0.5) * 0.4) * radius, gather);
    vec3 world = (uBirdMat * vec4(local, 1.0)).xyz;
    float arc = morph * (1.0 - morph) * 4.0;
    vec3 arcFlow = vec3(sin(local.y * 2.0 + aSeed), cos(local.x * 1.7 + aSeed), sin(local.z * 1.4 + aSeed));
    point = mix(spiral, world, morph) + arcFlow * arc * 0.34;
    float touch = smoothstep(1.05, 0.0, length(point - uPointer)) * uPointerActive * morph;
    point += normal * touch * (0.12 + uPointerVel * 0.15);
    energy += gather * 0.25 + touch * 0.5;
    float release = smoothstep(0.0, 1.0, uDissolve - (1.0 - seed) * 0.2);
    point += (normal - uBirdDir) * release * (1.2 + seed * 1.6);
    alpha *= 1.0 - release * 0.92;
  } else {
    float recede = smoothstep(0.56, 0.9, uHero);
    point += vec3(sign(aHome.x) * recede * 1.8, -recede, -recede * 1.6);
    alpha *= 1.0 - recede;
  }

  point = mix(point, aHome + flow * 0.7, uFinale);
  alpha = max(alpha, uFinale * 0.82);
  if (uWaveAge >= 0.0) {
    float ring = exp(-pow((length(point.xy - uWaveOrigin.xy) - uWaveAge * 3.0) * 1.9, 2.0)) * exp(-uWaveAge * 1.6);
    point.xy += normalize(point.xy - uWaveOrigin.xy + 0.0001) * ring * 0.2;
    energy += ring;
  }

  float appear = smoothstep(seed * 0.7, seed * 0.7 + 0.22, uReveal);
  vec4 view = modelViewMatrix * vec4(point, 1.0);
  gl_Position = projectionMatrix * view;
  vGlyph = aGlyph;
  vBird = bird;
  vAlpha = alpha * appear;
  vEnergy = clamp(energy, 0.0, 1.0);
  vDepth = clamp((-view.z - 3.0) / 10.0, 0.0, 1.0);
  float size = mix(0.5 + seed * 0.45, 0.7 + seed * 0.8, bird);
  gl_PointSize = uSize * size / -view.z;
}
`;

export const leanFragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec3 uColorBase;
uniform vec3 uColorAccent;
uniform vec3 uColorCyan;

varying float vGlyph;
varying float vBird;
varying float vAlpha;
varying float vEnergy;
varying float vDepth;

void main() {
  if (vAlpha < 0.01) discard;
  float shape;
  if (vBird > 0.5) {
    vec2 cell = vec2(mod(vGlyph, 4.0), floor(vGlyph / 4.0));
    shape = texture2D(uAtlas, (cell + gl_PointCoord) / 4.0).a;
    if (shape < 0.12) discard;
  } else {
    float radius = length(gl_PointCoord - 0.5);
    if (radius > 0.5) discard;
    shape = smoothstep(0.5, 0.08, radius);
  }
  vec3 color = mix(uColorBase, uColorCyan, vDepth * 0.3 + 0.06);
  color = mix(color, uColorAccent, smoothstep(0.38, 1.0, vEnergy));
  gl_FragColor = vec4(color, shape * vAlpha * (0.48 + vBird * 0.22 + vEnergy * 0.24));
}
`;
