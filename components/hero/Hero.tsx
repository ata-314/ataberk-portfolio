"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "../three/scroll-state";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// three.js loads only when the hero mounts — never in the initial bundle.
const HeroCanvas = dynamic(() => import("../three/HeroCanvas"), { ssr: false });

export type HeroStrings = {
  name: string;
  title: string;
  tagline: string;
  ctaWork: string;
  ctaAbout: string;
  scrollHint: string;
  otherLocale: string;
};

export function Hero({ t }: { t: HeroStrings }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  // Scroll choreography: the 260svh wrapper gives the terrain its transformation
  // runway; the stage stays pinned via CSS sticky (native scroll, no jacking).
  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: wrapper.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          scrollState.hero.current = self.progress;
        },
      });
    },
    { scope: wrapper },
  );

  return (
    <div ref={wrapper} className="relative h-[260svh]">
      <section className="sticky top-0 flex h-svh flex-col justify-start overflow-hidden px-6 pt-[16svh] md:px-16 md:pt-[19svh]">
        <HeroCanvas progressRef={progress} />

        <nav className="pointer-events-none absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-6 py-5 md:px-16">
          <span className="font-mono text-xs tracking-widest text-bone-dim uppercase">
            AS
          </span>
          <Link
            href={`/${t.otherLocale}`}
            className="pointer-events-auto font-mono text-xs tracking-widest text-bone-dim uppercase transition-colors hover:text-lime"
          >
            {t.otherLocale.toUpperCase()}
          </Link>
        </nav>

        {/* Text block: left / lower-left. HTML renders before WebGL — no gating. */}
        <div className="pointer-events-none relative z-10 max-w-3xl">
          <h1
            lang="en"
            className="font-display text-[13vw] leading-none font-semibold tracking-tight uppercase [animation:heroRise_0.9s_ease_0.15s_both] md:text-8xl"
          >
            Ataberk
            <br />
            Soylu
          </h1>
          <p
            lang="en"
            className="mt-5 font-mono text-sm tracking-widest text-lime uppercase [animation:heroRise_0.9s_ease_0.35s_both]"
          >
            {t.title}
          </p>
          <p className="mt-5 max-w-xl text-lg text-bone-dim [animation:heroRise_0.9s_ease_0.5s_both]">
            {t.tagline}
          </p>
          <div className="pointer-events-auto mt-9 flex flex-wrap gap-4 [animation:heroRise_0.9s_ease_0.65s_both]">
            <a
              href="#work"
              className="border border-lime px-6 py-3 font-mono text-xs tracking-widest text-lime uppercase transition-colors hover:bg-lime hover:text-ink"
            >
              {t.ctaWork}
            </a>
            <a
              href="#about"
              className="border border-graphite px-6 py-3 font-mono text-xs tracking-widest text-bone-dim uppercase transition-colors hover:border-bone hover:text-bone"
            >
              {t.ctaAbout}
            </a>
          </div>
        </div>

        <p className="pointer-events-none absolute bottom-7 left-6 z-10 font-mono text-xs tracking-widest text-bone-dim/50 uppercase md:left-16">
          {t.scrollHint} ↓
        </p>
      </section>
    </div>
  );
}
