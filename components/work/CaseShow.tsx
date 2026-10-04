"use client";

import { useEffect, useRef, useState } from "react";
import type { Fact } from "@/content/work-gallery";

// A case study laid out like a product page, on a light ground: the title
// and the idea, then the product itself, large and sharp, on a laptop (or,
// for an app, on three phones); a highlights carousel of the site's own
// chapters the visitor steps through; the figures the product states on a
// black band; and the site on phones. Nothing hijacks the scroll: things
// rise softly into place as they come into view.
type Props = {
  locale: "tr" | "en";
  title: string;
  kicker: string;
  idea: string;
  live?: { url: string; label: string; host: string };
  contact: string;
  hero?: string;
  desktop: string[];
  phone: string[];
  facts?: Fact[];
  labels: { highlights: string; phones: string; phonesBody: string; prev: string; next: string };
};

function Mac({ src, alt, host }: { src: string; alt: string; host?: string }) {
  return (
    <div className="ap-mac" role="img" aria-label={alt}>
      <div className="ap-mac-lid">
        <div className="ap-mac-screen">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" decoding="async" fetchPriority="high" />
        </div>
        <span className="ap-mac-notch" aria-hidden="true" />
      </div>
      <div className="ap-mac-base" aria-hidden="true"><span /></div>
      {host && <p className="ap-mac-host">{host}</p>}
    </div>
  );
}

function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="ap-phone">
      <div className="ap-phone-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" />
        <span className="ap-phone-island" aria-hidden="true" />
      </div>
    </div>
  );
}

export function CaseShow({ locale, title, kicker, idea, live, contact, hero, desktop, phone, facts, labels }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const app = !hero;

  // Soft reveal as things come into view.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -12% 0px" });
    el.querySelectorAll(".ap-reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // Carousel position follows the visitor's own swipe or scroll.
  useEffect(() => {
    const t = track.current;
    if (!t) return;
    const onScroll = () => {
      const card = t.firstElementChild as HTMLElement | null;
      if (!card) return;
      setSlide(Math.round(t.scrollLeft / (card.offsetWidth + 24)));
    };
    t.addEventListener("scroll", onScroll, { passive: true });
    return () => t.removeEventListener("scroll", onScroll);
  }, []);
  const go = (i: number) => {
    const t = track.current;
    const card = t?.children[i] as HTMLElement | undefined;
    if (t && card) t.scrollTo({ left: card.offsetLeft - t.offsetLeft - (t.clientWidth - card.offsetWidth) / 2, behavior: "smooth" });
  };

  const trio = phone.length > 3 ? [phone[1], phone[0], phone[3]] : phone.slice(0, 3);

  return (
    <div ref={root} className="ap">
      <header className="ap-hero">
        <p className="ap-kicker ap-reveal">{kicker}</p>
        <h1 className="ap-title font-display ap-reveal">{title}</h1>
        <p className="ap-idea ap-reveal">{idea}</p>
        <div className="ap-actions ap-reveal">
          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" className="ap-btn">
              {live.label} <span aria-hidden="true">↗</span>
            </a>
          )}
          <a href={`/${locale}#contact`} className="ap-link">{contact} <span aria-hidden="true">›</span></a>
        </div>
        <div className="ap-device ap-reveal">
          {hero ? (
            <Mac src={hero} alt={title} host={live?.host} />
          ) : (
            <div className="ap-trio">
              {trio.map((src, i) => <Phone key={src} src={src} alt={`${title} — ${i + 1}`} />)}
            </div>
          )}
        </div>
      </header>

      {desktop.length > 0 && (
        <section className="ap-high" aria-label={labels.highlights}>
          <h2 className="ap-h2 font-display ap-reveal">{labels.highlights}</h2>
          <div ref={track} className="ap-track">
            {desktop.map((src, i) => (
              <figure key={src} className="ap-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${title} — ${i + 1}`} loading="lazy" decoding="async" />
              </figure>
            ))}
          </div>
          <div className="ap-controls">
            <span className="ap-dots" aria-hidden="true">
              {desktop.map((src, i) => <i key={src} data-on={String(i === slide)} />)}
            </span>
            <span className="ap-arrows">
              <button type="button" onClick={() => go(Math.max(0, slide - 1))} disabled={slide === 0} aria-label={labels.prev}>‹</button>
              <button type="button" onClick={() => go(Math.min(desktop.length - 1, slide + 1))} disabled={slide >= desktop.length - 1} aria-label={labels.next}>›</button>
            </span>
          </div>
        </section>
      )}

      {facts && facts.length > 0 && (
        <section className="ap-facts" aria-label={title}>
          {facts.map((f) => (
            <div key={f.value + f.en} className="ap-reveal">
              <b className="font-display">{f.value}</b>
              <span>{f[locale]}</span>
            </div>
          ))}
        </section>
      )}

      {!app && phone.length > 0 && (
        <section className="ap-mobile">
          <div className="ap-mobile-copy ap-reveal">
            <h2 className="ap-h2 font-display">{labels.phones}</h2>
            <p>{labels.phonesBody}</p>
          </div>
          <div className="ap-trio ap-reveal">
            {trio.map((src, i) => <Phone key={src} src={src} alt={`${title} — ${i + 1}`} />)}
          </div>
        </section>
      )}

      {app && phone.length > 3 && (
        <section className="ap-high" aria-label={labels.highlights}>
          <h2 className="ap-h2 font-display ap-reveal">{labels.highlights}</h2>
          <div className="ap-row ap-reveal">
            {phone.map((src, i) => <Phone key={src} src={src} alt={`${title} — ${i + 1}`} />)}
          </div>
        </section>
      )}
    </div>
  );
}
