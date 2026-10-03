"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";
import { REEL_AT, REEL_STEP_SVH, reelItems, reelKinds } from "@/content/reel";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const copy = {
  tr: { gate: "Geçit açılıyor", caption: "Veri tüneli", depth: "Derinlik", reel: "Seçili işler" },
  en: { gate: "The gate opens", caption: "Data tunnel", depth: "Depth", reel: "Selected work" },
};

// The section's original runway (svh) and the reel's span inserted into it
// at REEL_AT; `at` maps a point of the original runway to the section's
// scroll progress.
const RUNWAY_SVH = 320;
const REEL_SVH = reelItems.length * REEL_STEP_SVH;
const at = (f: number) => (f * RUNWAY_SVH + (f > REEL_AT ? REEL_SVH : 0)) / (RUNWAY_SVH + REEL_SVH);

// Voyage: the scroll runway for the X condensing into beads, opening as a
// portal and the flight through it into the voxel tunnel, all of it drawn
// by the stage (which reads this section's progress through [data-voyage]).
// Inside the tunnel the flight runs on its own, so the depth readout counts
// with the flight's speed rather than the scroll; when the stage signals the
// end of the ride ("voyage-exit") the page is carried on through the tunnel's
// exit to the next section, unless the visitor takes the scroll back.
// Before that ride, the reel span ([data-reel]) holds the flight in the
// tunnel and scrolls it screen by screen past the showreel; the stage writes
// the screen in focus on the section (data-reel="index:focus") and its
// title is shown beneath.
export function Voyage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const root = useRef<HTMLElement>(null);
  const depth = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const section = root.current;
    if (!section || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const caption = section.querySelector("[data-voyage-caption]");
    const gate = section.querySelector("[data-voyage-gate]");
    let progress = 0;
    let metres = 0;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
        onUpdate: (self) => { progress = self.progress; },
      },
    })
      .fromTo(gate, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: at(0.27) - at(0.22) }, at(0.22))
      .to(gate, { opacity: 0, duration: at(0.44) - at(0.4) }, at(0.4))
      .fromTo(caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: at(0.64) - at(REEL_AT + 0.001) }, at(REEL_AT + 0.001))
      .to(caption, { opacity: 0, duration: at(0.91) - at(0.86) }, at(0.86))
      .set({}, {}, 1);
    const tick = (_time: number, deltaMs: number) => {
      if (progress < at(0.46) || progress > 0.99) {
        if (progress < at(0.46)) metres = 0;
        return;
      }
      // Counts with the stage's flight speed, which it writes on the section.
      metres += (deltaMs / 1000) * Number(section.dataset.speed || 0) * 4;
      if (depth.current) depth.current.textContent = String(Math.floor(metres) % 10000).padStart(4, "0");
    };
    gsap.ticker.add(tick);
    let carry: gsap.core.Tween | null = null;
    const cancel = () => {
      carry?.kill();
      carry = null;
    };
    const onExit = () => {
      const next = section.nextElementSibling as HTMLElement | null;
      if (!next || carry) return;
      const target = next.getBoundingClientRect().top + scrollY;
      if (target <= scrollY) return;
      const proxy = { y: scrollY };
      carry = gsap.to(proxy, {
        y: target,
        duration: 2.8,
        ease: "power2.inOut",
        onUpdate: () => window.scrollTo({ top: proxy.y, behavior: "instant" }),
        onComplete: () => { carry = null; },
      });
    };
    section.addEventListener("voyage-exit", onExit);
    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    inputs.forEach((type) => addEventListener(type, cancel, { passive: true }));
    return () => {
      gsap.ticker.remove(tick);
      tl.kill();
      cancel();
      section.removeEventListener("voyage-exit", onExit);
      inputs.forEach((type) => removeEventListener(type, cancel));
    };
  }, { scope: root });

  // Reel captions follow the screen in focus (also with reduced motion).
  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    const items = Array.from(section.querySelectorAll<HTMLElement>("[data-reel-item]"));
    let last = "";
    const tick = () => {
      const state = section.dataset.reel || "";
      if (state === last) return;
      last = state;
      const [index, focus] = state ? state.split(":").map(Number) : [-1, 0];
      items.forEach((item, i) => {
        const f = i === index ? focus : 0;
        item.style.opacity = String(f);
        item.style.translate = `0 ${(1 - f) * 10}px`;
        item.style.visibility = f > 0 ? "visible" : "hidden";
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, { scope: root });

  return (
    <section ref={root} data-voyage aria-label={t.caption} className="voyage relative z-20" style={{ height: `${RUNWAY_SVH + 100 + REEL_SVH}svh` }}>
      <div data-reel aria-hidden className="pointer-events-none absolute left-0 w-px" style={{ top: `${REEL_AT * RUNWAY_SVH}svh`, height: `${REEL_SVH}svh` }} />
      <div className="voyage-frame hero-copy">
        <ol aria-label={t.reel} className="reel-captions">
          {reelItems.map((item, i) => (
            <li key={item.slug} data-reel-item className="reel-caption">
              <span className="reel-count">{String(i + 1).padStart(2, "0")} / {String(reelItems.length).padStart(2, "0")} · {reelKinds[locale][item.kind]}</span>
              <span className="reel-title font-display">{item.title}</span>
            </li>
          ))}
        </ol>
        <p data-voyage-gate className="voyage-caption">{t.gate}</p>
        <p data-voyage-caption className="voyage-caption">
          {t.caption} · {t.depth} <span ref={depth}>0000</span> m
        </p>
      </div>
    </section>
  );
}
