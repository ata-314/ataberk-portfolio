import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { site } from "@/content/site";
import { Footer } from "@/components/sections/HomeSections";
import { ContactBlock } from "@/components/contact/ContactPage";
import { BASE_URL, PERSON_ID } from "@/lib/url";

// Who the page is about, in the words people search with.
const meta = {
  tr: {
    title: "Ataberk Soylu Kimdir? Creative Technologist ve Yapay Zeka Uzmanı",
    description:
      "Ataberk Soylu: İstanbul'da tasarım, motion, yapay zekâ ve web geliştirmeyi tek üretim sürecinde birleştiren creative technologist. Oneavex'in kurucusu, ModdTeam'in geliştiricisi.",
    h1: "Ataberk Soylu hakkında",
    cta: "Birlikte bir şey kuralım: aklındakini kısaca yaz.",
  },
  en: {
    title: "Who is Ataberk Soylu? Creative Technologist and AI Specialist",
    description:
      "Ataberk Soylu: an Istanbul-based creative technologist joining design, motion, AI and web development in one production process. Founder of Oneavex, builder of ModdTeam.",
    h1: "About Ataberk Soylu",
    cta: "Let's build something together: tell me what you have in mind.",
  },
};

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
    title: { absolute: meta[l].title },
    description: meta[l].description,
    alternates: {
      canonical: `/${l}/about`,
      languages: { tr: "/tr/about", en: "/en/about", "x-default": "/tr/about" },
    },
    openGraph: { title: meta[l].title, description: meta[l].description, url: `/${l}/about`, type: "profile", images: [`/${l}/opengraph-image`] },
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
          <h1 className="text-sm text-bone-dim">{meta[locale].h1}</h1>
          <p
            className="font-display mt-6 max-w-5xl leading-[1.05] font-semibold tracking-tight text-balance"
            style={{ fontSize: "var(--text-h1)" }}
          >
            {t.intro}
          </p>
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
              <p className="text-sm leading-relaxed text-bone-dim">
                {t.thesis}
              </p>
            </div>
            <div className="col-span-12 md:col-span-4 md:col-start-9">
              <dl className="space-y-10">
                {t.ventures.map((v) => (
                  <div key={v.name}>
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
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-bone-dim">
              {t.collaboration.areas.join(", ")}.
            </p>
          </section>

          <ContactBlock locale={locale} heading={meta[locale].cta} />
        </div>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "@id": `${BASE_URL}/${locale}/about#page`,
            url: `${BASE_URL}/${locale}/about`,
            name: meta[locale].title,
            inLanguage: locale,
            mainEntity: { "@id": PERSON_ID },
          }),
        }}
      />
    </main>
  );
}
