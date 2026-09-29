"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";
import { workSlots } from "@/content/work-slots";
import { workState } from "@/components/three/scroll-state";
import "./work.css";

const pad = (n: number) => String(n).padStart(2, "0");

// Selected work: a pinned runway where the stage turns a helix of glass
// cards round the diving bird (see gl/work-helix-layer). The DOM here is the
// HUD — heading, counter, slot index — plus the open card's panel and the
// input that drives it: clicks are hit-tested against the stage's cards;
// scroll, Escape or the close button leave a card. Each card is a project
// from content/work, painted in its slot's colour world.
export function WorkSection({ locale }: { locale: Locale }) {
  const tr = locale === "tr";
  const t = work[locale];
  const items = t.items.slice(0, workSlots.length);
  const count = items.length;
  const [open, setOpen] = useState(-1);
  const [focus, setFocus] = useState(0);
  const layer = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);

  const openSlot = useCallback((i: number) => {
    workState.open = i;
    setOpen(i);
  }, []);
  const close = useCallback(() => {
    workState.open = -1;
    setOpen(-1);
  }, []);

  // The stage writes the names on the cards as holograms.
  useEffect(() => {
    workState.titles = items.map((item) => item.title);
  }, [items]);

  // Mirror the stage's focused card into the counter.
  useEffect(() => {
    let frame = 0;
    let last = -1;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      // The big heading steps aside as soon as the helix starts to turn.
      const travelling = workState.progress > 0.015;
      if (section.current && (section.current.dataset.travel === "true") !== travelling) {
        if (travelling) section.current.dataset.travel = "true";
        else delete section.current.dataset.travel;
      }
      if (workState.focus !== last) {
        last = workState.focus;
        setFocus(last);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      workState.open = -1;
      workState.hover = -1;
    };
  }, []);

  // Inside a card the page holds still: a deliberate scroll, Escape or a
  // swipe closes it instead ("scroll to close").
  useEffect(() => {
    if (open < 0) return;
    let travel = 0;
    let touchY = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      travel += Math.abs(e.deltaY);
      if (travel > 70) close();
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (Math.abs(e.touches[0].clientY - touchY) > 40) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", "ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(e.key)) {
        e.preventDefault();
        close();
      }
    };
    addEventListener("wheel", onWheel, { passive: false });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: false });
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("wheel", onWheel);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const onPointerMove = (e: React.PointerEvent) => {
    if (open >= 0 || !workState.pick) return;
    const hit = workState.pick(e.clientX, e.clientY);
    workState.hover = hit;
    if (layer.current) {
      if (hit >= 0) layer.current.dataset.cursor = "view";
      else delete layer.current.dataset.cursor;
      layer.current.style.cursor = hit >= 0 ? "pointer" : "";
    }
  };
  const onClick = (e: React.MouseEvent) => {
    if (open >= 0 || !workState.pick) return;
    const hit = workState.pick(e.clientX, e.clientY);
    if (hit >= 0) openSlot(hit);
  };

  const copy = tr
    ? {
        kicker: "Seçili işler",
        hint: "Bir karta dokun, içine gir",
        close: "Kapat",
        scroll: "Kapatmak için kaydır",
      }
    : {
        kicker: "Selected work",
        hint: "Touch a card to step inside",
        close: "Close",
        scroll: "Scroll to close",
      };

  return (
    <section
      id="work"
      ref={section}
      data-work-helix
      data-open={open >= 0 ? "true" : undefined}
      className="work-helix relative z-20"
      style={{ height: `${100 + (count - 1) * 42}svh` }}
      aria-label={t.heading}
    >
      <div
        ref={layer}
        className="work-pin sticky top-0 h-svh overflow-hidden"
        onPointerMove={onPointerMove}
        onPointerLeave={() => (workState.hover = -1)}
        onClick={onClick}
      >
        <header className="work-head pointer-events-none absolute top-24 left-5 md:top-28 md:left-10">
          <p className="work-mono text-lime">[ 04 ] — {copy.kicker}</p>
          <h2
            className="font-display mt-3 leading-[0.9] font-semibold tracking-[-0.05em]"
            style={{ fontSize: "clamp(2.4rem, 5.4vw, 5.2rem)" }}
          >
            {t.heading}
          </h2>
        </header>

        <nav className="work-dock absolute bottom-8 left-5 md:bottom-10 md:left-10" aria-label={t.heading}>
          <p className="work-mono text-bone">
            {pad(focus + 1)} <span className="text-bone-dim">/ {pad(count)}</span>
          </p>
          <p className="work-mono mt-2 text-bone-dim">{copy.hint}</p>
          <ul className="mt-4 grid gap-y-1.5">
            {items.map((item, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="work-slot work-mono"
                  data-active={i === focus ? "true" : undefined}
                  style={{ "--slot": workSlots[i].colors[1] } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSlot(i);
                  }}
                >
                  -&gt; {item.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div
          className="work-rail pointer-events-none absolute top-1/2 right-5 hidden h-[38svh] -translate-y-1/2 md:right-10 md:block"
          aria-hidden
        >
          <span style={{ transform: `translateY(${(focus / Math.max(count - 1, 1)) * 38}svh)` }} />
        </div>

        {open >= 0 && (
          <>
            <p className="work-mono work-scroll pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 text-bone-dim md:top-28">
              {copy.scroll}
            </p>
            <aside
              className="work-panel absolute bottom-8 left-5 max-w-[22rem] md:bottom-10 md:left-10"
              onClick={(e) => e.stopPropagation()}
              aria-live="polite"
            >
              <p className="work-mono text-bone">{items[open].title}</p>
              <p className="work-mono mt-1 text-bone-dim">
                {items[open].year} / {items[open].category}
              </p>
              <p className="work-mono mt-4 leading-relaxed text-bone-dim">{items[open].idea}</p>
              <span
                className="work-swatch mt-4"
                style={{ background: `linear-gradient(90deg, ${workSlots[open].colors.join(", ")})` }}
              />
              <Link href={`/${locale}/work/${items[open].slug}`} className="work-mono work-close mt-5 block text-lime">
                {t.open} -&gt;
              </Link>
              <button type="button" className="work-mono work-close mt-2 text-bone" onClick={close} autoFocus>
                &lt;- {copy.close}
              </button>
            </aside>
          </>
        )}

        {/* Without WebGL (or with reduced motion) the slots are a plain
            colour grid. */}
        <ul className="work-static gap-3">
          {items.map((item, i) => (
            <li
              key={item.slug}
              style={{
                background: `radial-gradient(120% 90% at 30% 20%, ${workSlots[i].colors[2]}55, transparent 60%), linear-gradient(135deg, ${workSlots[i].colors[0]}, ${workSlots[i].colors[1]})`,
              }}
            >
              <Link href={`/${locale}/work/${item.slug}`} className="work-mono">
                {pad(i + 1)} — {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
