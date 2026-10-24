import Link from "next/link";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { BASE_URL, PERSON_ID } from "@/lib/url";
import { site } from "@/content/site";
import { work } from "@/content/work";
import { services, servicePath } from "@/content/services";
import { guides, guidePath, getGuide, guideAlternates, type Guide } from "@/content/guides";
import { Footer } from "@/components/sections/HomeSections";
import { ContactBlock } from "@/components/contact/ContactPage";
import "@/components/services/services-page.css";
import "./guides.css";

// The guides hub (/tr/rehber, /en/guides) and one page per article: plain,
// server-rendered reading pages for people and answer engines alike.

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const date = (iso: string, locale: Locale) =>
  new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

export function guideHubMetadata(locale: Locale): Metadata {
  const h = guides[locale].hub;
  return {
    title: h.title,
    description: h.description,
    alternates: { canonical: guidePath(locale), languages: { tr: guidePath("tr"), en: guidePath("en"), "x-default": guidePath("tr") } },
    openGraph: { title: h.title, description: h.description, url: guidePath(locale), type: "website", images: [`/${locale}/opengraph-image`] },
  };
}

export function guideMetadata(locale: Locale, slug: string): Metadata {
  const g = getGuide(locale, slug);
  if (!g) return {};
  return {
    title: { absolute: `${g.title} — Ataberk Soylu` },
    description: g.description,
    alternates: { canonical: guidePath(locale, slug), languages: guideAlternates(g.key) },
    openGraph: {
      title: g.title,
      description: g.description,
      url: guidePath(locale, slug),
      type: "article",
      publishedTime: g.published,
      modifiedTime: g.updated,
      authors: ["Ataberk Soylu"],
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export function GuideHub({ locale }: { locale: Locale }) {
  const g = guides[locale];
  return (
    <main id="content" className="relative z-10 bg-ink">
      <header className="px-6 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <h1 className="svc-title font-display font-semibold">{g.hub.h1}</h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-bone-dim md:text-xl">{g.hub.lead}</p>
        </div>
      </header>
      <div className="px-6 md:px-10" style={{ paddingBlock: "var(--space-section)" }}>
        <ul className="svc-grid mx-auto max-w-7xl">
          {g.items.map((item) => (
            <li key={item.slug}>
              <Link href={guidePath(locale, item.slug)} className="svc-card group">
                <h2 className="font-display text-2xl font-semibold tracking-[-0.03em]">{item.h1}</h2>
                <p className="mt-4 text-bone-dim">{item.description}</p>
                <span className="mt-8 inline-block text-sm text-bone transition-transform duration-500 group-hover:translate-x-1">
                  {g.labels.read} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
    </main>
  );
}

export function GuideArticle({ locale, guide }: { locale: Locale; guide: Guide }) {
  const g = guides[locale];
  const url = `${BASE_URL}${guidePath(locale, guide.slug)}`;
  const service = services[locale].items.find((s) => s.key === guide.service);
  const cited = guide.work
    .map((slug) => work[locale].items.find((w) => w.slug === slug))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${url}#article`,
      headline: guide.title,
      description: guide.description,
      inLanguage: locale,
      datePublished: guide.published,
      dateModified: guide.updated,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      mainEntityOfPage: url,
      image: `${BASE_URL}/${locale}/opengraph-image`,
      ...(service ? { about: { "@type": "Service", name: service.name, url: `${BASE_URL}${servicePath(locale, service.slug)}` } } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: services[locale].labels.home, item: `${BASE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: g.hub.h1, item: `${BASE_URL}${guidePath(locale)}` },
        { "@type": "ListItem", position: 3, name: guide.h1, item: url },
      ],
    },
  ];

  return (
    <main id="content" className="relative z-10 bg-ink">
      <article>
        <header className="px-6 pt-32 md:px-10 md:pt-44">
          <div className="mx-auto max-w-3xl">
            <nav aria-label="Breadcrumb" className="svc-crumbs text-sm text-bone-dim">
              <Link href={`/${locale}`} className="link-draw hover:text-bone">{services[locale].labels.home}</Link>
              <span aria-hidden> / </span>
              <Link href={guidePath(locale)} className="link-draw hover:text-bone">{g.hub.h1}</Link>
            </nav>
            <h1 className="guide-title font-display mt-10 font-semibold">{guide.h1}</h1>
            <p className="mt-6 text-sm text-bone-dim">
              Ataberk Soylu · {g.labels.updated} <time dateTime={guide.updated}>{date(guide.updated, locale)}</time>
            </p>
            <p className="mt-8 text-lg leading-relaxed text-bone md:text-xl">{guide.lead}</p>
          </div>
        </header>

        <div className="px-6 md:px-10" style={{ paddingTop: "calc(var(--space-section) * 0.6)" }}>
          <div className="guide-body mx-auto max-w-3xl">
            {guide.sections.map((s) => (
              <section key={s.h2}>
                <h2>{s.h2}</h2>
                {s.body.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
                {s.list && (
                  <ul>
                    {s.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </article>

      <div className="px-6 md:px-10" style={{ paddingBlock: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl space-y-20">
          {cited.length > 0 && (
            <section>
              <h2 className="svc-h2">{g.labels.related}</h2>
              <ul className="svc-work mt-10">
                {cited.map((w) => (
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
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {service && (
            <p className="text-lg text-bone-dim">
              {g.labels.service}:{" "}
              <Link href={servicePath(locale, service.slug)} className="link-draw text-bone">
                {service.name} →
              </Link>
            </p>
          )}
          <ContactBlock locale={locale} heading={g.labels.cta} serviceKey={guide.service} />
        </div>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <JsonLd data={schema} />
    </main>
  );
}
