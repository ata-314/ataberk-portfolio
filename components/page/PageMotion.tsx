"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Inner pages' motion: blocks marked data-rise come up once as they enter the
// view (they stay visible without JS or under reduced motion, because the hidden
// start state only applies once this has run), and glass cards light up where
// the pointer is.
export function PageMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    html.dataset.rise = "ready";
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.in = "";
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-rise]").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      delete html.dataset.rise;
    };
  }, [pathname]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.<HTMLElement>(".sub-card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
