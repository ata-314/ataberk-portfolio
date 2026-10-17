import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { BASE_URL, PERSON_ID } from "@/lib/url";
import { site } from "@/content/site";
import { work } from "@/content/work";
import { services, servicePath, type Service } from "@/content/services";
import { Footer } from "@/components/sections/HomeSections";
import "./services-page.css";

// The service hub (/tr/hizmetler, /en/services) and one page per service.
// Server-rendered text first: these pages exist to be read by search engines
// and AI answer engines as much as by people, so every fact sits in plain HTML.

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function Crumbs({ locale, current }: { locale: Locale; current?: string }) {
  const l = services[locale].labels;
  return (
    <nav aria-label="Breadcrumb" className="svc-crumbs text-sm text-bone-dim">
      <Link href={`/${locale}`} className="link-draw hover:text-bone">{l.home}</Link>
      <span aria-hidden> / </span>
      {current ? (
        <>
          <Link href={servicePath(locale)} className="link-draw hover:text-bone">{l.all}</Link>
          <span aria-hidden> / </span>
          <span aria-current="page" className="text-bone">{current}</span>
        </>
      ) : (
        <span aria-current="page" className="text-bone">{l.all}</span>
      )}
    </nav>
  );
}

function Cta({ locale }: { locale: Locale }) {
  const l = services[locale].labels;
  return (
    <section className="svc-cta">
      <p className="max-w-xl text-lg text-bone-dim">{l.ctaLine}</p>
      <Link href={`/${locale}#contact`} className="svc-pill">
        {l.cta} <span aria-hidden>↗</span>
      </Link>
    </section>
  );
}

function OtherServices({ locale, except }: { locale: Locale; except?: string }) {
  return (
    <ul className="svc-links">
      {services[locale].items
        .filter((s) => s.slug !== except)
        .map((s) => (
          <li key={s.slug}>
            <Link href={servicePath(locale, s.slug)} className="svc-link">
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
    <main id="content" className="relative z-10 bg-ink">
      <header className="px-6 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <Crumbs locale={locale} />
          <h1 className="svc-title font-display mt-10 max-w-5xl font-semibold">{s.hub.h1}</h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-bone-dim md:text-xl">{s.hub.lead}</p>
        </div>
      </header>
      <div className="px-6 md:px-10" style={{ paddingBlock: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl space-y-24">
          <ul className="svc-grid">
            {s.items.map((item) => (
              <li key={item.slug}>
                <Link href={servicePath(locale, item.slug)} className="svc-card group">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{item.name}</h2>
                  <p className="mt-4 text-bone-dim">{item.lead}</p>
                  <span className="mt-8 inline-block text-sm text-bone transition-transform duration-500 group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <section className="max-w-3xl">
            <p className="text-lg leading-relaxed text-bone-dim">{s.hub.who}</p>
          </section>
          <Cta locale={locale} />
        </div>
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
    <main id="content" className="relative z-10 bg-ink">
      <header className="px-6 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <Crumbs locale={locale} current={item.name} />
          <h1 className="svc-title font-display mt-10 max-w-5xl font-semibold">{item.h1}</h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-bone-dim md:text-xl">{item.lead}</p>
        </div>
      </header>

      <div className="px-6 md:px-10" style={{ paddingBlock: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl space-y-28">
          <section className="grid grid-cols-12 gap-6">
            <h2 className="svc-h2 col-span-12 md:col-span-4">{s.labels.offers}</h2>
            <dl className="col-span-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 md:col-span-8">
              {item.offers.map((o) => (
                <div key={o.name}>
                  <dt className="font-display text-xl font-semibold tracking-[-0.02em]">{o.name}</dt>
                  <dd className="mt-2 leading-relaxed text-bone-dim">{o.desc}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="grid grid-cols-12 gap-6">
            <h2 className="svc-h2 col-span-12 md:col-span-4">{s.labels.approach}</h2>
            <ol className="svc-steps col-span-12 md:col-span-8">
              {item.approach.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </section>

          {projects.length > 0 && (
            <section>
              <h2 className="svc-h2">{s.labels.work}</h2>
              <ul className="svc-work mt-10">
                {projects.map((w) => (
                  <li key={w.slug}>
                    <Link href={`/${locale}/work/${w.slug}`} className="svc-work-card group" data-cursor="view">
                      {w.media && "image" in w.media && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={w.media.image} alt={w.title} loading="lazy" decoding="async" />
                      )}
                      <span className="svc-work-meta">
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

          <section className="grid grid-cols-12 gap-6">
            <h2 className="svc-h2 col-span-12 md:col-span-4">{s.labels.faq}</h2>
            <div className="col-span-12 md:col-span-8">
              {item.faq.map((f) => (
                <div key={f.q} className="svc-faq">
                  <h3 className="font-display text-lg font-semibold tracking-[-0.02em] md:text-xl">{f.q}</h3>
                  <p className="mt-3 leading-relaxed text-bone-dim">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <Cta locale={locale} />

          <section>
            <h2 className="svc-h2">{s.labels.all}</h2>
            <OtherServices locale={locale} except={item.slug} />
          </section>
        </div>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <JsonLd data={schema} />
    </main>
  );
}
