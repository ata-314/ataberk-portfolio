"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "../three/scroll-state";
import { StaticField } from "../gl/StaticField";

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
  const tr = t.locale === "tr";

  useGSAP(
    () => {
      const root = wrapper.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        scrollState.hero.current = 0.58;
        return;
      }

      // One MODD-like pinned narrative: identity gives way to the forming
      // bird, then the role/CTA arrives before the scene hands off to Work.
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.45,
          onUpdate: (self) => {
            scrollState.hero.current = self.progress;
          },
        },
      });

      timeline
        .to("[data-hero-hint]", { autoAlpha: 0, duration: 0.06 }, 0.06)
        .to(
          "[data-phase='one']",
          { color: "#b9b5ac", opacity: 0.28, duration: 0.05 },
          0.14,
        )
        .to(
          "[data-hero-identity]",
          { autoAlpha: 0, y: -72, scale: 0.94, duration: 0.16 },
          0.2,
        )
        .fromTo(
          "[data-phase='two']",
          { color: "#b9b5ac", opacity: 0.28 },
          { color: "#c8ff3e", opacity: 1, duration: 0.05 },
          0.26,
        )
        .to(
          "[data-phase='two']",
          { color: "#b9b5ac", opacity: 0.28, duration: 0.05 },
          0.48,
        )
        .fromTo(
          "[data-hero-direction]",
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" },
          0.5,
        )
        .fromTo(
          "[data-hero-actions]",
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" },
          0.58,
        )
        .fromTo(
          "[data-phase='three']",
          { color: "#b9b5ac", opacity: 0.28 },
          { color: "#c8ff3e", opacity: 1, duration: 0.05 },
          0.52,
        )
        .to("[data-hero-direction]", { autoAlpha: 0, y: -42, duration: 0.12 }, 0.84)
        .to("[data-phase='three']", { opacity: 0.28, duration: 0.05 }, 0.88);
    },
    { scope: wrapper },
  );

  return (
    <div
      ref={wrapper}
      className="relative h-[300svh] md:h-[460svh] motion-reduce:h-auto"
    >
      <section
        aria-label={t.name}
        className="sticky top-0 z-30 flex h-svh flex-col justify-center overflow-hidden px-6 md:px-10 motion-reduce:relative motion-reduce:min-h-svh"
      >
        <StaticField />
        <div aria-hidden className="hero-scrim pointer-events-none absolute inset-0" />

        <div data-hero-identity className="hero-copy pointer-events-none relative z-10 mx-auto w-full max-w-5xl origin-center text-center">
          <p className="nav-glass mb-6 inline-flex rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.28em] text-bone-dim uppercase [animation:heroRise_0.8s_ease_0.1s_both] md:text-[11px]">
            {t.intro}
          </p>
          <h1
            lang="en"
            className="font-display leading-[0.9] font-semibold tracking-[-0.055em] text-balance"
            style={{ fontSize: "var(--text-display)" }}
          >
            Ataberk
            <span className="block md:inline"> Soylu</span>
          </h1>
          <p lang="en" className="mt-6 font-mono text-[11px] tracking-[0.24em] text-lime uppercase [animation:heroRise_0.9s_ease_0.45s_both] md:text-xs">
            {t.title}
          </p>
          <div className="pointer-events-auto mx-auto mt-5 max-w-2xl [animation:heroRise_0.9s_ease_0.58s_both]">
            <p className="text-base leading-relaxed text-bone-dim text-balance md:text-lg">{t.tagline}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href="#work"
                data-cursor="view"
                className="rounded-full bg-bone px-6 py-3.5 font-mono text-[11px] font-semibold tracking-widest text-ink uppercase transition-all hover:scale-[1.02] hover:bg-white"
              >
                {t.ctaWork}
              </a>
              <a
                href={`/${t.locale}/about`}
                className="nav-glass rounded-full px-6 py-3.5 font-mono text-[11px] tracking-widest text-bone uppercase transition-colors hover:text-white"
              >
                {t.ctaAbout}
              </a>
            </div>
          </div>
        </div>

        <div
          data-hero-direction
          className="glass-strong hero-copy pointer-events-none absolute inset-x-4 bottom-[10vh] z-10 mx-auto max-w-3xl p-7 text-center opacity-0 md:bottom-[12vh] md:p-11 motion-reduce:hidden"
        >
          <p className="font-mono text-[11px] tracking-[0.35em] text-lime uppercase">
            03 / {t.title}
          </p>
          <p className="font-display mx-auto mt-5 max-w-2xl text-3xl leading-[1.03] font-semibold tracking-tight text-balance md:text-5xl">
            {t.tagline}
          </p>
          <div
            data-hero-actions
            className="pointer-events-auto mt-8 flex flex-wrap justify-center gap-3 opacity-0"
          >
            <a
              href="#work"
              data-cursor="view"
              className="rounded-full bg-bone px-6 py-3.5 font-mono text-[11px] font-semibold tracking-widest text-ink uppercase transition-all hover:scale-[1.02] hover:bg-white"
            >
              {t.ctaWork}
            </a>
            <a
              href={`/${t.locale}/about`}
              className="rounded-full border border-white/12 bg-white/[0.06] px-6 py-3.5 font-mono text-[11px] tracking-widest text-bone uppercase transition-colors hover:border-white/25 hover:bg-white/[0.1]"
            >
              {t.ctaAbout}
            </a>
          </div>
        </div>

        <div
          data-hero-phases
          aria-hidden
          className="nav-glass pointer-events-none absolute right-6 top-24 hidden flex-col items-end gap-2 rounded-2xl px-4 py-3 font-mono text-[9px] tracking-[0.24em] text-bone-dim uppercase md:flex motion-reduce:hidden"
        >
          <span data-phase="one" className="text-lime">01 · {tr ? "Kimlik" : "Identity"}</span>
          <span data-phase="two" className="opacity-30">02 · {tr ? "Madde" : "Matter"}</span>
          <span data-phase="three" className="opacity-30">03 · {tr ? "Yön" : "Direction"}</span>
        </div>

        <p
          data-hero-hint
          className="nav-glass pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 font-mono text-[10px] tracking-widest text-bone-dim/70 uppercase motion-reduce:hidden"
        >
          {t.scrollHint} ↓
        </p>
        <p className="pointer-events-none absolute right-6 bottom-7 hidden font-mono text-[9px] tracking-[0.2em] text-bone-dim/40 uppercase lg:block motion-reduce:hidden">
          {tr
            ? "Kaydırma kuşu biçimlendirir · İmleç yön verir"
            : "Scroll shapes the bird · Cursor gives direction"}
        </p>
      </section>
    </div>
  );
}
