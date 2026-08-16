import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { site } from "@/content/site";
import { Footer } from "@/components/sections/HomeSections";

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
    <main id="content" className="relative z-10 bg-ink">
      <header className="px-6 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <h1
            className="font-display font-semibold tracking-tight"
            style={{ fontSize: "var(--text-h1)" }}
          >
            {t.heading}
          </h1>
          <p className="mt-4 max-w-xl text-bone-dim">{t.lead}</p>
        </div>
      </header>
      <div className="px-6 md:px-10" style={{ paddingBlock: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl">
          <dl className="divide-y divide-graphite border-y border-graphite">
            {t.entries.map((e, i) => (
              <div key={e.name} className="grid grid-cols-12 gap-4 py-8">
                <dt className="col-span-12 md:col-span-4">
                  <span className="font-mono text-[11px] text-bone-dim">0{i + 1}</span>
                  <span className="font-display ml-4 text-xl font-semibold">{e.name}</span>
                </dt>
                <dd className="col-span-12 text-sm leading-relaxed text-bone-dim md:col-span-5">
                  {e.desc}
                </dd>
                <dd className="col-span-12 font-mono text-xs tracking-widest text-lime/80 uppercase md:col-span-3 md:text-right">
                  {e.status}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} />
    </main>
  );
}
