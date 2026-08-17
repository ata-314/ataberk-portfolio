import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { work, type WorkItem } from "@/content/work";
import { SystemVisual } from "../work/SystemVisual";
import { SectionIntro } from "./SectionIntro";

function Meta({ item }: { item: WorkItem }) {
  return (
    <p className="font-mono text-[11px] tracking-widest text-bone-dim uppercase">
      {item.category} · {item.year} · {item.role.split("·")[0].trim()}
    </p>
  );
}

function CaseLink({
  locale,
  slug,
  children,
  className = "",
}: {
  locale: Locale;
  slug: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={`/${locale}/work/${slug}`}
      data-cursor="view"
      data-reveal
      className={`group block transition-transform duration-500 ease-out hover:-translate-y-1 ${className}`}
    >
      {children}
    </Link>
  );
}

// Editorial rhythm: featured full-bleed → system diagram → wide cinematic →
// split pair → typographic break → split. One grid, changing composition.
export function WorkSection({ locale, visualLabel }: { locale: Locale; visualLabel: string }) {
  const t = work[locale];
  const [featured, system, wide, splitA, typo, splitB] = t.items;

  return (
    <section
      id="work"
      className="story-surface relative z-10 px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow={locale === "tr" ? "Portfolyo" : "Portfolio"}
          title={t.heading}
          lead={
            locale === "tr"
              ? "Gerçek sistemler, gerçek işler — her biri aynı yaratıcı maddeden."
              : "Real systems, real work — each one cast from the same creative matter."
          }
        />

        {/* 01 — Featured, full width */}
        <CaseLink locale={locale} slug={featured.slug} className="mt-16">
          <SystemVisual item={featured} label={visualLabel} className="aspect-[16/8] w-full" />
          <div className="mt-6 grid grid-cols-12 items-end gap-4">
            <div className="col-span-12 md:col-span-7">
              <Meta item={featured} />
              <h3 className="font-display mt-2 text-4xl font-semibold tracking-tight transition-colors group-hover:text-lime md:text-6xl">
                {featured.title}
              </h3>
            </div>
            <p className="col-span-12 text-base text-bone-dim md:col-span-5">{featured.idea}</p>
          </div>
        </CaseLink>

        {/* 02 — System project, diagram-led, asymmetric */}
        <CaseLink locale={locale} slug={system.slug} className="mt-28 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5 md:pt-10">
            <Meta item={system} />
            <h3 className="font-display mt-2 text-3xl font-semibold tracking-tight transition-colors group-hover:text-lime md:text-5xl">
              {system.title}
            </h3>
            <p className="mt-4 max-w-md text-bone-dim">{system.idea}</p>
            <span className="mt-6 inline-block font-mono text-xs tracking-widest text-lime uppercase">
              {t.open} →
            </span>
          </div>
          <SystemVisual item={system} label={visualLabel} className="col-span-12 aspect-[4/3] md:col-span-7" />
        </CaseLink>

        {/* 03 — Wide cinematic band */}
        <CaseLink locale={locale} slug={wide.slug} className="mt-28">
          <SystemVisual item={wide} label={visualLabel} className="aspect-[21/7] w-full" />
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-3xl font-semibold tracking-tight transition-colors group-hover:text-lime md:text-4xl">
              {wide.title}
            </h3>
            <Meta item={wide} />
          </div>
        </CaseLink>

        {/* 04+06 — Split pair */}
        <div className="mt-28 grid grid-cols-12 gap-6">
          {[splitA, splitB].map((item) => (
            <CaseLink key={item.slug} locale={locale} slug={item.slug} className="col-span-12 md:col-span-6">
              <SystemVisual item={item} label={visualLabel} className="aspect-[4/3]" />
              <div className="mt-4">
                <Meta item={item} />
                <h3 className="font-display mt-1 text-2xl font-semibold tracking-tight transition-colors group-hover:text-lime md:text-3xl">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-md text-sm text-bone-dim">{item.idea}</p>
              </div>
            </CaseLink>
          ))}
        </div>

        {/* 05 — Typographic break */}
        <CaseLink locale={locale} slug={typo.slug} className="mt-28 border-y border-graphite py-14">
          <div className="grid grid-cols-12 items-center gap-4">
            <h3
              className="font-display col-span-12 leading-none font-semibold tracking-tight uppercase transition-colors group-hover:text-lime md:col-span-8"
              style={{ fontSize: "var(--text-h1)" }}
            >
              {typo.title}
            </h3>
            <div className="col-span-12 md:col-span-4">
              <Meta item={typo} />
              <p className="mt-3 text-sm text-bone-dim">{typo.idea}</p>
              <span className="mt-4 inline-block font-mono text-xs tracking-widest text-lime uppercase">
                {t.open} →
              </span>
            </div>
          </div>
        </CaseLink>
      </div>
    </section>
  );
}
