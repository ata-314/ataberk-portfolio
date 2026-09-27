import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";

// Editorial index: each project is one large typographic row. No media
// placeholders — imagery joins the rows once real case media exists.
// Hovering one row quiets the others so the eye lands on a single title.
export function WorkSection({ locale }: { locale: Locale }) {
  const t = work[locale];
  const tr = locale === "tr";

  return (
    <section
      id="work"
      className="relative z-20 px-5 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-[88rem]">
        <div data-reveal className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2
            className="font-display leading-[0.9] font-semibold tracking-[-0.05em] md:col-span-8"
            style={{ fontSize: "clamp(3.2rem, 8vw, 8rem)" }}
          >
            {t.heading}
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-bone-dim md:col-span-4 md:justify-self-end md:pb-3">
            {tr
              ? "Gerçek sistemler, çalışan ürünler ve hareketli kimlikler. Fikirden yayına."
              : "Real systems, working products and moving identities. From idea to release."}
          </p>
        </div>

        <ul className="work-index mt-16 md:mt-24">
          {t.items.map((item) => (
            <li key={item.slug} data-reveal>
              <Link
                href={`/${locale}/work/${item.slug}`}
                data-cursor="view"
                className="work-row group grid gap-3 py-7 md:grid-cols-12 md:items-baseline md:gap-8 md:py-9"
              >
                <h3
                  className="font-display leading-[0.95] font-semibold tracking-[-0.045em] text-balance transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] md:col-span-7 md:group-hover:translate-x-3"
                  style={{ fontSize: "clamp(2.1rem, 5vw, 5rem)" }}
                >
                  {item.title}
                </h3>
                <div className="md:col-span-5">
                  <p className="text-sm text-bone">
                    {item.category}
                    <span className="text-bone-dim"> — {item.year}</span>
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-bone-dim md:text-[15px]">
                    {item.idea}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
