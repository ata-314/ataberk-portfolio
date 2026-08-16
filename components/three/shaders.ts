// GLSL for the "Creative Mind" hero organism.
// Simplex noise: Ashima Arts / Ian McEwan (webgl-noise), MIT license.
// https://github.com/ashima/webgl-noise

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
  const float e = 0.1;
  float nx1 = snoise(p + vec3(0.0, e, 0.0));
  float nx2 = snoise(p - vec3(0.0, e, 0.0));
  float ny1 = snoise(p + vec3(0.0, 0.0, e));
  float ny2 = snoise(p - vec3(0.0, 0.0, e));
  float nz1 = snoise(p + vec3(e, 0.0, 0.0));
  float nz2 = snoise(p - vec3(e, 0.0, 0.0));
  // Pseudo-curl from noise gradients — divergence-reduced organic flow
  return normalize(vec3(nx1 - nx2, ny1 - ny2, nz1 - nz2) / (2.0 * e));
}
`;

export const vertexShader = /* glsl */ `
${simplex}

uniform float uTime;
uniform float uProgress;     // 0 = organism, 1 = structured lattice (scroll)
uniform vec3 uPointer;       // pointer in world space (z ~ 0 plane)
uniform float uPointerActive;
uniform float uHold;         // 0..1 while pressing
uniform vec3 uWaveOrigin;
uniform float uWaveAge;      // seconds since release, <0 = no wave
uniform float uSize;

attribute vec3 aTarget;      // lattice position
attribute float aSeed;

varying float vEnergy;

void main() {
  // Idle breathing: curl-noise flow, calming as the structure forms
  float breathe = 1.0 - uProgress;
  vec3 flow = curl(position * 0.35 + uTime * 0.05 + aSeed) * 0.45 * breathe;

  vec3 base = mix(position, aTarget, smoothstep(0.0, 1.0, uProgress));
  vec3 p = base + flow;

  // Magnetic pointer: repel within radius, eased falloff
  vec3 toPointer = p - uPointer;
  float d = length(toPointer);
  float magnet = smoothstep(1.6, 0.0, d) * uPointerActive;
  p += normalize(toPointer + 1e-4) * magnet * (0.5 + uHold * 0.9);

  // Release wave: expanding ring pulse from the press point
  if (uWaveAge >= 0.0) {
    float waveR = uWaveAge * 2.4;
    float ring = exp(-pow((distance(p, uWaveOrigin) - waveR) * 2.2, 2.0));
    float decay = exp(-uWaveAge * 1.4);
    p += normalize(p - uWaveOrigin + 1e-4) * ring * decay * 0.8;
  }

  vEnergy = clamp(length(flow) * 1.4 + magnet * 1.2, 0.0, 1.0);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // Fine dust: ~1.5–3 device px at the default camera distance
  gl_PointSize = uSize * (0.6 + 0.8 * fract(aSeed * 7.31)) * (1.0 / -mv.z);
}
`;

export const fragmentShader = /* glsl */ `
uniform vec3 uColorBase;
uniform vec3 uColorAccent;

varying float vEnergy;

void main() {
  // Soft round sprite
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, r);

  // Bone-white matter; lime only where energy concentrates (accent law).
  // Additive blending stacks fast — keep per-particle alpha low.
  vec3 color = mix(uColorBase, uColorAccent, smoothstep(0.6, 1.0, vEnergy));
  gl_FragColor = vec4(color, alpha * (0.26 + 0.35 * vEnergy));
}
`;
