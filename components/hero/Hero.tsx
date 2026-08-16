"use client";
/* eslint-disable react-hooks/set-state-in-effect --
   R3F frame-loop idiom: per-frame state lives in refs/uniforms mutated inside
   useFrame/raf (never React state), and GPU tier detection is a client-only
   mount effect. These are deliberate, documented patterns. */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "../three/scroll-state";
import { StaticField } from "../gl/Stage";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type HeroStrings = {
  name: string;
  title: string;
  tagline: string;
  intro: string;
  ctaWork: string;
  ctaAbout: string;
  scrollHint: string;
  locale: string;
};

// The hero is a transparent stage over the global CodeField canvas.
// Text is server-rendered HTML — visible before any WebGL loads.
export function Hero({ t }: { t: HeroStrings }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = document.createElement("canvas");
    setStaticMode(reduced || !c.getContext("webgl2"));
  }, []);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: wrapper.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          scrollState.hero.current = self.progress;
        },
      });
      // Text retreat: the headline yields the stage to the bird (hero ~40–55%)
      // with a masked slide, then returns on reverse scroll.
      gsap.to("[data-hero-text]", {
        opacity: 0,
        y: -60,
        ease: "none",
        scrollTrigger: {
          trigger: wrapper.current,
          start: "29% top", // ≈ hero progress 0.40 on the 360svh runway
          end: "40% top", // ≈ 0.55 — gone before the bird owns the stage
          scrub: true,
        },
      });
    },
    { scope: wrapper },
  );

  return (
    <div ref={wrapper} className="relative h-[220svh] md:h-[360svh]">
      <section
        aria-label={t.name}
        className="sticky top-0 z-30 flex h-svh flex-col justify-end overflow-hidden px-6 pb-[9svh] md:px-10"
      >
        {staticMode && <StaticField />}
        {/* Scrim: sits ABOVE the full-bleed painting (z-20 canvas), below the
            copy — the artwork owns the stage, the words stay effortless. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[25] h-[62svh]"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(10,10,11,0.55) 45%, rgba(10,10,11,0.92) 100%)",
          }}
        />
        <div data-hero-text className="pointer-events-none relative z-30 max-w-3xl">
          <p className="mb-5 font-mono text-xs tracking-[0.3em] text-bone-dim uppercase [animation:heroRise_0.8s_ease_0.1s_both]">
            {t.intro}
          </p>
          <h1
            lang="en"
            className="font-display leading-[0.95] font-semibold tracking-tight uppercase [animation:heroRise_0.9s_ease_0.25s_both]"
            style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)" }}
          >
            Ataberk Soylu
          </h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 [animation:heroRise_0.9s_ease_0.45s_both]">
            <p lang="en" className="font-mono text-sm tracking-widest text-lime uppercase">
              {t.title}
            </p>
            <p className="max-w-xl text-base text-bone-dim">{t.tagline}</p>
          </div>
          <div className="pointer-events-auto mt-8 flex flex-wrap gap-4 [animation:heroRise_0.9s_ease_0.65s_both]">
            <a
              href="#work"
              data-cursor="view"
              className="border border-lime bg-ink/40 px-6 py-3 font-mono text-xs tracking-widest text-lime uppercase backdrop-blur-sm transition-colors hover:bg-lime hover:text-ink"
            >
              {t.ctaWork}
            </a>
            <a
              href={`/${t.locale}/about`}
              className="border border-bone/20 bg-ink/40 px-6 py-3 font-mono text-xs tracking-widest text-bone-dim uppercase backdrop-blur-sm transition-colors hover:border-bone hover:text-bone"
            >
              {t.ctaAbout}
            </a>
          </div>
        </div>
        <p className="pointer-events-none absolute right-6 bottom-7 z-30 font-mono text-xs tracking-widest text-bone-dim/60 uppercase md:right-10">
          {t.scrollHint} ↓
        </p>
      </section>
    </div>
  );
}
