"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { scrollState } from "../three/scroll-state";

// Apple-style liquid glass capsule floating at the top of every page, above
// all content layers. Always visible; the open menu is a glass sheet
// (motion in globals.css under nav-).
export function Nav({ locale, t }: { locale: Locale; t: SiteContent["nav"] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const other = locale === "tr" ? "en" : "tr";
  const otherPath = pathname.replace(`/${locale}`, `/${other}`);
  const panel = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  // In the order the sections appear on the home page; Lab is its own page.
  const links = [
    { href: `/${locale}#services`, id: "services", label: locale === "tr" ? "Hizmetler" : "Services" },
    { href: `/${locale}#about`, id: "about", label: t.about },
    { href: `/${locale}#work`, id: "work", label: t.work },
    { href: `/${locale}#ai-systems`, id: "ai-systems", label: locale === "tr" ? "AI Sistemleri" : "AI Systems" },
    { href: `/${locale}/lab`, id: "lab", label: t.lab },
    { href: `/${locale}#contact`, id: "contact", label: t.contact },
  ];
  // The sheet stays mounted for its closing animation.
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (!open || closing) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setOpen(false); return; }
    setClosing(true);
    window.setTimeout(() => { setOpen(false); setClosing(false); }, 300);
  };

  // While the sheet is open (and not folding away) the WebGL stage holds its
  // frame, so the glass blurs a still picture (see RawStage).
  useEffect(() => {
    const html = document.documentElement;
    if (open && !closing) html.dataset.menuOpen = "true";
    else delete html.dataset.menuOpen;
    return () => { delete html.dataset.menuOpen; };
  }, [open, closing]);

  // Sheet links to a section on this page wait for the sheet to fold away
  // (the page is scroll-locked while it is open), then glide there.
  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = pathname === `/${locale}` ? document.getElementById(id) : null;
    if (!target) { close(); return; }
    event.preventDefault();
    close();
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }, 360);
  };

  // Desktop: a glass pill slides under the hovered link, and rests under the
  // section currently on screen.
  const navRef = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const [onScreen, setOnScreen] = useState<string | null>(null);
  const home = pathname === `/${locale}`;
  const current = home ? onScreen : pathname.startsWith(`/${locale}/lab`) ? "lab" : null;
  const [hovered, setHovered] = useState<string | null>(null);
  // Site chrome waits for the home stage's opening (data-stage-intro); pages
  // without a stage have no opening, so the nav marks it done itself or the
  // header stayed invisible there.
  useEffect(() => {
    if (!home && !document.documentElement.dataset.stageIntro) document.documentElement.dataset.stageIntro = "done";
  }, [home]);
  useEffect(() => {
    if (!home) return;
    const ids = ["services", "about", "work", "ai-systems", "contact"];
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      const best = ids.reduce<[string | null, number]>((acc, id) => (visible.get(id) ?? 0) > acc[1] ? [id, visible.get(id) ?? 0] : acc, [null, 0]);
      setOnScreen(best[0]);
    }, { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.01, 0.1, 0.3] });
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [home]);
  useEffect(() => {
    const nav = navRef.current;
    const p = pill.current;
    if (!nav || !p) return;
    const target = hovered ?? current;
    const link = target ? nav.querySelector<HTMLElement>(`[data-nav-id="${target}"]`) : null;
    if (!link) { p.style.opacity = "0"; return; }
    p.style.opacity = "1";
    p.style.width = `${link.offsetWidth}px`;
    p.style.transform = `translateX(${link.offsetLeft}px)`;
  }, [hovered, current]);

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

  // Menu: Escape closes, focus is trapped inside while open
  useEffect(() => {
    if (!open) return;
    const el = panel.current;
    const trigger = menuButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <header data-menu-open={open || undefined} className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-3 md:pt-5">
      <div className="nav-capsule liquid-glass pointer-events-auto relative flex w-full max-w-[40rem] items-center justify-between rounded-full py-1.5 pr-1.5 pl-5 md:w-auto md:max-w-none md:gap-6">
        <Link
          href={`/${locale}`}
          className="font-display text-[16px] font-semibold tracking-[-0.02em] text-bone transition-opacity hover:opacity-70"
        >
          Ataberk
        </Link>
        <nav ref={navRef} aria-label="Main" className="nav-links relative hidden items-center text-[13px] md:flex" onMouseLeave={() => setHovered(null)}>
          <span ref={pill} className="nav-pill" aria-hidden="true" />
          {links.map((l, i) => (
            <Link
              key={l.label}
              href={l.href}
              data-nav-id={l.id}
              aria-current={current === l.id ? "true" : undefined}
              onMouseEnter={() => setHovered(l.id)}
              onFocus={() => setHovered(l.id)}
              onBlur={() => setHovered(null)}
              className="nav-link relative z-[1] rounded-full px-3.5 py-2 text-bone/75"
              style={{ animationDelay: `${0.32 + i * 0.05}s` }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={otherPath}
            className="nav-link glass-item relative z-[1] ml-1 bg-white/[0.07] px-3 py-2 text-[12px] text-bone/80"
            style={{ animationDelay: `${0.32 + links.length * 0.05}s` }}
            aria-label={other === "en" ? "Switch to English" : "Türkçeye geç"}
          >
            {other.toUpperCase()}
          </Link>
        </nav>
        <button
          ref={menuButton}
          type="button"
          onClick={() => setOpen(true)}
          className="glass-item bg-white/[0.08] px-4 py-2 text-[13px] text-bone md:hidden"
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
          data-closing={closing || undefined}
          className="nav-sheet liquid-glass liquid-glass-dense pointer-events-auto fixed inset-3 z-[100] flex flex-col rounded-[2rem] px-6 pt-5 pb-8"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-[17px] font-semibold tracking-[-0.02em]">Ataberk</span>
            <button type="button" onClick={close} className="glass-item bg-white/[0.08] px-4 py-2 text-[13px] text-bone">
              {t.close}
            </button>
          </div>
          <nav aria-label="Main" className="mt-20 flex flex-col gap-2">
            {links.map((l, i) => (
              <div key={l.label} className="nav-sheet-item" style={{ animationDelay: `${0.08 + 0.05 * i}s` }}>
                <Link
                  href={l.href}
                  onClick={(event) => go(event, l.id)}
                  className="block py-2 font-display text-5xl font-semibold tracking-[-0.04em] transition-colors hover:text-bone-dim"
                >
                  {l.label}
                </Link>
              </div>
            ))}
          </nav>
          <Link
            href={otherPath}
            onClick={close}
            className="nav-sheet-item mt-auto w-fit text-sm text-bone-dim"
            style={{ animationDelay: `${0.08 + 0.05 * links.length}s` }}
          >
            {other === "en" ? "English" : "Türkçe"}
          </Link>
        </div>
      )}
    </header>
  );
}
