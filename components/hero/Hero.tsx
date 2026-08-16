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
        className="sticky top-0 z-30 flex h-svh flex-col justify-center overflow-hidden px-6 md:px-10"
      >
        {staticMode && <StaticField />}
        <div data-hero-text className="pointer-events-none relative max-w-3xl">
          <p className="mb-5 font-mono text-xs tracking-[0.3em] text-bone-dim uppercase [animation:heroRise_0.8s_ease_0.1s_both]">
            {t.intro}
          </p>
          <h1
            lang="en"
            className="font-display leading-[0.95] font-semibold tracking-tight uppercase [animation:heroRise_0.9s_ease_0.25s_both]"
            style={{ fontSize: "var(--text-display)" }}
          >
            Ataberk
            <br />
            Soylu
          </h1>
          <p lang="en" className="mt-6 font-mono text-sm tracking-widest text-lime uppercase [animation:heroRise_0.9s_ease_0.45s_both]">
            {t.title}
          </p>
          <p className="mt-5 max-w-xl text-lg text-bone-dim [animation:heroRise_0.9s_ease_0.6s_both]">
            {t.tagline}
          </p>
          <div className="pointer-events-auto mt-9 flex flex-wrap gap-4 [animation:heroRise_0.9s_ease_0.75s_both]">
            <a
              href="#work"
              data-cursor="view"
              className="rounded-full bg-lime px-7 py-3.5 font-mono text-xs font-semibold tracking-widest text-ink uppercase transition-all hover:brightness-110"
            >
              {t.ctaWork}
            </a>
            <a
              href={`/${t.locale}/about`}
              className="rounded-full border border-bone/20 bg-ink/40 px-7 py-3.5 font-mono text-xs tracking-widest text-bone uppercase backdrop-blur-sm transition-colors hover:border-bone/50"
            >
              {t.ctaAbout}
            </a>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-7 left-6 font-mono text-xs tracking-widest text-bone-dim/50 uppercase md:left-10">
          {t.scrollHint} ↓
        </p>
      </section>
    </div>
  );
}
