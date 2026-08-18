"use client";

import { useEffect, useRef } from "react";
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
  const titleRef = useRef<HTMLSpanElement>(null);
  const tr = t.locale === "tr";

  // Matrix-style decode: the name resolves out of cycling code glyphs when
  // the opening flight lands, then rests with rare single-character flickers.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const FINAL = "Ataberk Soylu";
    const CODE = "01<>{}/*+=:;#|";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = FINAL;
      return;
    }
    const timers: number[] = [];
    let decodeInterval = 0;
    let started = false;
    const glyph = () => CODE[Math.floor(Math.random() * CODE.length)];
    const restFlicker = () => {
      timers.push(
        window.setTimeout(() => {
          const idx = Math.floor(Math.random() * FINAL.length);
          if (FINAL[idx] !== " ") {
            let frames = 0;
            const flick = window.setInterval(() => {
              const chars = FINAL.split("");
              chars[idx] = frames < 3 ? glyph() : FINAL[idx];
              el.textContent = chars.join("");
              if (++frames > 3) clearInterval(flick);
            }, 55);
            timers.push(flick);
          }
          restFlicker();
        }, 4200 + Math.random() * 3800),
      );
    };
    const start = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      decodeInterval = window.setInterval(() => {
        const elapsed = performance.now() - t0;
        let out = "";
        let done = true;
        for (let i = 0; i < FINAL.length; i++) {
          if (FINAL[i] === " ") {
            out += " ";
          } else if (elapsed >= 260 + i * 95) {
            out += FINAL[i];
          } else {
            out += glyph();
            done = false;
          }
        }
        el.textContent = out;
        if (done) {
          clearInterval(decodeInterval);
          restFlicker();
        }
      }, 46);
    };
    const html = document.documentElement;
    const ready = () =>
      html.dataset.stageIntro === "done" || html.dataset.stageStatic === "true";
    if (ready()) start();
    const observer = new MutationObserver(() => {
      if (ready()) start();
    });
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-stage-intro", "data-stage-static"],
    });
    timers.push(window.setTimeout(start, 9500));
    return () => {
      observer.disconnect();
      clearInterval(decodeInterval);
      timers.forEach((timer) => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      el.textContent = FINAL;
    };
  }, []);

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
        .to(
          "[data-hero-identity]",
          { autoAlpha: 0, y: -72, scale: 0.94, duration: 0.16 },
          0.2,
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
        .to("[data-hero-direction]", { autoAlpha: 0, y: -42, duration: 0.12 }, 0.84);
    },
    { scope: wrapper },
  );

  return (
    <div
      ref={wrapper}
      className="relative h-[210svh] md:h-[240svh] motion-reduce:h-auto"
    >
      <section
        aria-label={t.name}
        className="sticky top-0 z-30 flex h-svh flex-col justify-center overflow-hidden px-6 md:px-10 motion-reduce:relative motion-reduce:min-h-svh"
      >
        <StaticField />
        <div aria-hidden className="hero-scrim pointer-events-none absolute inset-0" />
        <div data-hero-identity className="hero-focus hero-copy pointer-events-none relative z-10 mx-auto w-full max-w-5xl origin-center text-center">
          <div className="mb-7 flex items-center justify-center gap-3 [animation:heroRise_0.8s_ease_0.1s_both]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_16px_rgba(200,255,62,0.75)]" />
            <p lang="en" className="font-mono text-[10px] tracking-[0.28em] text-bone-dim uppercase md:text-[11px]">
              {t.title}
            </p>
          </div>
          <h1
            lang="en"
            aria-label="Ataberk Soylu"
            className="hero-title overflow-hidden leading-none"
            style={{ fontSize: "clamp(1.9rem, 5.4vw, 5.4rem)" }}
          >
            <span aria-hidden className="hero-type-shell">
              <span className="hero-type-prompt">&gt;</span>
              <span ref={titleRef} className="hero-type-text">
                Ataberk Soylu
              </span>
              <span className="hero-type-cursor" />
            </span>
          </h1>
          <div className="pointer-events-auto mx-auto mt-7 max-w-2xl [animation:heroRise_0.9s_ease_0.5s_both]">
            <p className="text-base leading-relaxed text-bone/85 text-balance md:text-xl">{t.tagline}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#work"
                data-cursor="view"
                className="rounded-full bg-bone px-6 py-3.5 font-mono text-[11px] font-semibold tracking-widest text-ink uppercase shadow-[0_12px_36px_-18px_rgba(243,239,231,0.75)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                {t.ctaWork}
              </a>
              <a
                href={`/${t.locale}/about`}
                className="rounded-full border border-white/15 bg-white/[0.07] px-6 py-3.5 font-mono text-[11px] tracking-widest text-bone uppercase backdrop-blur-xl backdrop-saturate-150 transition-colors hover:border-white/30 hover:bg-white/[0.12]"
              >
                {t.ctaAbout}
              </a>
            </div>
            <p className="mx-auto mt-7 max-w-xl font-mono text-[9px] leading-relaxed tracking-[0.16em] text-bone-dim/55 uppercase md:text-[10px]">
              {t.intro}
            </p>
          </div>
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

        <p
          data-hero-hint
          className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-mono text-[10px] tracking-widest text-bone-dim/80 uppercase backdrop-blur-xl backdrop-saturate-150 motion-reduce:hidden"
        >
          {t.scrollHint} <span aria-hidden className="text-lime">↓</span>
        </p>
        <p data-hero-corner className="pointer-events-none absolute right-6 bottom-7 hidden font-mono text-[9px] tracking-[0.2em] text-bone-dim/40 uppercase lg:block motion-reduce:hidden">
          {tr
            ? "Kaydırma kuşu biçimlendirir · İmleç yön verir"
            : "Scroll shapes the bird · Cursor gives direction"}
        </p>
      </section>
    </div>
  );
}
