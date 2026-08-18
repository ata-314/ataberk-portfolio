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

      gsap.set("[data-reveal]", { opacity: 0, y: 30 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        end: "bottom 10%",
        onEnter: (els) =>
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: true,
          }),
        onLeave: (els) =>
          gsap.to(els, { opacity: 0, y: -24, duration: 0.5, ease: "power2.in", overwrite: true }),
        onEnterBack: (els) =>
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
            overwrite: true,
          }),
        onLeaveBack: (els) =>
          gsap.to(els, { opacity: 0, y: 30, duration: 0.5, ease: "power2.in", overwrite: true }),
      });

      // Section headings arrive word by word and reverse out the same way.
      document.querySelectorAll<HTMLElement>("[data-reveal-words]").forEach((heading) => {
        const words = heading.querySelectorAll("[data-word]");
        if (!words.length) return;
        gsap.fromTo(
          words,
          { opacity: 0, y: "0.55em" },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            stagger: 0.05,
            scrollTrigger: {
              trigger: heading,
              start: "top 86%",
              end: "bottom 8%",
              toggleActions: "play reverse play reverse",
            },
          },
        );
      });
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
