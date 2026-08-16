// Hologram bird — particles read baked skinned positions from a float
// texture (row = frame) and mix two frames for smooth flight.

export const birdVertex = /* glsl */ `
uniform sampler2D uPosTex;
uniform float uTexW;          // packed texture width
uniform float uTexH;          // packed texture height
uniform float uRowsPerFrame;  // rows one frame occupies
uniform float uFrames;
uniform float uFlap;          // flap phase 0..1 (looping)
uniform float uAssemble;      // 0 scattered -> 1 bird
uniform float uSize;

attribute float aIndex;
attribute float aSeed;

varying float vSeed;
varying float vLocalY;

vec3 framePos(float frame) {
  float row = frame * uRowsPerFrame + floor(aIndex / uTexW);
  float col = mod(aIndex, uTexW);
  vec2 uv = vec2((col + 0.5) / uTexW, (row + 0.5) / uTexH);
  return texture2D(uPosTex, uv).xyz;
}

void main() {
  float ff = uFlap * uFrames;
  float f0 = floor(ff);
  float f1 = mod(f0 + 1.0, uFrames);
  vec3 birdPos = mix(framePos(f0), framePos(f1), fract(ff));

  // Assembly: drift in from a loose cloud, staggered per particle,
  // guaranteed exact landing at uAssemble = 1.
  float stag = fract(aSeed * 5.3) * 0.3;
  float t = clamp((uAssemble - stag) / 0.7, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 dir = normalize(vec3(
    fract(aSeed * 7.13) - 0.5,
    fract(aSeed * 3.71) - 0.5,
    fract(aSeed * 9.29) - 0.5
  ) + 1e-3);
  vec3 p = birdPos + dir * (1.0 - t) * (2.0 + fract(aSeed * 2.7) * 5.0);

  vSeed = aSeed;
  vLocalY = birdPos.y;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + 0.9 * fract(aSeed * 7.31)) * (1.0 / -mv.z);
}
`;

export const birdFragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColorBase;   // bone
uniform vec3 uColorAccent; // lime
uniform vec3 uColorCyan;

varying float vSeed;
varying float vLocalY;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r = length(uv);
  if (r > 0.5) discard;
  float alpha = smoothstep(0.5, 0.1, r);

  // Hologram: cyan-leaning matter, a horizontal scan band sweeping the
  // body in lime, and sparse per-particle flicker. Restraint still rules.
  float scan = smoothstep(0.92, 1.0, sin(vLocalY * 9.0 - uTime * 2.2) * 0.5 + 0.5);
  float flicker = step(0.96, fract(vSeed * 91.7 + floor(uTime * 7.0) * 0.618));

  vec3 color = mix(uColorBase, uColorCyan, 0.45 + 0.25 * fract(vSeed * 3.3));
  color = mix(color, uColorAccent, max(scan * 0.85, flicker * 0.6));

  gl_FragColor = vec4(color, alpha * (0.3 + 0.35 * scan) * uOpacity);
}
`;
