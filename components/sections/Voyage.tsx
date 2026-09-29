"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const copy = {
  tr: { caption: "Veri tüneli", depth: "Derinlik" },
  en: { caption: "Data tunnel", depth: "Depth" },
};

// Voyage: the scroll runway for the flight through the X into the voxel
// tunnel, all of it drawn by the stage (which reads this section's
// progress through [data-voyage]). The page only adds a quiet caption with
// a live depth readout once inside.
export function Voyage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const depth = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const section = root.current;
    if (!section || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const caption = section.querySelector("[data-voyage-caption]");
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
      .fromTo(caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.06 }, 0.22)
      .to(caption, { opacity: 0, duration: 0.05 }, 0.86)
      .set({}, {}, 1);
  }, { scope: root });

  return (
    <section ref={root} data-voyage aria-label={t.caption} className="voyage relative z-20 h-[480svh]">
      <div className="voyage-frame hero-copy">
        <p data-voyage-caption className="voyage-caption">
          {t.caption} · {t.depth} <span ref={depth}>0000</span> m
        </p>
      </div>
    </section>
  );
}
