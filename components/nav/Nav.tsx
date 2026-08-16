"use client";
 

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { scrollState } from "../three/scroll-state";

// Minimal fixed navigation: monogram, five destinations, locale, menu.
// Glass only here — a functional overlay, not a style.
export function Nav({ locale, t }: { locale: Locale; t: SiteContent["nav"] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const other = locale === "tr" ? "en" : "tr";
  const otherPath = pathname.replace(`/${locale}`, `/${other}`);
  const panel = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);

  const links = [
    { href: `/${locale}#work`, label: t.work },
    { href: `/${locale}#capabilities`, label: t.capabilities },
    { href: `/${locale}/about`, label: t.about },
    { href: `/${locale}/lab`, label: t.lab },
    { href: `/${locale}#contact`, label: t.contact },
  ];

  // Thin page progress line under the bar
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (progress.current)
        progress.current.style.transform = `scaleX(${scrollState.page.current})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Menu: Escape closes, focus is trapped inside while open
  useEffect(() => {
    if (!open) return;
    const el = panel.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && el) {
        const items = el.querySelectorAll<HTMLElement>("a, button");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    el?.querySelector<HTMLElement>("a, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="flex items-center justify-between border-b border-bone/5 bg-ink/60 px-5 py-4 backdrop-blur-md md:px-10">
        <Link
          href={`/${locale}`}
          className="font-display text-sm font-semibold tracking-tight"
          aria-label="Ataberk Soylu"
        >
          Ataberk Soylu
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[13px] text-bone-dim transition-colors hover:text-bone"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={otherPath}
            className="font-mono text-xs tracking-widest text-bone-dim uppercase transition-colors hover:text-lime"
            aria-label={other === "en" ? "Switch to English" : "Türkçeye geç"}
          >
            {other.toUpperCase()}
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[13px] text-bone md:hidden"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {t.menu}
        </button>
      </div>
      <div
        ref={progress}
        aria-hidden
        className="h-px origin-left bg-lime/70"
        style={{ transform: "scaleX(0)" }}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={t.menu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col bg-ink/97 px-6 py-5 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Ataberk Soylu</span>
              <button type="button" onClick={() => setOpen(false)} className="text-[13px] text-bone">
                {t.close}
              </button>
            </div>
            <nav aria-label="Main" className="mt-14 flex flex-col gap-6">
              {links.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.35 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-display text-4xl font-semibold tracking-tight"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <Link
              href={otherPath}
              onClick={() => setOpen(false)}
              className="mt-auto font-mono text-sm tracking-widest text-lime uppercase"
            >
              {other.toUpperCase()}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
