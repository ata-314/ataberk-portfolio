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
          scrub: 0.14,
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
      className="relative h-[265svh] md:h-[350svh] motion-reduce:h-auto"
    >
      <section
        aria-label={t.name}
        className="sticky top-0 z-30 flex h-svh flex-col justify-center overflow-hidden px-6 md:px-10 motion-reduce:relative motion-reduce:min-h-svh"
      >
        <StaticField />
        <div aria-hidden className="hero-scrim pointer-events-none absolute inset-0" />
        <div aria-hidden className="brutal-marquee top-[16svh] opacity-70">
          <span className="brutal-marquee-track">
            CODE / MOTION / AI / SYSTEMS / CODE / MOTION / AI / SYSTEMS /
          </span>
        </div>

        <div data-hero-identity className="hero-focus hero-copy pointer-events-none relative z-10 mx-auto w-full max-w-7xl origin-left text-left">
          <div className="mb-5 flex items-center gap-3 [animation:heroRise_0.8s_ease_0.1s_both]">
            <span aria-hidden className="h-2 w-2 bg-lime shadow-[0_0_16px_rgba(200,255,62,0.75)]" />
            <p lang="en" className="font-mono text-[10px] tracking-[0.28em] text-bone-dim uppercase md:text-[11px]">
              01 — {t.title}
            </p>
          </div>
          <h1
            lang="en"
            aria-label="Ataberk Soylu"
            className="overflow-hidden font-mono leading-[0.88] font-semibold tracking-[-0.085em]"
            style={{ fontSize: "clamp(2.65rem, 9vw, 9rem)" }}
          >
            <span aria-hidden className="hero-type-shell">
              <span className="hero-type-prompt">&gt;</span>
              <span className="hero-type-text">Ataberk Soylu</span>
              <span className="hero-type-cursor" />
            </span>
          </h1>
          <div className="pointer-events-auto mt-8 max-w-3xl [animation:heroRise_0.9s_ease_0.5s_both]">
            <p className="font-display text-xl leading-[1.06] font-semibold tracking-[-0.035em] text-bone/90 text-balance md:text-3xl">{t.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-0">
              <a
                href="#work"
                data-cursor="view"
                className="border border-bone bg-bone px-6 py-3.5 font-mono text-[11px] font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-lime"
              >
                {t.ctaWork}
              </a>
              <a
                href={`/${t.locale}/about`}
                className="-ml-px border border-white/20 bg-black/30 px-6 py-3.5 font-mono text-[11px] tracking-widest text-bone uppercase transition-colors hover:border-lime hover:text-lime"
              >
                {t.ctaAbout}
              </a>
            </div>
            <p className="mt-7 max-w-2xl border-l border-lime/60 pl-4 font-mono text-[9px] leading-relaxed tracking-[0.16em] text-bone-dim/60 uppercase md:text-[10px]">
              {t.intro}
            </p>
          </div>
        </div>

        <div
          data-hero-direction
          className="hero-panel hero-copy pointer-events-none absolute inset-x-6 bottom-[9svh] z-10 pl-5 text-left opacity-0 md:right-auto md:bottom-[12svh] md:left-10 md:w-[min(54rem,58vw)] md:pl-7 xl:left-[max(3rem,calc((100vw-80rem)/2))] motion-reduce:hidden"
        >
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-2 w-2 bg-lime" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-lime uppercase">
              03 / {tr ? "Yön" : "Direction"}
            </p>
          </div>
          <p className="font-display mt-5 max-w-4xl text-4xl leading-[0.94] font-semibold tracking-[-0.055em] text-balance md:text-6xl lg:text-7xl">
            {t.tagline}
          </p>
          <div
            data-hero-actions
            className="pointer-events-auto mt-7 flex flex-wrap gap-3 opacity-0"
          >
            <a
              href="#work"
              data-cursor="view"
              className="border border-bone bg-bone px-6 py-3.5 font-mono text-[11px] font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-lime"
            >
              {t.ctaWork}
            </a>
            <a
              href={`/${t.locale}/about`}
              className="-ml-px border border-white/20 bg-black/30 px-6 py-3.5 font-mono text-[11px] tracking-widest text-bone uppercase transition-colors hover:border-lime hover:text-lime"
            >
              {t.ctaAbout}
            </a>
          </div>
        </div>

        <div
          data-hero-phases
          aria-hidden
          className="pointer-events-none absolute right-8 top-24 hidden flex-col items-end gap-2 border-r border-white/20 pr-4 font-mono text-[9px] tracking-[0.24em] text-bone-dim uppercase lg:flex motion-reduce:hidden"
        >
          <span data-phase="one" className="text-lime">01 · {tr ? "Kimlik" : "Identity"}</span>
          <span data-phase="two" className="opacity-30">02 · {tr ? "Madde" : "Matter"}</span>
          <span data-phase="three" className="opacity-30">03 · {tr ? "Yön" : "Direction"}</span>
        </div>

        <p
          data-hero-hint
          className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 border border-white/15 bg-black/55 px-4 py-2 font-mono text-[10px] tracking-widest text-bone-dim/70 uppercase motion-reduce:hidden"
        >
          {t.scrollHint} <span aria-hidden className="text-lime">↓</span>
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
