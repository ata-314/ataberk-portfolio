"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Fact } from "@/content/work-gallery";
import { GlImage } from "./GlImage";

// The 3D spaces load only here, only in the browser.
const Gallery3D = dynamic(() => import("./Case3D").then((m) => m.Gallery3D), { ssr: false });
const Phones3D = dynamic(() => import("./Case3D").then((m) => m.Phones3D), { ssr: false });

gsap.registerPlugin(useGSAP, ScrollTrigger);

// A case study in the home page's matter (ink, lime, grain, gradient
// display type) with a product page's clarity: the site itself comes first,
// large and sharp.
// · Hero — the title rises letter by letter; the site gathers from lit
//   grains into a large screen that grows to full bleed as you scroll.
// · Marquee — the project's name runs past, faster with the scroll.
// · Idea — its words light up in turn, as on the home manifesto.
// · Chapters — a 3D space: the chapters as screens on a curved wall the
//   camera turns along with the scroll (2D fallback: one sticky screen
//   dissolving from chapter to chapter through a grain front).
// · Figures — outlined, then lit in lime.
// · Phones — 3D phone bodies floating in studio light, turning with the
//   cursor and the scroll (2D fallback: framed screens rising).
// · The hero screen comes in tilted back in 3D and lands as you scroll.
// The cursor ripples and splits every screen. Reduced motion: at rest.
type Props = {
  locale: "tr" | "en";
  title: string;
  kicker: string;
  idea: string;
  live?: { url: string; label: string; host: string };
  contact: string;
  hero?: string;
  desktop: string[];
  phone: string[];
  facts?: Fact[];
  labels: { chapter: string; phones: string; scroll: string };
};

const pad = (n: number) => String(n).padStart(2, "0");

