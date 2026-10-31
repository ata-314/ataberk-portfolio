import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { privacy, privacyPath } from "@/content/privacy";
import { Footer } from "@/components/sections/HomeSections";
import { PageHero, SubSection } from "@/components/page/PageHero";
import { PageMotion } from "@/components/page/PageMotion";
import { ConsentSettings } from "@/components/track/ConsentBanner";
import "@/components/page/subpage.css";

// The privacy notice (/tr/gizlilik, /en/privacy): plain, server-rendered text in
// the inner pages' matter, the browser storage table and a way to change consent.

export function privacyMetadata(locale: Locale): Metadata {
  const p = privacy[locale];
  return {
    title: p.title,
    description: p.description,
    alternates: {
      canonical: privacyPath(locale),
      languages: { tr: privacyPath("tr"), en: privacyPath("en"), "x-default": privacyPath("tr") },
    },
  };
}

export function PrivacyPage({ locale }: { locale: Locale }) {
  const p = privacy[locale];
  return (
    <main id="content" className="sub-page relative z-10">
      <PageMotion />
      <PageHero
        compact
        crumbs={[{ label: services[locale].labels.home, href: `/${locale}` }, { label: p.h1 }]}
        title={p.h1}
        meta={p.updated}
        lead={p.lead}
      />
      <div className="sub-body">
        {p.sections.map((s) => (
          <SubSection key={s.heading} heading={s.heading}>
            <div className="space-y-4 text-lg leading-relaxed text-bone-dim">
              {s.body?.map((b) => <p key={b.slice(0, 32)}>{b}</p>)}
              {s.items && (
                <ul className="list-disc space-y-2 pl-5">
                  {s.items.map((i) => <li key={i.slice(0, 32)}>{i}</li>)}
                </ul>
              )}
            </div>
          </SubSection>
        ))}
        <SubSection heading={p.storage.heading}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm text-bone-dim">
              <thead className="text-bone">
                <tr>
                  {p.storage.cols.map((c) => (
                    <th key={c} className="border-b border-white/15 py-3 pr-4 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.storage.rows.map((r) => (
                  <tr key={r.key} className="border-b border-white/10 align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-bone">{r.key}</td>
                    <td className="py-3 pr-4">{r.what}</td>
                    <td className="py-3 pr-4">{r.kind}</td>
                    <td className="py-3 pr-4">{r.keep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>
        <SubSection heading={p.manage.heading}>
          <p className="text-lg leading-relaxed text-bone-dim">{p.manage.body}</p>
          <ConsentSettings label={p.manage.button} className="hero-cta mt-6" />
        </SubSection>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
    </main>
  );
}
