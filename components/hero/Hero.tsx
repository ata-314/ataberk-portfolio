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
        .to("[data-hero-top]", { autoAlpha: 0, y: -40, duration: 0.14 }, 0.08)
        .to("[data-hero-name]", { autoAlpha: 0, y: 60, duration: 0.18 }, 0.12);
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
          className="hero-copy pointer-events-none relative z-10 flex h-full flex-col justify-between px-5 pt-28 pb-[4svh] md:px-10 md:pt-36 md:pb-[3svh]"
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

          <div data-hero-name className="hero-enter" style={{ ["--d" as string]: "0.05s" }}>
            <CodeName words={["ATABERK"]} label={t.name} fill className="hero-name" />
          </div>
        </div>
      </section>
    </div>
  );
}
