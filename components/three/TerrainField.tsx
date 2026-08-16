"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { terrainVertex, terrainFragment } from "./terrain-shaders";

export type QualityProfile = {
  cols: number;
  rows: number;
  pointerEnabled: boolean;
};

// All per-frame state lives in refs/uniforms — never React state.
export function TerrainField({
  profile,
  progressRef,
}: {
  profile: QualityProfile;
  progressRef: RefObject<number>;
}) {
  const { size, camera, gl } = useThree();

  const pointerTarget = useRef(new THREE.Vector3(999, 0, 999));
  const pointerSmoothed = useRef(new THREE.Vector3(999, 0, 999));
  const pointerPrev = useRef(new THREE.Vector3(999, 0, 999));
  const pointerActive = useRef(0);
  const pointerVel = useRef(0);
  const waveAge = useRef(-1);
  // #instant skips the opening gather — used by headless screenshot checks,
  // where virtual time freezes time-based animation.
  const reveal = useRef(
    typeof window !== "undefined" && window.location.hash.includes("instant") ? 1 : 0,
  );
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), // terrain plane y=0
    [],
  );
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  const { geometry, uniforms, material } = useMemo(() => {
    const { cols, rows } = profile;
    const count = cols * rows;
    const positions = new Float32Array(count * 3); // unused base, required attr
    const grid = new Float32Array(count * 2);
    const seeds = new Float32Array(count);

    // Uniform random placement — a regular grid produces moiré ray lines
    // converging at the horizon.
    for (let i = 0; i < count; i++) {
      grid[i * 2] = Math.random();
      grid[i * 2 + 1] = Math.random();
      seeds[i] = Math.random() * 100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aGrid", new THREE.BufferAttribute(grid, 2));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uProgress: { value: 0 },
      uPointer: { value: new THREE.Vector3(999, 0, 999) },
      uPointerActive: { value: 0 },
      uPointerVel: { value: 0 },
      uWaveOrigin: { value: new THREE.Vector3() },
      uWaveAge: { value: -1 },
      uSize: { value: 30 },
      uColorBase: { value: new THREE.Color("#f3efe7") },
      uColorAccent: { value: new THREE.Color("#c8ff3e") },
      uColorCyan: { value: new THREE.Color("#8ae6ff") },
    };

    // Material is built imperatively: R3F's `uniforms` prop COPIES values into
    // the material, so useFrame mutations on a local object never reach the
    // GPU. With an imperative material, material.uniforms IS this object.
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: terrainVertex,
      fragmentShader: terrainFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry, uniforms, material };
  }, [profile]);

  // Imperatively-created GPU resources are disposed by hand (memory contract).
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // Pointer / touch: magnetic field + click wave. Works for touch via pointer events.
  useEffect(() => {
    if (!profile.pointerEnabled) return;
    const el = gl.domElement;

    const toWorld = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(plane, pointerTarget.current);
    };

    const onMove = (e: PointerEvent) => {
      toWorld(e.clientX, e.clientY);
      pointerActive.current = 1;
    };
    const onLeave = () => {
      pointerActive.current = 0;
    };
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

    // Opening reveal: dark scatter gathers into the terrain (~2.4s, eased in shader)
    reveal.current = Math.min(reveal.current + delta / 2.4, 1);
    u.uReveal.value = reveal.current;

    // Fluid pointer lag + velocity (drives trail energy)
    pointerPrev.current.copy(pointerSmoothed.current);
    pointerSmoothed.current.lerp(pointerTarget.current, 1 - Math.exp(-6 * delta));
    const vel = pointerPrev.current.distanceTo(pointerSmoothed.current) / Math.max(delta, 1e-4);
    pointerVel.current = THREE.MathUtils.damp(pointerVel.current, Math.min(vel / 14, 1), 4, delta);
    u.uPointer.value.copy(pointerSmoothed.current);
    u.uPointerVel.value = pointerVel.current;
    u.uPointerActive.value = THREE.MathUtils.damp(
      u.uPointerActive.value, pointerActive.current, 5, delta,
    );

    if (waveAge.current >= 0) {
      waveAge.current += delta;
      if (waveAge.current > 3.5) waveAge.current = -1;
    }
    u.uWaveAge.value = waveAge.current;

    // Scroll progress from ScrollTrigger (scrub) — smoothed here for weight
    u.uProgress.value = THREE.MathUtils.damp(
      u.uProgress.value, progressRef.current ?? 0, 6, delta,
    );
    const prog = u.uProgress.value;

    // Camera: low cinematic glide toward/into the surface as the user scrolls.
    // Horizon sits ~upper third — the sky stays dark and owns the headline.
    const px = profile.pointerEnabled ? pointerSmoothed.current.x : 0;
    camera.position.set(
      THREE.MathUtils.clamp(px * 0.04, -0.35, 0.35),
      1.55 - prog * 0.75,
      6.2 - prog * 2.6,
    );
    lookTarget.set(0, -0.15 - prog * 0.2, -2.2);
    camera.lookAt(lookTarget);

    u.uSize.value = 30 * gl.getPixelRatio() * (size.height / 900);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      {/* primitive keeps material.uniforms === our object — see useMemo note */}
      <primitive object={material} attach="material" />
    </points>
  );
}
