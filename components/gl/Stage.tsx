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
  full: { count: 46000, birdCount: 16000, pointerEnabled: true },
  mobile: { count: 13000, birdCount: 6000, pointerEnabled: true },
};

function detectTier(): Tier {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const c = document.createElement("canvas");
  if (!c.getContext("webgl2")) return "static";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || window.innerWidth < 768 ? "mobile" : "full";
}

// One fixed canvas for the whole site — the single digital matter.
// Render pauses when nothing is visually active (deep mid-page).
export default function Stage({ onReady }: { onReady?: () => void }) {
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
    // The field sits above the page background and below z-20 content.
    // Background-free sections expose it; glass cards soften it with blur.
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[15]">
      <Canvas
        camera={{ position: [0, 0.15, 8.2], fov: 45 }}
        dpr={tier === "full" ? [1, 1.75] : [1, 1.25]}
        frameloop={active.current && !lost ? "always" : "never"}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          onReady?.();
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
