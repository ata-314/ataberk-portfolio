"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { scrollState } from "../three/scroll-state";

// Compact floating navigation: an Apple-like control island with one clear
// hierarchy. Its small blur footprint stays inexpensive over the WebGL stage.
export function Nav({ locale, t }: { locale: Locale; t: SiteContent["nav"] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const other = locale === "tr" ? "en" : "tr";
  const otherPath = pathname.replace(`/${locale}`, `/${other}`);
  const panel = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  const links = [
    { href: `/${locale}#work`, label: t.work },
    { href: `/${locale}#capabilities`, label: t.capabilities },
    { href: `/${locale}/about`, label: t.about },
    { href: `/${locale}/lab`, label: t.lab },
    { href: `/${locale}#contact`, label: t.contact },
  ];

  // Thin page progress line under the bar. Event-driven so non-home routes
  // never need the GSAP/Lenis runtime just to report scroll position.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      scrollState.page.current = value;
      if (progress.current) progress.current.style.transform = `scaleX(${value})`;
    };
    const requestUpdate = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [pathname]);

  // Menu: Escape closes, focus is trapped inside while open
  useEffect(() => {
    if (!open) return;
    const el = panel.current;
    const trigger = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 md:px-6">
      <div className="nav-shell pointer-events-auto relative mx-auto mt-3 flex max-w-5xl items-center justify-between overflow-hidden rounded-full px-2.5 py-2 md:mt-4 md:pl-3 md:pr-2">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 rounded-full px-2 py-1.5 font-display text-sm font-semibold tracking-tight transition-opacity hover:opacity-75"
          aria-label="Ataberk Soylu"
        >
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full border border-lime/25 bg-lime/[0.08] font-mono text-[9px] tracking-[-0.08em] text-lime shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            AS
          </span>
          <span className="hidden sm:inline">Ataberk Soylu</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {links.map((l, i) => (
            <Link
              key={l.label}
              href={l.href}
              className={`rounded-full px-3 py-2 text-[12px] transition-colors ${
                i === links.length - 1
                  ? "ml-1 bg-bone text-ink hover:bg-white"
                  : "text-bone-dim hover:bg-white/[0.07] hover:text-bone"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={otherPath}
            className="ml-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[9px] tracking-[0.18em] text-bone-dim uppercase transition-colors hover:border-white/20 hover:text-bone"
            aria-label={other === "en" ? "Switch to English" : "Türkçeye geç"}
          >
            {other.toUpperCase()}
          </Link>
        </nav>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] text-bone md:hidden"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {t.menu}
        </button>
        <div className="absolute inset-x-7 bottom-0 h-px overflow-hidden bg-white/[0.045]">
          <div
            ref={progress}
            aria-hidden
            className="h-full origin-left bg-lime/75"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>

      {open && (
          <div
            ref={panel}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={t.menu}
            className="glass-strong pointer-events-auto fixed inset-3 z-50 flex flex-col overflow-hidden rounded-[2rem] px-6 py-5 [animation:menuFade_0.25s_ease_both]"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5 font-display text-sm font-semibold">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime" />
                Ataberk Soylu
              </span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[12px] text-bone">
                {t.close}
              </button>
            </div>
            <nav aria-label="Main" className="mt-16 flex flex-col gap-3">
              {links.map((l, i) => (
                <div
                  key={l.label}
                  className="[animation:menuRise_0.35s_ease_both]"
                  style={{ animationDelay: `${0.06 * i}s` }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-white/[0.08] py-3 font-display text-4xl font-semibold tracking-tight transition-colors hover:text-lime"
                  >
                    {l.label}
                  </Link>
                </div>
              ))}
            </nav>
            <Link
              href={otherPath}
              onClick={() => setOpen(false)}
              className="mt-auto w-fit rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 font-mono text-xs tracking-widest text-lime uppercase"
            >
              {other.toUpperCase()}
            </Link>
          </div>
        )}
    </header>
  );
}
