"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { scrollState } from "../three/scroll-state";

// Plain editorial top bar: wordmark left, text links right, no container.
// It sits directly over the stage with only a legibility text shadow.
export function Nav({ locale, t }: { locale: Locale; t: SiteContent["nav"] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const other = locale === "tr" ? "en" : "tr";
  const otherPath = pathname.replace(`/${locale}`, `/${other}`);
  const panel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLElement>(null);

  const links = [
    { href: `/${locale}#work`, label: t.work },
    { href: `/${locale}#capabilities`, label: t.capabilities },
    { href: `/${locale}/about`, label: t.about },
    { href: `/${locale}/lab`, label: t.lab },
    { href: `/${locale}#contact`, label: t.contact },
  ];

  // Page progress feeds the WebGL stage. Event-driven so non-home routes
  // never need the GSAP/Lenis runtime just to report scroll position.
  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (bar.current && Math.abs(y - lastY) > 4) {
        bar.current.dataset.hidden = String(y > lastY && y > 120);
        lastY = y;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      scrollState.page.current = value;
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
    <header ref={bar} className="hero-copy pointer-events-none fixed inset-x-0 top-0 z-50 px-5 md:px-10">
      <div className="pointer-events-auto mx-auto flex max-w-[88rem] items-center justify-between pt-5 md:pt-7">
        <Link
          href={`/${locale}`}
          className="font-display text-[17px] font-semibold tracking-[-0.02em] text-bone transition-opacity hover:opacity-70"
        >
          Ataberk
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="link-draw text-bone-dim transition-colors hover:text-bone">
              {l.label}
            </Link>
          ))}
          <Link
            href={otherPath}
            className="link-draw text-bone-dim transition-colors hover:text-bone"
            aria-label={other === "en" ? "Switch to English" : "Türkçeye geç"}
          >
            {other.toUpperCase()}
          </Link>
        </nav>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-bone md:hidden"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {t.menu}
        </button>
      </div>

      {open && (
          <div
            ref={panel}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={t.menu}
            className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-ink px-5 pt-5 pb-8 [animation:menuFade_0.25s_ease_both]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[17px] font-semibold tracking-[-0.02em]">Ataberk</span>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-bone">
                {t.close}
              </button>
            </div>
            <nav aria-label="Main" className="mt-20 flex flex-col gap-2">
              {links.map((l, i) => (
                <div
                  key={l.label}
                  className="[animation:menuRise_0.35s_ease_both]"
                  style={{ animationDelay: `${0.06 * i}s` }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-2 font-display text-5xl font-semibold tracking-[-0.04em] transition-colors hover:text-bone-dim"
                  >
                    {l.label}
                  </Link>
                </div>
              ))}
            </nav>
            <Link
              href={otherPath}
              onClick={() => setOpen(false)}
              className="mt-auto w-fit text-sm text-bone-dim"
            >
              {other === "en" ? "English" : "Türkçe"}
            </Link>
          </div>
        )}
    </header>
  );
}
