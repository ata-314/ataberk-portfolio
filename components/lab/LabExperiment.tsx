"use client";

import { useEffect, useRef, useState } from "react";
import { mountSketch, type SketchKind } from "./lab-sketches";
import { mountBrain } from "../sections/brain-beads";

export type LabEntry = {
  kind: SketchKind | "brain";
  name: string;
  desc: string;
  tech: string[];
  status: string;
  live: boolean;
  phases?: [string, string];
};

// One experiment: a live sketch of the system on top, its note below. The
// sketch only runs while the card is on screen; reduced motion shows one
// still frame.
export function LabExperiment({ entry, index, feature }: { entry: LabEntry; index: number; feature?: boolean }) {
  const card = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const el = card.current, c = canvas.current;
    if (!el || !c) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = entry.kind === "brain"
      ? mountBrain(c, [], { still })
      : mountSketch(c, entry.kind, { still, onPhase: setPhase });
    const io = new IntersectionObserver(([e]) => engine.run(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => { io.disconnect(); engine.destroy(); };
  }, [entry.kind]);

  return (
    <article ref={card} className={`lab-card${feature ? " lab-card-feature" : ""}`}>
      <div className="lab-visual">
        <canvas ref={canvas} aria-hidden="true" />
        {entry.phases && (
          <span className="lab-phase" data-on={phase === 1 || undefined}>{entry.phases[phase]}</span>
        )}
      </div>
      <div className="lab-copy">
        <div className="lab-meta">
          <span className="lab-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="lab-status" data-live={entry.live || undefined}>{entry.status}</span>
        </div>
        <h2>{entry.name}</h2>
        <p>{entry.desc}</p>
        <ul className="lab-tech">
          {entry.tech.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </div>
    </article>
  );
}
