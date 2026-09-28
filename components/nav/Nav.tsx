"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { scrollState } from "../three/scroll-state";

// HUD chrome: a small mark on the left; on the right a dark glass capsule
// of links and, beneath it, the scene chip — the name of the chapter on
// screen with << >> to step between chapters. The open menu is a glass
// sheet. Chapters are any elements marked data-scene="NAME".
export function Nav({ locale, t }: { locale: Locale; t: SiteContent["nav"] }) {
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState<{ name: string; index: number; count: number } | null>(null);
  const scenes = useRef<HTMLElement[]>([]);
  const pathname = usePathname();
  const other = locale === "tr" ? "en" : "tr";
  const otherPath = pathname.replace(`/${locale}`, `/${other}`);
  const panel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  const links = [
    { href: `/${locale}#work`, label: t.work },
    { href: `/${locale}#services`, label: locale === "tr" ? "Hizmetler" : "Services" },
    { href: `/${locale}/about`, label: t.about },
    { href: `/${locale}/lab`, label: t.lab },
    { href: `/${locale}#contact`, label: t.contact },
  ];

  // Page progress feeds the WebGL stage. Event-driven so non-home routes
  // never need the GSAP/Lenis runtime just to report scroll position.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
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

  // Scene chip: the chapter whose middle is nearest the viewport centre.
  useEffect(() => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      const list = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
      scenes.current = list;
      if (!list.length) return setScene(null);
      const mid = innerHeight / 2;
      let best = 0, bestDistance = Infinity;
      list.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bestDistance) { bestDistance = d; best = i; }
      });
      setScene((prev) => {
        const name = list[best].dataset.scene ?? "";
        return prev && prev.name === name && prev.index === best && prev.count === list.length ? prev : { name, index: best, count: list.length };
      });
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(pick); };
    pick();
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", request); removeEventListener("resize", request); };
  }, [pathname]);
  const step = (by: number) => {
    if (!scene) return;
    const target = scenes.current[(scene.index + by + scene.count) % scene.count];
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex items-start justify-between px-4 pt-4 md:px-8 md:pt-6">
      <Link
        href={`/${locale}`}
        className="pointer-events-auto flex flex-col gap-1 transition-opacity hover:opacity-70"
      >
        <span className="font-display text-[15px] leading-none text-bone">Ataberk</span>
        <span className="hud-label hidden md:block">Creative Technologist</span>
      </Link>
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <div className="hud-pill flex items-center gap-1 px-2 py-1.5">
          <nav aria-label="Main" className="hidden items-center md:flex">
            {links.map((l, i) => (
              <span key={l.label} className="flex items-center">
                {i > 0 && <span aria-hidden className="hud-divider" />}
                <Link href={l.href} className="hud-link px-3 py-1">
                  {l.label}
                </Link>
              </span>
            ))}
            <Link
              href={otherPath}
              className="hud-link ml-2 rounded-full border border-white/15 px-2.5 py-1"
              aria-label={other === "en" ? "Switch to English" : "Türkçeye geç"}
            >
              {other.toUpperCase()}
            </Link>
          </nav>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen(true)}
            className="hud-link px-3 py-1 md:hidden"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {t.menu}
          </button>
        </div>
        {scene && (
          <div className="hud-chip hidden items-center md:flex" aria-live="polite">
            <button type="button" onClick={() => step(-1)} aria-label={locale === "tr" ? "Önceki sahne" : "Previous scene"}>&lt;&lt;</button>
            <span className="hud-label min-w-[11rem] text-center">
              {String(scene.index + 1).padStart(2, "0")} · {scene.name}
            </span>
            <button type="button" onClick={() => step(1)} aria-label={locale === "tr" ? "Sonraki sahne" : "Next scene"}>&gt;&gt;</button>
          </div>
        )}
      </div>

      {open && (
          <div
            ref={panel}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={t.menu}
            className="liquid-glass liquid-glass-dense pointer-events-auto fixed inset-3 z-[100] flex flex-col rounded-[2rem] px-6 pt-5 pb-8 [animation:menuFade_0.25s_ease_both]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[17px] font-semibold tracking-[-0.02em]">Ataberk</span>
              <button type="button" onClick={() => setOpen(false)} className="glass-item bg-white/[0.08] px-4 py-2 text-[13px] text-bone">
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
