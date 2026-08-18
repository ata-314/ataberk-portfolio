import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { SectionIntro } from "./SectionIntro";
import { HologramBust } from "../gl/HologramBust";

const CONTACT_URL = "https://github.com/ata-314";

export function AISystems({ t }: { t: SiteContent["aiSystems"] }) {
  return (
    <section
      id="ai-systems"
      className="relative z-20 border-t border-bone/10 px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-7xl">
        <SectionIntro eyebrow="Intelligence" title={t.heading} lead={t.lead} />
        <div className="mt-16 grid border-t border-white/10 md:grid-cols-2">
          {t.entries.map((e, i) => (
            <div
              key={e.name}
              data-reveal
              className={`border-b border-white/10 py-8 md:p-8 ${i % 2 === 0 ? "md:border-r" : ""}`}
            >
              <p className="font-mono text-[11px] tracking-widest text-bone-dim/60">
                0{i + 1}
              </p>
              <h3 lang="en" className="font-display mt-3 text-xl font-semibold">
                {e.name}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-bone-dim">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Second act of the page: the About story, fronted by the holographic scan
// of Ataberk that materializes and turns as the section scrolls through.
export function AboutPreview({
  locale,
  t,
  about,
}: {
  locale: Locale;
  t: SiteContent["aboutPreview"];
  about: SiteContent["about"];
}) {
  return (
    <section
      className="relative z-20 border-t border-bone/10 px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2 md:gap-6">
        <div data-reveal className="hero-copy order-2 md:order-1">
          <p className="font-mono text-[11px] tracking-[0.35em] text-lime/80 uppercase">
            {about.heading}
          </p>
          <p
            className="font-display mt-6 leading-[1.08] font-semibold tracking-tight text-balance"
            style={{ fontSize: "var(--text-h2)" }}
          >
            {t.line}
          </p>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-bone-dim md:text-lg">
            {about.intro}
          </p>
          <Link
            href={`/${locale}/about`}
            className="mt-9 inline-block rounded-full border border-white/15 bg-white/[0.06] px-7 py-3 font-mono text-xs tracking-widest text-bone uppercase backdrop-blur-xl backdrop-saturate-150 transition-colors hover:border-lime hover:text-lime"
          >
            {t.cta} →
          </Link>
        </div>
        <div data-reveal aria-hidden className="order-1 h-[46svh] md:order-2 md:h-[68svh]">
          <HologramBust />
        </div>
      </div>
    </section>
  );
}

// Final scene: transparent stage — the code matter returns behind the words.
export function ContactFinale({ t }: { t: SiteContent["contact"] }) {
  return (
    <section
      id="contact"
      className="pointer-events-none relative z-20 flex min-h-[90svh] flex-col justify-center px-6 md:px-10"
    >
      <div className="hero-copy mx-auto w-full max-w-5xl text-center">
        <p data-reveal className="font-mono text-[11px] tracking-[0.35em] text-lime/80 uppercase">
          {t.heading}
        </p>
        <h2
          data-reveal
          className="font-display mt-7 leading-[1.05] font-semibold tracking-tight text-balance"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {t.line}
        </h2>
        <ul data-reveal className="pointer-events-auto mt-12 flex flex-wrap justify-center gap-x-7 gap-y-3">
          {t.intents.map((intent) => (
            <li
              key={intent}
              className="border-b border-white/15 px-1 py-2 text-sm text-bone-dim"
            >
              {intent}
            </li>
          ))}
        </ul>
        <div data-reveal className="pointer-events-auto mt-10 flex flex-col items-center gap-4">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-lime px-8 py-4 font-mono text-xs font-semibold tracking-widest text-ink uppercase transition-transform duration-300 hover:-translate-y-1"
          >
            {t.cta} ↗
          </a>
          <p className="max-w-md text-sm text-bone-dim">{t.note}</p>
        </div>
      </div>
    </section>
  );
}

export function Footer({ t, name }: { t: SiteContent["footer"]; name: string }) {
  return (
    <footer className="relative z-20 border-t border-graphite bg-ink px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-4">
        <p className="font-display text-sm font-semibold">{name}</p>
        <p className="text-xs text-bone-dim">{t.built}</p>
        <p className="font-mono text-[11px] text-bone-dim/80">
          © {new Date().getFullYear()} · {t.rights}
        </p>
      </div>
    </footer>
  );
}
