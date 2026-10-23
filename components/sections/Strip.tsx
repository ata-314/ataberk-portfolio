"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";
import { STRIP_LEAD_SVH, STRIP_STEP_SVH, stripCopy, stripFilms, stripPosition, stripStop } from "@/content/strip";
import { stripState } from "../three/scroll-state";
import { StripPlayer } from "./StripPlayer";
import "./strip.css";

gsap.registerPlugin(useGSAP);

const RUNWAY_SVH = STRIP_LEAD_SVH + stripFilms.length * STRIP_STEP_SVH;

// Film strip: the scroll runway for the drum of brand films the stage draws
// between the hero and the X (it reads this section's box through
// [data-strip]). The page carries the titles: the film in front is set large
// along the bottom and rolls over to the next as the drum turns, and the next
// one is named at the side with buttons that scroll to it. A click on a film
// on the band (picked by the stage) opens it in the player. Without the stage
// (reduced motion, no WebGL) the posters are shown as a plain row instead,
// and open the player themselves.
export function Strip({ locale }: { locale: Locale }) {
  const t = stripCopy[locale];
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(-1);

  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    const titles = Array.from(section.querySelectorAll<HTMLElement>("[data-strip-title]"));
    const nexts = Array.from(section.querySelectorAll<HTMLElement>("[data-strip-next]"));
    const side = section.querySelector<HTMLElement>("[data-strip-side]");
    const list = section.querySelector<HTMLElement>(".strip-titles");
    let last = "";
    const tick = () => {
      const r = section.getBoundingClientRect();
      const h = innerHeight;
      if (r.bottom < 0 || r.top > h) return;
      const position = stripPosition(Math.max(0, Math.min(1, -r.top / Math.max(r.height - h, 1))));
      // The titles come up with the drum, after it has started to gather.
      const enter = Math.max(0, Math.min(1, ((h - r.top) / h - 0.55) / 0.4));
      // And leave as the drum backs out into the ring.
      const stay = 1 - Math.max(0, Math.min(1, (h - r.bottom) / (h * 0.3)));
      const key = `${position.toFixed(3)}:${enter.toFixed(3)}:${stay.toFixed(3)}`;
      if (key === last) return;
      last = key;
      titles.forEach((title, i) => {
        const offset = Math.max(-1, Math.min(1, i - position)) + (1 - enter);
        title.style.transform = `translate3d(0, ${Math.min(1, offset) * 108}%, 0)`;
      });
      const index = Math.round(position);
      nexts.forEach((next, i) => {
        const offset = Math.max(-1, Math.min(1, i - position));
        next.style.transform = `translate3d(0, ${offset * 110}%, 0)`;
      });
      if (side) side.style.opacity = String(enter * stay * (index < stripFilms.length - 1 ? 1 : 0.35));
      if (list) list.style.opacity = String(stay);
      section.dataset.film = String(index);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, { scope: root });

  // The buttons scroll the page to the film's hold, so the drum turns there.
  const go = (step: number) => {
    const section = root.current;
    if (!section) return;
    const index = Math.max(0, Math.min(stripFilms.length - 1, Number(section.dataset.film || 0) + step));
    const target = section.getBoundingClientRect().top + scrollY + stripStop(index, innerHeight);
    const proxy = { y: scrollY };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(proxy, {
      y: target,
      duration: reduced ? 0 : 1.2,
      ease: "power2.inOut",
      onUpdate: () => window.scrollTo({ top: proxy.y, behavior: "instant" }),
    });
  };

  // The band is drawn on the stage: the hit layer asks it which film is
  // under the pointer, for the cursor, the hover lift and the click.
  const pickAt = (e: React.PointerEvent | React.MouseEvent) => (stripState.pick ? stripState.pick(e.clientX, e.clientY) : -1);
  const onHitMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const hit = e.pointerType === "mouse" && open < 0 ? pickAt(e) : -1;
    stripState.hover = hit;
    e.currentTarget.style.cursor = hit >= 0 ? "pointer" : "";
    e.currentTarget.toggleAttribute("data-cursor", hit >= 0);
  };
  const onHitLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    stripState.hover = -1;
    e.currentTarget.toggleAttribute("data-cursor", false);
  };
  const onHitClick = (e: React.MouseEvent) => {
    if (open >= 0) return;
    const hit = pickAt(e);
    if (hit >= 0) setOpen(hit);
  };

  return (
    <section ref={root} data-strip data-open={open >= 0 ? "true" : undefined} aria-label={t.label} className="strip relative z-20" style={{ height: `${RUNWAY_SVH + 100}svh` }}>
      <div data-strip-lead aria-hidden className="pointer-events-none absolute left-0 top-0 w-px" style={{ height: `${STRIP_LEAD_SVH}svh` }} />
      <div className="strip-frame">
        <div className="strip-static">
          {stripFilms.map((film, i) => (
            <button key={film.slug} type="button" aria-label={`${t.play}: ${film.title}`} onClick={() => setOpen(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/strip/${film.slug}-1.jpg`} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <div className="strip-hit" aria-hidden onPointerMove={onHitMove} onPointerLeave={onHitLeave} onClick={onHitClick} />
        <ol className="strip-titles">
          {stripFilms.map((film, i) => (
            <li key={film.slug} className="strip-title-line">
              <span data-strip-title className="strip-title">{film.title}</span>
              <span className="sr-only">, {t.kind}</span>
              <button type="button" className="sr-only focus:not-sr-only" onClick={() => setOpen(i)}>{t.play}: {film.title}</button>
            </li>
          ))}
        </ol>
        <div data-strip-side className="strip-side">
          <span className="strip-next-label">{t.next}</span>
          <span className="strip-next-line" aria-hidden>
            {stripFilms.slice(1).map((film) => (
              <span key={film.slug} data-strip-next className="strip-next">{film.title}</span>
            ))}
          </span>
          <span className="strip-buttons">
            <button type="button" aria-label={t.nextFilm} onClick={() => go(1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l6 6-6 6M12 6l6 6-6 6" /></svg>
            </button>
            <button type="button" aria-label={t.prev} onClick={() => go(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden><path d="M18 6l-6 6 6 6M12 6l-6 6 6 6" /></svg>
            </button>
          </span>
        </div>
      </div>
      {open >= 0 && <StripPlayer locale={locale} film={open} onClosed={() => setOpen(-1)} />}
    </section>
  );
}
