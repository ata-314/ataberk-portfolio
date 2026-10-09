import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { HologramBust } from "../gl/HologramBust";
import { CodeRain } from "./CodeRain";
import { ContactForm } from "./ContactForm";

const CONTACT_URL = "https://github.com/ata-314";
const CONTACT_EMAIL = "ataberk@ataberksoylu.com";

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
      id="about"
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
        <div data-reveal aria-hidden className="portrait-frame relative order-1 h-[46svh] md:order-2 md:col-span-6 md:h-[72svh]">
          {/* Falling code behind, HUD ticks and markers round the portrait. */}
          <CodeRain className="absolute inset-0 h-full w-full opacity-70" />
          <span className="portrait-mark portrait-mark-tl">[[&nbsp;&nbsp;001&nbsp;&nbsp;]]</span>
          <span className="portrait-ticks portrait-ticks-top" />
          <span className="portrait-ticks portrait-ticks-bottom" />
          <span className="portrait-cross" style={{ left: "4%", top: "50%" }} />
          <span className="portrait-cross" style={{ right: "4%", top: "50%" }} />
          <div className="relative h-full w-full">
            <HologramBust />
          </div>
        </div>
      </div>
    </section>
  );
}

// Final scene: transparent stage — the code matter returns behind the words.
// Everything is centred: the line, the glass form over the matter, then the direct lines.
export function ContactFinale({ locale, t }: { locale: Locale; t: SiteContent["contact"] }) {
  return (
    <section
      id="contact"
      className="pointer-events-none relative z-20 px-5 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto flex w-full max-w-[88rem] flex-col items-center text-center">
        <div className="hero-copy flex flex-col items-center">
          <p data-reveal className="font-mono text-[11px] tracking-[0.22em] text-lime uppercase">
            [&nbsp;&nbsp;{t.heading}&nbsp;&nbsp;]
          </p>
          <h2
            data-reveal
            className="font-display mt-6 max-w-[18ch] leading-[0.95] font-semibold tracking-[-0.05em] text-balance"
            style={{ fontSize: "clamp(2.6rem, 6.2vw, 6.4rem)" }}
          >
            {t.line}
          </h2>
          <p data-reveal className="mt-6 max-w-xl text-base leading-relaxed text-bone-dim md:text-lg">
            {t.note}
          </p>
        </div>
        <div className="pointer-events-auto mt-14 w-full max-w-[46rem] text-left">
          <ContactForm locale={locale} intents={t.intents} t={t.form} />
        </div>
        <div className="hero-copy pointer-events-auto mt-12 flex flex-col items-center gap-3 text-sm text-bone-dim">
          <span className="font-mono text-[11px] tracking-[0.18em] uppercase">{t.form.direct}</span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="contact-link group font-display inline-flex items-baseline gap-2 text-xl font-semibold tracking-[-0.02em] text-bone md:text-2xl"
          >
            <span className="link-draw">{CONTACT_EMAIL}</span>
            <span aria-hidden className="text-lime transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
              ↗
            </span>
          </a>
          <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="link-draw">
            {t.cta} ↗
          </a>
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
