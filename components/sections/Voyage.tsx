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
    lines: [["Fikrin", "içine"], ["adım", "at,"], ["uçuşunu", "izle"]],
    key: "uçuşunu",
    caption: "Derinliğe · veri tüneli",
  },
  en: {
    kicker: "02 — Voyage",
    lines: [["Step", "inside"], ["the", "idea,"], ["watch", "it", "fly"]],
    key: "fly",
    caption: "Into the depth · data tunnel",
  },
};

// After the opening, on black: the line is already rising in as the bird
// reaches the dark — letters lift out of their masks word by word — then,
// held on screen, the words drift apart round the bird, the rest dissolve,
// and the key word (drawn in outline) fills and swells until the camera
// passes through it into the tunnel the stage has been assembling behind
// it. The stage reads this section's progress ([data-voyage]).
export function Voyage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = gsap.utils.toArray<HTMLElement>("[data-voyage-char]", section);
    const words = gsap.utils.toArray<HTMLElement>("[data-voyage-word]", section);
    const key = section.querySelector<HTMLElement>("[data-voyage-key]");
    const others = words.filter((w) => w !== key);
    const line = section.querySelector("[data-voyage-line]");
    const kicker = section.querySelector("[data-voyage-kicker]");
    const caption = section.querySelector("[data-voyage-caption]");

    // Arrival: while the section is still sliding up under the end of the
    // opening, so the words meet the bird in the dark.
    gsap.timeline({ scrollTrigger: { trigger: section, start: "top 92%", end: "top 15%", scrub: 0.5 } })
      .fromTo(kicker, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3 }, 0)
      .fromTo(chars, { yPercent: 115 }, { yPercent: 0, ease: "power3.out", duration: 0.7, stagger: 0.012 }, 0.05);

    // Held: drift apart, dissolve, swell through the key word.
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.5 },
    })
      .fromTo(line, { "--gap": "0.28em" }, { "--gap": "1.5em", duration: 0.22, ease: "power1.inOut" }, 0)
      .to(kicker, { opacity: 0, duration: 0.08 }, 0.12)
      .to(others, { opacity: 0, filter: "blur(10px)", duration: 0.12, stagger: 0.012 }, 0.2)
      .to(key, { "--fill": 1, duration: 0.1 }, 0.2)
      .fromTo(key, { scale: 1 }, { scale: 24, duration: 0.18, ease: "power3.in" }, 0.24)
      .to(key, { opacity: 0, duration: 0.05 }, 0.37)
      .fromTo(caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.06 }, 0.44)
      .to(caption, { opacity: 0, duration: 0.05 }, 0.86)
      .set({}, {}, 1);
  }, { scope: root });

  return (
    <section ref={root} data-voyage className="relative z-20 h-[560svh]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-5">
        <p data-voyage-kicker className="voyage-kicker">{t.kicker}</p>
        <p data-voyage-line className="voyage-line" aria-label={t.lines.flat().join(" ")}>
          {t.lines.map((row, i) => (
            <span key={i} className="block">
              {row.map((word) => (
                <span
                  key={word}
                  data-voyage-word
                  {...(word === t.key ? { "data-voyage-key": "" } : {})}
                  className={`voyage-word${word === t.key ? " voyage-key" : ""}`}
                  aria-hidden
                >
                  {Array.from(word).map((ch, k) => (
                    <span key={k} className="voyage-mask">
                      <span data-voyage-char className="inline-block">{ch}</span>
                    </span>
                  ))}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p data-voyage-caption className="voyage-caption">{t.caption}</p>
      </div>
    </section>
  );
}
