import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { BASE_URL, PERSON_ID } from "@/lib/url";
import { site } from "@/content/site";
import { work } from "@/content/work";
import { services, servicePath, type Service } from "@/content/services";
import { Footer } from "@/components/sections/HomeSections";
import { ContactBlock } from "@/components/contact/ContactPage";
import { ClientStrip } from "@/components/sections/ClientStrip";
import { guides, guidePath } from "@/content/guides";
import { PageHero, SubSection, Faq } from "@/components/page/PageHero";
import { PageMotion } from "@/components/page/PageMotion";
import { ServiceArt } from "@/components/sections/ServiceArt";
import { contactPage } from "@/content/contact";
import "@/components/sections/services.css";
import "@/components/page/subpage.css";
import "./services-page.css";

// The service hub (/tr/hizmetler, /en/services) and one page per service.
// Server-rendered text first: these pages exist to be read by search engines
// and AI answer engines as much as by people, so every fact sits in plain HTML.

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// Which home-page scene stands for each service (components/sections/ServiceArt.tsx):
// 0 web, 1 apps, 2 automation, 3 agent, 4 film, 5 brand. Glow colours as in services.css.
const SCENE: Record<string, [number, string]> = {
  "web-design": [0, "var(--violet)"],
  "real-estate": [0, "var(--blue)"],
  "web-dev": [1, "var(--blue)"],
  ux: [1, "var(--indigo)"],
  ai: [3, "var(--indigo)"],
  "ai-art": [4, "var(--magenta)"],
  motion: [4, "var(--violet)"],
  graphic: [5, "var(--blue)"],
};

function Scene({ serviceKey, locale }: { serviceKey: string; locale: Locale }) {
  const [kind, glow] = SCENE[serviceKey] ?? [0, "var(--violet)"];
  return (
    <div className="services-section sub-scene" data-active="true" style={{ ["--glow" as string]: glow, paddingBlock: 0 }}>
      <div className="service-visual">
        <span className="service-halo" aria-hidden="true" />
        <ServiceArt kind={kind} locale={locale} />
      </div>
    </div>
  );
}

function HeroActions({ locale }: { locale: Locale }) {
  return (
    <>
      <a href="#contact" data-track="cta_contact" className="hero-cta">
        {contactPage[locale].cta} <span aria-hidden>↗</span>
      </a>
      <a href="#work" className="link-draw text-bone">
        {locale === "tr" ? "İşleri gör" : "See the work"}
      </a>
    </>
  );
}

function Cta({ locale, serviceKey }: { locale: Locale; serviceKey?: string }) {
  return <ContactBlock locale={locale} heading={services[locale].labels.ctaLine} serviceKey={serviceKey} />;
}

function OtherServices({ locale, except }: { locale: Locale; except?: string }) {
  return (
    <ul className="sub-links">
      {services[locale].items
        .filter((s) => s.slug !== except)
        .map((s) => (
          <li key={s.slug}>
            <Link href={servicePath(locale, s.slug)} >
              <span>{s.name}</span>
              <span aria-hidden>→</span>
            </Link>
          </li>
        ))}
    </ul>
  );
}

