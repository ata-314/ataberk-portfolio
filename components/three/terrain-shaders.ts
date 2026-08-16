// "Terrain of Mind" — liquid data landscape.
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

float fbm(vec2 st, float t) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(vec3(st, t));
    st *= 2.05;
    a *= 0.5;
  }
  return v;
}
`;

export const terrainVertex = /* glsl */ `
${simplex}

uniform float uTime;
uniform float uReveal;      // 0 dark scatter -> 1 formed terrain
uniform float uProgress;    // scroll: 0 rest -> 1 parted/streaming
uniform vec3 uPointer;      // world, on terrain plane
uniform float uPointerActive;
uniform float uPointerVel;  // damped pointer speed
uniform vec3 uWaveOrigin;
uniform float uWaveAge;     // <0 none
uniform float uSize;

attribute vec2 aGrid;       // 0..1 across the field
attribute float aSeed;

varying float vEnergy;
varying float vSpectral;
varying float vFade;

// Two sinuous data channels crossing the field. Returns (mask, alongFlow).
vec2 channels(vec2 xz, float t) {
  float d1 = abs(xz.y + 1.1 + sin(xz.x * 0.42 + 1.7) * 0.9);
  float d2 = abs(xz.y - 0.6 + sin(xz.x * 0.31 - 0.8) * 1.2);
  float c1 = smoothstep(0.55, 0.0, d1);
  float c2 = smoothstep(0.45, 0.0, d2) * 0.85;
  float mask = max(c1, c2);
  // Light pulses traveling along the channels
  float pulse = smoothstep(0.92, 1.0, sin(xz.x * 0.55 - t * 1.6) * 0.5 + 0.5) * c1
              + smoothstep(0.93, 1.0, sin(xz.x * 0.7 + t * 1.2 + 2.0) * 0.5 + 0.5) * c2;
  return vec2(mask, pulse);
}

void main() {
  // Terrain target position from field coords; the whole surface sits below
  // the camera's eye line so the sky stays clean for the headline
  vec2 xz = vec2((aGrid.x - 0.5) * 14.0, (aGrid.y - 0.5) * 7.5 - 2.0);

  float h = fbm(xz * 0.33 + vec2(uTime * 0.05, 0.0), uTime * 0.12) * 0.62 - 0.7;
  vec2 ch = channels(xz, uTime);
  h -= ch.x * 0.28;                       // channels carve the surface
  h += snoise(vec3(xz * 1.6, uTime * 0.3)) * 0.05; // fine ripple

  vec3 terrain = vec3(xz.x, h, xz.y);

  // Droplets: sparse particles launch off crests and fall back
  float isDrop = step(0.955, fract(aSeed * 13.7));
  float ph = fract(uTime * 0.10 + aSeed);
  float crest = smoothstep(-0.25, 0.05, h);
  terrain.y += isDrop * crest * pow(sin(ph * 3.14159), 2.0) * 0.9;

  // Scroll: the surface parts along the channels; currents stream toward camera
  float part = smoothstep(0.05, 0.75, uProgress);
  terrain.x += sign(xz.x + sin(xz.y) * 0.5) * ch.x * part * 2.4;
  terrain.z += ch.x * part * 9.0;         // stream past the camera
  terrain.y += ch.x * part * 0.5;

  // Opening: particles drift in from outside and settle onto the terrain.
  // Staggered per particle; guaranteed to land EXACTLY on the surface at
  // uReveal = 1 (an earlier mix() formulation left residue floating forever).
  float stag = fract(aSeed * 5.3) * 0.25;
  float t = clamp((uReveal - stag) / 0.75, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 dir = normalize(vec3(
    fract(aSeed * 7.13) - 0.5,
    fract(aSeed * 3.71) - 0.15,
    fract(aSeed * 9.29) - 0.5
  ) + 1e-3);
  vec3 p = terrain + dir * (1.0 - t) * (3.5 + fract(aSeed * 2.7) * 6.0);

  // Pointer: fluid magnetic field on the surface (lag lives in JS damping)
  vec2 toP = p.xz - uPointer.xz;
  float d = length(toP);
  float magnet = smoothstep(2.2, 0.0, d) * uPointerActive;
  p.xz += normalize(toP + 1e-4) * magnet * 0.55;
  p.y += magnet * (0.25 + uPointerVel * 0.5);

  // Click: soft energy ring across the surface
  float ring = 0.0;
  if (uWaveAge >= 0.0) {
    float waveR = uWaveAge * 3.2;
    ring = exp(-pow((length(p.xz - uWaveOrigin.xz) - waveR) * 1.8, 2.0))
         * exp(-uWaveAge * 1.5);
    p.y += ring * 0.5;
  }

  vEnergy = clamp(
    ch.y * 1.5 + ch.x * 0.38 + magnet * (0.5 + uPointerVel * 0.9) + ring * 1.5,
    0.0, 1.0
  );
  vSpectral = isDrop * 0.5 + smoothstep(-0.15, 0.15, h) * 0.2;
  // Fade far-side particles slightly for depth; fade all out as streaming ends
  vFade = (0.55 + 0.45 * smoothstep(-6.0, 2.0, p.z)) * (1.0 - smoothstep(0.85, 1.0, uProgress) * 0.8);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + 1.0 * fract(aSeed * 7.31)) * (1.0 / -mv.z);
}
`;

export const terrainFragment = /* glsl */ `
uniform vec3 uColorBase;
uniform vec3 uColorAccent;
uniform vec3 uColorCyan;

varying float vEnergy;
varying float vSpectral;
varying float vFade;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;
  float alpha = smoothstep(0.5, 0.08, r);

  // Bone matter; lime lives in the channels' pulses and interaction energy;
  // a whisper of cyan on droplets/crests as spectral response. Never a fill.
  vec3 color = mix(uColorBase, uColorAccent, smoothstep(0.35, 0.9, vEnergy));
  color = mix(color, uColorCyan, vSpectral * 0.18);
  gl_FragColor = vec4(color, alpha * (0.22 + 0.4 * vEnergy) * vFade);
}
`;
