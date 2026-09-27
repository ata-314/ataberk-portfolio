"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "../three/scroll-state";
import { StaticField } from "../gl/StaticField";
import { CodeName } from "./CodeName";
import { ScrollHint } from "./ScrollHint";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type HeroStrings = {
  name: string;
  title: string;
  tagline: string;
  ctaWork: string;
  ctaAbout: string;
  locale: string;
};

// The hero is a transparent stage over the global WebGL canvas. Editorial
// composition: a short statement up top, the name set edge to edge along the
// bottom of the viewport. Text is server-rendered HTML — visible before any
// WebGL loads. Entrance motion is pure CSS, held until the stage intro ends.
export function Hero({ t }: { t: HeroStrings }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [roleA, roleB] = t.title.split(" & ");
  const hint = t.locale === "tr" ? "Kaydır" : "Scroll";

  useGSAP(
    () => {
      const root = wrapper.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        scrollState.hero.current = 0.58;
        return;
      }

      // Pinned narrative: the identity gives way to the forming bird before
      // the scene hands off to the next section.
      gsap
        .timeline({
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
        })
        // The name is not tweened: CodeName breaks it into code glyphs as
        // the bird forms, reading the same scroll progress.
        .to("[data-hero-top]", { autoAlpha: 0, y: -40, duration: 0.14 }, 0.08)
        // Scroll cues: the intro cue leaves on the first scroll; a second
        // one holds while only the bird is on screen.
        .to("[data-hint-intro]", { autoAlpha: 0, y: 12, duration: 0.04 }, 0.02)
        .fromTo(
          "[data-hint-bird]",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" },
          0.38,
        )
        .to("[data-hint-bird]", { autoAlpha: 0, y: -10, duration: 0.06 }, 0.9)
        // Pin the timeline length to 1 so tween positions equal scroll progress.
        .set({}, {}, 1);
    },
    { scope: wrapper },
  );

  return (
    <div
      ref={wrapper}
      className="relative h-[220svh] md:h-[260svh] motion-reduce:h-auto"
    >
      <section
        aria-label={t.name}
        className="sticky top-0 z-30 h-svh overflow-hidden motion-reduce:relative motion-reduce:min-h-svh"
      >
        <StaticField />
        <div
          data-hero-identity
          className="hero-copy pointer-events-none relative z-10 flex h-full flex-col justify-between px-5 pt-28 pb-[6svh] md:px-10 md:pt-36 md:pb-[3svh]"
        >
          <div
            data-hero-top
            className="grid gap-8 md:grid-cols-12 md:items-start"
          >
            <p
              className="hero-enter hero-tagline max-w-[22ch] text-[1.65rem] leading-[1.12] text-bone text-balance md:col-span-6 md:text-[2.4rem] lg:col-span-5"
              style={{ ["--d" as string]: "0.1s" }}
            >
              {t.tagline}
            </p>
            <div
              className="hero-enter pointer-events-auto flex flex-col gap-6 md:col-span-4 md:col-start-9 md:items-end md:text-right"
              style={{ ["--d" as string]: "0.25s" }}
            >
              <p lang="en" className="text-sm leading-snug text-bone-dim md:text-[15px]">
                {roleA}
                {roleB ? (
                  <>
                    <br />
                    {roleB}
                  </>
                ) : null}
              </p>
              <div className="flex gap-6 text-sm md:text-[15px]">
                <a href="#work" data-cursor="view" className="link-draw text-bone">
                  {t.ctaWork}
                </a>
                <a href={`/${t.locale}/about`} className="link-draw text-bone-dim hover:text-bone">
                  {t.ctaAbout}
                </a>
              </div>
            </div>
          </div>

          {/* Mobile: the name sits higher and runs edge to edge (the negative
              margin cancels the gutter), with the scroll cue beneath it.
              Desktop: the cue rests above the name along the bottom edge. */}
          <div className="flex flex-col">
            <div data-hint-intro className="pointer-events-none order-2 mt-[8svh] flex justify-center md:order-1 md:mt-0 md:mb-[4svh]">
              <span className="scroll-hint-intro">
                <ScrollHint label={hint} />
              </span>
            </div>
            <div data-hero-name className="hero-enter order-1 -mx-5 md:order-2 md:mx-0" style={{ ["--d" as string]: "0.05s" }}>
              <CodeName words={["ATABERK"]} label={t.name} fill className="hero-name" />
            </div>
          </div>
        </div>

        <div
          data-hint-bird
          className="hero-copy pointer-events-none invisible absolute inset-x-0 bottom-[6svh] z-10 flex justify-center opacity-0 motion-reduce:hidden"
        >
          <ScrollHint label={hint} />
        </div>
      </section>
    </div>
  );
}
