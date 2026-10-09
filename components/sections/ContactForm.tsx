"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import "./contact.css";

// The contact finale's form, centred on frosted glass over the returning matter.
// One frosted slab: it rises and grows into place as it scrolls into view, a light
// sweeps across it, then its parts follow in order (contact.css). Sends to
// /api/contact with the personal link and visitor from Tracker.tsx.

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

type Status = "idle" | "sending" | "sent" | "error" | "fast";
type T = SiteContent["contact"]["form"];
type Props = { locale: Locale; intents: string[]; t: T };

function useContactForm(locale: Locale, first: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [intent, setIntent] = useState(first);
  // The thank-you pane keeps the form's height so the page doesn't jump.
  const [height, setHeight] = useState<number>();
  const opened = useRef(0);
  const form = useRef<HTMLFormElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          intent,
          locale,
          ref: read("ab_ref"),
          visitor: read("ab_visitor"),
          elapsed: Date.now() - opened.current,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.ok) {
        setHeight(form.current?.offsetHeight);
        form.current?.reset();
        setStatus("sent");
      } else setStatus(out.error === "fast" ? "fast" : "error");
    } catch {
      setStatus("error");
    }
  }

  const onFocus = () => {
    if (!opened.current) opened.current = Date.now();
  };
  const again = () => {
    opened.current = Date.now();
    setStatus("idle");
  };
  return { status, intent, setIntent, height, form, submit, onFocus, again };
}

// Plays the entrance once, when a quarter of the form is on screen.
function useEntrance() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

function Honeypot() {
  // People never see this field; form-filling bots do.
  return <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />;
}

function Sent({ t, height, again, className }: { t: T; height?: number; again: () => void; className: string }) {
  return (
    <div role="status" style={{ minHeight: height }} className={`${className} cf-sent flex flex-col items-center justify-center text-center`}>
      <span aria-hidden className="cf-sent-dot mb-7 block h-3 w-3 rounded-full bg-lime" />
      <p className="font-display text-4xl font-semibold tracking-[-0.04em] md:text-5xl">{t.sentTitle}</p>
      <p className="mt-4 text-bone-dim">{t.sentBody}</p>
      <button type="button" onClick={again} className="link-draw mt-10 text-sm text-bone">
        {t.again} →
      </button>
    </div>
  );
}

function SendRow({ t, status, i, wide }: { t: T; status: Status; i: number; wide?: boolean }) {
  return (
    <div data-a style={order(i)} className="flex flex-col items-center gap-3">
      <button type="submit" disabled={status === "sending"} className={`cf-send group ${wide ? "w-full" : ""}`}>
        {status === "sending" ? `${t.sending}…` : t.send}
        <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">↗</span>
      </button>
      {(status === "error" || status === "fast") && (
        <p role="alert" className="text-sm text-bone-dim">
          {status === "fast" ? t.tooFast : t.error}
        </p>
      )}
    </div>
  );
}

// Topics as one row of chips that slides sideways: drag, swipe or the edge arrows.
// The row fades at whichever edge has more to show; a chosen chip slides into view.
function TopicSlider({ intents, intent, setIntent }: { intents: string[]; intent: string; setIntent: (i: string) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const drag = useRef({ x: 0, left: 0, moved: false, id: -1 });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const step = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.7, behavior: "smooth" });

  return (
    <div data-a style={order(1)} className="cf-slider relative" data-start={edges.start || undefined} data-end={edges.end || undefined}>
      <div
        ref={track}
        className="cf-track"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !track.current) return;
          drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false, id: e.pointerId };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d.id !== e.pointerId || !track.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4 && !d.moved) {
            d.moved = true;
            track.current.setPointerCapture(e.pointerId);
          }
          if (d.moved) track.current.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => (drag.current.id = -1)}
        onPointerCancel={() => (drag.current.id = -1)}
        onClickCapture={(e) => {
          // A drag is not a choice.
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
      >
        {intents.map((i) => (
          <label key={i} className="cf-slide cursor-pointer">
            <input
              type="radio"
              name="intent-choice"
              value={i}
              checked={intent === i}
              onChange={(e) => {
                setIntent(i);
                const chip = e.currentTarget.parentElement;
                const row = track.current;
                if (chip && row)
                  row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
              }}
              className="peer sr-only"
            />
            <span className="cf-chip">{i}</span>
          </label>
        ))}
      </div>
      <button type="button" aria-hidden tabIndex={-1} onClick={() => step(-1)} className="cf-arrow cf-arrow-start">←</button>
      <button type="button" aria-hidden tabIndex={-1} onClick={() => step(1)} className="cf-arrow cf-arrow-end">→</button>
    </div>
  );
}

export function ContactForm({ locale, intents, t }: Props) {
  const { status, intent, setIntent, height, form, submit, onFocus, again } = useContactForm(locale, intents[0]);
  const { ref, inView } = useEntrance();
  return (
    <div ref={ref} className="cf-stage" data-in={inView || undefined}>
      {status === "sent" ? (
        <Sent t={t} height={height} again={again} className="cf-glass cf-pane p-10" />
      ) : (
        <form ref={form} onSubmit={submit} onFocus={onFocus} className="cf-glass cf-pane cf-sheen relative flex flex-col gap-5 p-6 md:p-10">
          <p data-a style={order(0)} className="cf-label text-center">{t.intent}</p>
          <TopicSlider intents={intents} intent={intent} setIntent={setIntent} />
          <div className="mt-1 grid gap-3 sm:grid-cols-2">
            <label data-a style={order(3)} className="cf-well">
              <span className="cf-label">{t.name}</span>
              <input name="name" required maxLength={120} autoComplete="name" className="cf-input" />
            </label>
            <label data-a style={order(4)} className="cf-well">
              <span className="cf-label">{t.email}</span>
              <input name="email" type="email" required maxLength={200} autoComplete="email" className="cf-input" />
            </label>
          </div>
          <label data-a style={order(5)} className="cf-well">
            <span className="cf-label">{t.company}</span>
            <input name="company" maxLength={200} autoComplete="organization" className="cf-input" />
          </label>
          <label data-a style={order(6)} className="cf-well">
            <span className="cf-label">{t.message}</span>
            <textarea name="message" required rows={4} maxLength={5000} placeholder={t.messageHint} data-lenis-prevent className="cf-input resize-none" />
          </label>
          <Honeypot />
          <SendRow t={t} status={status} i={7} wide />
        </form>
      )}
    </div>
  );
}
