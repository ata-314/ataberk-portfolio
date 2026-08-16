"use client";

import dynamic from "next/dynamic";

// three.js stays out of the initial bundle — loaded only when the hero mounts.
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export function Hero3D() {
  return <HeroCanvas />;
}
