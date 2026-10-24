"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";
import { STRIP_LEAD_SVH, STRIP_SHOTS, STRIP_STEP_SVH, stripCopy, stripFilms, stripPosition, stripStop } from "@/content/strip";
import { stripState } from "../three/scroll-state";
import { StripPlayer } from "./StripPlayer";
import "./strip.css";

gsap.registerPlugin(useGSAP);

const RUNWAY_SVH = STRIP_LEAD_SVH + stripFilms.length * STRIP_STEP_SVH;

// Film strip: the scroll runway for the band of brand films the stage draws
// between the hero and the X (it reads this section's box through
// [data-strip]). The page carries the title of the film in front, set like
// the site's section headings with its letters rising in turn, and an index
// of the films with buttons that scroll to them. A click on a shot on the
// band (picked by the stage) opens its film in the player. Without the stage
// (reduced motion, no WebGL) the posters are shown as a plain row instead,
// and open the player themselves.
export function Strip({ locale }: { locale: Locale }) {
  const t = stripCopy[locale];
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<{ film: number; panel: number } | null>(null);
  const [active, setActive] = useState(0);

  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    const block = section.querySelector<HTMLElement>("[data-strip-block]");
    let last = "";
    let shown = -1;
    const tick = () => {
      const r = section.getBoundingClientRect();
      const h = innerHeight;
      if (r.bottom < 0 || r.top > h) return;
      const position = stripPosition(Math.max(0, Math.min(1, -r.top / Math.max(r.height - h, 1))));
      // The titles come up with the band, and leave as it breaks into the X.
      const enter = Math.max(0, Math.min(1, ((h - r.top) / h - 0.55) / 0.4));
      const stay = 1 - Math.max(0, Math.min(1, (h - r.bottom) / (h * 0.3)));
      const key = `${enter.toFixed(3)}:${stay.toFixed(3)}`;
      if (key !== last && block) {
        last = key;
        block.style.opacity = String(enter * stay);
        block.style.transform = `translate3d(0, ${(1 - enter) * 24}px, 0)`;
      }
      const index = Math.round(position);
      if (index !== shown) {
        shown = index;
        section.dataset.film = String(index);
        setActive(index);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, { scope: root });

  // The buttons and the index scroll the page to a film's hold, so the band
  // turns there.
  const goTo = (index: number) => {
    const section = root.current;
    if (!section) return;
    const i = Math.max(0, Math.min(stripFilms.length - 1, index));
    const target = section.getBoundingClientRect().top + scrollY + stripStop(i, innerHeight);
    const proxy = { y: scrollY };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(proxy, {
      y: target,
      duration: reduced ? 0 : 1.2,
      ease: "power2.inOut",
      onUpdate: () => window.scrollTo({ top: proxy.y, behavior: "instant" }),
    });
  };

  // The band is drawn on the stage: the hit layer asks it which shot is
  // under the pointer, for the cursor, the hover (the shot eases forward)
  // and the click.
  const pickAt = (e: { clientX: number; clientY: number }) => (stripState.pick ? stripState.pick(e.clientX, e.clientY) : -1);
  const openShot = (panel: number) => setOpen({ film: Math.floor(panel / STRIP_SHOTS), panel });
  const onHitMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const hit = e.pointerType === "mouse" && !open ? pickAt(e) : -1;
    stripState.hover = hit;
    e.currentTarget.style.cursor = hit >= 0 ? "pointer" : "";
    e.currentTarget.toggleAttribute("data-cursor", hit >= 0);
  };
  const onHitLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    stripState.hover = -1;
    e.currentTarget.toggleAttribute("data-cursor", false);
  };
  const onHitClick = (e: React.MouseEvent) => {
    if (open) return;
    const hit = pickAt(e);
    if (hit >= 0) openShot(hit);
  };
  // The middle shot of a film, for the keyboard and the poster row.
  const middle = (film: number) => film * STRIP_SHOTS + 1;

  return (
    <section ref={root} data-strip data-section="strip" data-open={open ? "true" : undefined} aria-label={t.label} className="strip relative z-20" style={{ height: `${RUNWAY_SVH + 100}svh` }}>
      <div data-strip-lead aria-hidden className="pointer-events-none absolute left-0 top-0 w-px" style={{ height: `${STRIP_LEAD_SVH}svh` }} />
      <div className="strip-frame">
        <div className="strip-static">
          {stripFilms.map((f, i) => (
            <button key={f.slug} type="button" aria-label={`${t.play}: ${f.title}`} onClick={() => setOpen({ film: i, panel: middle(i) })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/strip/${f.slug}-2.jpg`} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <div className="strip-hit" aria-hidden onPointerMove={onHitMove} onPointerLeave={onHitLeave} onClick={onHitClick} />
        <div data-strip-block className="strip-block">
          <h3 className="strip-heading" aria-label={stripFilms[active].title}>
            {stripFilms.map((f, i) => (
              <span key={f.slug} aria-hidden className="strip-heading-line" data-active={i === active ? "true" : undefined} data-past={i < active ? "true" : undefined}>
                {Array.from(f.title, (ch, k) => (
                  <span key={k} style={{ "--i": k } as React.CSSProperties}>{ch}</span>
                ))}
              </span>
            ))}
          </h3>
          <div className="strip-index">
            <span className="strip-kind">{t.kind}</span>
            <ol>
              {stripFilms.map((f, i) => (
                <li key={f.slug}>
                  <button type="button" data-active={i === active ? "true" : undefined} aria-current={i === active ? "true" : undefined} onClick={() => goTo(i)}>{f.title}</button>
                </li>
              ))}
            </ol>
            <span className="strip-buttons">
              <button type="button" aria-label={t.prev} onClick={() => goTo(active - 1)} disabled={active === 0}>
                <svg viewBox="0 0 24 24" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button type="button" aria-label={t.nextFilm} onClick={() => goTo(active + 1)} disabled={active === stripFilms.length - 1}>
                <svg viewBox="0 0 24 24" aria-hidden><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </span>
          </div>
          <button type="button" className="sr-only focus:not-sr-only" onClick={() => setOpen({ film: active, panel: middle(active) })}>
            {t.play}: {stripFilms[active].title}
          </button>
        </div>
      </div>
      {open && <StripPlayer locale={locale} film={open.film} panel={open.panel} onClosed={() => setOpen(null)} />}
    </section>
  );
}
