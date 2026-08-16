"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const BirdLayer = dynamic(() => import("./BirdLayer"), { ssr: false });

// Mount gate for the hologram bird: skip entirely under reduced motion or
// without WebGL2 — the page works fully without it.
export function BirdCompanion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) return;
    setEnabled(true);
  }, []);

  return enabled ? <BirdLayer /> : null;
}
