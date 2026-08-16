"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders";

export type QualityProfile = {
  count: number;
  pointerEnabled: boolean;
};

// All per-frame state lives in refs/uniforms — never React state (R3F pitfall #1).
export function CreativeMind({ profile }: { profile: QualityProfile }) {
  const material = useRef<THREE.ShaderMaterial>(null!);
  const points = useRef<THREE.Points>(null!);
  const parallax = useRef({ x: 0, y: 0 });
  const { size, camera, gl } = useThree();

  const pointerTarget = useRef(new THREE.Vector3(999, 999, 0));
  const pointerSmoothed = useRef(new THREE.Vector3(999, 999, 0));
  const pointerActive = useRef(0);
  const hold = useRef(0);
  const holdTarget = useRef(0);
  const waveAge = useRef(-1);
  const scroll = useRef(0);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );

  const { geometry, uniforms } = useMemo(() => {
    const count = profile.count;
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    // Organism: flattened ellipsoid cloud, offset right so the headline breathes.
    // Structure: camera-facing lattice spanning the full stage (scroll handoff).
    const cols = Math.ceil(Math.sqrt(count * 1.6));
    const rows = Math.ceil(count / cols);
    const spanX = 7.2;
    const spanY = 4.2;
    const offsetX = 1.7;
    for (let i = 0; i < count; i++) {
      const r = Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 2.4 + offsetX;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 1.7;
      positions[i * 3 + 2] = r * Math.cos(phi) * 1.2;

      const col = i % cols;
      const row = Math.floor(i / cols);
      targets[i * 3] = (col / (cols - 1) - 0.5) * spanX;
      targets[i * 3 + 1] = (row / (rows - 1) - 0.5) * spanY;
      targets[i * 3 + 2] = (Math.random() - 0.5) * 0.12;

      seeds[i] = Math.random() * 100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPointer: { value: new THREE.Vector3(999, 999, 0) },
      uPointerActive: { value: 0 },
      uHold: { value: 0 },
      uWaveOrigin: { value: new THREE.Vector3() },
      uWaveAge: { value: -1 },
      uSize: { value: 38 },
      uCenter: { value: new THREE.Vector3(offsetX, 0, 0) },
      uColorBase: { value: new THREE.Color("#f3efe7") },
      uColorAccent: { value: new THREE.Color("#c8ff3e") },
    };
    return { geometry, uniforms };
  }, [profile.count]);

  // Imperatively-created GPU resources are disposed by hand (memory contract).
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Pointer + hold + release-wave wiring on the canvas element.
  useEffect(() => {
    if (!profile.pointerEnabled) return;
    const el = gl.domElement;

    const toWorld = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(plane, pointerTarget.current);
      parallax.current.x = ndc.x;
      parallax.current.y = ndc.y;
    };

    const onMove = (e: PointerEvent) => {
      toWorld(e);
      pointerActive.current = 1;
    };
    const onLeave = () => {
      pointerActive.current = 0;
      holdTarget.current = 0;
    };
    const onDown = (e: PointerEvent) => {
      toWorld(e);
      holdTarget.current = 1;
    };
    const onUp = () => {
      if (holdTarget.current > 0) {
        uniforms.uWaveOrigin.value.copy(pointerSmoothed.current);
        waveAge.current = 0;
      }
      holdTarget.current = 0;
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl, camera, ndc, raycaster, plane, uniforms, profile.pointerEnabled]);

  // Scroll morph: progress over the first viewport height (hero handoff).
  useEffect(() => {
    const onScroll = () => {
      scroll.current = Math.min(window.scrollY / window.innerHeight, 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((_, delta) => {
    const u = uniforms;
    u.uTime.value += delta;

    // Damped follow — motion by delta, never fixed steps
    pointerSmoothed.current.lerp(pointerTarget.current, 1 - Math.exp(-8 * delta));
    u.uPointer.value.copy(pointerSmoothed.current);
    u.uPointerActive.value = THREE.MathUtils.damp(
      u.uPointerActive.value, pointerActive.current, 6, delta,
    );

    hold.current = THREE.MathUtils.damp(hold.current, holdTarget.current, 4, delta);
    u.uHold.value = hold.current;

    if (waveAge.current >= 0) {
      waveAge.current += delta;
      if (waveAge.current > 3) waveAge.current = -1;
    }
    u.uWaveAge.value = waveAge.current;

    u.uProgress.value = THREE.MathUtils.damp(u.uProgress.value, scroll.current, 5, delta);
    // gl_PointSize is in device pixels — scale by DPR and viewport height
    u.uSize.value = 38 * gl.getPixelRatio() * (size.height / 900);

    // Subtle pointer parallax on the whole organism (desktop only)
    if (profile.pointerEnabled && points.current) {
      points.current.rotation.y = THREE.MathUtils.damp(
        points.current.rotation.y, parallax.current.x * 0.08, 3, delta,
      );
      points.current.rotation.x = THREE.MathUtils.damp(
        points.current.rotation.x, -parallax.current.y * 0.05, 3, delta,
      );
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
