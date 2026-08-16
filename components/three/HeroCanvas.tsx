"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CreativeMind, type QualityProfile } from "./CreativeMind";

type Tier = "loading" | "full" | "mobile" | "static";

const PROFILES: Record<"full" | "mobile", QualityProfile> = {
  full: { count: 45000, pointerEnabled: true },
  mobile: { count: 8000, pointerEnabled: false },
};

function detectTier(): Tier {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return "static";
  const canvas = document.createElement("canvas");
  const gl2 = canvas.getContext("webgl2");
  if (!gl2) return "static";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;
  return coarse || small ? "mobile" : "full";
}

// Designed fallback: no WebGL / reduced motion still gets the composition.
function StaticPoster() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 42% 46%, #1e1e23 0%, #131316 45%, #0a0a0b 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#f3efe7 0.5px, transparent 0.5px), radial-gradient(#f3efe7 0.4px, transparent 0.4px)",
          backgroundSize: "56px 56px, 92px 92px",
          backgroundPosition: "0 0, 28px 40px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 45% 48%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 45% 48%, black 0%, transparent 75%)",
        }}
      />
    </div>
  );
}

export default function HeroCanvas() {
  const [tier, setTier] = useState<Tier>("loading");
  const [visible, setVisible] = useState(true);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => setTier(detectTier()), []);

  // Pause rendering when the hero scrolls out of view (perf checklist).
  useEffect(() => {
    if (!wrapper.current) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
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
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={tier === "full" ? [1, 2] : [1, 1.5]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <CreativeMind profile={profile} />
      </Canvas>
    </div>
  );
}
