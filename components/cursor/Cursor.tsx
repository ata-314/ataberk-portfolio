"use client";
/* eslint-disable react-hooks/set-state-in-effect --
   R3F frame-loop idiom: per-frame state lives in refs/uniforms mutated inside
   useFrame/raf (never React state), and GPU tier detection is a client-only
   mount effect. These are deliberate, documented patterns. */

import { useEffect, useRef, useState } from "react";

type Mode = "default" | "link" | "view" | "play";

// Refined contextual cursor — fine pointers only. A small ring that grows
// modestly on links and labels itself over projects/video. Elements opt in
// via data-cursor="view" | "play".
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("default");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.body.dataset.cursor = "on";

    const pos = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-cursor], a, button",
      );
      const dc = target?.dataset.cursor as Mode | undefined;
      setMode(dc ?? (target ? "link" : "default"));
    };

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      if (dot.current)
        dot.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      if (ring.current)
        ring.current.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      delete document.body.dataset.cursor;
    };
  }, []);

  if (!enabled) return null;
  const label = mode === "view" ? "VIEW" : mode === "play" ? "PLAY" : "";
  const grown = mode !== "default";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      <div
        ref={dot}
        className="absolute top-0 left-0 h-1 w-1 -translate-x-1/2 rounded-full bg-bone"
        style={{ marginLeft: -2, marginTop: -2 }}
      />
      <div
        ref={ring}
        className="absolute top-0 left-0 flex items-center justify-center"
        style={{ marginLeft: -22, marginTop: -22, width: 44, height: 44 }}
      >
        <div
          className={`flex items-center justify-center rounded-full border transition-all duration-300 ${
            grown
              ? "h-11 w-11 border-lime/80 bg-ink/40"
              : "h-5 w-5 border-bone/40"
          }`}
        >
          {label && (
            <span className="font-mono text-[8px] tracking-widest text-lime">{label}</span>
          )}
        </div>
      </div>
    </div>
  );
}
