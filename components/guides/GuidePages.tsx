import Link from "next/link";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { BASE_URL, PERSON_ID } from "@/lib/url";
import { site } from "@/content/site";
import { work } from "@/content/work";
import { services, servicePath } from "@/content/services";
import { guides, guidePath, getGuide, guideAlternates, readingMinutes, sectionId, type Guide } from "@/content/guides";
import { Footer } from "@/components/sections/HomeSections";
import { ContactBlock } from "@/components/contact/ContactPage";
import { PageHero, SubSection, Faq } from "@/components/page/PageHero";
import { PageMotion } from "@/components/page/PageMotion";
import { CodeRain } from "@/components/sections/CodeRain";
import { ReadingProgress } from "./ReadingProgress";
import "@/components/page/subpage.css";
import "./guides.css";

// The guides hub (/tr/rehber, /en/guides) and one page per article: plain,
// server-rendered reading pages for people and answer engines alike, each with
// its contents, short answers (FAQPage) and the work it cites.

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
    keywords: guides[locale].items.flatMap((g) => g.keywords.slice(0, 2)),
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
    keywords: g.keywords,
    alternates: { canonical: guidePath(locale, slug), languages: guideAlternates(g.key) },
    openGraph: {
      title: g.title,
      description: g.description,
      url: guidePath(locale, slug),
      type: "article",
      publishedTime: g.published,
      modifiedTime: g.updated,
      authors: ["Ataberk Soylu"],
      tags: g.keywords,
      images: [`/${locale}/opengraph-image`],
    },
  };
}

function GuideCard({ locale, item, i }: { locale: Locale; item: Guide; i: number }) {
  const g = guides[locale];
  return (
    <li data-rise style={{ ["--rd" as string]: `${(i % 2) * 0.08}s` }}>
      <Link href={guidePath(locale, item.slug)} className="sub-card guide-card group">
        <span className="text-sm text-bone-dim">
          {readingMinutes(item)} {g.labels.minutes}
        </span>
        <h2 className="font-display mt-4 text-2xl font-semibold tracking-[-0.03em] text-balance md:text-3xl">{item.h1}</h2>
        <p>{item.description}</p>
        <ul className="sub-chips mt-6">
          {item.keywords.slice(0, 3).map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <span className="mt-8 inline-block text-sm text-lime transition-transform duration-500 group-hover:translate-x-1">
          {g.labels.read} →
        </span>
      </Link>
    </li>
  );
}

export function GuideHub({ locale }: { locale: Locale }) {
  const g = guides[locale];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${BASE_URL}${guidePath(locale)}#blog`,
    name: g.hub.title,
    description: g.hub.description,
    url: `${BASE_URL}${guidePath(locale)}`,
    inLanguage: locale,
    author: { "@id": PERSON_ID },
    blogPost: g.items.map((item) => ({
      "@type": "BlogPosting",
      headline: item.title,
      url: `${BASE_URL}${guidePath(locale, item.slug)}`,
      datePublished: item.published,
      dateModified: item.updated,
      author: { "@id": PERSON_ID },
    })),
  };
  return (
    <main id="content" className="sub-page relative z-10">
      <PageMotion />
      <div className="guide-hub-head">
        <CodeRain className="guide-hub-rain" />
        <PageHero
          crumbs={[{ label: services[locale].labels.home, href: `/${locale}` }, { label: g.hub.h1 }]}
          title={g.hub.h1}
          lead={g.hub.lead}
        />
      </div>
      <div className="sub-body">
        <ul className="guide-grid">
          {g.items.map((item, i) => (
            <GuideCard key={item.slug} locale={locale} item={item} i={i} />
          ))}
        </ul>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <JsonLd data={schema} />
    </main>
  );
}

