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
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4">
        <p
          className="font-display col-span-12 leading-[1.08] font-semibold tracking-tight text-balance md:col-span-10 md:col-start-2"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {line.split(" ").map((w, i) => (
            <span key={i} data-word className="inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
        <p className="col-span-12 mt-8 max-w-xl text-lg text-bone-dim md:col-span-6 md:col-start-6">
          {sub}
        </p>
      </div>
    </section>
  );
}
