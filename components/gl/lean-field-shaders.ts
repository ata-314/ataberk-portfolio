// Lean production shader for the homepage. It keeps the authored states —
// folded pigment currents, gathering, glyph bird, pointer response and dissolve — in a
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
uniform float uMinPoint;
uniform vec2 uSheet;
uniform mat4 uBirdMat;
uniform vec3 uBirdDir;
uniform sampler2D uPosTex;
uniform sampler2D uNrmTex;
uniform float uVideoOn;
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
uniform vec2 uScanPtr;
uniform float uScanVel;

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
varying vec2 vFlow;
varying float vStreak;

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

// Value noise + fbm for the procedural data sea.
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Two-octave fbm: the smooth stream function the sea's currents follow.
float fbm2(vec2 p) {
  return 0.667 * vnoise(p) + 0.333 * vnoise(mat2(1.6, 1.2, -1.2, 1.6) * p);
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
  float pointerScan = 0.0;
  float streamFade = 1.0;
  vFlow = vec2(1.0, 0.0);
  vStreak = 0.0;
  // Uniform branch: once the data sea has handed off, integrated GPUs skip
  // every noise, exp and liquid-wave operation during bird flight.
  if (uVideoOn > 0.015) {
    // A continuous folded volume: broad currents carry fine sediment along
    // their contours. The same relief controls position, pigment and light.
    vec2 world = (aGrid - 0.5) * 2.0 * uSheet;
    float st = uTime * 0.12;
    vec2 q = world * 0.36;
    vec2 warp = vec2(
      fbm2(q + vec2(st * 0.22, -st * 0.16)),
      fbm2(q + vec2(7.2, 2.8) + st * 0.18)
    );
    float bend = sin(world.x * 0.58 + st * 0.32);
    float current = world.y * 1.4 + bend * 1.65
      + sin(world.x * 0.28 - st * 0.2) * 1.4
      + (warp.x - 0.5) * 2.8;
    float ridge = sin(current);
    float crest = pow(0.5 + 0.5 * ridge, 2.0);
    float grain = fbm2(q * 5.0 + warp * 2.0 - st * 0.12);
    float filament = sin(current * 24.0 + grain * 3.0);
    // Depth layers break the sheet into suspended grains, keeping the broad
    // folds intact while giving the camera actual thickness and parallax.
    float depthLayer = fract(aSeed * 2.719) - 0.5;
    vec3 sheet = vec3(world,
      crest * 2.0 - 0.9 + (warp.y - 0.5) * 0.9
      + depthLayer * (0.12 + crest * 0.42));
    sheet.y += ridge * 0.48 + (warp.y - 0.5) * 0.5;
    sheet.x += (warp.x - 0.5) * 0.65;
    sheet.xy += uTide * 0.09;
    // Raking light across the slopes: pearl peaks, saturated blue recesses.
    float slope = cos(current);
    luminance = clamp(0.25 + crest * 0.47 + slope * 0.22
      + grain * 0.12 + filament * 0.035, 0.0, 1.0);
    pigmentDensity = crest;
    vVideo = vec3(luminance);
    float derivative = cos(world.x * 0.58 + st * 0.32) * 0.96
      + cos(world.x * 0.28 - st * 0.2) * 0.39;
    vec2 flowDir = normalize(vec2(1.0, -derivative / 1.4));
    float flowStrength = 0.8 + crest * 0.8;
    // Pointer scanning: moving the cursor sweeps a lime scan through the
    // pigment — data near the sweep lights up and ripples in its wake, and
    // the effect fades as the cursor comes to rest.
    vec2 toScan = sheet.xy - uScanPtr;
    float scanDist = length(toScan);
    pointerScan = exp(-scanDist * scanDist * 0.85) * uScanVel;
    float scanWave = sin(scanDist * 6.0 - uTime * 9.0) * pointerScan;
    sheet.xy += normalize(toScan + 0.0001) * scanWave * 0.22;
    sheet.z += pointerScan * 0.45 + scanWave * 0.18;
    vec4 edgeDist = vec4(sheet.x + uSheet.x, uSheet.x - sheet.x, sheet.y + uSheet.y, uSheet.y - sheet.y);
    for (int i = 0; i < 4; i++) {
      float age = uEdgeAges[i];
      if (age >= 0.0) {
        float ring = exp(-pow((edgeDist[i] - age * 3.3) * 1.12, 2.0)) * exp(-age * 1.05);
        sheet.xy += EDGE_INWARD[i] * ring * 0.5;
        sheet.z += ring * 0.34;
        edgeGlow += ring;
      }
    }
    // Each particle slides along the local current for a short life and
    // fades at both ends; the fragment stage draws it as a stroke aligned to
    // the same direction, so the sea reads as brushed flow lines.
    float life = fract(uTime * (0.05 + seed * 0.05) + fract(aSeed * 0.618));
    float reach = 0.28 + crest * 0.24;
    sheet.xy += flowDir * (life - 0.5) * reach;
    streamFade = 0.62 + 0.38 * sin(3.14159 * life);
    vFlow = flowDir;
    vStreak = smoothstep(0.1, 0.9, flowStrength);
    field = mix(field, sheet, smoothstep(0.0, 0.72, uVideoOn));
  }
  vec3 point = field;
  float alpha = 1.0;
  float energy = 0.08 + luminance * uVideoOn * 0.22 + 0.1 * sin(aSeed + uTime * 0.08)
    + edgeGlow * 0.85 + pointerScan * 0.9;
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

  // Opening assembly: every point launches from a deep, compact core and
  // spirals outward into its place in the painting on a staggered expo-out
  // curve — one decisive gather instead of a long flight. The start depth sits
  // far behind the focal plane, so no point ever passes the camera and flares
  // into an out-of-focus blob. A sparse subset carries an acid-lime glint
  // while in transit and cools to base colour as it lands.
  vScanLime = 0.0;
  float introT = clamp((uIntro - seed * 0.4) / 0.6, 0.0, 1.0);
  float introLife = introT >= 1.0 ? 0.0 : pow(2.0, -10.0 * introT);
  if (introLife > 0.001) {
    float spin = introLife * (1.6 + seed * 1.2);
    float cs = cos(spin);
    float sn = sin(spin);
    vec2 core = mat2(cs, -sn, sn, cs) * point.xy * (0.18 + seed * 0.2);
    vec3 origin = vec3(core, point.z - 20.0 - fract(aSeed * 9.271) * 16.0);
    point = mix(point, origin, introLife);
    alpha *= smoothstep(0.0, 0.18, introT);
    float glint = step(0.86, fract(aSeed * 7.13)) * introLife * (1.0 - introLife) * 4.0;
    vScanLime = glint * 0.7;
    energy += glint * 0.4;
  }
  // The pointer sweep shares the acid-lime scan identity.
  vScanLime += pointerScan;

  float appear = smoothstep(seed * 0.7, seed * 0.7 + 0.22, uReveal);
  vec4 view = modelViewMatrix * vec4(point, 1.0);
  gl_Position = projectionMatrix * view;
  vGlyph = aGlyph;
  vBird = bird;
  vVideoMix = uVideoOn * (1.0 - bird) * (1.0 - uFinale);
  alpha *= mix(1.0, (0.3 + luminance * 0.7) * streamFade, vVideoMix);
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
  // Bright currents swell into overlapping glow; quiet water stays a fine
  // dust, which gives the sea its luminous-pigment depth.
  // Strokes need a larger sprite to hold their length.
  float pigmentSize = mix(1.05 + seed * 0.4, 1.95 + seed * 0.6, luminance) * (1.0 + vStreak * 0.35);
  size = mix(size, pigmentSize, vVideoMix);
  size *= 1.0 + electric * 0.75;
  // The fly-through brings particles right up to the camera plane: clamp the
  // divisor so near passes flare into streaks instead of exploding, and cap
  // the sprite so a single point can never flood the mobile rasterizer.
  float pointPx = min(uSize * size / max(-view.z, 0.6), uSize * 2.2);
  // Sprites under a few device pixels rasterize as square blocks. Hold a
  // minimum footprint so every droplet stays round, and dim the enlarged
  // sprite by the area ratio so its total light stays the same. Glyph points
  // keep their size so the bird's characters never wash out.
  if (bird < 0.5 && uLineMode < 0.5 && pointPx < uMinPoint) {
    float grow = uMinPoint / max(pointPx, 0.001);
    vAlpha /= grow * grow;
    pointPx = uMinPoint;
  }
  gl_PointSize = pointPx;
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
varying vec2 vFlow;
varying float vStreak;

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
    // Soft volumetric droplet: a gaussian body with a brighter core, sized to
    // overlap its neighbours so the field reads as one continuous fluid mass
    // instead of discrete pixels.
    vec2 pc = gl_PointCoord - 0.5;
    pc.y = -pc.y;
    // Flow stroke: squeeze the droplet across the current and stretch it
    // along it. Strong currents give long thin strokes, calm water stays round.
    float along = dot(pc, vFlow);
    float across = dot(pc, vec2(-vFlow.y, vFlow.x));
    float stretch = mix(1.0, 2.1, vStreak * vVideoMix);
    float radius = length(vec2(along, across * stretch));
    if (radius > 0.5) discard;
    // Depth of field: near droplets stay tight and bright, far ones widen
    // into a soft out-of-focus haze so the painting gains real volume.
    float sharp = mix(12.0, 6.5, vDepth);
    float fall = exp(-radius * radius * sharp) - exp(-sharp * 0.25);
    float core = exp(-radius * radius * sharp * 3.0) * (1.0 - vDepth * 0.4);
    shape = fall * mix(0.3, 0.44, vPigmentDensity)
      + core * mix(0.3, 0.5, vPigmentDensity);
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

  // Quiet pigment lighting lets the sculptural currents read without
  // periodic screen-space scanning bars interrupting their movement.
  float scan = 0.0;

  color = mix(color, videoColor, vVideoMix * 0.98);
  color = mix(color, uColorAccent, smoothstep(0.38, 1.0, vEnergy) * (1.0 - vVideoMix));
  // Edge waves and pointer ripples flare toward the palette's peak stop.
  color = mix(color, uGradD, smoothstep(0.42, 1.0, vEnergy) * vVideoMix * 0.85);
  // The opening scan planes light passing data points in acid lime, and link
  // segments carry the same identity color.
  color = mix(color, mix(uGradC, uGradD, 0.65), clamp(vScanLime * 0.6, 0.0, 0.65));
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
