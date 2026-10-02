"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Locale } from "@/lib/i18n";
import { mountGrains } from "./ais-grains";
import "./ai-systems-visuals.css";

// The AI Systems stage: one canvas of grains (ais-grains.ts) with the type
// laid over it in the DOM. Labels the scene must point at carry a
// data-anchor and are positioned by the scene; the rest is plain layout.
// Timed DOM reveals match the scene's clock (see the delays in the CSS).

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

const copy = {
  tr: {
    brain: { nodes: ["Ses", "Palet", "Yasaklı", "Desenler"], core: "Brand Brain" },
    team: { roles: ["Stratejist", "Art direktör", "Üretim", "QA"], artifacts: ["brief", "moodboard", "post", "onaylı post"], out: "final teslim paketi" },
    web: {
      repo: "web-development-agent", steps: ["brief alındı", "marka okunuyor", "tasarım sistemi", "build", "lint · typecheck", "deploy → canlı"],
      url: "ataberksoylu.com", live: "Canlı", scores: ["Performans", "Erişilebilirlik", "En iyi pratik", "SEO"],
    },
    qc: { title: "Yayın öncesi denetim", checks: ["Marka sesi", "Palet ve görsel dil", "Yasaklı ifade", "Hafızadaki desenler"], fix: "çığır açan → daha net", ready: "Onaya hazır" },
  },
  en: {
    brain: { nodes: ["Voice", "Palette", "Banned", "Patterns"], core: "Brand Brain" },
    team: { roles: ["Strategist", "Art director", "Production", "QA"], artifacts: ["brief", "moodboard", "post", "approved post"], out: "final delivery package" },
    web: {
      repo: "web-development-agent", steps: ["brief received", "reading the brand", "design system", "build", "lint · typecheck", "deploy → live"],
      url: "ataberksoylu.com", live: "Live", scores: ["Performance", "Accessibility", "Best practices", "SEO"],
    },
    qc: { title: "Pre-publish review", checks: ["Brand voice", "Palette and visual language", "Banned phrase", "Patterns from memory"], fix: "game-changing → sharper", ready: "Ready for approval" },
  },
} satisfies Record<Locale, unknown>;

const SCORES = [96, 100, 100, 100];

export function GrainStage({ system, locale, visible }: { system: number; locale: Locale; visible: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof mountGrains> | null>(null);
  const [phase, setPhase] = useState(0);
  const c = copy[locale];

  useEffect(() => {
    if (!canvas.current || !root.current) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const e = mountGrains(canvas.current, root.current, system, { still, onPhase: setPhase });
    engine.current = e;
    return () => e.destroy();
  }, [system]);
  useEffect(() => engine.current?.run(visible), [visible, system]);

  return (
    <div ref={root} className={`g-wrap g-sys-${system}`}>
      <canvas ref={canvas} className="g-canvas" />
      {system === 0 && (
        <>
          {c.brain.nodes.map((n, i) => <span key={n} data-anchor={`sat-${i}`} className={`g-tag${i === 2 ? " is-coral" : ""}`}>{n}</span>)}
          <span data-anchor="core" lang="en" className="g-tag is-core">{c.brain.core}</span>
        </>
      )}
      {system === 1 && (
        <>
          {c.team.roles.map((n, i) => (
            <span key={n} data-anchor={`role-${i}`} className={`g-tag${phase === 4 || i <= phase ? " is-lit" : ""}`}>{n}</span>
          ))}
          <span data-anchor="pkt" className="g-tag is-pkt">{phase === 4 ? c.team.out : c.team.artifacts[phase]}</span>
        </>
      )}
      {system === 2 && (
        <>
          <ul className="g-log">
            <li className="g-log-head">{c.web.repo}</li>
            {c.web.steps.map((s, i) => (
              <li key={s} style={v({ "--i": i })}><time>00:{String(i * 7 + 2).padStart(2, "0")}</time>{s}<i /></li>
            ))}
          </ul>
          <span data-anchor="url" className="g-url"><small>https://</small>{c.web.url}</span>
          <span data-anchor="live" className="g-live">{c.web.live}</span>
          {SCORES.map((s, i) => (
            <span key={i} data-anchor={`ring-${i}`} className="g-ring" style={v({ "--i": i })}><b>{s}</b><small>{c.web.scores[i]}</small></span>
          ))}
        </>
      )}
      {system === 3 && (
        <>
          {[1, 2, 3, 4].map((n) => <span key={n} data-anchor={`pin-${n}`} className={`g-pin g-pin-${n}`}>{n}</span>)}
          <div data-anchor="list" className="g-list">
            <small>{c.qc.title}</small>
            <ol>
              {c.qc.checks.map((k, i) => (
                <li key={k} style={v({ "--i": i })} className={i === 2 ? "is-issue" : undefined}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <b>{k}{i === 2 && <em>{c.qc.fix}</em>}</b>
                  <i />
                </li>
              ))}
            </ol>
            <span className="g-ready">{c.qc.ready}</span>
          </div>
        </>
      )}
    </div>
  );
}