export function ServiceHub({ locale }: { locale: Locale }) {
  const s = services[locale];
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${BASE_URL}${servicePath(locale)}#service`,
    name: "Ataberk Soylu",
    description: s.hub.description,
    url: `${BASE_URL}${servicePath(locale)}`,
    founder: { "@id": PERSON_ID },
    address: { "@type": "PostalAddress", addressLocality: "İstanbul", addressCountry: "TR" },
    areaServed: [{ "@type": "City", name: "İstanbul" }, { "@type": "Country", name: "Türkiye" }],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: s.labels.all,
      itemListElement: s.items.map((item) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: item.name, url: `${BASE_URL}${servicePath(locale, item.slug)}` },
      })),
    },
  };

  return (
    <main id="content" className="sub-page relative z-10">
      <PageMotion />
      <PageHero
        crumbs={[{ label: s.labels.home, href: `/${locale}` }, { label: s.labels.all }]}
        title={s.hub.h1}
        lead={s.hub.lead}
        actions={<a href="#contact" data-track="cta_contact" className="hero-cta">{contactPage[locale].cta} <span aria-hidden>↗</span></a>}
        visual={<Scene serviceKey="ai" locale={locale} />}
      />
      <div className="sub-body">
        <ul className="sub-hub-grid">
          {s.items.map((item, i) => (
            <li key={item.slug} data-rise style={{ ["--rd" as string]: `${(i % 3) * 0.08}s` }}>
              <Link href={servicePath(locale, item.slug)} className="sub-card sub-hub-card group">
                <div className="sub-hub-scene" aria-hidden>
                  <Scene serviceKey={item.key} locale={locale} />
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">{item.name}</h2>
                <p>{item.lead}</p>
                <span className="mt-6 inline-block text-sm text-lime transition-transform duration-500 group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <p data-rise className="max-w-3xl text-lg leading-relaxed text-bone-dim">{s.hub.who}</p>
        <div className="-mx-5 md:-mx-10">
          <ClientStrip locale={locale} />
        </div>
        <Cta locale={locale} />
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <JsonLd data={schema} />
    </main>
  );
}

export function ServiceDetail({ locale, item }: { locale: Locale; item: Service }) {
  const s = services[locale];
  const url = `${BASE_URL}${servicePath(locale, item.slug)}`;
  const projects = item.work
    .map((slug) => work[locale].items.find((w) => w.slug === slug))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));
  const reading = guides[locale].items.filter((g) => g.service === item.key);

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service`,
      name: item.name,
      serviceType: item.terms,
      description: item.description,
      url,
      provider: { "@id": PERSON_ID },
      areaServed: [{ "@type": "City", name: "İstanbul" }, { "@type": "Country", name: "Türkiye" }],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: item.name,
        itemListElement: item.offers.map((o) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: o.name, description: o.desc },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: item.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: s.labels.home, item: `${BASE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: s.labels.all, item: `${BASE_URL}${servicePath(locale)}` },
        { "@type": "ListItem", position: 3, name: item.name, item: url },
      ],
    },
  ];

  return (
    <main id="content" className="sub-page relative z-10">
      <PageMotion />
      <PageHero
        crumbs={[
          { label: s.labels.home, href: `/${locale}` },
          { label: s.labels.all, href: servicePath(locale) },
          { label: item.name },
        ]}
        title={item.h1}
        lead={item.lead}
        actions={<HeroActions locale={locale} />}
        visual={<Scene serviceKey={item.key} locale={locale} />}
      />

      <div className="sub-body">
        <SubSection heading={s.labels.offers}>
          <div className="sub-cards">
            {item.offers.map((o, i) => (
              <div key={o.name} className="sub-card" data-rise style={{ ["--rd" as string]: `${(i % 2) * 0.08}s` }}>
                <span className="sub-card-dot" aria-hidden />
                <h3>{o.name}</h3>
                <p>{o.desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection heading={s.labels.approach}>
          <ol className="sub-steps">
            {item.approach.map((a) => (
              <li key={a} data-rise>{a}</li>
            ))}
          </ol>
        </SubSection>

        {projects.length > 0 && (
          <section id="work" className="scroll-mt-28">
            <h2 className="sub-h2">{s.labels.work}</h2>
            <ul className="sub-work mt-10">
              {projects.map((w, i) => (
                <li key={w.slug} data-rise style={{ ["--rd" as string]: `${(i % 2) * 0.1}s` }}>
                  <Link href={`/${locale}/work/${w.slug}`} className="group" data-cursor="view">
                    {w.media && "image" in w.media && (
                      <div className="sub-work-frame">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={w.media.image} alt={w.title} loading="lazy" decoding="async" />
                      </div>
                    )}
                    <span className="sub-work-meta">
                      <span className="font-display text-xl font-semibold tracking-[-0.02em] text-bone">{w.title}</span>
                      <span className="text-sm text-bone-dim">{w.category} · {w.year}</span>
                    </span>
                    <span className="mt-2 block text-sm leading-relaxed text-bone-dim">{w.idea}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <SubSection heading={s.labels.faq}>
          <Faq items={item.faq} />
        </SubSection>

        {reading.length > 0 && (
          <SubSection heading={guides[locale].hub.h1}>
            <ul className="sub-links">
              {reading.map((g) => (
                <li key={g.slug}>
                  <Link href={guidePath(locale, g.slug)}>
                    <span>{g.h1}</span>
                    <span aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SubSection>
        )}

        <div className="-mx-5 md:-mx-10">
          <ClientStrip locale={locale} />
        </div>

        <Cta locale={locale} serviceKey={item.key} />

        <SubSection heading={s.labels.all}>
          <OtherServices locale={locale} except={item.slug} />
        </SubSection>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <JsonLd data={schema} />
    </main>
  );
}
