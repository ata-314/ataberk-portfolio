import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { site } from "@/content/site";
import { Footer } from "@/components/sections/HomeSections";
import { LabExperiment } from "@/components/lab/LabExperiment";
import "@/components/lab/lab.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "tr";
  return {
    title: site[l].lab.heading,
    description: site[l].lab.lead,
    alternates: {
      canonical: `/${l}/lab`,
      languages: { tr: "/tr/lab", en: "/en/lab" },
    },
  };
}

export default async function LabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = site[locale].lab;

  return (
    <main id="content" className="relative z-10 min-h-screen overflow-hidden bg-ink">
      <div className="lab-glow" aria-hidden="true" />
      <header className="relative px-5 pt-32 md:px-10 md:pt-44">
        <div className="lab-head">
          <p className="lab-label">{t.label}</p>
          <h1 className="lab-title">{t.heading}</h1>
          <p className="lab-lead">{t.lead}</p>
          <div className="lab-stats">
            {t.stats.map((s) => <span key={s}>{s}</span>)}
          </div>
        </div>
      </header>
      <section aria-label={t.heading} className="relative px-5 pt-14 pb-24 md:px-10 md:pt-20 md:pb-32">
        <div className="lab-grid">
          {t.entries.map((e, i) => (
            <LabExperiment key={e.name} entry={e} index={i} feature={i === 0} cta={t.cta} ctaHref={`/${locale}#contact`} useLabel={t.useLabel} />
          ))}
        </div>
        <p className="lab-note">{t.note}</p>
        <div className="lab-close">
          <h2>{t.close.heading}</h2>
          <p>{t.close.line}</p>
          <Link href={`/${locale}#contact`} className="lab-cta">{t.close.cta}<span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <Footer t={site[locale].footer} name={site[locale].name} />
    </main>
  );
}
