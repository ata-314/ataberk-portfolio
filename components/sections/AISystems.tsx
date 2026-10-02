"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { GrainStage } from "./AISystemsVisuals";
import "./ai-systems.css";

// AI Systems, set like the rest of the page: an editorial index on the
// left, one glass stage on the right that shows the selected system at
// work, its description underneath as a caption. The index advances on its
// own while the section is on screen (paused on hover or focus; off under
// reduced motion and below desktop). The stage has a fixed size, so
// switching systems never moves the page. The visuals are drawn in grains
// of light (AISystemsVisuals.tsx + ais-grains.ts).

const CYCLE = 7000;

export function AISystems({ locale, t }: { locale: Locale; t: SiteContent["aiSystems"] }) {
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [auto, setAuto] = useState(false);
  const [held, setHeld] = useState(false);
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
          <div className="ais-visual" key={active} aria-hidden="true"><GrainStage system={active} locale={locale} visible={visible} /></div>
          <div className="ais-caption">
            <p key={`d-${active}`}>{t.entries[active].desc}</p>
            <span className="ais-count" aria-hidden="true">{String(active + 1).padStart(2, "0")}<i>/</i>{String(count).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
