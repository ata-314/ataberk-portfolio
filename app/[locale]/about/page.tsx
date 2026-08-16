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
    title: site[l].about.heading,
    description: site[l].about.intro,
    alternates: {
      canonical: `/${l}/about`,
      languages: { tr: "/tr/about", en: "/en/about" },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = site[locale].about;

  return (
    <main id="content" className="relative z-10 bg-ink">
      <header className="px-6 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-[11px] tracking-widest text-bone-dim uppercase">{t.heading}</p>
          <h1
            className="font-display mt-6 max-w-5xl leading-[1.05] font-semibold tracking-tight text-balance"
            style={{ fontSize: "var(--text-h1)" }}
          >
            {t.intro}
          </h1>
        </div>
      </header>

      <div className="px-6 md:px-10" style={{ paddingBlock: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl space-y-24">
          <section className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-6 md:col-span-7">
              {t.bio.map((p) => (
                <p key={p.slice(0, 24)} className="text-lg leading-relaxed text-bone-dim">
                  {p}
                </p>
              ))}
              <p className="border-l-2 border-lime pl-5 text-sm leading-relaxed text-bone-dim">
                {t.thesis}
              </p>
            </div>
            <div className="col-span-12 md:col-span-4 md:col-start-9">
              <dl className="divide-y divide-graphite border-y border-graphite">
                {t.ventures.map((v) => (
                  <div key={v.name} className="py-6">
                    <dt className="font-display text-xl font-semibold">{v.name}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-bone-dim">{v.desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {t.collaboration.heading}
            </h2>
            <ul className="mt-6 flex max-w-3xl flex-wrap gap-3">
              {t.collaboration.areas.map((a) => (
                <li
                  key={a}
                  className="rounded-full border border-graphite px-5 py-2.5 text-sm text-bone"
                >
                  {a}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} />
    </main>
  );
}
