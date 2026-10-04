"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Fact } from "@/content/work-gallery";
import { GlImage } from "./GlImage";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// A case study in the home page's matter (ink, lime, grain, gradient
// display type) with a product page's clarity: the site itself comes first,
// large and sharp.
// · Hero — the title rises letter by letter; the site gathers from lit
//   grains into a large screen that grows to full bleed as you scroll.
// · Marquee — the project's name runs past, faster with the scroll.
// · Idea — its words light up in turn, as on the home manifesto.
// · Chapters — one large sticky screen; each step of the scroll dissolves
//   it to the next chapter of the site through a grain front.
// · Figures — outlined, then lit in lime.
// · Phones — rise at different speeds and lean toward the cursor.
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
  const app = !hero;
  const trio = phone.length > 3 ? [phone[1], phone[0], phone[3]] : phone.slice(0, 3);

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.still = "true";
      return;
    }
    // Title letters rise; the rest of the hero follows.
    gsap.from(el.querySelectorAll(".cx-letter"), { yPercent: 110, duration: 1.1, stagger: 0.025, ease: "power4.out", delay: 0.1 });
    gsap.from(el.querySelectorAll("[data-hero-rise]"), { y: 30, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out", delay: 0.5 });

    // The hero screen grows to full bleed.
    const screen = el.querySelector("[data-hero-screen]");
    if (screen) {
      gsap.fromTo(screen, { "--inset": "4vw", "--radius": "28px" }, {
        "--inset": "0vw", "--radius": "0px", ease: "none",
        scrollTrigger: { trigger: screen, start: "top 60%", end: "bottom 60%", scrub: true },
      });
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
    }

    // The idea, word by word.
    const words = el.querySelectorAll("[data-word]");
    if (words.length) {
      gsap.fromTo(words, { opacity: 0.12 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: el.querySelector("[data-idea]"), start: "top 75%", end: "bottom 50%", scrub: true },
      });
    }

    // Chapters: the scroll picks the chapter shown on the sticky screen.
    const ch = el.querySelector("[data-chapters]");
    if (ch && chapters.length > 1) {
      ScrollTrigger.create({
        trigger: ch, start: "top top", end: "bottom bottom",
        onUpdate: (s) => setChapter(Math.min(chapters.length - 1, Math.floor(s.progress * chapters.length))),
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
    }
  }, { scope: root });

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
            <GlImage srcs={[hero]} intro alt={title} className="cx-screen" fit="top" />
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

      {chapters.length > 1 && (
        <section data-chapters className="cx-chapters" style={{ "--n": chapters.length } as React.CSSProperties}>
          <div className="cx-chapters-stage">
            <GlImage srcs={chapters} index={chapter} alt={title} className="cx-chapter-screen" fit="top" />
            <div className="cx-chapter-hud">
              <span className="case-kicker">{labels.chapter}</span>
              <b className="font-display">{pad(chapter + 1)}<i> / {pad(chapters.length)}</i></b>
              {live && <span className="cx-host">{live.host}</span>}
            </div>
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

      {phone.length > 0 && (
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
