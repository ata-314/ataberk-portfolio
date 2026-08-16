"use client";

import { useState } from "react";
import type { SiteContent } from "@/content/site";

// Four living systems on one network spine. Approaching one (hover/focus on
// desktop, native accordion on mobile) reveals how it feeds the others —
// no percentage bars, no CV table.
export function Capabilities({ t }: { t: SiteContent["capabilities"] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      id="capabilities"
      className="relative z-10 bg-ink px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="font-display font-semibold tracking-tight" style={{ fontSize: "var(--text-h2)" }}>
          {t.heading}
        </h2>
        <p className="mt-4 max-w-xl text-bone-dim">{t.lead}</p>

        {/* Desktop: network grid */}
        <div className="relative mt-16 hidden md:block">
          <div aria-hidden className="absolute inset-x-8 top-7 h-px bg-graphite">
            <div
              className="h-px bg-lime/70 transition-all duration-500"
              style={{
                width: active === null ? "0%" : "100%",
                opacity: active === null ? 0 : 1,
              }}
            />
          </div>
          <div className="grid grid-cols-4 gap-8">
            {t.systems.map((sys, i) => (
              <button
                key={sys.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`relative cursor-inherit text-left transition-opacity duration-400 ${
                  active !== null && active !== i ? "opacity-35" : "opacity-100"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute top-6 left-0 h-2.5 w-2.5 rounded-full border transition-colors duration-300 ${
                    active === i ? "border-lime bg-lime" : "border-steel bg-ink"
                  }`}
                />
                <p className="font-mono text-[11px] tracking-widest text-bone-dim">0{i + 1}</p>
                <h3 lang="en" className="font-display mt-4 text-xl font-semibold">
                  {sys.name}
                </h3>
                <ul className="mt-5 space-y-2 border-l border-graphite pl-4">
                  {sys.items.map((item) => (
                    <li key={item} lang="en" className="text-sm text-bone-dim">
                      {item}
                    </li>
                  ))}
                </ul>
                <p
                  className={`mt-5 min-h-16 text-[13px] leading-relaxed transition-all duration-400 ${
                    active === i ? "text-lime/90 opacity-100" : "opacity-0"
                  }`}
                >
                  {sys.bridge}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: accessible native accordion */}
        <div className="mt-12 space-y-3 md:hidden">
          {t.systems.map((sys, i) => (
            <details key={sys.key} className="group border border-graphite">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4">
                <span lang="en" className="font-display text-lg font-semibold">
                  {sys.name}
                </span>
                <span className="font-mono text-xs text-bone-dim">0{i + 1}</span>
              </summary>
              <div className="border-t border-graphite px-5 py-4">
                <ul className="space-y-2">
                  {sys.items.map((item) => (
                    <li key={item} lang="en" className="text-sm text-bone-dim">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[13px] text-lime/90">{sys.bridge}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
