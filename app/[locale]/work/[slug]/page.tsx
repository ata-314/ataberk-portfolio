import type { Metadata } from "next";
import Link from "next/link";
import "@/components/sections/work.css";
import "@/components/work/case.css";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n";
import { work, getWorkItem } from "@/content/work";
import { Footer } from "@/components/sections/HomeSections";
import { site } from "@/content/site";
import { galleries } from "@/content/work-gallery";
import { CaseShow } from "@/components/work/CaseShow";

const labels = {
  tr: {
    role: "Rol", year: "Yıl", category: "Kategori", next: "Sonraki proje", back: "Tüm işler",
    built: "Kullanılanlar", highlights: "Öne çıkanlar.", phones: "Telefonda da.", phonesBody: "Aynı site, telefonda: her bölüm tek elde gezilecek şekilde.", prev: "Önceki", nextSlide: "Sonraki", screens: "Ekranlar", desktop: "Masaüstü", phone: "Mobil", app: "Uygulama ekranları",
    ask: "Markan için benzerini birlikte kuralım.", askBody: "Bir site, bir uygulama ya da bir lansman deneyimi: fikrini anlat, nasıl kurulacağını birlikte çıkaralım.", askCta: "İletişime geç",
  },
  en: {
    role: "Role", year: "Year", category: "Category", next: "Next project", back: "All work",
    built: "Built with", highlights: "Get the highlights.", phones: "On the phone, too.", phonesBody: "The same site on a phone: every chapter within reach of one hand.", prev: "Previous", nextSlide: "Next", screens: "Screens", desktop: "Desktop", phone: "Mobile", app: "App screens",
    ask: "Let's build something like this for your brand.", askBody: "A site, an app or a launch experience: tell me the idea and we'll work out how to build it together.", askCta: "Get in touch",
  },
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
  const gallery = galleries[slug];
  const stack = item.sections.find((s) => s.kind === "technical")?.body.join(" · ").split(/\s*·\s*/).map((t) => t.replace(/\.$/, "")).filter(Boolean) ?? [];
  const story = item.sections.filter((s) => s.kind !== "technical");
  const host = item.live?.host;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    description: item.idea,
    author: { "@type": "Person", name: "Ataberk Soylu" },
    ...(item.live ? { url: item.live.url } : {}),
  };

  return (
    <main id="content" className={`relative z-10 ${gallery ? "case-light" : "bg-ink"}`}>
      {/* The product, large and sharp, the way a product page shows it */}
      {gallery && (
        <CaseShow
          locale={locale}
          title={item.title}
          kicker={`${item.category} · ${item.year}`}
          idea={item.idea}
          live={item.live}
          contact={l.askCta}
          hero={item.media && "image" in item.media && gallery.desktop.length ? item.media.image : undefined}
          desktop={gallery.desktop}
          phone={gallery.phone}
          facts={gallery.facts}
          labels={{ highlights: l.highlights, phones: l.phones, phonesBody: l.phonesBody, prev: l.prev, next: l.nextSlide }}
        />
      )}

      {/* Case hero (projects without screens) */}
      {!gallery && (
      <header className="case-hero px-6 pt-32 md:px-10 md:pt-44">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/${locale}#work`}
            className="link-draw text-sm text-bone-dim transition-colors hover:text-bone"
          >
            ← {l.back}
          </Link>
          <p className="case-kicker mt-10">{item.category} · {item.year}</p>
          <h1
            className="font-display case-title mt-4 leading-[0.9] font-semibold tracking-[-0.05em]"
            style={{ fontSize: "clamp(3.2rem, 9vw, 9rem)" }}
          >
            {item.title}
          </h1>
          <div className="mt-8 grid grid-cols-12 gap-6">
            {!gallery && <p className="col-span-12 max-w-2xl text-lg text-bone-dim md:col-span-7">{item.idea}</p>}
            <dl className={`col-span-12 grid grid-cols-3 gap-4 text-sm md:col-span-5 ${gallery ? "md:col-start-8" : ""}`}>
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
      )}

      {/* Without a gallery: a capture of it in a browser frame, or its film */}
      {!gallery && item.media && (
        <div className="px-6 pt-16 md:px-10 md:pt-24">
          <div className="mx-auto max-w-7xl">
            {"video" in item.media ? (
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
            ) : (
              <figure className="case-browser">
                {host && (
                  <figcaption className="case-browser-bar" aria-hidden="true">
                    <i /><i /><i />
                    <span>{host}</span>
                  </figcaption>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.media.image} alt={item.title} style={{ aspectRatio: String(item.media.aspect) }} decoding="async" />
              </figure>
            )}
          </div>
        </div>
      )}

      {/* Story — editorial tempo: alternating column starts */}
      <div className="px-6 md:px-10" style={{ paddingTop: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl space-y-20">
          {gallery && (
            <div className="case-rise grid grid-cols-12 gap-6">
              <dl className="col-span-12 grid grid-cols-3 gap-4 border-t border-black/10 pt-6 text-sm md:col-span-6 md:col-start-6">
                <div><dt className="text-bone-dim">{l.category}</dt><dd className="mt-1 text-bone">{item.category}</dd></div>
                <div><dt className="text-bone-dim">{l.year}</dt><dd className="mt-1 text-bone">{item.year}</dd></div>
                <div><dt className="text-bone-dim">{l.role}</dt><dd className="mt-1 text-bone">{item.role}</dd></div>
              </dl>
            </div>
          )}
          {story.map((s, i) => (
            <section key={s.title} className="case-rise grid grid-cols-12 gap-6">
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
                  <p key={p.slice(0, 24)} className="text-lg leading-relaxed text-bone-dim">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
          {stack.length > 0 && (
            <section className="case-rise grid grid-cols-12 gap-6">
              <h2 className="font-display col-span-12 text-2xl font-semibold tracking-tight md:col-span-4">{l.built}</h2>
              <ul className="case-stack col-span-12 md:col-span-6 md:col-start-6">
                {stack.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* The offer: a brief for the visitor's own project */}
      <section className="px-6 md:px-10" style={{ paddingTop: "var(--space-section)" }}>
        <div className="case-ask case-rise mx-auto max-w-7xl">
          <h2 className="font-display">{l.ask}</h2>
          <p>{l.askBody}</p>
          <Link href={`/${locale}#contact`} className="case-live">
            {l.askCta} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Next project */}
      <Link
        href={`/${locale}/work/${next.slug}`}
        data-cursor="view"
        className="group block px-6 py-20 md:px-10 md:py-28"
      >
        <div className="case-next mx-auto max-w-7xl">
          <div>
            <span className="text-sm text-bone-dim">{l.next}</span>
            <span className="font-display mt-3 block text-4xl font-semibold tracking-[-0.04em] transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-2 md:text-7xl">
              {next.title} →
            </span>
          </div>
          {next.media && "image" in next.media && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={next.media.image} alt="" className="case-next-shot" loading="lazy" decoding="async" />
          )}
        </div>
      </Link>
      <div className="bg-ink text-bone">
        <Footer t={site[locale].footer} name={site[locale].name} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