export function GuideArticle({ locale, guide }: { locale: Locale; guide: Guide }) {
  const g = guides[locale];
  const url = `${BASE_URL}${guidePath(locale, guide.slug)}`;
  const service = services[locale].items.find((s) => s.key === guide.service);
  const minutes = readingMinutes(guide);
  const others = g.items.filter((x) => x.slug !== guide.slug);
  const cited = guide.work
    .map((slug) => work[locale].items.find((w) => w.slug === slug))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: guide.title,
      description: guide.description,
      keywords: guide.keywords.join(", "),
      inLanguage: locale,
      datePublished: guide.published,
      dateModified: guide.updated,
      wordCount: minutes * 200,
      timeRequired: `PT${minutes}M`,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      mainEntityOfPage: url,
      image: `${BASE_URL}/${locale}/opengraph-image`,
      articleSection: g.hub.h1,
      ...(service ? { about: { "@type": "Service", name: service.name, url: `${BASE_URL}${servicePath(locale, service.slug)}` } } : {}),
      mentions: cited.map((w) => ({ "@type": "CreativeWork", name: w.title, url: `${BASE_URL}/${locale}/work/${w.slug}` })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
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
    <main id="content" className="sub-page relative z-10">
      <PageMotion />
      <ReadingProgress target="#guide-body" />
      <article>
        <PageHero
          compact
          crumbs={[
            { label: services[locale].labels.home, href: `/${locale}` },
            { label: g.hub.h1, href: guidePath(locale) },
            { label: guide.h1 },
          ]}
          title={guide.h1}
          meta={
            <>
              Ataberk Soylu · {g.labels.updated} <time dateTime={guide.updated}>{date(guide.updated, locale)}</time> · {minutes} {g.labels.minutes}
            </>
          }
          lead={guide.lead}
        />

        <div id="guide-body" className="guide-layout">
          <aside className="guide-aside">
            <nav aria-label={g.labels.toc} className="guide-toc">
              <p>{g.labels.toc}</p>
              <ol>
                {guide.sections.map((s) => (
                  <li key={s.h2}>
                    <a href={`#${sectionId(s.h2)}`}>{s.h2}</a>
                  </li>
                ))}
                <li>
                  <a href="#faq">{g.labels.faq}</a>
                </li>
              </ol>
            </nav>
          </aside>

          <div className="guide-body">
            {guide.sections.map((s) => (
              <section key={s.h2} id={sectionId(s.h2)}>
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

            <section id="faq">
              <h2>{g.labels.faq}</h2>
              <Faq items={guide.faq} />
            </section>

            <div className="guide-topics">
              <p className="text-sm text-bone-dim">{g.labels.topics}</p>
              <ul className="sub-chips mt-3">
                {guide.keywords.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>

            <div className="sub-card guide-author">
              <p className="text-sm text-bone-dim">{g.labels.author}</p>
              <Link href={`/${locale}/about`} className="font-display mt-2 block text-xl font-semibold tracking-[-0.02em] text-bone">
                Ataberk Soylu
              </Link>
              <p>{g.labels.authorBio}</p>
            </div>
          </div>
        </div>
      </article>

      <div className="sub-body">
        {cited.length > 0 && (
          <section>
            <h2 className="sub-h2">{g.labels.related}</h2>
            <ul className="sub-work mt-10">
              {cited.map((w) => (
                <li key={w.slug} data-rise>
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
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {service && (
          <SubSection heading={g.labels.service}>
            <ul className="sub-links">
              <li>
                <Link href={servicePath(locale, service.slug)}>
                  <span>{service.name}</span>
                  <span aria-hidden>→</span>
                </Link>
              </li>
            </ul>
          </SubSection>
        )}
        {others.length > 0 && (
          <section>
            <h2 className="sub-h2">{g.labels.more}</h2>
            <ul className="guide-grid mt-10">
              {others.map((item, i) => (
                <GuideCard key={item.slug} locale={locale} item={item} i={i} />
              ))}
            </ul>
          </section>
        )}
      </div>
      <ContactBlock locale={locale} heading={g.labels.cta} serviceKey={guide.service} />
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <JsonLd data={schema} />
    </main>
  );
}
