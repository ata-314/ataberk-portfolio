"use client";

import { useEffect, useRef } from "react";

// A lime hairline under the nav that fills as the article is read.
export function ReadingProgress({ target }: { target: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(target);
    if (!el || !bar.current) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const done = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      bar.current!.style.transform = `scaleX(${done})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
    };
  }, [target]);
  return <div ref={bar} aria-hidden className="guide-progress" />;
}
