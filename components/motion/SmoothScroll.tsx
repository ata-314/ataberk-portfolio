"use client";

import { useEffect, useRef } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// One raf chain for the whole site: gsap.ticker drives Lenis, Lenis feeds
// ScrollTrigger. Never add a second requestAnimationFrame loop for motion.
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const update = (time: number) => {
      lenisRef.current?.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(update);
    // Keep GSAP's lag guard active. Disabling it makes one slow frame advance
    // Lenis by the full delayed delta, which reads as a jump in the bird morph.
    gsap.ticker.lagSmoothing(500, 33);

    const lenis = lenisRef.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(update);
      lenis?.off("scroll", ScrollTrigger.update);
    };
  }, []);

  return (
    <ReactLenis
      root
      options={{ autoRaf: false, anchors: true, lerp: 0.16, wheelMultiplier: 0.92 }}
      ref={lenisRef}
    >
      {children}
    </ReactLenis>
  );
}
