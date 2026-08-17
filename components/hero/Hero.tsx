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
        <div data-hero-identity className="hero-copy pointer-events-none relative max-w-3xl origin-left">
          <p className="mb-5 font-mono text-xs tracking-[0.3em] text-bone-dim uppercase [animation:heroRise_0.8s_ease_0.1s_both]">
            {t.intro}
          </p>
          <h1
            lang="en"
            className="font-display leading-[0.95] font-semibold tracking-tight uppercase"
            style={{ fontSize: "var(--text-display)" }}
          >
            Ataberk
            <br />
            Soylu
          </h1>
          <p lang="en" className="mt-6 font-mono text-sm tracking-widest text-lime uppercase [animation:heroRise_0.9s_ease_0.45s_both]">
            {t.title}
          </p>
          <div className="pointer-events-auto mt-6 hidden motion-reduce:block">
            <p className="max-w-xl text-lg text-bone-dim">{t.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#work"
                className="rounded-full bg-lime px-7 py-3.5 font-mono text-xs font-semibold tracking-widest text-ink uppercase"
              >
                {t.ctaWork}
              </a>
              <a
                href={`/${t.locale}/about`}
                className="rounded-full border border-bone/20 px-7 py-3.5 font-mono text-xs tracking-widest text-bone uppercase"
              >
                {t.ctaAbout}
              </a>
            </div>
          </div>
        </div>

        <div
          data-hero-direction
          className="hero-copy pointer-events-none absolute inset-x-6 bottom-[12vh] max-w-xl opacity-0 md:inset-x-auto md:right-10 md:bottom-[13vh] md:text-right motion-reduce:hidden"
        >
          <p className="font-mono text-[11px] tracking-[0.35em] text-lime uppercase">
            03 / {t.title}
          </p>
          <p className="font-display mt-5 text-4xl leading-[1.02] font-semibold tracking-tight text-balance md:text-6xl">
            {t.tagline}
          </p>
          <div
            data-hero-actions
            className="pointer-events-auto mt-8 flex flex-wrap gap-4 opacity-0 md:justify-end"
          >
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

        <div
          aria-hidden
          className="pointer-events-none absolute right-6 top-24 hidden flex-col items-end gap-2 font-mono text-[10px] tracking-[0.28em] text-bone-dim uppercase md:flex motion-reduce:hidden"
        >
          <span data-phase="one" className="text-lime">01 · {tr ? "Kimlik" : "Identity"}</span>
          <span data-phase="two" className="opacity-30">02 · {tr ? "Madde" : "Matter"}</span>
          <span data-phase="three" className="opacity-30">03 · {tr ? "Yön" : "Direction"}</span>
        </div>

        <p
          data-hero-hint
          className="pointer-events-none absolute bottom-7 left-6 font-mono text-xs tracking-widest text-bone-dim/50 uppercase md:left-10 motion-reduce:hidden"
        >
          {t.scrollHint} ↓
        </p>
        <p className="pointer-events-none absolute right-6 bottom-7 hidden font-mono text-[10px] tracking-[0.25em] text-bone-dim/45 uppercase md:block motion-reduce:hidden">
          {tr
            ? "Kaydırma kuşu biçimlendirir · İmleç yön verir"
            : "Scroll shapes the bird · Cursor gives direction"}
        </p>
      </section>
    </div>
  );
}
