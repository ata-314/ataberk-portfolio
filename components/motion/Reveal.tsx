"use client";

import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// One motion grammar for content: copy rises in as its section scrolls into
// view and slips away again when it leaves — in both directions — so text
// always feels carried by the scroll. Section titles decompose per word.
// Disabled under prefers-reduced-motion (elements simply stay visible).
export function Reveal() {
  const pathname = usePathname();

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Copy is scrubbed directly to scroll position: it rises in through the
      // lower band of the viewport, holds through the middle, and slips out
      // through the upper band — every pixel of scroll moves the text.
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap
          .timeline({
            scrollTrigger: { trigger: el, start: "top 98%", end: "bottom 2%", scrub: 0.5 },
          })
          .fromTo(
            el,
            { opacity: 0, y: 44 },
            { opacity: 1, y: 0, ease: "power2.out", duration: 3 },
          )
          .to(el, { opacity: 1, y: 0, duration: 5.5 })
          .to(el, { opacity: 0, y: -36, ease: "power2.in", duration: 2.5 });
      });

      // Section headings decompose word by word on the same scrubbed rail.
      document.querySelectorAll<HTMLElement>("[data-reveal-words]").forEach((heading) => {
        const words = heading.querySelectorAll("[data-word]");
        if (!words.length) return;
        gsap
          .timeline({
            scrollTrigger: { trigger: heading, start: "top 96%", end: "bottom 4%", scrub: 0.5 },
          })
          .fromTo(
            words,
            { opacity: 0, y: "0.55em" },
            { opacity: 1, y: 0, ease: "power2.out", duration: 2.4, stagger: 0.35 },
          )
          .to(words, { opacity: 1, duration: 5 })
          .to(words, { opacity: 0, y: "-0.4em", ease: "power2.in", duration: 2, stagger: 0.2 });
      });
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
