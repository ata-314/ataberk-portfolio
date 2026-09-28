"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const copy = {
  tr: {
    kicker: "02 — Yolculuk",
    depth: "Derinlik",
    lines: [["Fikrin", "içine"], ["adım", "at."]],
    body: "Kuş, fikrin kendisi. Onu izle: girdabın içinden veri tüneline, oradan işlerin içine uzanan yolculuk burada başlıyor.",
    cta: "Kaydır — tünele gir",
    caption: "Veri tüneli",
  },
  en: {
    kicker: "02 — Voyage",
    depth: "Depth",
    lines: [["Step", "inside"], ["the", "idea."]],
    body: "The bird is the idea itself. Follow it: through the vortex into the data tunnel, and on into the work.",
    cta: "Scroll — enter the tunnel",
    caption: "Data tunnel",
  },
};

// Voyage, on black after the opening. An editorial frame round the bird:
// kicker and rule top-left, a live depth readout top-right, the headline
// set large bottom-left (second line quieter), a short note and the cue
// bottom-right. It rises in while the section is still sliding up, so the
// words meet the bird in the dark. Then the stage takes the headline's
// letters as particles (vortex-layer) — the page copy steps aside at the
// same moment — winds them and the bird into a vortex and pulls it into
// the tunnel. The stage reads this section's progress ([data-voyage]).
export function Voyage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const depth = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    const q = (s: string) => section.querySelector(s);
    const words = gsap.utils.toArray<HTMLElement>("[data-voyage-word]", section);
    const meta = gsap.utils.toArray<HTMLElement>("[data-voyage-meta]", section);
    const headline = q("[data-voyage-headline]");
    const rule = q("[data-voyage-rule]");
    const caption = q("[data-voyage-caption]");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Arrival, scrubbed while the section slides in under the opening.
    gsap.timeline({ scrollTrigger: { trigger: section, start: "top 90%", end: "top 10%", scrub: 0.5 } })
      .fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: "power2.out", duration: 0.5 }, 0)
      .fromTo(words, { yPercent: 110 }, { yPercent: 0, ease: "power4.out", duration: 0.6, stagger: 0.07 }, 0.1)
      .fromTo(meta, { opacity: 0, y: 16 }, { opacity: 1, y: 0, ease: "power2.out", duration: 0.4, stagger: 0.08 }, 0.35);

    // Held: the copy hands its letters to the vortex, the frame steps
    // aside, and the tunnel caption comes up once inside.
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
        onUpdate: (self) => {
          if (depth.current) depth.current.textContent = String(Math.round(self.progress * 9000)).padStart(4, "0");
        },
      },
    })
      .to(meta, { opacity: 0, y: -10, duration: 0.05, stagger: 0.01 }, 0.07)
      .to(headline, { opacity: 0, duration: 0.03 }, 0.11)
      .fromTo(caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.06 }, 0.46)
      .to(caption, { opacity: 0, duration: 0.05 }, 0.86)
      .set({}, {}, 1);
  }, { scope: root });

  return (
    <section ref={root} data-voyage className="voyage relative z-20 h-[560svh]">
      <div className="voyage-frame hero-copy">
        <div className="voyage-top">
          <div data-voyage-meta>
            <p className="voyage-label">{t.kicker}</p>
            <span data-voyage-rule className="voyage-rule" />
          </div>
          <p data-voyage-meta className="voyage-label voyage-depth">
            {t.depth} <span ref={depth}>0000</span> m
          </p>
        </div>
        <div className="voyage-bottom">
          <h2 data-voyage-headline className="voyage-headline" aria-label={t.lines.flat().join(" ")}>
            {t.lines.map((row, i) => (
              <span key={i} className={`voyage-row${i ? " voyage-row-quiet" : ""}`} aria-hidden>
                {row.map((word) => (
                  <span key={word} className="voyage-mask">
                    <span data-voyage-word className="voyage-word">{word}</span>
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <div className="voyage-aside">
            <p data-voyage-meta className="voyage-body">{t.body}</p>
            <p data-voyage-meta className="voyage-cta">
              <span className="voyage-cta-line" />
              {t.cta}
            </p>
          </div>
        </div>
        <p data-voyage-caption className="voyage-caption">{t.caption}</p>
      </div>
    </section>
  );
}
