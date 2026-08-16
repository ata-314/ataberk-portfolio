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

// Bird flight inside the hero act: assembles center-right, crosses the
// stage, exits toward the Work handoff. Short and purposeful — the bird
// does not haunt the rest of the page.
const FLIGHT = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(2.8, -0.1, -1.0),
    new THREE.Vector3(1.7, 0.6, 0.2),
    new THREE.Vector3(-1.8, 0.9, 0.8),
    new THREE.Vector3(-3.6, 1.6, -0.6),
  ],
  false,
  "catmullrom",
  0.55,
);

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
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const mat = useMemo(() => new THREE.Matrix4(), []);
  const lookM = useMemo(() => new THREE.Matrix4(), []);
  const scl = useMemo(() => new THREE.Vector3(0.8, 0.8, 0.8), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  const { geometry, uniforms, material } = useMemo(() => {
    const { count, birdCount } = profile;
    const positions = new Float32Array(count * 3); // required attr, unused
    const homes = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const glyphs = new Float32Array(count);
    const birds = new Float32Array(count);
    const v = new THREE.Vector3();
    const birdSamples = bake?.count ?? 1;

    for (let i = 0; i < count; i++) {
      homePosition(i, count, v);
      homes[i * 3] = v.x;
      homes[i * 3 + 1] = v.y;
      homes[i * 3 + 2] = v.z;
      seeds[i] = Math.random() * 100;
      glyphs[i] = Math.floor(Math.random() * GLYPHS.length);
      // Every birdCount-th particle carries the bird; spread across samples
      birds[i] =
        bake && i < birdCount ? Math.floor((i / birdCount) * birdSamples) : -1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aHome", new THREE.BufferAttribute(homes, 3));
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
      uPosTex: { value: bake?.texture ?? fallbackTex },
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

  // Pointer / touch: force field + click wave.
  useEffect(() => {
    if (!profile.pointerEnabled) return;
    const el = gl.domElement;
    const toWorld = (x: number, y: number) => {
      const rect = el.getBoundingClientRect();
      ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
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
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
    };
  }, [gl, camera, ndc, raycaster, plane, uniforms, profile.pointerEnabled]);

  useFrame((_, delta) => {
    const u = uniforms;
    u.uTime.value += delta;
    reveal.current = Math.min(reveal.current + delta / 2.6, 1);
    u.uReveal.value = reveal.current;

    const hero = scrollState.hero.current;
    const page = scrollState.page.current;
    u.uHero.value = THREE.MathUtils.damp(u.uHero.value, hero, 6, delta);

    // Bird dissolves right after the hero act ends (Work handoff)
    const heroShare = 0.24; // hero runway ≈ this share of total page height
    const dissolve = THREE.MathUtils.smoothstep(page, heroShare, heroShare + 0.07);
    u.uDissolve.value = THREE.MathUtils.damp(u.uDissolve.value, dissolve, 5, delta);
    // Finale: matter returns free at the contact scene
    const finale = THREE.MathUtils.smoothstep(page, 0.86, 0.97);
    u.uFinale.value = THREE.MathUtils.damp(u.uFinale.value, finale, 5, delta);

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

    // Bird transform along its short flight (hero 0.55 → 1)
    if (bake) {
      const t = THREE.MathUtils.smoothstep(u.uHero.value, 0.55, 1.0);
      pathT.current = THREE.MathUtils.damp(pathT.current, t, 4, delta);
      const tt = Math.min(Math.max(pathT.current, 0.001), 0.999);
      FLIGHT.getPointAt(tt, pos);
      FLIGHT.getTangentAt(tt, tangent);
      lookM.lookAt(pos, lookTarget.copy(pos).add(tangent), THREE.Object3D.DEFAULT_UP);
      quat.setFromRotationMatrix(lookM);
      mat.compose(pos, quat, scl);
      u.uBirdMat.value.copy(mat);
      u.uBirdDir.value.copy(tangent);
      const speed = 1.1 + Math.abs(t - pathT.current) * 30;
      flap.current = (flap.current + delta * speed) % 1;
      u.uFlap.value = flap.current;
    }

    // Camera: slow push-in through the hero act; still afterwards
    const h = u.uHero.value;
    camera.position.set(
      Math.sin(h * Math.PI) * 0.4,
      0.15 - h * 0.1,
      8.2 - h * 1.8 * (1 - u.uFinale.value),
    );
    camera.lookAt(lookTarget.set(0.4, 0.1, 0));

    u.uSize.value = 40 * gl.getPixelRatio() * (size.height / 900);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </points>
  );
}
