"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Case study 3D spaces (loaded only on case pages):
// · Gallery — the site's chapters as large screens on a curved wall round
//   the camera; the scroll turns the camera along the arc from one to the
//   next, the cursor shifts the view, lime dust drifts in the space and the
//   screen in front lights with a lime halo while the rest sit back.
// · Phones — real phone bodies (titanium, glass) carrying the site's
//   mobile screens, floating in studio light and turning with the cursor
//   and the scroll.
// Both draw only while on screen and cap their pixel ratio.

const LIME = new THREE.Color("#c8ff3e");
// Textures carry colour (sRGB) and are seen at grazing angles.
const prep = (t: THREE.Texture | THREE.Texture[]) => {
  for (const x of Array.isArray(t) ? t : [t]) {
    x.colorSpace = THREE.SRGBColorSpace;
    x.anisotropy = 8;
  }
};

// A screen bent onto a circle of radius r round the camera, centred on
// angle `a` (radians, 0 straight ahead), w wide and h tall in world units.
function arcGeometry(r: number, a: number, w: number, h: number) {
  const g = new THREE.PlaneGeometry(w, h, 48, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const phi = a + p.getX(i) / r;
    p.setXYZ(i, Math.sin(phi) * r, p.getY(i), -Math.cos(phi) * r);
  }
  g.computeVertexNormals();
  return g;
}

// Dust: seeded, so it is the same on every render.
function makeDust(count: number) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const bone = new THREE.Color("#f3efe7");
  let seed = 1234567;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < count; i++) {
    const r = 3 + rand() * 12, t = rand() * Math.PI * 2, y = (rand() - 0.5) * 8;
    pos.set([Math.sin(t) * r, y, -Math.cos(t) * r], i * 3);
    const c = rand() < 0.35 ? LIME : bone;
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function Dust({ count = 1400 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => makeDust(count), [count]);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.01; });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.7} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Wall({ srcs, progress, pointer }: { srcs: string[]; progress: React.RefObject<number>; pointer: React.RefObject<[number, number]> }) {
  const textures = useTexture(srcs, prep);
  const { camera, size } = useThree();
  const narrow = size.width < 768;
  // Portrait screens see a narrow slice horizontally: smaller screens there.
  const R = 9, W = narrow ? 3.9 : 7.4, H = W / 1.6;
  const step = (W + 1.1) / R;
  const panels = useMemo(() => srcs.map((_, i) => ({
    screen: arcGeometry(R, i * step, W, H),
    halo: arcGeometry(R + 0.05, i * step, W + 0.1, H + 0.1),
  })), [srcs, step, W, H]);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  const halos = useRef<THREE.MeshBasicMaterial[]>([]);
  const look = useRef({ yaw: 0, px: 0, py: 0 });
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 6);
    const target = (progress.current ?? 0) * (srcs.length - 1) * step;
    const l = look.current;
    l.yaw += (target - l.yaw) * k;
    l.px += ((pointer.current?.[0] ?? 0) - l.px) * k;
    l.py += ((pointer.current?.[1] ?? 0) - l.py) * k;
    camera.rotation.set(l.py * 0.08, -l.yaw - l.px * 0.12, 0, "YXZ");
    srcs.forEach((_, i) => {
      const off = Math.abs(i * step - l.yaw) / step;
      const focus = Math.max(0, 1 - off);
      const m = mats.current[i];
      if (m) m.color.setScalar(0.32 + 0.68 * focus);
      const h = halos.current[i];
      if (h) h.opacity = 0.03 + 0.4 * focus * focus;
    });
  });
  return (
    <group>
      {panels.map((p, i) => (
        <group key={srcs[i]}>
          <mesh geometry={p.halo}>
            <meshBasicMaterial ref={(m) => { if (m) halos.current[i] = m; }} color={LIME} transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh geometry={p.screen}>
            <meshBasicMaterial ref={(m) => { if (m) mats.current[i] = m; }} map={textures[i]} side={THREE.FrontSide} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// A rounded rectangle with UVs over its bounds, for phone screens.
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 12);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h);
  return g;
}

function Phone({ src, position, rotation }: { src: string; position: [number, number, number]; rotation: number }) {
  const tex = useTexture(src, prep);
  const W = 0.74, H = 1.6;
  const screen = useMemo(() => roundedRect(W - 0.05, H - 0.05, 0.085), []);
  const island = useMemo(() => roundedRect(0.2, 0.055, 0.0275), []);
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.5}>
      <group position={position} rotation={[0, rotation, 0]}>
        <RoundedBox args={[W, H, 0.08]} radius={0.1} smoothness={6}>
          <meshPhysicalMaterial color="#34363b" metalness={0.92} roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.25} />
        </RoundedBox>
        <mesh geometry={screen} position={[0, 0, 0.0405]}>
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        <mesh geometry={island} position={[0, H / 2 - 0.09, 0.0412]}>
          <meshBasicMaterial color="#000" />
        </mesh>
      </group>
    </Float>
  );
}

