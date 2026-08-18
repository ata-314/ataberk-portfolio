"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const loadStage = () => import("./Stage");
const Stage = lazy(loadStage);

export default function StageLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const markStatic = () => {
      document.documentElement.dataset.stageStatic = "true";
      return () => delete document.documentElement.dataset.stageStatic;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return markStatic();
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("webgl2")) return markStatic();

    // Loading is never attached to wheel/touch/pointer input. The Three/R3F
    // chunk is evaluated in an idle window and mounted on a later frame, so a
    // visitor cannot accidentally trigger WebGL setup inside a scroll gesture.
    let cancelled = false;
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mountFrame = 0;
    const warm = () => {
      void loadStage().then(() => {
        if (cancelled) return;
        mountFrame = requestAnimationFrame(() => setActive(true));
      });
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(warm, { timeout: 1200 });
    } else {
      timer = setTimeout(warm, 700);
    }

    // Content is hidden until the intro reports done; if the WebGL chunk
    // never arrives (network failure), release it rather than leave a blank
    // page.
    const contentSafety = setTimeout(() => {
      if (!document.documentElement.dataset.stageIntro) {
        document.documentElement.dataset.stageIntro = "done";
      }
    }, 9000);

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      clearTimeout(timer);
      clearTimeout(contentSafety);
      cancelAnimationFrame(mountFrame);
      delete document.documentElement.dataset.stageReady;
      delete document.documentElement.dataset.stageStatic;
      delete document.documentElement.dataset.stageIntro;
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
