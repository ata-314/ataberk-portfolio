"use client";
/* eslint-disable react-hooks/immutability --
   R3F frame-loop idiom: geometry is generated once with Math.random inside
   useMemo, and GPU objects (materials, uniforms) are mutated in useFrame —
   never React state. Same documented pattern as components/gl/CodeField. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { HELIX, exp } from "./state";

export type HelixCard = {
  kind: string;
  title: string;
  meta: string;
  mark: string;
  a: string;
  b: string;
  media?: string; // image or video URL; the artwork is generated without it
  href?: string;
};

// A card bent onto the helix cylinder and leaning along its pitch.
function curvedCard(segU = 32, segV = 8) {
  const g = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  const slope = -HELIX.yStep / HELIX.angleStep;
  for (let v = 0; v <= segV; v++) {
    for (let u = 0; u <= segU; u++) {
      const s = u / segU, t = v / segV;
      const d = (s - 0.5) * HELIX.arc;
      positions.push(Math.sin(d) * HELIX.radius, (t - 0.5) * HELIX.height + d * slope * HELIX.tilt, Math.cos(d) * HELIX.radius);
      normals.push(Math.sin(d), 0, Math.cos(d));
      uvs.push(s, t);
    }
  }
  for (let v = 0; v < segV; v++) {
    for (let u = 0; u < segU; u++) {
      const i = v * (segU + 1) + u;
      index.push(i, i + 1, i + segU + 1, i + 1, i + segU + 2, i + segU + 1);
    }
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  return g;
}

// Generated face: two colour masses, grain, scanlines, a bevel frame and
// the card's words in the HUD face.
function artwork(card: HelixCard) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.round(1024 / ((HELIX.arc * HELIX.radius) / HELIX.height));
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  ctx.fillStyle = "#04080b";
  ctx.fillRect(0, 0, w, h);
  const blob = (x: number, y: number, r: number, c: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  ctx.globalCompositeOperation = "lighter";
  blob(w * 0.25, h * 0.35, w * 0.6, card.a + "bb");
  blob(w * 0.78, h * 0.72, w * 0.6, card.b + "bb");
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
  // Bevel frame.
  ctx.lineWidth = 10;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,255,255,0.75)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(255,255,255,0.35)");
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, 44);
  ctx.stroke();
  const style = getComputedStyle(document.body);
  const font = style.getPropertyValue("--font-hud").trim() || "sans-serif";
  const mono = style.getPropertyValue("--font-jetbrains").trim() || "monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 22;
  ctx.font = `500 24px ${mono}`;
  ctx.globalAlpha = 0.8;
  ctx.fillText(card.mark, w / 2, h * 0.26);
  ctx.globalAlpha = 1;
  let size = 96;
  const words = card.title.toUpperCase().split(" ");
  const layout = () => {
    ctx.font = `500 ${size}px ${font}`;
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > w * 0.82 && line) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
    return lines;
  };
  let lines = layout();
  while (lines.length * size > h * 0.48 || Math.max(...lines.map((l) => ctx.measureText(l).width)) > w * 0.86) {
    size -= 4;
    lines = layout();
  }
  const top = h * 0.52 - ((lines.length - 1) * size) / 2;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, top + i * size));
  ctx.font = `500 21px ${mono}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(`${card.kind} · ${card.meta}`.toUpperCase(), w / 2, h * 0.84);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function Card({ card, index, onOpen }: { card: HelixCard; index: number; onOpen: (i: number) => void }) {
  const geometry = useMemo(() => curvedCard(), []);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false;
    void document.fonts.ready.then(() => { if (!cancelled) setTexture(artwork(card)); });
    return () => { cancelled = true; };
  }, [card]);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        side: THREE.DoubleSide,
        roughness: 0.18,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.75,
        transparent: true,
        opacity: 0.9,
        envMapIntensity: 0.9,
      }),
    [],
  );
  // Backs are dark glass: no mirrored words.
  const back = useMemo(
    () => new THREE.MeshPhysicalMaterial({ side: THREE.BackSide, color: "#06121a", roughness: 0.2, metalness: 0.2, clearcoat: 1, transparent: true, opacity: 0.8, envMapIntensity: 0.7 }),
    [],
  );
  useEffect(() => {
    material.side = THREE.FrontSide;
    material.map = texture;
    material.emissiveMap = texture;
    material.needsUpdate = true;
  }, [material, texture]);
  const mesh = useRef<THREE.Mesh>(null);
  const lift = useRef(0);
  useFrame((_, delta) => {
    // Cards arrive once the opening has handed over to the helix.
    const show = Math.min(1, Math.max(0, (exp.intro - 0.35) / 0.4));
    material.opacity = 0.9 * show;
    back.opacity = 0.8 * show;
    const target = exp.hovered === index ? 0.22 : 0;
    lift.current += (target - lift.current) * (1 - Math.exp(-10 * delta));
    if (mesh.current) mesh.current.scale.setScalar(1 + lift.current * 0.05);
  });
  const angle = index * HELIX.angleStep;
  const y = HELIX.top - index * HELIX.yStep;
  return (
    <group rotation={[0, angle, 0]} position={[0, y, 0]}>
      <mesh geometry={geometry} material={back} />
      <mesh
        ref={mesh}
        geometry={geometry}
        material={material}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); exp.hovered = index; document.documentElement.dataset.cardHover = "true"; }}
        onPointerOut={() => { if (exp.hovered === index) exp.hovered = -1; document.documentElement.dataset.cardHover = "false"; }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(index); }}
      />
    </group>
  );
}

// The helix: cards stacked down a vertical axis, each a turn further round.
// The whole helix turns with the descent so the card level with the eagle
// comes round to face the camera.
export function CardHelix({ cards, onOpen }: { cards: HelixCard[]; onOpen: (i: number) => void }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const t = exp.helix * (cards.length - 1);
    group.current.rotation.y = -t * HELIX.angleStep + HELIX.side;
  });
  return (
    <group ref={group}>
      {cards.map((card, i) => (
        <Card key={card.title} card={card} index={i} onOpen={onOpen} />
      ))}
    </group>
  );
}
