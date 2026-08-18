import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { work, type WorkItem } from "@/content/work";
import { SystemVisual } from "../work/SystemVisual";

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
      className={`group block ${className}`}
    >
      {children}
    </Link>
  );
}

function ProjectCopy({
  item,
  index,
  open,
  featured = false,
}: {
  item: WorkItem;
  index: number;
  open: string;
  featured?: boolean;
}) {
  return (
    <div className="border-t border-white/12 pt-5">
      <div className="flex items-start justify-between gap-5">
        <Meta item={item} />
        <span aria-hidden className="font-mono text-[10px] tracking-[0.22em] text-bone-dim/45">
          {String(index).padStart(2, "0")}
        </span>
      </div>
      <h3
        className={`font-display mt-4 font-semibold tracking-[-0.04em] text-balance transition-colors duration-500 group-hover:text-lime ${
          featured ? "text-5xl md:text-7xl" : "text-3xl md:text-5xl"
        }`}
      >
        {item.title}
      </h3>
      <p className={`mt-4 leading-relaxed text-bone-dim ${featured ? "max-w-2xl text-base md:text-lg" : "max-w-xl text-sm md:text-base"}`}>
        {item.idea}
      </p>
      <span className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-lime uppercase">
        {open} <span aria-hidden>↗</span>
      </span>
    </div>
  );
}

// Open editorial rhythm: copy and media live on the page grid rather than in
// nested cards. Empty media stages preserve the final image/video geometry.
export function WorkSection({ locale, visualLabel }: { locale: Locale; visualLabel: string }) {
  const t = work[locale];
  const [featured, system, wide, splitA, typo, splitB] = t.items;

  return (
    <section
      id="work"
      className="relative z-20 px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="work-intro-shell grid gap-10 p-7 md:grid-cols-12 md:p-12 lg:p-16">
          <div className="md:col-span-7">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_14px_rgba(200,255,62,0.65)]" />
              <p className="font-mono text-[10px] tracking-[0.34em] text-lime uppercase">
                01 / {locale === "tr" ? "Seçki" : "Selection"}
              </p>
            </div>
            <h2
              className="font-display mt-7 leading-[0.95] font-semibold tracking-[-0.055em] text-balance"
              style={{ fontSize: "clamp(3rem, 7vw, 7.5rem)" }}
            >
              {t.heading}
            </h2>
          </div>
          <div className="flex flex-col justify-between gap-10 md:col-span-5 md:border-l md:border-white/10 md:pl-10">
            <p className="max-w-md text-base leading-relaxed text-bone-dim text-balance md:text-lg">
              {locale === "tr"
                ? "Gerçek sistemler, çalışan ürünler ve hareketli kimlikler — fikirden yayına uzanan seçili işler."
                : "Real systems, working products and moving identities — selected work from idea to release."}
            </p>
            <div className="flex flex-wrap gap-2">
              {["AI Systems", "Creative Development", "Motion + 3D"].map((label) => (
                <span key={label} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 font-mono text-[9px] tracking-[0.14em] text-bone-dim uppercase">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="col-span-full flex items-center justify-between border-t border-white/10 pt-5 font-mono text-[9px] tracking-[0.22em] text-bone-dim/55 uppercase">
            <span>{locale === "tr" ? "Altı seçili sistem" : "Six selected systems"}</span>
            <span aria-hidden>01 — 06</span>
          </div>
        </div>

        {/* 01 — Lead story: generous copy followed by a cinematic media plane */}
        <CaseLink locale={locale} slug={featured.slug} className="mt-20 md:mt-24">
          <ProjectCopy item={featured} index={1} open={t.open} featured />
          <SystemVisual item={featured} label={visualLabel} className="mt-9 aspect-[4/3] w-full sm:aspect-[16/9]" />
        </CaseLink>

        {/* 02 — Media leads; copy rests on the same baseline */}
        <CaseLink locale={locale} slug={system.slug} className="mt-32 grid items-end gap-8 md:mt-44 md:grid-cols-12 md:gap-12">
          <SystemVisual item={system} label={visualLabel} className="aspect-[4/3] md:col-span-8" />
          <div className="md:col-span-4 md:pb-4">
            <ProjectCopy item={system} index={2} open={t.open} />
          </div>
        </CaseLink>

        {/* 03 — Alternating composition creates a natural reading cadence */}
        <CaseLink locale={locale} slug={wide.slug} className="mt-32 grid items-end gap-8 md:mt-44 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4 md:pb-4">
            <ProjectCopy item={wide} index={3} open={t.open} />
          </div>
          <SystemVisual item={wide} label={visualLabel} className="aspect-[4/3] md:col-span-8" />
        </CaseLink>

        {/* 04 + 05 — Two independent media columns, without card shells */}
        <div className="mt-32 grid gap-x-8 gap-y-28 md:mt-44 md:grid-cols-2 md:gap-x-12">
          {[splitA, typo].map((item, i) => (
            <CaseLink key={item.slug} locale={locale} slug={item.slug}>
              <SystemVisual item={item} label={visualLabel} className={`aspect-[4/5] ${i === 1 ? "md:mt-24" : ""}`} />
              <div className="mt-7">
                <ProjectCopy item={item} index={i + 4} open={t.open} />
              </div>
            </CaseLink>
          ))}
        </div>

        {/* 06 — A wide final plane closes the portfolio sequence */}
        <CaseLink locale={locale} slug={splitB.slug} className="mt-32 md:mt-44">
          <ProjectCopy item={splitB} index={6} open={t.open} />
          <SystemVisual item={splitB} label={visualLabel} className="mt-9 aspect-[16/10] w-full md:aspect-[21/9]" />
        </CaseLink>
      </div>
    </section>
  );
}
