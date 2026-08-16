"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Editorial manifesto: lines unmask as the bird's traces pass — a scrubbed
// clip reveal, not a mechanical fade.
export function Manifesto({ line, sub }: { line: string; sub: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const words = root.current?.querySelectorAll("[data-word]");
      if (!words?.length) return;
      gsap.fromTo(
        words,
        { clipPath: "inset(0 100% 0 0)", opacity: 0.15 },
        {
          clipPath: "inset(0 0% 0 0)",
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 75%",
            end: "top 25%",
            scrub: true,
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative z-10 bg-ink px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-5xl text-center">
        <p
          className="font-display leading-[1.08] font-semibold tracking-tight text-balance"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {line.split(" ").map((w, i) => (
            <span key={i} data-word className="inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
        <p className="mx-auto mt-8 max-w-xl text-lg text-bone-dim">{sub}</p>
      </div>
    </section>
  );
}
