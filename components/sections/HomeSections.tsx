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
// The form sits on a glass pane at the right; the direct lines stay at the left.
export function ContactFinale({ locale, t }: { locale: Locale; t: SiteContent["contact"] }) {
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
        <div data-reveal className="pointer-events-auto mt-12 grid gap-12 md:grid-cols-12 md:items-end md:gap-6">
          <div className="text-[15px] leading-relaxed text-bone-dim md:col-span-4">
            <p>{t.note}</p>
            <p className="mt-10 font-mono text-[11px] tracking-[0.18em] uppercase">{t.form.direct}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="contact-link group font-display mt-3 inline-flex w-fit items-baseline gap-2 text-xl font-semibold tracking-[-0.02em] text-bone md:text-2xl"
            >
              <span className="link-draw">{CONTACT_EMAIL}</span>
              <span aria-hidden className="text-lime transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
                ↗
              </span>
            </a>
            <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="link-draw mt-4 block w-fit text-sm">
              {t.cta} ↗
            </a>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <ContactForm locale={locale} intents={t.intents} t={t.form} />
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