export function CaseShow({ locale, title, kicker, idea, live, contact, hero, desktop, phone, facts, labels }: Props) {
  const root = useRef<HTMLDivElement>(null);
  // The hero already shows the opening screen; chapters start after it.
  const chapters = desktop.length > 1 ? desktop : hero ? [hero, ...desktop] : [];
  const [chapter, setChapter] = useState(0);
  // 3D only with motion allowed and WebGL2 at hand.
  const [three, setThree] = useState(false);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ok = !!document.createElement("canvas").getContext("webgl2");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ok) setThree(true);
  }, []);
  const app = !hero;
  const trio = phone.length > 3 ? [phone[1], phone[0], phone[3]] : phone.slice(0, 3);

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.still = "true";
      return;
    }
    const cleanups: (() => void)[] = [];
    // Title letters rise; the rest of the hero follows.
    gsap.from(el.querySelectorAll(".cx-letter"), { yPercent: 110, duration: 1.1, stagger: 0.025, ease: "power4.out", delay: 0.1 });
    gsap.from(el.querySelectorAll("[data-hero-rise]"), { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out", delay: 0.5 });

    // The hero screen grows to full bleed, landing from a tilt back in 3D;
    // the cursor leans it a little.
    const screen = el.querySelector<HTMLElement>("[data-hero-screen]");
    if (screen) {
      gsap.fromTo(screen, { "--inset": "4vw", "--radius": "28px" }, {
        "--inset": "0vw", "--radius": "0px", ease: "none",
        scrollTrigger: { trigger: screen, start: "top 60%", end: "bottom 60%", scrub: true },
      });
      const tilt = screen.querySelector<HTMLElement>("[data-tilt]");
      if (tilt) {
        gsap.fromTo(tilt, { rotateX: 24, scale: 0.92 }, { rotateX: 0, scale: 1, duration: 1.6, ease: "power3.out", delay: 0.25 });
        gsap.set(tilt, { rotateY: 0 });
        const ry = gsap.quickTo(tilt, "rotateY", { duration: 0.9, ease: "power3.out" });
        const lean = (e: PointerEvent) => ry((e.clientX / innerWidth - 0.5) * 6);
        addEventListener("pointermove", lean, { passive: true });
        cleanups.push(() => removeEventListener("pointermove", lean));
      }
    }

    // Marquee: drifts on its own and speeds with the scroll.
    const row = el.querySelector<HTMLElement>("[data-marquee]");
    if (row) {
      let x = 0, boost = 0;
      ScrollTrigger.create({ trigger: row, start: "top bottom", end: "bottom top", onUpdate: (s) => { boost = Math.min(18, Math.abs(s.getVelocity()) / 120); } });
      const tick = () => {
        boost *= 0.94;
        x -= 0.6 + boost;
        const w = row.scrollWidth / 2;
        if (-x > w) x += w;
        row.style.transform = `translate3d(${x}px,0,0)`;
      };
      gsap.ticker.add(tick);
      cleanups.push(() => gsap.ticker.remove(tick));
    }

    // The idea, word by word.
    const words = el.querySelectorAll("[data-word]");
    if (words.length) {
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: el.querySelector("[data-idea]"), start: "top 75%", end: "bottom 50%", scrub: true },
      });
    }

    // Chapters: the scroll picks the chapter shown (2D screen or 3D wall).
    const ch = el.querySelector("[data-chapters]");
    if (ch && chapters.length > 1) {
      ScrollTrigger.create({
        trigger: ch, start: "top top", end: "bottom bottom",
        // Same mapping as the 3D camera: chapter i in front at progress i/(n-1).
        onUpdate: (s) => setChapter(Math.round(s.progress * (chapters.length - 1))),
      });
    }

    // Figures light up.
    el.querySelectorAll<HTMLElement>("[data-fact]").forEach((b) => {
      ScrollTrigger.create({ trigger: b, start: "top 78%", onEnter: () => b.classList.add("on"), onLeaveBack: () => b.classList.remove("on") });
    });

    // Phones rise at different speeds; they lean toward the cursor.
    const phones = el.querySelectorAll<HTMLElement>("[data-phone]");
    phones.forEach((p, i) => {
      gsap.fromTo(p, { y: 160 + i * 60 }, {
        y: -40 * i, ease: "none",
        scrollTrigger: { trigger: el.querySelector("[data-phones]"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    const stage = el.querySelector<HTMLElement>("[data-phones]");
    if (stage) {
      const lean = (e: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(stage.querySelectorAll(".cx-phone"), { rotateY: x * 18, rotateX: -y * 12, duration: 0.8, ease: "power3.out" });
      };
      stage.addEventListener("pointermove", lean);
      cleanups.push(() => stage.removeEventListener("pointermove", lean));
    }
    return () => cleanups.forEach((f) => f());
  }, { scope: root, dependencies: [three], revertOnUpdate: true });

  const hud = chapters.length > 1 && (
    <div className="cx-chapter-hud">
      <span className="case-kicker">{labels.chapter}</span>
      <b className="font-display">{pad(chapter + 1)}<i> / {pad(chapters.length)}</i></b>
      {live && <span className="cx-host">{live.host}</span>}
    </div>
  );

  const name = `${title} — `;

  return (
    <div ref={root} className="cx">
      <header className="cx-hero">
        <div className="cx-hero-copy">
          <p className="case-kicker" data-hero-rise>{kicker}</p>
          <h1 className="cx-title font-display" aria-label={title}>
            {title.split(" ").map((word, w) => (
              <span key={w} className="cx-word" aria-hidden="true">
                {[...word].map((c, i) => <span key={i} className="cx-letter">{c}</span>)}
              </span>
            ))}
          </h1>
          <div className="cx-actions" data-hero-rise>
            {live && (
              <a href={live.url} target="_blank" rel="noopener noreferrer" className="case-live">
                {live.label} <span aria-hidden="true">↗</span>
                <em>{live.host}</em>
              </a>
            )}
            <a href={`/${locale}#contact`} className="cx-link link-draw">{contact} →</a>
          </div>
        </div>
        <div className="cx-hero-screen" data-hero-screen>
          {hero ? (
            <div data-tilt className="cx-tilt"><GlImage srcs={[hero]} intro alt={title} className="cx-screen" fit="top" /></div>
          ) : (
            <div className="cx-trio cx-trio-hero">
              {trio.map((src, i) => (
                <div key={src} className="cx-phone"><GlImage srcs={[src]} intro alt={`${title} — ${i + 1}`} fit="top" /></div>
              ))}
            </div>
          )}
        </div>
        <p className="cx-scroll case-kicker" data-hero-rise aria-hidden="true">{labels.scroll} ↓</p>
      </header>

      <div className="cx-marquee" aria-hidden="true">
        <div data-marquee className="cx-marquee-row font-display">
          {Array.from({ length: 8 }, (_, i) => <span key={i}>{name}</span>)}
        </div>
      </div>

      <section data-idea className="cx-idea">
        <p className="font-display">
          {idea.split(" ").map((w, i) => <span key={i} data-word>{w} </span>)}
        </p>
      </section>

      {chapters.length > 1 && three && <Gallery3D srcs={chapters} onChapter={setChapter}>{hud}</Gallery3D>}

      {chapters.length > 1 && !three && (
        <section data-chapters className="cx-chapters" style={{ "--n": chapters.length } as React.CSSProperties}>
          <div className="cx-chapters-stage">
            <GlImage srcs={chapters} index={chapter} alt={title} className="cx-chapter-screen" fit="top" />
            {hud}
          </div>
        </section>
      )}

      {facts && facts.length > 0 && (
        <section className="cx-facts" aria-label={title}>
          {facts.map((f) => (
            <div key={f.value + f.en}>
              <b data-fact className="font-display">{f.value}</b>
              <span className="case-kicker">{f[locale]}</span>
            </div>
          ))}
        </section>
      )}

      {phone.length > 0 && three && (
        <Phones3D srcs={app ? phone.slice(0, 5) : trio}>
          <h2 className="cx-h2 font-display c3-phones-title">{labels.phones}</h2>
        </Phones3D>
      )}

      {phone.length > 0 && !three && (
        <section className="cx-mobile">
          <h2 className="cx-h2 font-display">{labels.phones}</h2>
          <div data-phones className="cx-trio">
            {(app ? phone : trio).map((src, i) => (
              <div key={src} data-phone className="cx-phone-wrap">
                <div className="cx-phone"><GlImage srcs={[src]} alt={`${title} — ${i + 1}`} fit="top" /></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
