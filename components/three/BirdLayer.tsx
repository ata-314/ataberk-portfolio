"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { bakeBird, type BirdBake } from "./bird-bake";
import { birdVertex, birdFragment } from "./bird-shaders";
import { scrollState } from "./scroll-state";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Flight path across the page, in camera space (camera at z=9).
// t=0 is the assembly point (hero handoff); t=1 is the final ascent.
const FLIGHT = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(2.4, 0.1, 0),
    new THREE.Vector3(-2.0, 1.1, -1.2),
    new THREE.Vector3(2.6, -0.5, -2.0),
    new THREE.Vector3(-2.4, 0.7, -1.0),
    new THREE.Vector3(0.2, 0.1, 0.6),
    new THREE.Vector3(0.4, 2.8, -2.5),
  ],
  false,
  "catmullrom",
  0.6,
);

function Bird({ bake, count }: { bake: BirdBake; count: number }) {
  const group = useRef<THREE.Group>(null!);
  const flap = useRef(0);
  const pathT = useRef(0);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const lookAt = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  const { geometry, uniforms, material } = useMemo(() => {
    const indices = new Float32Array(count);
    const seeds = new Float32Array(count);
    const positions = new Float32Array(count * 3); // required attr, unused
    for (let i = 0; i < count; i++) {
      // Spread sampled columns across the full texture when count < samples
      indices[i] = Math.floor((i / count) * bake.count);
      seeds[i] = Math.random() * 100;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const uniforms = {
      uPosTex: { value: bake.texture },
      uTexW: { value: bake.texWidth },
      uTexH: { value: bake.texHeight },
      uRowsPerFrame: { value: bake.rowsPerFrame },
      uFrames: { value: bake.frames },
      uFlap: { value: 0 },
      uAssemble: { value: 0 },
      uSize: { value: 26 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColorBase: { value: new THREE.Color("#f3efe7") },
      uColorAccent: { value: new THREE.Color("#c8ff3e") },
      uColorCyan: { value: new THREE.Color("#8ae6ff") },
    };
    // Imperative material — R3F's uniforms prop copies values (see NOTES_R3F_PATTERNS)
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: birdVertex,
      fragmentShader: birdFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, uniforms, material };
  }, [bake, count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      bake.texture.dispose();
    },
    [geometry, material, bake],
  );

  useFrame(({ gl, size, camera }, delta) => {
    const u = uniforms;
    u.uTime.value += delta;

    // Assembly rides the end of the hero runway; flight rides page scroll.
    const hero = scrollState.hero.current;
    const page = scrollState.page.current;
    const assemble = THREE.MathUtils.smoothstep(hero, 0.72, 0.97);
    u.uAssemble.value = THREE.MathUtils.damp(u.uAssemble.value, assemble, 5, delta);
    u.uOpacity.value = THREE.MathUtils.damp(
      u.uOpacity.value,
      assemble > 0.02 ? 1 : 0,
      4,
      delta,
    );

    // Wing beat: continuous, slightly faster while traveling
    const targetT = THREE.MathUtils.smoothstep(page, 0.28, 0.97);
    const speed = 0.9 + Math.abs(targetT - pathT.current) * 40;
    flap.current = (flap.current + delta * speed) % 1;
    u.uFlap.value = flap.current;

    // Glide along the flight path with weight
    pathT.current = THREE.MathUtils.damp(pathT.current, targetT, 3, delta);
    FLIGHT.getPointAt(Math.min(pathT.current, 0.999), pos);
    FLIGHT.getTangentAt(Math.min(pathT.current, 0.999), tangent);
    group.current.position.copy(pos);

    // Face travel direction (model noses -x after bake; yaw from tangent)
    lookAt.lookAt(pos, pos.clone().add(tangent), group.current.up);
    quat.setFromRotationMatrix(lookAt);
    group.current.quaternion.slerp(quat, 1 - Math.exp(-4 * delta));

    u.uSize.value = 26 * gl.getPixelRatio() * (size.height / 900);
    void camera;
  });

  return (
    <group ref={group} scale={0.85}>
      <points geometry={geometry} frustumCulled={false}>
        <primitive object={material} attach="material" />
      </points>
    </group>
  );
}

export default function BirdLayer() {
  const [bake, setBake] = useState<BirdBake | null>(null);
  const [count, setCount] = useState(12000);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = window.innerWidth < 768;
    setCount(coarse || small ? 5000 : 12000);
    let alive = true;
    bakeBird("/models/robot_bird_eagle.glb")
      .then((b) => alive && setBake(b))
      .catch((e) => console.error("bird bake failed:", e));
    return () => {
      alive = false;
    };
  }, []);

  // Page-wide scroll progress for the flight path.
  useGSAP(() => {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      scrub: true,
      onUpdate: (self) => {
        scrollState.page.current = self.progress;
      },
    });
  });

  if (!bake) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <Bird bake={bake} count={count} />
      </Canvas>
    </div>
  );
}
