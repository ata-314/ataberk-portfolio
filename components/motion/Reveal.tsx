"use client";

import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// One motion grammar for content entrances: a single soft rise, batched,
// once per element. No per-section improvisation, disabled under
// prefers-reduced-motion (elements simply stay visible).
export function Reveal() {
  const pathname = usePathname();

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.set("[data-reveal]", { opacity: 0, y: 26 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (els) =>
          gsap.to(els, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
          }),
      });
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
