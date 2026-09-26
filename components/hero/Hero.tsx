"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "../three/scroll-state";
import { StaticField } from "../gl/StaticField";
import { CodeName } from "./CodeName";

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

// The hero is a transparent stage over the global WebGL canvas. Text is
// server-rendered HTML — visible before any WebGL loads. Entrance motion is
// pure CSS, held on its first frame until the stage reports the intro done.
export function Hero({ t }: { t: HeroStrings }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const tr = t.locale === "tr";
  const [roleA, roleB] = t.title.split(" & ");
  const disciplines = tr
    ? ["Yapay Zekâ", "Motion", "3D", "Web"]
    : ["AI", "Motion", "3D", "Web"];

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
          scrub: true,
          onUpdate: (self) => {
            scrollState.hero.current = self.progress;
          },
        },
      });

      timeline
        .to("[data-hero-hint]", { autoAlpha: 0, duration: 0.06 }, 0.06)
        .to("[data-hero-rail]", { autoAlpha: 0, y: 24, duration: 0.1 }, 0.1)
        .to(
          "[data-hero-identity]",
          { autoAlpha: 0, y: -64, duration: 0.16 },
          0.12,
        )
        .fromTo(
          "[data-hero-direction]",
          { autoAlpha: 0, y: 34 },
          { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" },
          0.72,
        )
        .fromTo(
          "[data-hero-actions]",
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" },
          0.78,
        )
        .to("[data-hero-direction]", { autoAlpha: 0, y: -42, duration: 0.08 }, 0.92);
    },
    { scope: wrapper },
  );

  return (
    <div
      ref={wrapper}
      className="relative h-[240svh] md:h-[280svh] motion-reduce:h-auto"
    >
      <section
        aria-label={t.name}
        className="sticky top-0 z-30 flex h-svh flex-col justify-center overflow-hidden px-6 md:px-10 motion-reduce:relative motion-reduce:min-h-svh"
      >
        <StaticField />
        <div aria-hidden className="hero-scrim pointer-events-none absolute inset-0" />
        <div
          data-hero-identity
          className="hero-copy pointer-events-none relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center pt-24 pb-20 text-center"
        >
          <div className="hero-enter mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-bone-dim uppercase md:mb-8 md:text-[11px] md:tracking-[0.28em]" style={{ ["--d" as string]: "0.05s" }}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime" />
            <p lang="en">
              {roleA}
              {roleB ? (
                <>
                  <span aria-hidden className="mx-2 text-lime md:mx-3">/</span>
                  {roleB}
                </>
              ) : null}
            </p>
          </div>

          <div className="hero-frame">
            <i aria-hidden />
            <i aria-hidden />
            <i aria-hidden />
            <i aria-hidden />
            <span aria-hidden className="hero-meta hero-enter top-2 left-6 hidden md:block" style={{ ["--d" as string]: "0.5s" }}>
              N°001
            </span>
            <span aria-hidden className="hero-meta hero-enter top-2 right-6 hidden md:block" style={{ ["--d" as string]: "0.55s" }}>
              Portfolio — {new Date().getFullYear()}
            </span>
            <span aria-hidden className="hero-meta hero-enter bottom-2 left-6 hidden md:flex md:items-center md:gap-2" style={{ ["--d" as string]: "0.6s" }}>
              <span className="h-1 w-1 animate-pulse rounded-full bg-lime" />
              {tr ? "Etkileşimli · İmleci gezdir" : "Interactive · Move the cursor"}
            </span>
            <span aria-hidden className="hero-meta hero-enter right-6 bottom-2 hidden md:block" style={{ ["--d" as string]: "0.65s" }}>
              {t.locale.toUpperCase()} / {tr ? "EN" : "TR"}
            </span>
            <CodeName words={["ATABERK", "SOYLU"]} label={t.name} className="hero-name" />
          </div>

          <div className="pointer-events-auto mt-8 flex max-w-2xl flex-col items-center md:mt-10">
            <p className="hero-enter hero-tagline text-xl leading-[1.25] text-bone text-balance md:text-[1.7rem]" style={{ ["--d" as string]: "0.9s" }}>
              {t.tagline}
            </p>
            <p className="hero-enter mt-4 max-w-md font-mono text-[11px] leading-relaxed tracking-[0.04em] text-bone-dim text-balance" style={{ ["--d" as string]: "1s" }}>
              {t.intro}
            </p>
            <div className="hero-enter mt-8 flex flex-wrap justify-center gap-3" style={{ ["--d" as string]: "1.1s" }}>
              <a
                href="#work"
                data-cursor="view"
                className="group inline-flex items-center gap-2.5 rounded-full bg-bone px-6 py-3.5 font-[family-name:var(--font-space)] text-sm font-medium text-ink transition-colors hover:bg-white"
              >
                {t.ctaWork}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </a>
              <a
                href={`/${t.locale}/about`}
                className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 font-[family-name:var(--font-space)] text-sm text-bone transition-colors hover:border-white/35 hover:bg-white/[0.06]"
              >
                {t.ctaAbout}
              </a>
            </div>
          </div>
        </div>

        <div
          data-hero-rail
          className="hero-rail pointer-events-none absolute inset-x-6 bottom-6 z-10 mx-auto flex max-w-7xl items-center justify-between gap-6 border-t border-white/10 pt-4 font-mono text-[10px] tracking-[0.2em] text-bone-dim/70 uppercase md:inset-x-10 motion-reduce:hidden"
        >
          <ul lang="en" className="flex flex-wrap gap-x-4 gap-y-1 md:gap-x-5">
            {disciplines.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="hidden text-bone-dim/45 lg:block">
            {tr
              ? "Kaydırma kuşu biçimlendirir · İmleç yön verir"
              : "Scroll shapes the bird · Cursor gives direction"}
          </p>
          <p data-hero-hint className="flex items-center gap-3">
            {t.scrollHint}
            <span aria-hidden className="hero-scroll-line" />
          </p>
        </div>

        <div
          data-hero-direction
          className="hero-panel hero-copy pointer-events-none absolute inset-x-5 bottom-[8svh] z-10 p-6 text-left opacity-0 md:right-auto md:bottom-[12svh] md:left-10 md:w-[29rem] md:p-8 xl:left-[max(3rem,calc((100vw-80rem)/2))] motion-reduce:hidden"
        >
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime" />
            <p className="font-mono text-[10px] tracking-[0.3em] text-lime uppercase">
              03 / {tr ? "Yön" : "Direction"}
            </p>
          </div>
          <p className="font-display mt-5 max-w-md text-2xl leading-[1.08] font-semibold tracking-[-0.035em] text-balance md:text-3xl">
            {t.tagline}
          </p>
          <div
            data-hero-actions
            className="pointer-events-auto mt-7 flex flex-wrap gap-3 opacity-0"
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

      </section>
    </div>
  );
}
