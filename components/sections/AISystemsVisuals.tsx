"use client";

import { useEffect, useState, type CSSProperties, type PointerEvent } from "react";
import type { Locale } from "@/lib/i18n";
import "./ai-systems-visuals.css";

// The AI Systems stage as glass objects: each system is one thick piece of
// glass with the brand's colours floating behind it as light, kin to the
// glass cards in Selected work. A Brand Brain disc ringed by its memory, a
// fan of four role panes the light walks through, a glass browser the site
// lights up behind, and a real magnifying lens reviewing a post.
// Motion is CSS; only the team's relay keeps a small clock in React. With
// a mouse, the specular light on the glass follows the pointer (the objects
// themselves never move with it).

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

const copy = {
  tr: {
    brain: { nodes: ["Ses", "Palet", "Yasaklı", "Desenler"], core: "Brand Brain", sub: "marka hafızası" },
    team: { roles: ["Stratejist", "Art direktör", "Üretim", "QA"], artifacts: ["brief", "moodboard", "post", "onaylı post"], out: "final teslim paketi" },
    web: { url: "ataberksoylu.com", live: "Canlı", scores: ["Performans", "Erişilebilirlik", "En iyi pratik", "SEO"] },
    qc: {
      title: "Yayın öncesi denetim", checks: ["Marka sesi", "Palet ve görsel dil", "Yasaklı ifade", "Hafızadaki desenler"],
      headline: "Hızlı hareket eden markalar için.", caption: ["Kampanyanı brieflemenin ", "çığır açan", "daha net", " yolu."], ready: "Onaya hazır",
    },
  },
  en: {
    brain: { nodes: ["Voice", "Palette", "Banned", "Patterns"], core: "Brand Brain", sub: "brand memory" },
    team: { roles: ["Strategist", "Art director", "Production", "QA"], artifacts: ["brief", "moodboard", "post", "approved post"], out: "final delivery package" },
    web: { url: "ataberksoylu.com", live: "Live", scores: ["Performance", "Accessibility", "Best practices", "SEO"] },
    qc: {
      title: "Pre-publish review", checks: ["Brand voice", "Palette and visual language", "Banned phrase", "Patterns from memory"],
      headline: "Built for brands that move fast.", caption: ["A ", "game-changing", "sharper", " way to brief a campaign."], ready: "Ready for approval",
    },
  },
} satisfies Record<Locale, unknown>;
type Copy = (typeof copy)["en"];

const SCORES = [96, 100, 100, 100];

function Brain({ c }: { c: Copy; visible: boolean }) {
  const ring = `${c.brain.nodes.join("  ·  ")}  ·  `.repeat(2);
  return (
    <div className="gs gs-brain">
      <i className="gs-light l-lime" /><i className="gs-light l-cyan" /><i className="gs-light l-bone" /><i className="gs-light l-coral" />
      <svg className="gs-ring" viewBox="0 0 300 300" aria-hidden="true">
        <defs><path id="gs-ring-path" d="M150 150 m-132 0 a132 132 0 1 1 264 0 a132 132 0 1 1 -264 0" /></defs>
        <text><textPath href="#gs-ring-path">{ring}</textPath></text>
      </svg>
      <i className="gs-floor" />
      <div className="gs-glass gs-disc"><div><b>{c.brain.core}</b><small>{c.brain.sub}</small><span className="gs-dots"><i /><i /><i /></span></div></div>
    </div>
  );
}

// The relay steps every 1.4 s while on screen: four roles, then the stack.
function Team({ c, visible }: { c: Copy; visible: boolean }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!visible || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setPhase((p) => (p + 1) % 5), 1400);
    return () => clearInterval(id);
  }, [visible]);
  return (
    <div className="gs gs-team" data-phase={phase}>
      <i className="gs-light gs-walker" />
      <i className="gs-floor" />
      <div className="gs-fan">
        {c.team.roles.map((r, i) => (
          <div key={r} className="gs-glass gs-pane" style={v({ "--i": i })}
            data-state={phase === 4 ? "stack" : i === phase ? "on" : i < phase ? "done" : undefined}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <em className={`gs-icon gs-icon-${i}`}>{i === 0 ? <><i /><i /><i /></> : i === 1 ? <><i /><i /><i /><i /></> : <i />}</em>
            <b>{r}</b>
            <small>{c.team.artifacts[i]}</small>
          </div>
        ))}
      </div>
      <span className="gs-note">{phase === 4 ? c.team.out : c.team.artifacts[phase]}</span>
    </div>
  );
}

function Web({ c }: { c: Copy; visible: boolean }) {
  return (
    <div className="gs gs-web">
      <div className="gs-browser">
        <div className="gs-site" aria-hidden="true"><i className="b-nav" /><i className="b-hero" /><i className="b-card" /><i className="b-card" /><i className="b-card" /></div>
        <div className="gs-glass gs-window">
          <div className="gs-bar"><span className="gs-url"><small>https://</small>{c.web.url}</span><span className="gs-live">{c.web.live}</span><i className="gs-load" /></div>
          <span className="gs-sitename">Ataberk</span>
        </div>
      </div>
      <div className="gs-scores">
        {SCORES.map((s, i) => (
          <span key={i} className={`gs-glass gs-score${s === 100 ? " is-full" : ""}`} style={v({ "--i": i })}><b>{s}</b><small>{c.web.scores[i]}</small></span>
        ))}
      </div>
    </div>
  );
}

function Post({ c }: { c: Copy }) {
  const [pre, banned, fix, post] = c.qc.caption;
  return (
    <div className="gs-post-art">
      <i className="p-logo" /><span className="p-strip"><i /><i /><i /></span>
      <p className="p-head">{c.qc.headline}</p>
      <p className="p-cap">{pre}<s>{banned}</s> <ins>{fix}</ins>{post}</p>
    </div>
  );
}

function Review({ c }: { c: Copy; visible: boolean }) {
  return (
    <div className="gs gs-qc">
      <div className="gs-post">
        <Post c={c} />
        <div className="gs-glass gs-lens"><div className="gs-zoom"><Post c={c} /></div></div>
      </div>
      <div className="gs-list">
        <small>{c.qc.title}</small>
        <ol>
          {c.qc.checks.map((k, i) => (
            <li key={k} style={v({ "--i": i })} className={i === 2 ? "is-issue" : undefined}>
              <span>{String(i + 1).padStart(2, "0")}</span><b>{k}</b><i />
            </li>
          ))}
        </ol>
        <span className="gs-ready">{c.qc.ready}</span>
      </div>
    </div>
  );
}

const SCENES = [Brain, Team, Web, Review];

export function GlassStage({ system, locale, visible }: { system: number; locale: Locale; visible: boolean }) {
  const Scene = SCENES[system];
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.removeProperty("--mx");
    e.currentTarget.style.removeProperty("--my");
  };
  return (
    <div className="gs-root" onPointerMove={onMove} onPointerLeave={onLeave}>
      <Scene c={copy[locale]} visible={visible} />
    </div>
  );
}
