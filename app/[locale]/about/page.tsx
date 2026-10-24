import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { site } from "@/content/site";
import { Footer } from "@/components/sections/HomeSections";
import { ContactBlock } from "@/components/contact/ContactPage";
import { BASE_URL, PERSON_ID } from "@/lib/url";
import Link from "next/link";
import { HologramBust } from "@/components/gl/HologramBust";
import { CodeRain } from "@/components/sections/CodeRain";
import { ClientStrip } from "@/components/sections/ClientStrip";
import { PageHero, SubSection } from "@/components/page/PageHero";
import { PageMotion } from "@/components/page/PageMotion";
import { contactPage, contactPath } from "@/content/contact";
import { services, servicePath } from "@/content/services";
import "@/components/page/subpage.css";

// Who the page is about, in the words people search with.
const meta = {
  tr: {
    title: "Ataberk Soylu Kimdir? Creative Technologist ve Yapay Zeka Uzmanı",
    description:
      "Ataberk Soylu: İstanbul'da tasarım, motion, yapay zekâ ve web geliştirmeyi tek üretim sürecinde birleştiren creative technologist. Oneavex'in kurucusu, ModdTeam'in geliştiricisi.",
    h1: "Ataberk Soylu hakkında",
    cta: "Birlikte bir şey kuralım: aklındakini kısaca yaz.",
    role: "Creative Technologist & Multi Designer · İstanbul",
    work: "İşleri gör",
    ventures: "Kurduklarım",
    disciplines: "Disiplinler",
    academic: "Akademik",
  },
  en: {
    title: "Who is Ataberk Soylu? Creative Technologist and AI Specialist",
    description:
      "Ataberk Soylu: an Istanbul-based creative technologist joining design, motion, AI and web development in one production process. Founder of Oneavex, builder of ModdTeam.",
    h1: "About Ataberk Soylu",
    cta: "Let's build something together: tell me what you have in mind.",
    role: "Creative Technologist & Multi Designer · Istanbul",
    work: "See the work",
    ventures: "What I built",
    disciplines: "Disciplines",
    academic: "Academic",
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

  const m = meta[locale];
  const systems = site[locale].capabilities.systems;

  return (
    <main id="content" className="sub-page relative z-10">
      <PageMotion />
      <PageHero
        crumbs={[{ label: services[locale].labels.home, href: `/${locale}` }, { label: m.h1 }]}
        title={<><span className="sr-only">{m.h1}: </span>{t.intro}</>}
        visualFirst
        meta={m.role}
        lead={t.bio[0]}
        actions={
          <>
            <Link href={contactPath(locale)} data-track="cta_contact" className="hero-cta">
              {contactPage[locale].cta} <span aria-hidden>↗</span>
            </Link>
            <Link href={`/${locale}#work`} className="link-draw text-bone">{m.work}</Link>
          </>
        }
        visual={
          <div className="portrait-frame sub-portrait">
            {/* The same scan and frame as the home page's About section. */}
            <CodeRain className="absolute inset-0 h-full w-full opacity-70" />
            <span className="portrait-mark portrait-mark-tl">[[&nbsp;&nbsp;001&nbsp;&nbsp;]]</span>
            <span className="portrait-ticks portrait-ticks-top" />
            <span className="portrait-ticks portrait-ticks-bottom" />
            <span className="portrait-cross" style={{ left: "4%", top: "50%" }} />
            <span className="portrait-cross" style={{ right: "4%", top: "50%" }} />
            <section className="relative h-full w-full">
              <HologramBust />
            </section>
          </div>
        }
      />

      <div className="sub-body">
        <section className="sub-section">
          <div aria-hidden />
          <div data-rise className="space-y-6">
            {t.bio.slice(1).map((p) => (
              <p key={p.slice(0, 24)} className="font-display text-[clamp(1.4rem,2.6vw,2.2rem)] leading-[1.2] font-semibold tracking-[-0.03em] text-balance">
                {p}
              </p>
            ))}
          </div>
        </section>

        <SubSection heading={m.ventures}>
          <div className="sub-cards">
            {t.ventures.map((v, i) => (
              <div key={v.name} className="sub-card" data-rise style={{ ["--rd" as string]: `${i * 0.08}s` }}>
                <span className="sub-card-dot" aria-hidden />
                <h3 className="!text-2xl">{v.name}</h3>
                <p>{v.desc}</p>
                {v.name === "ModdTeam" && (
                  <Link href={`/${locale}/work/modd-ai`} className="link-draw mt-5 inline-block text-sm text-bone">→</Link>
                )}
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection heading={m.disciplines}>
          <div className="grid gap-10 sm:grid-cols-2">
            {systems.map((sys) => (
              <div key={sys.key} data-rise>
                <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">{sys.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bone-dim">{sys.bridge}</p>
                <ul className="sub-chips mt-4">
                  {sys.items.map((i) => (
                    <li key={i} lang="en">{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection heading={m.academic}>
          <p data-rise className="text-lg leading-relaxed text-bone-dim">{t.thesis}</p>
        </SubSection>

        <SubSection heading={t.collaboration.heading}>
          <ul className="sub-links">
            {services[locale].items.map((s) => (
              <li key={s.slug}>
                <Link href={servicePath(locale, s.slug)}>
                  <span>{s.name}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </SubSection>

        <div className="-mx-5 md:-mx-10">
          <ClientStrip locale={locale} />
        </div>

        <ContactBlock locale={locale} heading={m.cta} />
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
