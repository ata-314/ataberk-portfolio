import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { SectionIntro } from "./SectionIntro";

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
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {t.entries.map((e, i) => (
            <div key={e.name} data-reveal className="glass glass-hover p-8">
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

export function AboutPreview({
  locale,
  t,
}: {
  locale: Locale;
  t: SiteContent["aboutPreview"];
}) {
  return (
    <section
      className="relative z-20 border-t border-bone/10 px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div data-reveal className="hero-copy mx-auto max-w-4xl text-center">
        <p className="font-mono text-[11px] tracking-[0.35em] text-lime/80 uppercase">
          {t.heading}
        </p>
        <p
          className="font-display mt-6 leading-[1.1] font-semibold tracking-tight text-balance"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {t.line}
        </p>
        <Link
          href={`/${locale}/about`}
          className="mt-9 inline-block rounded-full border border-bone/15 px-7 py-3 font-mono text-xs tracking-widest text-bone-dim uppercase transition-colors hover:border-lime hover:text-lime"
        >
          {t.cta} →
        </Link>
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
        <p className="font-mono text-[11px] tracking-[0.35em] text-lime/80 uppercase">
          {t.heading}
        </p>
        <h2
          className="font-display mt-7 leading-[1.05] font-semibold tracking-tight text-balance"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {t.line}
        </h2>
        <ul className="pointer-events-auto mt-12 flex flex-wrap justify-center gap-3">
          {t.intents.map((intent) => (
            <li
              key={intent}
              className="glass rounded-full px-6 py-3 text-sm text-bone-dim"
            >
              {intent}
            </li>
          ))}
        </ul>
        <div className="pointer-events-auto mt-10 flex flex-col items-center gap-4">
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
