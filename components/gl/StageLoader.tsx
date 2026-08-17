"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const Stage = lazy(() => import("./Stage"));

export default function StageLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) return;

    const activate = () => setActive(true);
    const events = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown"] as const;
    for (const event of events) {
      window.addEventListener(event, activate, { once: true, passive: true });
    }
    return () => {
      for (const event of events) window.removeEventListener(event, activate);
      delete document.documentElement.dataset.stageReady;
    };
  }, []);

  if (!active) return null;
  return (
    <Suspense fallback={null}>
      <Stage
        onReady={() => {
          document.documentElement.dataset.stageReady = "true";
        }}
      />
    </Suspense>
  );
}
