"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const Stage = lazy(() => import("./Stage"));

export default function StageLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) return;

    // Warm fine-pointer desktops while the browser is idle, before a likely
    // scroll. Direct wheel input is debounced so Canvas creation never lands
    // inside the active gesture. Coarse/mobile devices stay interaction-gated.
    let started = false;
    let wheelTimer: ReturnType<typeof setTimeout> | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    const activate = () => {
      if (started) return;
      started = true;
      setActive(true);
    };
    const events = ["pointermove", "pointerdown", "touchstart", "keydown"] as const;
    const onWheel = () => {
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(activate, 360);
    };
    for (const event of events) {
      window.addEventListener(event, activate, { once: true, passive: true });
    }
    window.addEventListener("wheel", onWheel, { passive: true });

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(activate, { timeout: 1400 });
      } else {
        idleTimer = setTimeout(activate, 900);
      }
    }

    return () => {
      for (const event of events) window.removeEventListener(event, activate);
      window.removeEventListener("wheel", onWheel);
      clearTimeout(wheelTimer);
      clearTimeout(idleTimer);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
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
