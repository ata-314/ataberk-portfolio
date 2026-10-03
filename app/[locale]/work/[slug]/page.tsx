import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/work.css";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n";
import { work, getWorkItem } from "@/content/work";
import { Footer } from "@/components/sections/HomeSections";
import { site } from "@/content/site";

const labels = {
  tr: { role: "Rol", year: "Yıl", category: "Kategori", next: "Sonraki proje", back: "Tüm işler" },
  en: { role: "Role", year: "Year", category: "Category", next: "Next project", back: "All work" },
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    work[locale].items.map((w) => ({ locale, slug: w.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = isLocale(locale) ? locale : "tr";
  const item = getWorkItem(l, slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.idea,
    alternates: {
      canonical: `/${l}/work/${slug}`,
      languages: { tr: `/tr/work/${slug}`, en: `/en/work/${slug}` },
    },
    openGraph: { title: item.title, description: item.idea, type: "article" },
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const item = getWorkItem(locale, slug);
  if (!item) notFound();
  const l = labels[locale];
  const items = work[locale].items;
  const next = items[(items.findIndex((w) => w.slug === slug) + 1) % items.length];

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    description: item.idea,
    author: { "@type": "Person", name: "Ataberk Soylu" },
  };

  return (
    <main id="content" className="relative z-10 bg-ink">
      {/* Case hero */}
      <header className="px-6 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/${locale}#work`}
            className="link-draw text-sm text-bone-dim transition-colors hover:text-bone"
          >
            ← {l.back}
          </Link>
          <h1
            className="font-display mt-10 leading-[0.9] font-semibold tracking-[-0.05em]"
            style={{ fontSize: "clamp(3.4rem, 10vw, 10rem)" }}
          >
            {item.title}
          </h1>
          <div className="mt-8 grid grid-cols-12 gap-6">
            <p className="col-span-12 max-w-2xl text-lg text-bone-dim md:col-span-7">{item.idea}</p>
            <dl className="col-span-12 grid grid-cols-3 gap-4 text-sm md:col-span-5">
              <div>
                <dt className="text-bone-dim">{l.category}</dt>
                <dd className="mt-1 text-bone">{item.category}</dd>
              </div>
              <div>
                <dt className="text-bone-dim">{l.year}</dt>
                <dd className="mt-1 text-bone">{item.year}</dd>
              </div>
              <div>
                <dt className="text-bone-dim">{l.role}</dt>
                <dd className="mt-1 text-bone">{item.role}</dd>
              </div>
            </dl>
          </div>
          {item.live && (
            <a href={item.live.url} target="_blank" rel="noopener noreferrer" className="case-live mt-10">
              {item.live.label} <span aria-hidden="true">↗</span>
              <em>{item.live.host}</em>
            </a>
          )}
        </div>
      </header>

      {/* The project's own film */}
      {item.media && (
        <div className="px-6 pt-16 md:px-10 md:pt-24">
          <div className="mx-auto max-w-7xl">
            <video
              className="case-film"
              src={item.media.video}
              poster={item.media.poster}
              style={{ aspectRatio: String(item.media.aspect), width: `min(100%, calc(82svh * ${item.media.aspect}))` }}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={item.title}
            />
          </div>
        </div>
      )}

      {/* Sections — editorial tempo: alternating column starts */}
      <div className="px-6 pb-24 md:px-10" style={{ paddingTop: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl space-y-20">
          {item.sections.map((s, i) => (
            <section key={s.title} className="grid grid-cols-12 gap-6">
              <h2
                className={`font-display col-span-12 text-2xl font-semibold tracking-tight md:col-span-4 ${
                  i % 2 ? "md:col-start-2" : ""
                }`}
              >
                {s.title}
              </h2>
              <div
                className={`col-span-12 space-y-5 md:col-span-6 ${
                  i % 2 ? "md:col-start-7" : "md:col-start-6"
                }`}
              >
                {s.body.map((p) => (
                  <p key={p.slice(0, 24)} className="leading-relaxed text-bone-dim">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Next project */}
      <Link
        href={`/${locale}/work/${next.slug}`}
        data-cursor="view"
        className="group block px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-4">
          <span className="text-sm text-bone-dim">
            {l.next}
          </span>
          <span className="font-display text-4xl font-semibold tracking-[-0.04em] transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-x-2 md:text-7xl">
            {next.title} →
          </span>
        </div>
      </Link>
      <Footer t={site[locale].footer} name={site[locale].name} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
