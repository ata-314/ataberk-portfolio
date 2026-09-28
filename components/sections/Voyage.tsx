"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const copy = {
  tr: { lines: [["Fikrin", "içine"], ["adım", "at,", "uçuşunu"], ["izle"]], key: "uçuşunu", caption: "Derinliğe · veri tüneli" },
  en: { lines: [["Step", "inside"], ["the", "idea,", "watch"], ["it", "fly"]], key: "fly", caption: "Into the depth · data tunnel" },
};

// After the opening: on black, the bird floats at the centre while a line
// opens up around it word by word; one word swells until the camera passes
// through it, and the stage takes the flight into the voxel tunnel. The
// stage reads this section's progress ([data-voyage]).
export function Voyage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = gsap.utils.toArray<HTMLElement>("[data-voyage-word]", section);
    const key = section.querySelector<HTMLElement>("[data-voyage-key]");
    const others = words.filter((w) => w !== key);
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.4 },
    })
      .fromTo(section.querySelector("[data-voyage-line]"), { "--gap": "0.25em", opacity: 0 }, { "--gap": "1.6em", opacity: 1, duration: 0.3 }, 0)
      .to(others, { opacity: 0, filter: "blur(8px)", duration: 0.12, stagger: 0.01 }, 0.3)
      .fromTo(key, { scale: 1 }, { scale: 26, duration: 0.2, ease: "power2.in" }, 0.32)
      .to(key, { opacity: 0, duration: 0.05 }, 0.42)
      .fromTo(section.querySelector("[data-voyage-caption]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.08 }, 0.52)
      .to(section.querySelector("[data-voyage-caption]"), { opacity: 0, duration: 0.06 }, 0.92)
      .set({}, {}, 1);
  }, { scope: root });

  return (
    <section ref={root} data-voyage className="relative z-20 h-[560svh]">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden px-5">
        <p data-voyage-line className="voyage-line hero-copy font-display text-center font-semibold uppercase" aria-label={t.lines.flat().join(" ")}>
          {t.lines.map((line, i) => (
            <span key={i} className="block">
              {line.map((word) => (
                <span
                  key={word}
                  data-voyage-word
                  {...(word === t.key ? { "data-voyage-key": "" } : {})}
                  className="voyage-word inline-block"
                  aria-hidden
                >
                  {word}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p data-voyage-caption className="hero-copy absolute bottom-[8svh] left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.2em] text-bone/70 uppercase opacity-0">
          {t.caption}
        </p>
      </div>
    </section>
  );
}
