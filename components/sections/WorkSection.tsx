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
function applyHover(el: HTMLElement | null, hit: number) {
  workState.hover = hit;
  if (!el) return;
  if (hit >= 0) el.dataset.cursor = "view";
  else delete el.dataset.cursor;
  el.style.cursor = hit >= 0 ? "pointer" : "";
}

export function WorkSection({ locale }: { locale: Locale }) {
  const tr = locale === "tr";
  const t = work[locale];
  const items = t.items.slice(0, workSlots.length);
  const count = items.length;
  const [open, setOpen] = useState(-1);
  const [focus, setFocus] = useState(0);
  const layer = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
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
      if (pointer.current && workState.open < 0 && workState.pick) {
        const hit = workState.pick(pointer.current.x, pointer.current.y);
        if (hit !== workState.hover) applyHover(layer.current, hit);
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

  // Hover is mouse-only (a swipe must not tilt cards) and is re-picked
  // every frame, so a scroll that turns the helix under a still pointer
  // never leaves a stale card raised.
  const setHover = (hit: number) => applyHover(layer.current, hit);
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") {
      pointer.current = null;
      return;
    }
    pointer.current = { x: e.clientX, y: e.clientY };
    if (open >= 0 || !workState.pick) return;
    setHover(workState.pick(e.clientX, e.clientY));
  };
  const onClick = (e: React.MouseEvent) => {
    if (open >= 0 || !workState.pick) return;
    const hit = workState.pick(e.clientX, e.clientY);
    if (hit >= 0) openSlot(hit);
  };

  const copy = tr
    ? {
        label: "Seçili işler",
        lead: "Gerçek sistemler, çalışan ürünler ve hareketli kimlikler. Fikirden yayına.",
        hint: "Bir karta dokun, içine gir.",
        close: "Kapat",
        scroll: "Kapatmak için kaydır",
      }
    : {
        label: "Selected work",
        lead: "Real systems, working products and moving identities. From idea to release.",
        hint: "Touch a card to step inside.",
        close: "Close",
        scroll: "Scroll to close",
      };

  // Typography follows the site's section system (see services.css): a
  // small accent label, a large Archivo heading with the soft white
  // gradient, a quiet lead; project names set like card titles.
  return (
    <section
      id="work"
      ref={section}
      data-work-helix
      data-open={open >= 0 ? "true" : undefined}
      className="work-helix relative z-20"
      // Card runway plus a tail in which the backdrop sinks away before the
      // next section arrives (see CARDS_END in the helix layer).
      style={{ height: `${100 + (count - 1) * 42 + 150}svh` }}
      aria-labelledby="work-heading"
    >
      <div
        ref={layer}
        className="work-pin sticky top-0 h-svh overflow-hidden"
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          pointer.current = null;
          setHover(-1);
        }}
        onClick={onClick}
      >
        <header className="work-head pointer-events-none absolute top-24 left-5 md:top-28 md:left-10">
          <p className="work-label">{copy.label}</p>
          <h2 id="work-heading" className="work-title">
            {t.heading}
          </h2>
          <p className="work-lead">{copy.lead}</p>
        </header>

        <nav className="work-dock absolute bottom-8 left-5 md:bottom-10 md:left-10" aria-label={t.heading}>
          <p className="work-count">
            {pad(focus + 1)} <span>/ {pad(count)}</span>
          </p>
          <ul className="mt-4 grid gap-y-1">
            {items.map((item, i) => (
              <li key={item.slug}>
                <button
                  type="button"
                  className="work-slot"
                  data-active={i === focus ? "true" : undefined}
                  style={{ "--slot": workSlots[i].colors[1] } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSlot(i);
                  }}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
          <p className="work-hint mt-4">{copy.hint}</p>
        </nav>

        <div
          className="work-rail pointer-events-none absolute top-1/2 right-5 hidden h-[38svh] -translate-y-1/2 md:right-10 md:block"
          aria-hidden
        >
          <span style={{ transform: `translateY(${(focus / Math.max(count - 1, 1)) * 38}svh)` }} />
        </div>

        {open >= 0 && (
          <>
            <p className="work-hint work-scroll pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 md:top-28">
              {copy.scroll}
            </p>
            <aside
              className="work-panel absolute bottom-8 left-5 max-w-[24rem] outline-none md:bottom-10 md:left-10"
              onClick={(e) => e.stopPropagation()}
              aria-live="polite"
              tabIndex={-1}
              autoFocus
            >
              <p className="work-label">
                {items[open].category} · {items[open].year}
              </p>
              <h3 className="work-panel-title">{items[open].title}</h3>
              <p className="work-lead mt-3">{items[open].idea}</p>
              <span
                className="work-swatch mt-5"
                style={{ background: `linear-gradient(90deg, ${workSlots[open].colors.join(", ")})` }}
              />
              {items[open].live && (
                <a href={items[open].live.url} target="_blank" rel="noopener noreferrer" className="work-live mt-6">
                  {items[open].live.label} <span aria-hidden="true">↗</span>
                  <em>{items[open].live.host}</em>
                </a>
              )}
              <div className="mt-6 flex items-baseline gap-6">
                <Link href={`/${locale}/work/${items[open].slug}`} className="link-draw text-base text-bone">
                  {t.open} →
                </Link>
                <button type="button" className="work-close" onClick={close}>
                  ← {copy.close}
                </button>
              </div>
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
              <Link href={`/${locale}/work/${item.slug}`} className="work-panel-title">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
