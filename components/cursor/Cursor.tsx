"use client";
/* eslint-disable react-hooks/set-state-in-effect --
   Fine-pointer detection is a client-only mount effect. */

import { useEffect, useRef, useState } from "react";

// Minimal dot cursor — no ring, no labels. The dot warms to lime over
// interactive elements and grows only slightly. Fine pointers only;
// the GL light trail streams behind it on the stage.
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.body.dataset.cursor = "on";

    const onMove = (e: PointerEvent) => {
      if (dot.current)
        dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const target = (e.target as HTMLElement).closest("a, button, [data-cursor]");
      setHot(!!target);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      delete document.body.dataset.cursor;
    };
  }, []);

  if (!enabled) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <div ref={dot} className="absolute top-0 left-0">
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,height,background-color] duration-200 ${
            hot ? "h-3 w-3 bg-lime" : "h-2 w-2 bg-bone"
          }`}
        />
      </div>
    </div>
  );
}
