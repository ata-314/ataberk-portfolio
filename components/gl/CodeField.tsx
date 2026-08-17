"use client";
/* eslint-disable react-hooks/purity, react-hooks/immutability --
   R3F frame-loop idiom: per-frame state lives in refs/uniforms mutated inside
   useFrame/raf (never React state), and GPU tier detection is a client-only
   mount effect. These are deliberate, documented patterns. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { fieldVertex, fieldFragment } from "./field-shaders";
import { createGlyphAtlas, GLYPHS } from "./glyph-atlas";
import { scrollState } from "../three/scroll-state";
import type { BirdBake } from "../three/bird-bake";

export type FieldProfile = {
  count: number;
  birdCount: number;
  pointerEnabled: boolean;
};

// Flight choreography over hero progress 0.45→1.0 (brief §7):
// formation (three-quarter, center-right) → grow + drift LEFT → S-curve
// RIGHT while growing → close-up toward camera → dissolve to Work.
// Position spline + matching scale keys; smooth, reversible, no hard cuts.
const FLIGHT_KEYS = [
  { h: 0.42, pos: new THREE.Vector3(1.1, 1.05, -0.6), scale: 0.72 },
  { h: 0.6, pos: new THREE.Vector3(0.55, 1.15, 0.0), scale: 0.9 },
  { h: 0.72, pos: new THREE.Vector3(-1.1, 1.30, 0.5), scale: 1.04 },
  { h: 0.84, pos: new THREE.Vector3(1.35, 1.10, 1.1), scale: 1.18 },
  { h: 0.94, pos: new THREE.Vector3(0.4, 0.95, 1.9), scale: 1.38 },
  { h: 1.0, pos: new THREE.Vector3(0.15, 1.30, 1.7), scale: 1.42 },
];
const FLIGHT = new THREE.CatmullRomCurve3(
  FLIGHT_KEYS.map((k) => k.pos),
  false,
  "catmullrom",
  0.5,
);

// After the hero act the bird stays with the reader: a page-long companion
// path weaving over the sections, ending centered for the contact finale.
const PAGE_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0.15, 1.3, 1.7), // hero close-up handoff
    new THREE.Vector3(-2.3, 0.7, 0.1),
    new THREE.Vector3(2.4, 1.1, -0.5),
    new THREE.Vector3(-2.1, 0.4, 0.6),
    new THREE.Vector3(1.8, 0.9, 0.2),
    new THREE.Vector3(0.2, 0.7, 1.2), // finale center
  ],
  false,
  "catmullrom",
  0.55,
);

function flightAt(h: number, pos: THREE.Vector3, tangent: THREE.Vector3) {
  const keys = FLIGHT_KEYS;
  const h0 = keys[0].h;
  const h1 = keys[keys.length - 1].h;
  const c = THREE.MathUtils.clamp(h, h0, h1);
  // Map hero progress to spline parameter through the key timings
  let seg = 0;
  while (seg < keys.length - 2 && c > keys[seg + 1].h) seg++;
  const local = (c - keys[seg].h) / (keys[seg + 1].h - keys[seg].h);
  const t = THREE.MathUtils.clamp((seg + local) / (keys.length - 1), 0.001, 0.999);
  FLIGHT.getPointAt(t, pos);
  FLIGHT.getTangentAt(t, tangent);
  const scale = THREE.MathUtils.lerp(keys[seg].scale, keys[seg + 1].scale, local);
  return scale;
}

// Lobed volumetric home: three depth shells, displaced by layered sines —
// organic and layered, deliberately not a grid, sphere or height-map.
function homePosition(i: number, count: number, out: THREE.Vector3) {
  const shell = i % 3;
  const t = (i / count) * Math.PI * 2 * 13.37;
  const u = Math.acos(2 * ((i * 0.61803) % 1) - 1);
  const r = 1.1 + shell * 0.65 + Math.sin(t * 2.7) * 0.25;
  out.set(
    Math.sin(u) * Math.cos(t) * r * 1.9,
    Math.sin(u) * Math.sin(t) * r * 0.9 + Math.sin(t * 1.3) * 0.4,
    Math.cos(u) * r * 1.1,
  );
  // Lobe displacement — asymmetric mass, offset right for the headline
  out.x += Math.sin(out.y * 1.7 + shell) * 0.5 + 1.3;
  out.y += Math.sin(out.x * 0.9) * 0.35;
  return out;
}

export function CodeField({
  profile,
  bake,
}: {
  profile: FieldProfile;
  bake: BirdBake | null;
}) {
  const { size, camera, gl } = useThree();
  const pointerTarget = useRef(new THREE.Vector3(999, 999, 0));
  const pointerSmoothed = useRef(new THREE.Vector3(999, 999, 0));
  const pointerPrev = useRef(new THREE.Vector3(999, 999, 0));
  const pointerActive = useRef(0);
  const pointerVel = useRef(0);
  const waveAge = useRef(-1);
  const reveal = useRef(0);
  const flap = useRef(0);
  const pathT = useRef(0);
  const pageT = useRef(0);
  const pageAtHeroEnd = useRef(0);
  const yawRef = useRef(-1.07);
  const followMix = useRef(0);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const mat = useMemo(() => new THREE.Matrix4(), []);
  const scl = useMemo(() => new THREE.Vector3(0.8, 0.8, 0.8), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const followTarget = useMemo(() => new THREE.Vector3(), []);
  const followDirection = useMemo(() => new THREE.Vector3(), []);

  const { geometry, uniforms, material } = useMemo(() => {
    const { count, birdCount } = profile;
    const positions = new Float32Array(count * 3); // required attr, unused
    const homes = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const glyphs = new Float32Array(count);
    const birds = new Float32Array(count);
    const v = new THREE.Vector3();
    const birdSamples = bake?.count ?? 1;

    // Shuffled pixel mapping: every particle owns one cell of the source
    // video, interleaved so the bird subset never carves a spatial hole.
    const grid = new Float32Array(count * 2);
    const cols = Math.round(Math.sqrt(count * (16 / 9)));
    const rows = Math.ceil(count / cols);
    const perm = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    for (let i = 0; i < count; i++) {
      homePosition(i, count, v);
      homes[i * 3] = v.x;
      homes[i * 3 + 1] = v.y;
      homes[i * 3 + 2] = v.z;
      seeds[i] = Math.random() * 100;
      glyphs[i] = Math.floor(Math.random() * GLYPHS.length);
      const g = perm[i];
      grid[i * 2] = ((g % cols) + 0.5 + (Math.random() - 0.5) * 0.25) / cols;
      grid[i * 2 + 1] = 1 - ((Math.floor(g / cols) + 0.5 + (Math.random() - 0.5) * 0.25) / rows);
      // Every birdCount-th particle carries the bird; spread across samples
      birds[i] =
        bake && i < birdCount ? Math.floor((i / birdCount) * birdSamples) : -1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aHome", new THREE.BufferAttribute(homes, 3));
    geometry.setAttribute("aGrid", new THREE.BufferAttribute(grid, 2));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aGlyph", new THREE.BufferAttribute(glyphs, 1));
    geometry.setAttribute("aBird", new THREE.BufferAttribute(birds, 1));

    const atlas = createGlyphAtlas();
    const fallbackTex = new THREE.DataTexture(
      new Float32Array(4),
      1,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    fallbackTex.needsUpdate = true;

    const uniforms = {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uHero: { value: 0 },
      uDissolve: { value: 0 },
      uFinale: { value: 0 },
      uPointer: { value: new THREE.Vector3(999, 999, 0) },
      uPointerActive: { value: 0 },
      uPointerVel: { value: 0 },
      uWaveOrigin: { value: new THREE.Vector3() },
      uWaveAge: { value: -1 },
      uSize: { value: 40 },
      uBirdMat: { value: new THREE.Matrix4() },
      uBirdDir: { value: new THREE.Vector3(-1, 0, 0) },
      uVortexA: { value: new THREE.Vector3(-1.5, 0.4, 0) },
      uVortexB: { value: new THREE.Vector3(2.5, -0.6, 0) },
      uPosTex: { value: bake?.texture ?? fallbackTex },
      uNrmTex: { value: bake?.normals ?? fallbackTex },
      uVideoTex: { value: fallbackTex as THREE.Texture },
      uVideoOn: { value: 0 },
      uMeltScale: {
        value:
          typeof window !== "undefined" && window.location.hash.includes("lock") ? 0 : 1,
      },
      uTexW: { value: bake?.texWidth ?? 1 },
      uTexH: { value: bake?.texHeight ?? 1 },
      uRowsPerFrame: { value: bake?.rowsPerFrame ?? 1 },
      uFrames: { value: bake?.frames ?? 1 },
      uFlap: { value: 0 },
      uAtlas: { value: atlas },
      uColorBase: { value: new THREE.Color("#f3efe7") },
      uColorAccent: { value: new THREE.Color("#c8ff3e") },
      uColorCyan: { value: new THREE.Color("#8ae6ff") },
    };

    // Imperative material — R3F's uniforms prop copies values (NOTES_R3F_PATTERNS)
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: fieldVertex,
      fragmentShader: fieldFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, uniforms, material, atlas };
  }, [profile, bake]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      (uniforms.uAtlas.value as THREE.Texture).dispose();
    },
    [geometry, material, uniforms],
  );

  // Data-painting source: the hero video feeds the field as a texture.
  // Muted + playsInline + loop; the site never blocks on it (uVideoOn flips
  // only once frames actually decode).
  useEffect(() => {
    const vid = document.createElement("video");
    vid.src = "/media/hero-source.mp4";
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.preload = "auto";
    const tex = new THREE.VideoTexture(vid);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const onPlaying = () => {
      uniforms.uVideoTex.value = tex;
      uniforms.uVideoOn.value = 1;
    };
    vid.addEventListener("playing", onPlaying);
    vid.play().catch(() => {
      // Autoplay refused (rare with muted): stay in fluid mode
      uniforms.uVideoOn.value = 0;
    });
    return () => {
      vid.removeEventListener("playing", onPlaying);
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      tex.dispose();
    };
  }, [uniforms]);

  // Pointer / touch on WINDOW: the canvas is a click-through overlay, so the
  // matter reacts everywhere on the page — including around the companion bird.
  useEffect(() => {
    if (!profile.pointerEnabled) return;
    const toWorld = (x: number, y: number) => {
      ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(plane, pointerTarget.current);
    };
    const onMove = (e: PointerEvent) => {
      toWorld(e.clientX, e.clientY);
      pointerActive.current = 1;
    };
    const onLeave = () => (pointerActive.current = 0);
    const onDown = (e: PointerEvent) => {
      toWorld(e.clientX, e.clientY);
      uniforms.uWaveOrigin.value.copy(pointerTarget.current);
      waveAge.current = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [camera, ndc, raycaster, plane, uniforms, profile.pointerEnabled]);

  useFrame((_, delta) => {
    const u = uniforms;
    u.uTime.value += delta;
    reveal.current = Math.min(reveal.current + delta / 2.6, 1);
    u.uReveal.value = reveal.current;

    const hero = scrollState.hero.current;
    const page = scrollState.page.current;
    u.uHero.value = THREE.MathUtils.damp(u.uHero.value, hero, 6, delta);

    // The bird stays with the reader for the whole page; it only releases
    // back into free matter as the contact finale arrives.
    const dissolve = THREE.MathUtils.smoothstep(page, 0.9, 0.97);
    u.uDissolve.value = THREE.MathUtils.damp(u.uDissolve.value, dissolve, 5, delta);
    // Finale: matter returns free at the contact scene
    const finale = THREE.MathUtils.smoothstep(page, 0.86, 0.97);
    u.uFinale.value = THREE.MathUtils.damp(u.uFinale.value, finale, 5, delta);

    // Roaming vortex centers of the data field
    u.uVortexA.value.set(-1.6 + Math.sin(u.uTime.value * 0.07) * 1.2, 0.5 + Math.cos(u.uTime.value * 0.05) * 0.8, 0);
    u.uVortexB.value.set(2.4 + Math.cos(u.uTime.value * 0.06) * 1.4, -0.5 + Math.sin(u.uTime.value * 0.08) * 0.7, 0);

    // Pointer physics
    pointerPrev.current.copy(pointerSmoothed.current);
    pointerSmoothed.current.lerp(pointerTarget.current, 1 - Math.exp(-6 * delta));
    const vel = pointerPrev.current.distanceTo(pointerSmoothed.current) / Math.max(delta, 1e-4);
    pointerVel.current = THREE.MathUtils.damp(pointerVel.current, Math.min(vel / 14, 1), 4, delta);
    u.uPointer.value.copy(pointerSmoothed.current);
    u.uPointerVel.value = pointerVel.current;
    u.uPointerActive.value = THREE.MathUtils.damp(u.uPointerActive.value, pointerActive.current, 5, delta);

    if (waveAge.current >= 0) {
      waveAge.current += delta;
      if (waveAge.current > 3.5) waveAge.current = -1;
    }
    u.uWaveAge.value = waveAge.current;

    // Bird transform: keyframed flight (grow → left → S-right → close-up).
    // Orientation: gentle yaw from the travel direction blended over a stable
    // three-quarter base so the anatomy never spins away; soft, clamped bank.
    if (bake) {
      const h = u.uHero.value;
      // #pose debug: identity orientation at a fixed spot to read model axes
      if (typeof window !== "undefined" && window.location.hash.includes("pose")) {
        pos.set(0.3, 0.1, 1.0);
        quat.identity();
        scl.setScalar(1.1);
        tangent.set(-1, 0, 0);
        mat.compose(pos, quat, scl);
        u.uBirdMat.value.copy(mat);
        u.uBirdDir.value.copy(tangent);
      } else {
      pathT.current = THREE.MathUtils.damp(pathT.current, h, 5, delta);
      let s: number;
      if (h < 0.999) {
        s = flightAt(pathT.current, pos, tangent);
        pageAtHeroEnd.current = page;
      } else {
        // Companion flight: weave over the sections on page progress
        const span = Math.max(0.9 - pageAtHeroEnd.current, 0.05);
        const target = THREE.MathUtils.clamp((page - pageAtHeroEnd.current) / span, 0, 1);
        pageT.current = THREE.MathUtils.damp(pageT.current, target, 4, delta);
        const tt = THREE.MathUtils.clamp(pageT.current, 0.001, 0.999);
        PAGE_CURVE.getPointAt(tt, pos);
        PAGE_CURVE.getTangentAt(tt, tangent);
        // Smaller while traveling between sections; settles for the finale
        s = THREE.MathUtils.lerp(1.42, 0.82, THREE.MathUtils.smoothstep(pageT.current, 0.0, 0.25))
          + THREE.MathUtils.smoothstep(pageT.current, 0.85, 1.0) * 0.2;
      }

      // The scroll curve remains the bird's authored route; a fine pointer
      // becomes a second, softer director once the anatomy has formed. The
      // bird chases a point just inside the cursor, then returns to its route
      // when the pointer leaves — no snapping and no loss of scroll intent.
      const formed = THREE.MathUtils.smoothstep(h, 0.56, 0.74);
      const desiredFollow = formed * pointerActive.current * (1 - u.uFinale.value);
      followMix.current = THREE.MathUtils.damp(followMix.current, desiredFollow, 3.2, delta);
      if (pointerSmoothed.current.x < 500 && followMix.current > 0.001) {
        const aspect = size.width / Math.max(size.height, 1);
        const side = pointerSmoothed.current.x >= 0 ? -1 : 1;
        followTarget.copy(pointerSmoothed.current);
        followTarget.x += side * 0.72;
        followTarget.y += 0.32;
        followTarget.x = THREE.MathUtils.clamp(
          followTarget.x,
          aspect < 1 ? -1.65 : -3.15,
          aspect < 1 ? 1.65 : 3.15,
        );
        followTarget.y = THREE.MathUtils.clamp(followTarget.y, -1.55, 1.85);
        followTarget.z = pos.z;
        followDirection.subVectors(followTarget, pos);
        const followStrength = (h < 0.999 ? 0.48 : 0.76) * followMix.current;
        pos.lerp(followTarget, followStrength);
        if (followDirection.lengthSq() > 0.0001) {
          tangent.lerp(followDirection.normalize(), followStrength * 0.82).normalize();
        }
      }
      scl.setScalar(s);
      // Stable three-quarter pose: the model faces +Z at identity, so a yaw
      // of ±1.07 rad reads as a 3/4 profile. Heading follows travel direction
      // with heavy damping — the bird banks and turns, never spins.
      const yawTarget = (tangent.x >= 0 ? 1 : -1) * 1.07;
      yawRef.current = THREE.MathUtils.damp(yawRef.current, yawTarget, 2.2, delta);
      const bank = THREE.MathUtils.clamp(-tangent.x * 0.22, -0.28, 0.28);
      quat.setFromEuler(euler.set(0.06, yawRef.current, bank));
      mat.compose(pos, quat, scl);
      u.uBirdMat.value.copy(mat);
      u.uBirdDir.value.set(tangent.x, tangent.y * 0.4, tangent.z).normalize();
      }
      // Wing beat: the model's own clip; slightly faster while traveling
      const speed = 1.0 + Math.min(Math.abs(h - pathT.current) * 20, 0.8);
      flap.current = (flap.current + delta * speed) % 1;
      u.uFlap.value = flap.current;
    }

    // Camera: slightly below eye-line, slow push through the hero act,
    // whisper of pointer parallax — never enough to bend the silhouette.
    const h2 = u.uHero.value;
    const px = profile.pointerEnabled ? THREE.MathUtils.clamp(pointerSmoothed.current.x * 0.02, -0.18, 0.18) : 0;
    camera.position.set(
      Math.sin(h2 * Math.PI) * 0.35 + px,
      -0.05 - h2 * 0.05,
      8.2 - h2 * 1.6 * (1 - u.uFinale.value),
    );
    camera.lookAt(lookTarget.set(0.35, 0.15, 0));

    u.uSize.value = 40 * gl.getPixelRatio() * (size.height / 900);
  });

  return (
    <>
      <points geometry={geometry} frustumCulled={false}>
        <primitive object={material} attach="material" />
      </points>
      {profile.pointerEnabled && (
        <LightTrail pointer={pointerSmoothed} vel={pointerVel} active={pointerActive} />
      )}
    </>
  );
}

// A thin streak of light that follows the pointer — a fading line, not a
// cursor shape. Head chases the pointer, tail relaxes; brightness rides speed.
const TRAIL_N = 28;

function LightTrail({
  pointer,
  vel,
  active,
}: {
  pointer: React.RefObject<THREE.Vector3>;
  vel: React.RefObject<number>;
  active: React.RefObject<number>;
}) {
  const { line, geometry, material, uniforms, positions } = useMemo(() => {
    const positions = new Float32Array(TRAIL_N * 3);
    const ages = new Float32Array(TRAIL_N);
    for (let i = 0; i < TRAIL_N; i++) ages[i] = i / (TRAIL_N - 1);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aT", new THREE.BufferAttribute(ages, 1));
    const uniforms = { uIntensity: { value: 0 } };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        attribute float aT;
        varying float vT;
        void main() {
          vT = aT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uIntensity;
        varying float vT;
        void main() {
          float a = (1.0 - vT) * uIntensity;
          vec3 color = mix(vec3(0.784, 1.0, 0.243), vec3(0.953, 0.937, 0.906), vT);
          gl_FragColor = vec4(color, a * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    return { line, geometry, material, uniforms, positions };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    const p = pointer.current;
    if (p.x > 500) return; // pointer hasn't entered the stage yet
    positions[0] = p.x;
    positions[1] = p.y;
    positions[2] = 1.2;
    const k = 1 - Math.exp(-26 * delta);
    for (let i = TRAIL_N - 1; i >= 1; i--) {
      const o = i * 3;
      positions[o] += (positions[o - 3] - positions[o]) * k;
      positions[o + 1] += (positions[o - 2] - positions[o + 1]) * k;
      positions[o + 2] = 1.2;
    }
    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    uniforms.uIntensity.value = THREE.MathUtils.damp(
      uniforms.uIntensity.value,
      Math.min((vel.current ?? 0) * 1.6, 1) * (active.current ?? 0),
      6,
      delta,
    );
  });

  return <primitive object={line} />;
}
