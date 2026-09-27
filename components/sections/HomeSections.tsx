import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { SectionIntro } from "./SectionIntro";
import { HologramBust } from "../gl/HologramBust";

const CONTACT_URL = "https://github.com/ata-314";

// The working systems behind the visual work, as a two-column definition
// list set directly on the page.
export function AISystems({ t }: { t: SiteContent["aiSystems"] }) {
  return (
    <section
      id="ai-systems"
      className="relative z-20 px-5 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionIntro title={t.heading} lead={t.lead} />
        <dl className="mt-16 grid gap-x-16 gap-y-12 md:mt-24 md:grid-cols-2">
          {t.entries.map((e) => (
            <div key={e.name} data-reveal className="hero-copy max-w-xl">
              <dt lang="en" className="font-display text-2xl font-semibold tracking-[-0.03em]">
                {e.name}
              </dt>
              <dd className="mt-3 text-[15px] leading-relaxed text-bone-dim">{e.desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// Second act of the page: the About story, set openly beside the
// holographic scan that materializes and turns as the section scrolls.
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
      className="relative z-20 px-5 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto grid max-w-[88rem] items-center gap-10 md:grid-cols-12 md:gap-6">
        <div data-reveal className="hero-copy order-2 md:order-1 md:col-span-6">
          <p
            className="font-display leading-[1.02] font-semibold tracking-[-0.04em] text-balance"
            style={{ fontSize: "clamp(2.2rem, 4.4vw, 4.4rem)" }}
          >
            {t.line}
          </p>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-bone-dim md:text-lg">
            {about.intro}
          </p>
          <Link
            href={`/${locale}/about`}
            className="link-draw mt-10 inline-block text-base text-bone"
          >
            {t.cta} →
          </Link>
        </div>
        <div data-reveal aria-hidden className="order-1 h-[46svh] md:order-2 md:col-span-6 md:h-[72svh]">
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
      className="pointer-events-none relative z-20 flex min-h-[90svh] flex-col justify-end px-5 pb-[10svh] md:px-10"
    >
      <div className="hero-copy mx-auto w-full max-w-[88rem]">
        <h2
          data-reveal
          className="font-display max-w-[16ch] leading-[0.95] font-semibold tracking-[-0.05em] text-balance"
          style={{ fontSize: "clamp(3rem, 7.5vw, 7.5rem)" }}
        >
          {t.line}
        </h2>
        <div data-reveal className="pointer-events-auto mt-12 grid gap-10 md:grid-cols-12 md:items-end">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noreferrer"
            className="contact-link group font-display inline-flex w-fit items-baseline gap-3 text-3xl font-semibold tracking-[-0.03em] md:col-span-6 md:text-5xl"
          >
            <span className="link-draw">{t.cta}</span>
            <span aria-hidden className="text-lime transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
              ↗
            </span>
          </a>
          <div className="text-[15px] leading-relaxed text-bone-dim md:col-span-5 md:col-start-8">
            <p>{t.intents.join(", ")}.</p>
            <p className="mt-3">{t.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ t, name }: { t: SiteContent["footer"]; name: string }) {
  return (
    <footer className="relative z-20 bg-ink px-5 py-10 md:px-10">
      <div className="mx-auto flex max-w-[88rem] flex-wrap items-baseline justify-between gap-4 text-sm text-bone-dim">
        <p className="font-display font-semibold text-bone">{name}</p>
        <p>{t.built}</p>
        <p>
          © {new Date().getFullYear()} {t.rights}
        </p>
      </div>
    </footer>
  );
}
