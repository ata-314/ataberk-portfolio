"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { TerrainField, type QualityProfile } from "./TerrainField";

type Tier = "loading" | "full" | "mobile" | "static";

const PROFILES: Record<"full" | "mobile", QualityProfile> = {
  full: { cols: 380, rows: 170, pointerEnabled: true },   // ~64k particles
  mobile: { cols: 130, rows: 64, pointerEnabled: true },  // ~8k, touch magnet
};

function detectTier(): Tier {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return "static";
  const canvas = document.createElement("canvas");
  if (!canvas.getContext("webgl2")) return "static";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;
  return coarse || small ? "mobile" : "full";
}

// Designed fallback: the terrain and its channels as a still composition.
export function StaticPoster() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, #131316 30%, #1e1e23 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(#f3efe7 0.5px, transparent 0.5px), radial-gradient(#f3efe7 0.4px, transparent 0.4px)",
          backgroundSize: "42px 42px, 74px 74px",
          backgroundPosition: "0 0, 21px 30px",
          maskImage: "linear-gradient(180deg, transparent 0%, black 55%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 55%)",
        }}
      />
      {/* Two still data channels */}
      <div
        className="absolute right-0 bottom-[26%] left-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, #c8ff3e55 35%, #c8ff3e 60%, transparent 95%)",
        }}
      />
      <div
        className="absolute right-0 bottom-[14%] left-0 h-px opacity-40"
        style={{
          background:
            "linear-gradient(90deg, transparent 10%, #8ae6ff66 50%, transparent 90%)",
        }}
      />
    </div>
  );
}

export default function HeroCanvas({
  progressRef,
}: {
  progressRef: RefObject<number>;
}) {
  const [tier, setTier] = useState<Tier>("loading");
  const [visible, setVisible] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => setTier(detectTier()), []);

  // Pause rendering when the hero scrolls out of view.
  useEffect(() => {
    if (!wrapper.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.02 },
    );
    io.observe(wrapper.current);
    return () => io.disconnect();
  }, [tier]);

  if (tier === "loading") return <div aria-hidden className="absolute inset-0" />;
  if (tier === "static") return <StaticPoster />;

  const profile = PROFILES[tier];
  return (
    <div ref={wrapper} aria-hidden className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 1.55, 6.2], fov: 46 }}
        dpr={tier === "full" ? [1, 2] : [1, 1.5]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor("#0a0a0b", 1)}
      >
        <TerrainField profile={profile} progressRef={progressRef} />
        {tier === "full" && (
          <EffectComposer>
            {/* One controlled cinematic bloom — quality ladder drops it on mobile */}
            <Bloom luminanceThreshold={0.75} intensity={0.3} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
