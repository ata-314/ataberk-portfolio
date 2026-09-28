"use client";
/* eslint-disable react-hooks/purity, react-hooks/immutability --
   R3F frame-loop idiom: geometry is generated once with Math.random inside
   useMemo, and GPU objects (materials, uniforms) are mutated in useFrame —
   never React state. Same documented pattern as components/gl/CodeField. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { Eagle } from "./Eagle";
import { CardHelix, type HelixCard } from "./CardHelix";
import { HELIX, exp } from "./state";

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));
const smooth = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Soft round points shared by the dust, coral, bokeh and galaxies.
function pointsMaterial(sizeScale: number, opacity: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, pixel: { value: 1 }, opacity: { value: opacity } },
    vertexShader: `
      attribute vec3 color;
      attribute float size;
      uniform float time;
      uniform float pixel;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vColor = color;
        vFade = smoothstep(0.4, 2.5, -mv.z) * (1.0 - smoothstep(40.0, 70.0, -mv.z));
        gl_PointSize = size * ${sizeScale.toFixed(2)} * pixel / max(-mv.z, 0.3);
      }`,
    fragmentShader: `
      uniform float opacity;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vFade * opacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor * a, a);
      }`,
  });
}

function makePoints(count: number, fill: (i: number, p: Float32Array, c: Float32Array, s: Float32Array) => void) {
  const p = new Float32Array(count * 3), c = new Float32Array(count * 3), s = new Float32Array(count);
  for (let i = 0; i < count; i++) fill(i, p, c, s);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  g.setAttribute("size", new THREE.BufferAttribute(s, 1));
  return g;
}

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const HELIX_BOTTOM = -HELIX.top + 11 * HELIX.yStep; // depth of the last card

// Galaxies of data particles stacked below the helix, near the flight path,
// so the descent falls through their discs.
function Galaxies({ mobile }: { mobile: boolean }) {
  const per = mobile ? 5000 : 14000;
  const geometry = useMemo(() => {
    const galaxies = 7;
    return makePoints(galaxies * per, (i, p, c, s) => {
      const g = Math.floor(i / per);
      const rnd = (n: number) => { const x = Math.sin((g + 1) * 91.7 + n * 13.1) * 43758.5; return x - Math.floor(x); };
      const centre = new THREE.Vector3(Math.sin(g * 2.3 + 0.7) * 7, -HELIX_BOTTOM - 8 - g * 14, Math.cos(g * 1.7) * 5 - 4);
      const radius = 11 + rnd(1) * 7;
      const arms = 2 + Math.floor(rnd(2) * 3);
      const hueA = new THREE.Color().setHSL(rnd(3), 0.75, 0.6);
      const hueB = new THREE.Color().setHSL((rnd(3) + 0.2) % 1, 0.8, 0.55);
      const pick = Math.random();
      let x = 0, y = 0, z = 0, t = 0;
      if (pick < 0.12) {
        x = gauss() * radius * 0.12; y = gauss() * radius * 0.06; z = gauss() * radius * 0.12; t = 0;
      } else if (pick < 0.22) {
        const r = radius * (0.45 + Math.floor(Math.random() * 3) * 0.26), a = Math.random() * Math.PI * 2;
        x = Math.cos(a) * r; z = Math.sin(a) * r; t = r / radius;
      } else {
        t = Math.pow(Math.random(), 0.7);
        const arm = Math.floor(Math.random() * arms);
        const a = (arm / arms) * Math.PI * 2 + Math.log(1 + t * 6) * 2.6 + gauss() * 0.3 * (1 - t * 0.5);
        x = Math.cos(a) * t * radius + gauss() * radius * 0.04;
        z = Math.sin(a) * t * radius + gauss() * radius * 0.04;
        y = gauss() * radius * 0.03;
      }
      const tilt = new THREE.Euler(0.15 + rnd(4) * 0.4, rnd(5) * 6.28, 0);
      const v = new THREE.Vector3(x, y, z).applyEuler(tilt).add(centre);
      p.set([v.x, v.y, v.z], i * 3);
      const col = hueA.clone().lerp(hueB, t).lerp(new THREE.Color(1, 0.97, 0.9), pick < 0.12 ? 0.8 : (1 - t) * 0.3);
      c.set([col.r, col.g, col.b], i * 3);
      s[i] = pick < 0.12 ? 34 : 16 + Math.random() * 18;
    });
  }, [per]);
  const material = useMemo(() => pointsMaterial(1, 1.2), []);
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    material.uniforms.pixel.value = state.gl.getPixelRatio();
    if (group.current) group.current.rotation.y = state.clock.elapsedTime * 0.01;
  });
  return <group ref={group}><points geometry={geometry} material={material} /></group>;
}

// Drifting matter along the whole descent: fine dust, pink/violet coral
// clusters round the helix and a few large out-of-focus motes.
function Atmosphere({ mobile }: { mobile: boolean }) {
  const depth = HELIX_BOTTOM + 120;
  const dust = useMemo(() => makePoints(mobile ? 3000 : 9000, (i, p, c, s) => {
    p.set([(Math.random() - 0.5) * 30, 6 - Math.random() * depth, (Math.random() - 0.5) * 30], i * 3);
    const k = Math.random();
    c.set(k < 0.5 ? [0.5, 0.95, 0.85] : [0.85, 0.9, 1.0], i * 3);
    s[i] = 2 + Math.random() * 3;
  }), [mobile, depth]);
  const coral = useMemo(() => makePoints(mobile ? 6000 : 16000, (i, p, c, s) => {
    const cluster = Math.floor(i / 400);
    const r = (n: number) => { const x = Math.sin(cluster * 57.3 + n * 7.9) * 43758.5; return x - Math.floor(x); };
    const a = r(1) * Math.PI * 2, rad = 4.2 + r(2) * 3.5;
    const cx = Math.cos(a) * rad, cz = Math.sin(a) * rad, cy = -r(3) * (HELIX_BOTTOM + 4);
    p.set([cx + gauss() * 0.9, cy + gauss() * 1.2, cz + gauss() * 0.9], i * 3);
    const tone = r(4);
    c.set(tone < 0.45 ? [1.0, 0.45, 0.8] : tone < 0.8 ? [0.6, 0.45, 1.0] : [0.35, 0.95, 0.85], i * 3);
    s[i] = 4 + Math.random() * 7;
  }), [mobile]);
  const bokeh = useMemo(() => makePoints(70, (i, p, c, s) => {
    p.set([(Math.random() - 0.5) * 14, 4 - Math.random() * depth, 2 + Math.random() * 5], i * 3);
    const k = Math.random();
    c.set(k < 0.5 ? [0.9, 0.8, 0.45] : [0.4, 0.9, 0.85], i * 3);
    s[i] = 120 + Math.random() * 220;
  }), [depth]);
  const dustM = useMemo(() => pointsMaterial(1, 0.7), []);
  const coralM = useMemo(() => pointsMaterial(1, 0.55), []);
  const bokehM = useMemo(() => pointsMaterial(1, 0.07), []);
  useFrame((state) => {
    const px = state.gl.getPixelRatio();
    dustM.uniforms.pixel.value = coralM.uniforms.pixel.value = bokehM.uniforms.pixel.value = px;
  });
  return (
    <>
      <points geometry={dust} material={dustM} />
      <points geometry={coral} material={coralM} />
      <points geometry={bokeh} material={bokehM} />
    </>
  );
}

// The opening title, set in the scene behind the eagle.
function TitlePlane({ title, subtitle }: { title: string; subtitle: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 700;
      const ctx = canvas.getContext("2d")!;
      const font = getComputedStyle(document.body).getPropertyValue("--font-hud").trim() || "sans-serif";
      const mono = getComputedStyle(document.body).getPropertyValue("--font-jetbrains").trim() || "monospace";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = 420;
      ctx.font = `500 ${size}px ${font}`;
      size *= Math.min(1, (canvas.width * 0.96) / ctx.measureText(title).width);
      ctx.font = `500 ${size}px ${font}`;
      ctx.fillText(title, canvas.width / 2, canvas.height * 0.42);
      ctx.font = `500 44px ${mono}`;
      ctx.globalAlpha = 0.75;
      ctx.fillText(subtitle.split("").join(" "), canvas.width / 2, canvas.height * 0.86);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      setTexture(t);
    });
    return () => { cancelled = true; };
  }, [title, subtitle]);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (material.current) material.current.opacity = 1 - smooth(exp.intro, 0.15, 0.55);
    // Fit the title to the visible width (narrow screens).
    if (mesh.current) {
      const cam = state.camera as THREE.PerspectiveCamera;
      const distance = Math.abs(cam.position.z - mesh.current.position.z);
      const visible = 2 * distance * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * (state.size.width / Math.max(state.size.height, 1));
      mesh.current.scale.setScalar(Math.min(1, (visible * 0.92) / 11));
    }
  });
  if (!texture) return null;
  return (
    <mesh ref={mesh} position={[0, 0.35, -2.6]}>
      <planeGeometry args={[11, 11 * (700 / 2048)]} />
      <meshBasicMaterial ref={material} map={texture} transparent toneMapped={false} depthWrite={false} color={new THREE.Color(1.15, 1.15, 1.15)} />
    </mesh>
  );
}

// One camera path for the whole page: the eagle falls from the title into
// the helix, descends it card by card, then dives through the galaxies,
// the camera following above and behind and leaning with the pointer.
function Rig({ eagle, count }: { eagle: React.RefObject<THREE.Group | null>; count: number }) {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const s = useRef({ depth: 0, dive: 0, px: 0, py: 0, sway: 0 });
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = s.current;
    const helixDepth = smooth(exp.intro, 0.2, 1) * -HELIX.top + exp.helix * (count - 1) * HELIX.yStep;
    const target = helixDepth + exp.galaxy * (7 * 14 + 16) + exp.after * 10;
    k.depth = damp(k.depth, target, 6, dt);
    k.dive = damp(k.dive, exp.galaxy > 0 && exp.galaxy < 1 ? 1 : exp.galaxy >= 1 ? 0.4 : 0, 3, dt);
    k.px = damp(k.px, exp.pointer[0], 3, dt);
    k.py = damp(k.py, exp.pointer[1], 3, dt);
    const y = -k.depth;
    if (eagle.current) {
      // After the galaxies it flies off into the depth.
      eagle.current.position.set(Math.sin(state.clock.elapsedTime * 0.35) * 0.08, y + Math.sin(state.clock.elapsedTime * 0.7) * 0.05 - exp.after * 6, -exp.after * 40);
      // Nose down through the galaxies.
      eagle.current.rotation.set(k.dive * 0.9, -0.55 + Math.sin(state.clock.elapsedTime * 0.2) * 0.08, 0);
    }
    // Close on the eagle for the title, pulled back to frame the helix.
    // Portrait screens pull back so the title and the helix still fit.
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const fit = Math.min(2.1, Math.max(1, 1.05 / aspect));
    const dist = (7.4 + smooth(exp.intro, 0.2, 1) * 1.8 - k.dive * 2) * fit;
    camera.position.set(k.px * 0.6 - smooth(exp.intro, 0.2, 1) * 0.8 * (1 - k.dive), y + 0.4 + k.dive * 5 + k.py * 0.3, dist);
    look.set(0, y - k.dive * 4, 0);
    camera.lookAt(look);
  });
  return null;
}

export function World({ cards, title, subtitle, onOpen, mobile }: { cards: HelixCard[]; title: string; subtitle: string; onOpen: (i: number) => void; mobile: boolean }) {
  const eagle = useRef<THREE.Group>(null);
  return (
    <>
      <color attach="background" args={["#020507"]} />
      <fog attach="fog" args={["#020507", 12, 60]} />
      {/* Studio light for the chrome: long strips and a ring, teal and
          magenta, rendered once into the environment map. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#bff" position={[0, 4, -6]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#6ff5dc" position={[-6, 0, 2]} rotation={[0, Math.PI / 2, 0]} scale={[10, 0.8, 1]} />
        <Lightformer form="rect" intensity={2} color="#d56bff" position={[6, -1, 1]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 0.8, 1]} />
        <Lightformer form="ring" intensity={2.4} color="#ffffff" position={[0, 0, 6]} scale={4} />
        <Lightformer form="rect" intensity={1} color="#ffd98a" position={[0, -5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
      </Environment>
      <Rig eagle={eagle} count={cards.length} />
      <TitlePlane title={title} subtitle={subtitle} />
      <Eagle group={eagle} />
      <CardHelix cards={cards} onOpen={onOpen} />
      <Atmosphere mobile={mobile} />
      <Galaxies mobile={mobile} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.25} />
        <ChromaticAberration offset={new THREE.Vector2(0.0007, 0.0007)} />
        <Noise opacity={0.045} premultiply blendFunction={BlendFunction.SCREEN} />
        <Vignette offset={0.28} darkness={0.78} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}
