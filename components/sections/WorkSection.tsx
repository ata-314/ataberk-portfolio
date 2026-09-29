"use client";

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
// scroll, Escape or the close button leave a card. The slots are empty
// colour worlds for now; projects are filled in later.
export function WorkSection({ locale }: { locale: Locale }) {
  const tr = locale === "tr";
  const count = workSlots.length;
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

  const t = work[locale];
  const copy = tr
    ? {
        kicker: "Seçili işler",
        hint: "Bir karta dokun, içine gir",
        soon: "Yakında",
        body: "Bu kart yeni bir proje için ayrıldı. Görseller, hikâye ve sistem burada açılacak.",
        close: "Kapat",
        scroll: "Kapatmak için kaydır",
        slot: "İş",
      }
    : {
        kicker: "Selected work",
        hint: "Touch a card to step inside",
        soon: "Coming soon",
        body: "This card is reserved for a new project. Visuals, story and system will open here.",
        close: "Close",
        scroll: "Scroll to close",
        slot: "Work",
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
          <ul className="mt-4 flex max-w-[16rem] flex-wrap gap-x-3 gap-y-1.5">
            {workSlots.map((slot, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="work-slot work-mono"
                  data-active={i === focus ? "true" : undefined}
                  style={{ "--slot": slot.colors[1] } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSlot(i);
                  }}
                  aria-label={`${copy.slot} ${pad(i + 1)}`}
                >
                  -&gt; {pad(i + 1)}
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
              <p className="work-mono text-bone">
                {copy.slot} {pad(open + 1)}
              </p>
              <p className="work-mono mt-1 text-bone-dim">
                {copy.soon} / {pad(open + 1)} — {pad(count)}
              </p>
              <p className="work-mono mt-4 leading-relaxed text-bone-dim">{copy.body}</p>
              <span
                className="work-swatch mt-4"
                style={{ background: `linear-gradient(90deg, ${workSlots[open].colors.join(", ")})` }}
              />
              <button type="button" className="work-mono work-close mt-5 text-bone" onClick={close} autoFocus>
                &lt;- {copy.close}
              </button>
            </aside>
          </>
        )}

        {/* Without WebGL (or with reduced motion) the slots are a plain
            colour grid. */}
        <ul className="work-static gap-3" aria-hidden>
          {workSlots.map((slot, i) => (
            <li
              key={i}
              style={{
                background: `radial-gradient(120% 90% at 30% 20%, ${slot.colors[2]}55, transparent 60%), linear-gradient(135deg, ${slot.colors[0]}, ${slot.colors[1]})`,
              }}
            >
              <span className="work-mono">{pad(i + 1)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