function PhoneRig({ srcs, progress, pointer }: { srcs: string[]; progress: React.RefObject<number>; pointer: React.RefObject<[number, number]> }) {
  const g = useRef<THREE.Group>(null);
  const { size } = useThree();
  const narrow = size.width < 768;
  const n = srcs.length;
  const gap = narrow ? 0.82 : 0.95;
  useFrame((_, dt) => {
    if (!g.current) return;
    const k = 1 - Math.exp(-dt * 4);
    const t = progress.current ?? 0;
    const ry = -0.5 + t * 1.0 + (pointer.current?.[0] ?? 0) * 0.5;
    const rx = (pointer.current?.[1] ?? 0) * 0.25;
    g.current.rotation.y += (ry - g.current.rotation.y) * k;
    g.current.rotation.x += (rx - g.current.rotation.x) * k;
  });
  return (
    <group ref={g} scale={narrow ? 0.56 : 1}>
      {srcs.map((src, i) => {
        const off = i - (n - 1) / 2;
        return <Phone key={src} src={src} position={[off * gap, -Math.abs(off) * 0.08, -Math.abs(off) * 0.35]} rotation={-off * 0.28} />;
      })}
    </group>
  );
}

// Draw only while the section is on screen; read its scroll progress and
// the pointer relative to it.
function useSection(ref: React.RefObject<HTMLElement | null>, sticky: boolean, onProgress?: (p: number) => void) {
  const progress = useRef(0);
  const pointer = useRef<[number, number]>([0, 0]);
  const visible = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { rootMargin: "200px 0px" });
    io.observe(el);
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      progress.current = sticky
        ? Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)))
        : Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)));
      onProgress?.(progress.current);
    };
    const onMove = (e: PointerEvent) => {
      pointer.current = [e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5];
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onMove);
    };
  }, [ref, sticky, onProgress]);
  return { progress, pointer, visible };
}

function Pause({ visible }: { visible: React.RefObject<boolean> }) {
  const { invalidate } = useThree();
  useFrame(() => { if (visible.current) invalidate(); });
  useEffect(() => {
    const id = setInterval(() => { if (visible.current) invalidate(); }, 250);
    return () => clearInterval(id);
  }, [invalidate, visible]);
  return null;
}

export function Gallery3D({ srcs, children, onChapter }: { srcs: string[]; children?: React.ReactNode; onChapter?: (i: number) => void }) {
  const ref = useRef<HTMLElement>(null);
  // The chapter in front, for the counter: chapter i at progress i/(n-1).
  const onProgress = useMemo(() => (p: number) => onChapter?.(Math.round(p * (srcs.length - 1))), [onChapter, srcs.length]);
  const { progress, pointer, visible } = useSection(ref, true, onProgress);
  return (
    <section ref={ref} className="c3-gallery" style={{ "--n": srcs.length } as React.CSSProperties}>
      <div className="c3-stage">
        <Canvas frameloop="demand" dpr={[1, 1.75]} camera={{ fov: 42, near: 0.1, far: 60, position: [0, 0, 0] }} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <color attach="background" args={["#0a0a0b"]} />
          <fog attach="fog" args={["#0a0a0b", 9, 22]} />
          <Pause visible={visible} />
          <Wall srcs={srcs} progress={progress} pointer={pointer} />
          <Dust />
        </Canvas>
        {children}
      </div>
    </section>
  );
}

export function Phones3D({ srcs, children }: { srcs: string[]; children?: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const { progress, pointer, visible } = useSection(ref, false);
  return (
    <section ref={ref} className="c3-phones">
      {children}
      <div className="c3-phones-stage">
        <Canvas frameloop="demand" dpr={[1, 1.75]} camera={{ fov: 32, position: [0, 0, 5.2] }} gl={{ antialias: true, alpha: true }}>
          <Pause visible={visible} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 4, 5]} intensity={1.6} />
          <Environment resolution={256}>
            <Lightformer form="rect" intensity={3} position={[0, 3, 3]} scale={[6, 1.2, 1]} />
            <Lightformer form="rect" intensity={1.6} color="#c8ff3e" position={[-4, 0, 1]} scale={[1, 5, 1]} />
            <Lightformer form="rect" intensity={1.2} position={[4, -1, 2]} scale={[1, 4, 1]} />
          </Environment>
          <PhoneRig srcs={srcs} progress={progress} pointer={pointer} />
        </Canvas>
      </div>
    </section>
  );
}
