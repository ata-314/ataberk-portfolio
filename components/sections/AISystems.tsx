"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import "./ai-systems.css";

// AI Systems, set like the rest of the page: an editorial index on the
// left, one glass stage on the right that shows the selected system at
// work, its description underneath as a caption. The index advances on its
// own while the section is on screen (paused on hover or focus; off under
// reduced motion and below desktop). The stage has a fixed size, so
// switching systems never moves the page; every visual is pure CSS/SVG.

const CYCLE = 7000;

const copy = {
  tr: {
    brain: { core: "Brand Brain", nodes: ["Ses", "Palet", "Yasaklar", "Desenler"], learn: "Her üretimden öğrenir" },
    team: { roles: [["Stratejist", "açı ve brief"], ["Art direktör", "görsel yön"], ["Üretim", "görsel ve metin"], ["QA", "marka denetimi"]], out: "Final teslim paketi" },
    web: ["brief alındı", "marka ve içerik okunuyor", "tasarım sistemi kuruluyor", "build", "lint · typecheck", "deploy → canlı"],
    qc: { title: "Yayın öncesi denetim", checks: ["Marka sesi", "Palet ve görsel dil", "Yasaklı ifadeler", "Hafızadaki desenler"], ready: "Onaya hazır" },
  },
  en: {
    brain: { core: "Brand Brain", nodes: ["Voice", "Palette", "Banned", "Patterns"], learn: "Learns from every production" },
    team: { roles: [["Strategist", "angle & brief"], ["Art director", "visual direction"], ["Production", "assets & copy"], ["QA", "brand check"]], out: "Final delivery package" },
    web: ["brief received", "reading brand and content", "building the design system", "build", "lint · typecheck", "deploy → live"],
    qc: { title: "Pre-publish review", checks: ["Brand voice", "Palette and visual language", "Banned phrases", "Patterns from memory"], ready: "Ready for approval" },
  },
};
type Copy = (typeof copy)["tr"];

function Brain({ c }: { c: Copy }) {
  return (
    <div className="ais-brain">
      <svg className="ais-brain-links" viewBox="0 0 400 300" aria-hidden="true">
        {[[70, 60], [330, 60], [70, 240], [330, 240]].map(([x, y], i) => (
          <g key={i}>
            <path className="base" d={`M${x} ${y} Q ${(x + 200) / 2} 150 200 150`} />
            <path className="pulse" d={`M${x} ${y} Q ${(x + 200) / 2} 150 200 150`} pathLength={100} style={{ "--i": i } as CSSProperties} />
          </g>
        ))}
      </svg>
      <div className="ais-core"><span className="ais-core-ring" /><span className="ais-core-ring two" /><b>{c.brain.core}</b></div>
      {c.brain.nodes.map((n, i) => (
        <span key={n} className={`ais-chip ais-chip-${i}`} style={{ "--i": i } as CSSProperties}>
          {i === 1 ? <span className="ais-swatches"><i /><i /><i /></span> : <i className="ais-dot" />}{n}
        </span>
      ))}
      <span className="ais-brain-note">{c.brain.learn}</span>
    </div>
  );
}

function Team({ c }: { c: Copy }) {
  return (
    <div className="ais-team">
      <div className="ais-rail"><span className="ais-packet" /></div>
      <ol>
        {c.team.roles.map(([role, out], i) => (
          <li key={role} style={{ "--i": i } as CSSProperties}>
            <span className="ais-node">{String(i + 1).padStart(2, "0")}</span>
            <b>{role}</b><small>{out}</small>
          </li>
        ))}
      </ol>
      <span className="ais-delivery">{c.team.out}</span>
    </div>
  );
}

function Terminal({ c }: { c: Copy }) {
  return (
    <div className="ais-term">
      <div className="ais-term-bar"><span>web-development-agent</span><span>main</span></div>
      <ul>
        {c.web.map((line, i) => (
          <li key={line} style={{ "--i": i } as CSSProperties}><span className="ais-prompt">›</span>{line}<span className="ais-ok">✓</span></li>
        ))}
      </ul>
    </div>
  );
}

function Review({ c }: { c: Copy }) {
  return (
    <div className="ais-qc">
      <div className="ais-doc"><span className="ais-scan" /><i /><i /><i /><i className="short" /><b /></div>
      <div className="ais-checks">
        <small>{c.qc.title}</small>
        {c.qc.checks.map((k, i) => (
          <span key={k} style={{ "--i": i } as CSSProperties}><i className="ais-tick" />{k}</span>
        ))}
        <em>{c.qc.ready}</em>
      </div>
    </div>
  );
}

const stages = [Brain, Team, Terminal, Review];

export function AISystems({ locale, t }: { locale: Locale; t: SiteContent["aiSystems"] }) {
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [auto, setAuto] = useState(false);
  const [held, setHeld] = useState(false);
  const c = copy[locale];
  const count = t.entries.length;

  // Stages animate while the section is on screen; the index advances on
  // its own only on desktop, and only while nobody is reading.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setAuto(!matchMedia("(prefers-reduced-motion: reduce), (max-width: 1023px)").matches);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const cycling = auto && visible && !held;
  useEffect(() => {
    if (!cycling) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % count), CYCLE);
    return () => clearTimeout(id);
  }, [cycling, active, count]);

  // Arrow keys walk the index, as a tablist should.
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (active + step + count) % count;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const Stage = stages[active];
  return (
    <section ref={root} id="ai-systems" aria-labelledby="ai-systems-heading" className="ais-section relative z-20 px-5 md:px-10"
      data-visible={visible ? "true" : "false"} data-cycling={cycling ? "true" : "false"} data-system={active}>
      <div className="ais-grid mx-auto max-w-[88rem]" onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
        <div className="ais-side">
          <div className="ais-heading" data-reveal>
            <p className="ais-label">{t.label}</p>
            <h2 id="ai-systems-heading">{t.heading}</h2>
            <p className="ais-lead">{t.lead}</p>
          </div>
          <div className="ais-index" role="tablist" aria-label={t.heading} aria-orientation="vertical" onKeyDown={onKey} data-reveal>
            {t.entries.map((e, i) => (
              <button key={e.name} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`ais-tab-${i}`}
                aria-selected={i === active} aria-controls="ais-panel" tabIndex={i === active ? 0 : -1}
                className="ais-tab" onClick={() => setActive(i)}>
                <span className="ais-num">{String(i + 1).padStart(2, "0")}</span>
                <b>{e.name}</b>
                <small>{e.tag}</small>
                <span className="ais-progress" aria-hidden="true"><i key={i === active ? `on-${active}` : "off"} /></span>
              </button>
            ))}
          </div>
        </div>
        <div className="ais-stage" id="ais-panel" role="tabpanel" aria-labelledby={`ais-tab-${active}`} data-reveal>
          <div className="ais-visual" key={active} aria-hidden="true"><Stage c={c} /></div>
          <div className="ais-caption">
            <p key={`d-${active}`}>{t.entries[active].desc}</p>
            <span className="ais-count" aria-hidden="true">{String(active + 1).padStart(2, "0")}<i>/</i>{String(count).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
