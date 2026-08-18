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
uniform sampler2D uVideoTex;
uniform float uVideoOn;
uniform float uMeltScale;
uniform vec3 uVortexA;
uniform vec3 uVortexB;
uniform float uTexW;
uniform float uTexH;
uniform float uRowsPerFrame;
uniform float uFrames;
uniform float uFlap;
uniform float uBirdReady;
uniform vec2 uTide;
uniform vec4 uEdgeAges;
uniform float uIntro;
uniform float uLineMode;

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
varying vec3 vVideo;
varying float vVideoMix;
varying float vLight;
varying float vElectric;
varying float vPigment;
varying float vPigmentDensity;
varying float vScanLime;

// Inward directions for the frame edges: left, right, bottom, top. Edge waves
// travel along these when the fluid body strikes the border of the viewport.
const vec2 EDGE_INWARD[4] = vec2[4](
  vec2(1.0, 0.0), vec2(-1.0, 0.0), vec2(0.0, 1.0), vec2(0.0, -1.0)
);

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
  vVideo = vec3(0.0);
  float luminance = 0.0;
  float pigmentDensity = 0.0;
  float edgeGlow = 0.0;
  // Uniform branch: once the liquid painting has handed off, integrated GPUs
  // skip every video sample, exp and liquid-wave operation during bird flight.
  if (uVideoOn > 0.015) {
    vVideo = texture2D(uVideoTex, aGrid).rgb;
    luminance = dot(vVideo, vec3(0.299, 0.587, 0.114));
    float chroma = max(vVideo.r, max(vVideo.g, vVideo.b))
      - min(vVideo.r, min(vVideo.g, vVideo.b));
    pigmentDensity = smoothstep(0.035, 0.88, luminance + chroma * 0.28);
    vec2 centered = aGrid - 0.5;
    vec3 sheet = vec3(
      centered.x * 10.8,
      centered.y * 6.4,
      centered.y * -1.2 + luminance * 1.8 + (seed - 0.5) * (0.42 + (1.0 - pigmentDensity) * 0.5)
    );
    float melt = (0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * 0.16), 2.0)) * uMeltScale;
    float edge = max(
      smoothstep(0.26, 0.5, abs(centered.x)),
      smoothstep(0.24, 0.5, abs(centered.y))
    );
    float lowBand = sin(aGrid.y * 19.0 + uTime * 0.31 + aSeed * 0.07);
    float crossBand = cos(aGrid.x * 17.0 - uTime * 0.27 + aSeed * 0.05);
    float pigmentFold = sin(
      centered.x * 5.2
      + centered.y * 7.4
      + sin(centered.y * 3.0 - uTime * 0.21) * 1.8
      + uTime * 0.3
    );
    float slowSwell = sin(
      centered.y * 4.2
      - uTime * 0.31
      + sin(centered.x * 3.1 + uTime * 0.16) * 1.4
    );
    vec2 liquid = vec2(lowBand, crossBand) * (0.045 + (1.0 - luminance) * 0.075 + melt * 0.34);
    liquid += vec2(pigmentFold, -pigmentFold) * (0.05 + pigmentDensity * 0.095);
    liquid += vec2(
      cos(centered.y * 3.6 - uTime * 0.23),
      slowSwell
    ) * (0.075 + pigmentDensity * 0.08);
    liquid += vec2(
      sin(centered.y * 9.0 + uTime * 0.85 + aSeed * 0.1),
      cos(centered.x * 8.0 - uTime * 0.75)
    ) * edge * (0.28 + melt * 0.55);
    // Domain-warped advection: nested sines approximate curl noise, so the
    // pigment streams shear and fold instead of oscillating in place.
    vec2 warp = vec2(
      sin(sheet.y * 1.9 + uTime * 0.5 + sin(sheet.x * 1.1 + uTime * 0.23) * 2.1),
      cos(sheet.x * 1.6 - uTime * 0.44 + sin(sheet.y * 1.35 - uTime * 0.31) * 1.9)
    );
    liquid += warp * (0.07 + pigmentDensity * 0.07);
    vec2 vortexA = sheet.xy - uVortexA.xy;
    vec2 vortexB = sheet.xy - uVortexB.xy;
    float distanceA = length(vortexA) + 0.001;
    float distanceB = length(vortexB) + 0.001;
    liquid += vec2(-vortexA.y, vortexA.x) / distanceA * exp(-distanceA * 0.55) * 0.3;
    liquid += vec2(vortexB.y, -vortexB.x) / distanceB * exp(-distanceB * 0.6) * 0.26;
    sheet.xy += liquid * (1.0 + edge * 1.65);
    sheet.z += (lowBand + crossBand) * 0.055 * melt
      + pigmentFold * (0.08 + pigmentDensity * 0.15)
      + slowSwell * (0.07 + pigmentDensity * 0.12);
    // Slosh: the whole fluid body leans with a slow tide and piles up against
    // the frame; when it strikes an edge the CPU fires that edge's wave and a
    // ring travels back through the pigment.
    sheet.xy += uTide * (0.3 + pigmentDensity * 0.25);
    vec4 edgeDist = vec4(sheet.x + 5.4, 5.4 - sheet.x, sheet.y + 3.2, 3.2 - sheet.y);
    for (int i = 0; i < 4; i++) {
      float age = uEdgeAges[i];
      if (age >= 0.0) {
        float ring = exp(-pow((edgeDist[i] - age * 3.3) * 1.12, 2.0)) * exp(-age * 1.05);
        sheet.xy += EDGE_INWARD[i] * ring * 0.5;
        sheet.z += ring * 0.34;
        edgeGlow += ring;
      }
    }
    field = mix(field, sheet, smoothstep(0.0, 0.72, uVideoOn));
  }
  vec3 point = field;
  float alpha = 1.0;
  float energy = 0.08 + luminance * uVideoOn * 0.22 + 0.1 * sin(aSeed + uTime * 0.08)
    + edgeGlow * 0.85;
  float light = 1.0;
  float electric = 0.0;
  // At rest every point belongs to the video painting. Bird anatomy and its
  // heavier lighting/electric path only wake once the user starts the act.
  float bird = step(0.0, aBird)
    * smoothstep(0.08, 0.85, uBirdReady)
    * smoothstep(0.025, 0.14, uHero);
  if (bird > 0.001) {
    float frame = uFlap * uFrames;
    float first = floor(frame);
    float second = mod(first + 1.0, uFrames);
    vec3 local = mix(birdPosition(aBird, first), birdPosition(aBird, second), fract(frame));
    vec3 normal = normalize(birdNormal(aBird));
    float delay = seed * 0.07;
    float gather = smoothstep(0.08, 0.35, uHero - seed * 0.08) * uBirdReady;
    vec3 anchor = uBirdMat[3].xyz;
    float wingtip = smoothstep(0.95, 1.65, abs(local.x));
    float tail = smoothstep(0.48, 1.0, local.z) * (1.0 - wingtip);
    float morph = smoothstep(0.27, 0.56, uHero - delay + wingtip * 0.035) * uBirdReady;

    // Cinematic convergence: long directional streams tighten into a helix,
    // then anneal into the baked anatomy. Wingtips arrive first.
    float angle = gather * (5.5 + seed * 6.0) + aSeed;
    float streamAxis = mix(-6.8, 6.8, fract(aSeed * 0.731));
    float streamLife = sqrt(max(1.0 - gather, 0.0));
    float radius = mix(2.6, 0.24, gather) * (0.55 + seed * 0.55);
    vec3 stream = anchor + vec3(
      streamAxis * streamLife,
      sin(angle) * radius + (seed - 0.5) * streamLife * 1.5,
      cos(angle) * radius * 0.55
    );
    stream -= uBirdDir * streamLife * (0.8 + seed * 1.8);
    vec3 spiral = mix(field, stream, gather);
    vec3 world = (uBirdMat * vec4(local, 1.0)).xyz;
    float arc = morph * (1.0 - morph) * 4.0;
    vec3 arcFlow = normalize(vec3(
      sin(local.y * 2.0 + aSeed + uTime * 0.35),
      cos(local.x * 1.7 + aSeed - uTime * 0.28),
      sin(local.z * 1.4 + aSeed)
    ));
    point = mix(spiral, world, morph) + arcFlow * arc * (0.2 + wingtip * 0.16);

    vec3 worldNormal = normalize((uBirdMat * vec4(normal, 0.0)).xyz);
    vec3 keyLight = normalize(vec3(-0.42, 0.68, 0.72));
    light = 0.34 + 0.82 * max(dot(worldNormal, keyLight), 0.0);
    float electricGate = smoothstep(0.68, 0.94, fract(aSeed * 4.73 + uTime * 0.34));
    float electricPulse = 0.42 + 0.58 * (0.5 + 0.5 * sin(uTime * 7.5 + aSeed * 3.1));
    electric = morph * electricGate * electricPulse * (0.32 + wingtip * 1.05 + tail * 0.55);
    point += worldNormal * electric * (0.035 + wingtip * 0.085);
    point -= uBirdDir * electric * (0.08 + wingtip * 0.2);
    float touch = smoothstep(1.05, 0.0, length(point - uPointer)) * uPointerActive * morph;
    point += normal * touch * (0.12 + uPointerVel * 0.15);
    energy += gather * 0.2 + touch * 0.5 + electric * 0.85;
    float release = smoothstep(0.0, 1.0, uDissolve - (1.0 - seed) * 0.2);
    point += (normal - uBirdDir) * release * (1.2 + seed * 1.6);
    alpha *= 1.0 - release * 0.92;
  } else {
    // Supporting dust follows the same directional pull, fading only after
    // it has crossed the forming silhouette instead of simply scattering.
    if (uHero > 0.025) {
      float dustGather = smoothstep(0.15, 0.48, uHero - seed * 0.1);
      vec3 dustTarget = uBirdMat[3].xyz - uBirdDir * mix(1.8, -1.2, seed);
      vec3 dustArc = vec3(
        sin(aSeed + uTime * 0.4),
        cos(aSeed * 1.3 - uTime * 0.34),
        sin(aSeed * 0.7)
      ) * dustGather * (1.0 - dustGather) * 0.75;
      point = mix(point, dustTarget + dustArc, dustGather * 0.72);
      float recede = smoothstep(0.42, 0.72, uHero - seed * 0.05);
      alpha *= 1.0 - recede;
      electric = step(0.9, fract(aSeed * 3.17)) * dustGather * (1.0 - recede)
        * (0.5 + 0.5 * sin(uTime * 8.0 + aSeed));
      energy += electric * 0.75;
    }
  }

  point = mix(point, aHome + flow * 0.7, uFinale);
  alpha = max(alpha, uFinale * 0.82);
  if (uWaveAge >= 0.0) {
    float ring = exp(-pow((length(point.xy - uWaveOrigin.xy) - uWaveAge * 3.0) * 1.9, 2.0)) * exp(-uWaveAge * 1.6);
    point.xy += normalize(point.xy - uWaveOrigin.xy + 0.0001) * ring * 0.2;
    energy += ring;
  }

  // Opening flight: the field starts stretched into a deep data bore the
  // camera flies through; particles anneal into the painting as uIntro eases
  // to 1. Two lime scan planes sweep the bore and briefly light passing data.
  vScanLime = 0.0;
  // uIntro is the raw flight progress: the bore holds its shape for the first
  // third of the flight, then anneals into the painting as the camera slows.
  float introLife = 1.0 - smoothstep(0.3, 1.0, uIntro);
  if (introLife > 0.001) {
    float lane = fract(aSeed * 3.917) * 6.28318;
    float bore = 1.55 + fract(aSeed * 6.31) * 3.6;
    vec3 tunnel = vec3(
      cos(lane) * bore + flow.x * 0.7,
      sin(lane) * bore * 0.62 + flow.y * 0.7,
      6.0 - fract(aSeed * 9.271) * 36.0
    );
    point = mix(point, tunnel, introLife);
    float lime = 0.0;
    for (int k = 0; k < 2; k++) {
      float sweep = mix(-30.0, 9.0, fract(uTime * 0.5 + float(k) * 0.5));
      lime += exp(-pow((point.z - sweep) * 0.45, 2.0));
    }
    vScanLime = lime * introLife * 1.2;
    energy += vScanLime * 0.9;
  }

  float appear = smoothstep(seed * 0.7, seed * 0.7 + 0.22, uReveal);
  vec4 view = modelViewMatrix * vec4(point, 1.0);
  gl_Position = projectionMatrix * view;
  vGlyph = aGlyph;
  vBird = bird;
  vVideoMix = uVideoOn * (1.0 - bird) * (1.0 - uFinale);
  alpha *= mix(1.0, 0.22 + luminance * 0.82, vVideoMix);
  vAlpha = alpha * appear;
  // Link pass: the same particles redrawn as line pairs. Each endpoint pulses
  // on a short offset cycle, so thin connections surface briefly between
  // neighbouring data points and dissolve again. Fluid state only.
  if (uLineMode > 0.5) {
    float cycle = fract(aSeed * 0.173 + uTime * (0.08 + fract(aSeed * 2.9) * 0.12));
    float pulse = smoothstep(0.0, 0.1, cycle) * (1.0 - smoothstep(0.16, 0.3, cycle));
    vAlpha *= pulse * vVideoMix * 0.55 * smoothstep(0.85, 1.0, uIntro);
  }
  vEnergy = clamp(energy, 0.0, 1.0);
  vDepth = clamp((-view.z - 3.0) / 10.0, 0.0, 1.0);
  vLight = mix(1.0, light, bird);
  vElectric = electric;
  vPigment = fract(
    luminance * 0.72
    + seed * 0.2
    + 0.08 * sin(uTime * 0.22 + aSeed * 0.17)
  );
  vPigmentDensity = pigmentDensity;
  float size = mix(0.5 + seed * 0.45, 0.7 + seed * 0.8, bird);
  // Compact particles keep the fluid field crisp; darker matter remains just
  // large enough to build depth without turning into low-resolution blobs.
  float pigmentSize = mix(1.85 + seed * 0.38, 1.15 + seed * 0.3, pigmentDensity);
  size = mix(size, pigmentSize, vVideoMix);
  size *= 1.0 + electric * 0.75;
  gl_PointSize = uSize * size / -view.z;
}
`;

export const leanFragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColorBase;
uniform vec3 uColorAccent;
uniform vec3 uColorCyan;
uniform float uLineMode;
uniform float uScanBoost;
// Living gradient for the fluid state — four stops (deep, mid, bright, peak)
// crossfaded on the CPU between curated palettes, Unsupervised-style.
uniform vec3 uGradA;
uniform vec3 uGradB;
uniform vec3 uGradC;
uniform vec3 uGradD;

varying float vGlyph;
varying float vBird;
varying float vAlpha;
varying float vEnergy;
varying float vDepth;
varying vec3 vVideo;
varying float vVideoMix;
varying float vLight;
varying float vElectric;
varying float vPigment;
varying float vPigmentDensity;
varying float vScanLime;

float hash1(float n) { return fract(sin(n) * 43758.5453); }

// One holographic scan column: a sharp leading edge, a decaying data wake
// carved by micro scanlines and row ticks, and cyan/magenta diffraction
// fringes hugging either side of the edge. rowHash shears occasional rows
// sideways for a glitched-readout feel.
vec4 scanColumn(vec2 screen, float pixelY, float head, float dir, float rowHash) {
  float x = head + (rowHash - 0.5) * 0.016 * step(0.86, rowHash);
  float ahead = (screen.x - x) * dir;
  float front = exp(-pow(abs(ahead) * 150.0, 2.0)) * 1.35;
  float wake = exp(-max(-ahead, 0.0) * 13.0) * step(ahead, 0.0) * (1.0 - front);
  float micro = 0.5 + 0.5 * sin(pixelY * 1.7 + uTime * 26.0);
  float tick = 0.22 + 0.78 * step(0.55, rowHash);
  vec3 fringe = vec3(0.86, 1.0, 0.42) * exp(-pow((ahead - 0.006) * 150.0, 2.0))
    + vec3(0.32, 0.9, 0.5) * exp(-pow((ahead + 0.009) * 130.0, 2.0));
  float body = front + wake * micro * tick * 0.8;
  return vec4(fringe, body);
}

void main() {
  if (vAlpha < 0.01) discard;
  float shape;
  if (uLineMode > 0.5) {
    // Link segments have no point sprite; render as a thin uniform stroke.
    shape = 0.85;
  } else if (vBird > 0.5) {
    vec2 cell = vec2(mod(vGlyph, 4.0), floor(vGlyph / 4.0));
    shape = texture2D(uAtlas, (cell + gl_PointCoord) / 4.0).a;
    float electricHalo = smoothstep(0.5, 0.05, length(gl_PointCoord - 0.5));
    shape = max(shape, electricHalo * vElectric * 0.72);
    if (shape < 0.12) discard;
  } else {
    // Hard-rimmed disc with an anti-aliased edge exactly one pixel wide: the
    // particle reads as a crisp droplet at any DPR instead of a soft blob.
    float radius = length(gl_PointCoord - 0.5);
    float edge = max(fwidth(radius), 0.004);
    if (radius > 0.46 + edge) discard;
    float disc = 1.0 - smoothstep(0.44 - edge, 0.46 + edge, radius);
    float core = 1.0 - smoothstep(0.05, 0.3, radius);
    shape = disc * (
      mix(0.3, 0.46, vPigmentDensity)
      + core * mix(0.48, 0.72, vPigmentDensity)
    );
  }
  vec3 color = mix(uColorBase, uColorCyan, vDepth * 0.3 + 0.06);
  float luminance = dot(vVideo, vec3(0.299, 0.587, 0.114));
  // The source RGB becomes a density field graded through the living palette:
  // deep tones in quiet pockets, the peak stop at the energetic crests. The
  // per-particle pigment phase spreads neighbours across the ramp so the
  // fluid shimmers with hue variation instead of banding.
  float rampLevel = clamp(
    luminance * 0.82
    + vPigmentDensity * 0.2
    + (1.0 - vDepth) * 0.05
    + (vPigment - 0.5) * 0.16,
    0.0, 1.0);
  vec3 videoColor = mix(uGradA, uGradB, smoothstep(0.015, 0.3, rampLevel));
  videoColor = mix(videoColor, uGradC, smoothstep(0.3, 0.68, rampLevel));
  videoColor = mix(videoColor, uGradD, smoothstep(0.68, 0.98, rampLevel));

  // Two holographic scan columns sweep the field in opposite directions,
  // gated so they surface occasionally instead of sitting permanently. Rows
  // are hashed per time-step: some shear sideways, some read brighter, and a
  // fast flicker keeps the projection feeling volumetric rather than printed.
  vec2 screen = gl_FragCoord.xy / max(uResolution, vec2(1.0));
  float rowBand = floor(screen.y * 40.0);
  float rowHash = hash1(rowBand * 12.9898 + floor(uTime * 9.0) * 0.173);
  float gateA = max(smoothstep(0.5, 0.88, 0.5 + 0.5 * sin(uTime * 0.52)), uScanBoost);
  float gateB = max(smoothstep(0.55, 0.9, 0.5 + 0.5 * sin(uTime * 0.34 + 2.6)), uScanBoost * 0.8);
  float flicker = 0.82 + 0.18 * sin(uTime * 31.0 + rowBand * 0.7);
  vec4 colA = scanColumn(screen, gl_FragCoord.y, fract(uTime * 0.058), 1.0, rowHash);
  vec4 colB = scanColumn(screen, gl_FragCoord.y, 1.0 - fract(uTime * 0.041 + 0.37), -1.0, rowHash);
  float scan = (colA.a * gateA + colB.a * gateB) * flicker * vVideoMix;
  vec3 scanChroma = (colA.rgb * gateA + colB.rgb * gateB) * flicker * vVideoMix;
  // The columns carry the site's acid-lime identity: a lime core with a faint
  // thin-film shimmer so the wake still refracts like a hologram.
  vec3 iridescence = 0.5 + 0.5 * cos(6.28318 * (screen.y * 1.4 + vec3(0.0, 0.33, 0.66)) + uTime * 0.4);
  videoColor += (uColorAccent * 0.66 + vec3(0.12) + iridescence * 0.18) * scan + scanChroma * 1.2;

  color = mix(color, videoColor, vVideoMix * 0.98);
  color = mix(color, uColorAccent, smoothstep(0.38, 1.0, vEnergy) * (1.0 - vVideoMix));
  // Edge waves and pointer ripples flare toward the palette's peak stop.
  color = mix(color, uGradD, smoothstep(0.42, 1.0, vEnergy) * vVideoMix * 0.85);
  // The opening scan planes light passing data points in acid lime, and link
  // segments carry the same identity color.
  color = mix(color, uColorAccent, clamp(vScanLime * 0.9, 0.0, 0.85));
  if (uLineMode > 0.5) color = mix(color, uColorAccent, 0.45);
  color *= mix(1.0, vLight, vBird * (1.0 - vElectric * 0.45));
  vec3 electricColor = mix(uColorCyan, uColorAccent, 0.35 + 0.35 * sin(vGlyph));
  color = mix(color, electricColor, clamp(vElectric * 0.92, 0.0, 0.92));
  color += electricColor * vElectric * 0.42;
  float depthFade = 1.0 - vDepth * 0.48;
  float body = mix(0.5, 0.72, vBird);
  body = mix(body, 0.48 + vPigmentDensity * 0.22 + scan * 0.24, vVideoMix);
  gl_FragColor = vec4(color, shape * vAlpha * depthFade * (body + vEnergy * 0.26 + vElectric * 0.34));
}
`;
