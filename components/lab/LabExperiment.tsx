"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { mountSketch, type SketchKind } from "./lab-sketches";
import { mountBrain } from "../sections/brain-beads";

type Choice = { key: string; label: string; options: { value: string; label: string }[] };
type Range = { key: string; label: string; range: true };

export type LabEntry = {
  kind: SketchKind | "brain";
  name: string;
  desc: string;
  hint: string;
  use: string;
  tech: string[];
  status: string;
  live: boolean;
  controls?: (Choice | Range)[];
  phases?: [string, string];
};

type Engine = { run(on: boolean): void; destroy(): void; set?(key: string, value: string | number): void };

// One experiment as a toy and an offer: a live sketch the visitor can turn
// and tune, what it would do for their brand, and a way to ask for it. The
// sketch only runs while the card is on screen; reduced motion shows one
// still frame.
export function LabExperiment({
  entry, index, feature, cta, ctaHref, useLabel,
}: { entry: LabEntry; index: number; feature?: boolean; cta: string; ctaHref: string; useLabel: string }) {
  const card = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Engine | null>(null);
  const [phase, setPhase] = useState(0);
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = card.current, c = canvas.current;
    if (!el || !c) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const e: Engine = entry.kind === "brain"
      ? mountBrain(c, [], { still })
      : mountSketch(c, entry.kind, { still, onPhase: setPhase });
    engine.current = e;
    const io = new IntersectionObserver(([x]) => e.run(x.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => { io.disconnect(); e.destroy(); engine.current = null; };
  }, [entry.kind]);

  const set = (key: string, value: string | number) => {
    setValues((v) => ({ ...v, [key]: value }));
    engine.current?.set?.(key, value);
  };

  return (
    <article ref={card} className={`lab-card${feature ? " lab-card-feature" : ""}`}>
      <div className="lab-visual" onPointerDown={() => setTouched(true)}>
        <canvas ref={canvas} aria-hidden="true" />
        {entry.phases && (
          <span className="lab-phase" data-on={phase === 1 || undefined}>{entry.phases[phase]}</span>
        )}
        <span className="lab-hint" data-hidden={touched || undefined}>{entry.hint}</span>
      </div>
      {entry.controls && (
        <div className="lab-controls">
          {entry.controls.map((c) => "range" in c ? (
            <label key={c.key} className="lab-range">
              <span>{c.label}</span>
              <input
                type="range" min={0} max={1} step={0.001}
                value={typeof values[c.key] === "number" ? values[c.key] : 0}
                onChange={(e) => set(c.key, Number(e.target.value))}
              />
            </label>
          ) : (
            <div key={c.key} className="lab-choice" role="group" aria-label={c.label}>
              <span>{c.label}</span>
              {c.options.map((o) => (
                // Precision starts on its own cycle, so nothing is pressed yet.
                <button
                  key={o.value} type="button"
                  aria-pressed={(values[c.key] ?? (c.key === "precision" ? null : c.options[0].value)) === o.value}
                  onClick={() => set(c.key, o.value)}
                >{o.label}</button>
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="lab-copy">
        <div className="lab-meta">
          <span className="lab-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="lab-status" data-live={entry.live || undefined}>{entry.status}</span>
        </div>
        <h2>{entry.name}</h2>
        <p>{entry.desc}</p>
        <div className="lab-use">
          <span>{useLabel}</span>
          <p>{entry.use}</p>
        </div>
        <div className="lab-foot">
          <ul className="lab-tech">
            {entry.tech.map((x) => <li key={x}>{x}</li>)}
          </ul>
          <Link href={ctaHref} className="lab-cta">{cta}<span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>
  );
}
