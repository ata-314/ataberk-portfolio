"use client";

import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";

// The contact finale's form: a glass pane over the returning matter. Fields are
// hairlines that light lime on focus; topics are the section's intent chips.
// Sends to /api/contact with the personal link and visitor from Tracker.tsx.

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const label = "font-mono text-[11px] tracking-[0.18em] text-bone-dim uppercase";
const input =
  "mt-2 w-full border-0 border-b border-white/15 bg-transparent py-2.5 text-lg text-bone outline-none transition-colors duration-300 placeholder:text-bone-dim/40 focus:border-lime";

type Status = "idle" | "sending" | "sent" | "error" | "fast";

export function ContactForm({ locale, intents, t }: { locale: Locale; intents: string[]; t: SiteContent["contact"]["form"] }) {
  const [status, setStatus] = useState<Status>("idle");
  const [intent, setIntent] = useState(intents[0]);
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

  if (status === "sent") {
    return (
      <div
        role="status"
        style={{ minHeight: height }}
        className="glass-strong flex flex-col justify-end p-7 [text-shadow:none] md:p-10"
      >
        <span aria-hidden className="mb-6 block h-2 w-2 rounded-full bg-lime shadow-[0_0_18px_var(--lime)]" />
        <p className="font-display text-4xl font-semibold tracking-[-0.04em] md:text-5xl">{t.sentTitle}</p>
        <p className="mt-4 text-bone-dim">{t.sentBody}</p>
        <button
          type="button"
          onClick={() => {
            opened.current = Date.now();
            setStatus("idle");
          }}
          className="link-draw mt-10 w-fit text-sm text-bone"
        >
          {t.again} →
        </button>
      </div>
    );
  }

  return (
    <form
      ref={form}
      onSubmit={submit}
      onFocus={() => {
        if (!opened.current) opened.current = Date.now();
      }}
      className="glass-strong relative flex flex-col gap-8 p-7 [text-shadow:none] md:p-10"
    >
      <fieldset>
        <legend className={label}>[ 01 ] {t.intent}</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {intents.map((i) => (
            <label key={i} className="cursor-pointer">
              <input
                type="radio"
                name="intent-choice"
                value={i}
                checked={intent === i}
                onChange={() => setIntent(i)}
                className="peer sr-only"
              />
              <span className="glass-chip inline-block px-4 py-2 text-sm text-bone-dim transition-colors duration-300 peer-checked:border-lime! peer-checked:bg-lime! peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-lime hover:text-bone">
                {i}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2">
        <label className="block">
          <span className={label}>[ 02 ] {t.name}</span>
          <input name="name" required maxLength={120} autoComplete="name" className={input} />
        </label>
        <label className="block">
          <span className={label}>[ 03 ] {t.email}</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={input} />
        </label>
      </div>

      <label className="block">
        <span className={label}>[ 04 ] {t.company}</span>
        <input name="company" maxLength={200} autoComplete="organization" className={input} />
      </label>

      <label className="block">
        <span className={label}>[ 05 ] {t.message}</span>
        <textarea
          name="message"
          required
          rows={4}
          maxLength={5000}
          placeholder={t.messageHint}
          data-lenis-prevent
          className={`${input} resize-none`}
        />
      </label>

      {/* People never see this field; form-filling bots do. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex items-center gap-3 rounded-full bg-lime px-7 py-3.5 font-display text-base font-semibold text-ink transition-[transform,opacity] duration-300 hover:-translate-y-0.5 disabled:opacity-60"
        >
          {status === "sending" ? `${t.sending}…` : t.send}
          <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
            ↗
          </span>
        </button>
        {(status === "error" || status === "fast") && (
          <p role="alert" className="text-sm text-bone-dim">
            {status === "fast" ? t.tooFast : t.error}
          </p>
        )}
      </div>
    </form>
  );
}
