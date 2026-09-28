import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";
import { HologramBust } from "../gl/HologramBust";
import { HexPanel } from "./HexPanel";

const CONTACT_URL = "https://github.com/ata-314";

// Lab · AI systems: a wide honeycomb panel of living data with the lab
// entry at its lens, then the working systems as HUD rows.
export function AISystems({ t, locale }: { t: SiteContent["aiSystems"]; locale: Locale }) {
  const tr = locale === "tr";
  return (
    <section
      id="ai-systems"
      className="relative z-20 px-5 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-[88rem]">
        <div data-reveal className="lab-panel">
          <HexPanel className="absolute inset-0 h-full w-full" />
          <div className="lab-panel-copy">
            <Link href={`/${locale}/lab`} className="lab-panel-link font-display">
              {"// Lab ->"}
            </Link>
            <Link href={`/${locale}/lab`} aria-label="Lab" className="lab-panel-ring">
              <span aria-hidden>✦</span>
            </Link>
            <p className="max-w-[26ch] font-mono text-[11px] leading-[1.8] tracking-[0.1em] text-bone/85 uppercase">
              {tr ? "Prototiplerin üretime dönüştüğü deney alanım." : "My home for experiments, where prototypes become production."}
            </p>
          </div>
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="hud-label">{tr ? "Çalışan sistemler" : "Working systems"}</p>
            <h2 className="font-display mt-3 leading-[0.95]" style={{ fontSize: "clamp(2rem, 4vw, 3.6rem)" }}>
              {t.heading}
            </h2>
          </div>
          <dl className="md:col-span-7 md:col-start-6">
            {t.entries.map((e, i) => (
              <div key={e.name} data-reveal className="lab-row">
                <dt className="flex items-baseline gap-4">
                  <span className="hud-label">{String(i + 1).padStart(2, "0")}</span>
                  <span lang="en" className="font-display text-xl md:text-2xl">{e.name}</span>
                </dt>
                <dd className="mt-2 pl-9 font-mono text-[12px] leading-[1.8] tracking-[0.06em] text-bone-dim uppercase">{e.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
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
        <p data-reveal className="hud-label mb-6">{t.heading} · signal</p>
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
