"use client";
/* eslint-disable react-hooks/purity, react-hooks/immutability --
   R3F frame-loop idiom: geometry is generated once with Math.random inside
   useMemo, and GPU objects (materials, uniforms) are mutated in useFrame —
   never React state. Same documented pattern as components/gl/CodeField. */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const URL = "/models/robot_bird_eagle.glb";

// The centrepiece: the eagle as a chrome-and-glass sculpture — polished
// metal with an iridescent film and clear coat, lit only by the studio
// environment — beating its wings slowly, wrapped in a cloud of light.
export function Eagle({ group }: { group: React.RefObject<THREE.Group | null> }) {
  const { scene, animations } = useGLTF(URL);
  const model = useMemo(() => scene, [scene]);
  const { actions, mixer } = useAnimations(animations, model);

  const chrome = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#d9e6ea"),
        metalness: 1,
        roughness: 0.14,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        iridescence: 0.9,
        iridescenceIOR: 1.7,
        iridescenceThicknessRange: [180, 820],
        envMapIntensity: 1.6,
      }),
    [],
  );

  useEffect(() => {
    model.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = chrome;
        mesh.frustumCulled = false;
      }
    });
    const flight = Object.values(actions)[0];
    flight?.reset().play();
    if (flight) flight.timeScale = 0.55;
    return () => { flight?.stop(); };
  }, [model, actions, chrome]);

  const aura = useRef<THREE.Points>(null);
  const auraGeometry = useMemo(() => {
    const count = 2600;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // A loose ellipsoid shell round the body and wings.
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      const r = 0.9 + Math.random() * 1.4;
      positions.set([Math.sin(v) * Math.cos(u) * r * 1.6, Math.cos(v) * r * 0.8, Math.sin(v) * Math.sin(u) * r], i * 3);
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, []);
  const auraMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { time: { value: 0 }, pixel: { value: 1 } },
        vertexShader: `
          attribute float seed;
          uniform float time;
          uniform float pixel;
          varying float vGlow;
          varying vec3 vColor;
          void main() {
            vec3 p = position;
            float t = time * (0.15 + seed * 0.25) + seed * 6.28;
            p += vec3(sin(t), cos(t * 1.3), sin(t * 0.7)) * 0.12;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float twinkle = 0.5 + 0.5 * sin(time * (1.0 + seed * 3.0) + seed * 40.0);
            vGlow = 0.25 + 0.75 * twinkle;
            vColor = mix(vec3(0.55, 1.0, 0.85), vec3(0.75, 0.6, 1.0), step(0.7, seed));
            gl_PointSize = (2.0 + seed * 5.0) * pixel * (6.0 / -mv.z);
          }`,
        fragmentShader: `
          varying float vGlow;
          varying vec3 vColor;
          void main() {
            vec2 d = gl_PointCoord - 0.5;
            float a = smoothstep(0.5, 0.0, length(d));
            gl_FragColor = vec4(vColor * a * vGlow * 0.9, a * vGlow);
          }`,
      }),
    [],
  );

  useFrame((state, delta) => {
    mixer.update(delta);
    auraMaterial.uniforms.time.value = state.clock.elapsedTime;
    auraMaterial.uniforms.pixel.value = state.gl.getPixelRatio();
    if (aura.current) aura.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={group}>
      <primitive object={model} scale={2.7} position={[0, -0.35, 0.55]} />
      <points ref={aura} geometry={auraGeometry} material={auraMaterial} scale={1.35} />
    </group>
  );
}

useGLTF.preload(URL);
