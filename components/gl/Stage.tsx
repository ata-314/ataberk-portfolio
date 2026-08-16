"use client";
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect --
   R3F frame-loop idiom: per-frame state lives in refs/uniforms mutated inside
   useFrame/raf (never React state), and GPU tier detection is a client-only
   mount effect. These are deliberate, documented patterns. */

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CodeField, type FieldProfile } from "./CodeField";
import { bakeBird, type BirdBake } from "../three/bird-bake";

type Tier = "loading" | "full" | "mobile" | "static";

const PROFILES: Record<"full" | "mobile", FieldProfile> = {
  full: { count: 30000, birdCount: 15000, pointerEnabled: true },
  mobile: { count: 9000, birdCount: 5600, pointerEnabled: true },
};

function detectTier(): Tier {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const c = document.createElement("canvas");
  if (!c.getContext("webgl2")) return "static";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || window.innerWidth < 768 ? "mobile" : "full";
}

// Reduced-motion / no-WebGL2: a designed still of the same idea — glyph dust
// held in a loose structure. Pure CSS, zero JS cost.
export function StaticField() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 45% at 62% 45%, #1e1e23 0%, #131316 55%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 font-mono text-[10px] leading-[26px] tracking-[14px] text-bone/25 select-none"
        style={{
          maskImage: "radial-gradient(ellipse 50% 42% at 62% 45%, black 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 50% 42% at 62% 45%, black 0%, transparent 78%)",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 24 }, (_, r) => (
          <div key={r} className="whitespace-nowrap">
            {"01<>{}/+*=:;.-|_".repeat(9).slice(r % 7)}
          </div>
        ))}
      </div>
    </div>
  );
}

// One fixed canvas for the whole site — the single digital matter.
// Render pauses when nothing is visually active (deep mid-page).
export default function Stage() {
  const [tier, setTier] = useState<Tier>("loading");
  const [bake, setBake] = useState<BirdBake | null>(null);
  const [lost, setLost] = useState(false);
  const active = useRef(true);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const t = detectTier();
    setTier(t);
    if (t === "static") return;
    let alive = true;
    bakeBird("/models/robot_bird_eagle.glb")
      .then((b) => alive && setBake(b))
      .catch((e) => console.error("bird bake failed:", e));
    return () => {
      alive = false;
    };
  }, []);

  // The companion bird rides the whole page — the loop stays live while the
  // tab is visible and sleeps only when the document is hidden.
  useEffect(() => {
    if (tier === "static" || tier === "loading") return;
    const onVis = () => {
      active.current = !document.hidden;
      forceRender((n) => n + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [tier]);

  if (tier === "loading") return null;
  if (tier === "static") return null; // hero renders its own StaticField

  const profile = PROFILES[tier];
  return (
    // Click-through overlay ABOVE section backgrounds: matter and bird pass
    // over the page; pointer events reach the content beneath.
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20">
      <Canvas
        camera={{ position: [0, 0.15, 8.2], fov: 45 }}
        dpr={tier === "full" ? [1, 1.75] : [1, 1.25]}
        frameloop={active.current && !lost ? "always" : "never"}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          // WebGL context loss: stop cleanly, recover on restore
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setLost(true);
          });
          gl.domElement.addEventListener("webglcontextrestored", () => setLost(false));
        }}
        style={{ pointerEvents: "none" }}
      >
        <CodeField profile={profile} bake={bake} />
      </Canvas>
    </div>
  );
}
