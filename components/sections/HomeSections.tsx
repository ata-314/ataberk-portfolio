import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { SiteContent } from "@/content/site";

export function AISystems({ t }: { t: SiteContent["aiSystems"] }) {
  return (
    <section
      id="ai-systems"
      className="relative z-10 border-t border-graphite bg-ink px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <h2 className="font-display font-semibold tracking-tight" style={{ fontSize: "var(--text-h2)" }}>
              {t.heading}
            </h2>
            <p className="mt-4 max-w-sm text-bone-dim">{t.lead}</p>
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-6">
            <dl className="divide-y divide-graphite">
              {t.entries.map((e) => (
                <div key={e.name} className="grid grid-cols-12 gap-3 py-7">
                  <dt lang="en" className="font-display col-span-12 text-lg font-semibold md:col-span-5">
                    {e.name}
                  </dt>
                  <dd className="col-span-12 text-sm leading-relaxed text-bone-dim md:col-span-7">
                    {e.desc}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutPreview({
  locale,
  t,
}: {
  locale: Locale;
  t: SiteContent["aboutPreview"];
}) {
  return (
    <section
      className="relative z-10 border-t border-graphite bg-ink px-6 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-7xl">
        <p className="font-mono text-[11px] tracking-widest text-bone-dim uppercase">{t.heading}</p>
        <p
          className="font-display mt-6 max-w-4xl leading-[1.1] font-semibold tracking-tight text-balance"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {t.line}
        </p>
        <Link
          href={`/${locale}/about`}
          className="mt-8 inline-block border border-graphite px-6 py-3 font-mono text-xs tracking-widest text-bone-dim uppercase transition-colors hover:border-bone hover:text-bone"
        >
          {t.cta} →
        </Link>
      </div>
    </section>
  );
}

// Final scene: transparent stage — the code matter returns behind the words.
export function ContactFinale({ t }: { t: SiteContent["contact"] }) {
  return (
    <section
      id="contact"
      className="pointer-events-none relative z-10 flex min-h-[90svh] flex-col justify-center px-6 md:px-10"
    >
      <div className="mx-auto w-full max-w-7xl">
        <p className="font-mono text-[11px] tracking-widest text-bone-dim uppercase">{t.heading}</p>
        <h2
          className="font-display mt-6 max-w-5xl leading-[1.05] font-semibold tracking-tight text-balance"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {t.line}
        </h2>
        <ul className="pointer-events-auto mt-10 flex max-w-2xl flex-wrap gap-3">
          {t.intents.map((intent) => (
            <li
              key={intent}
              className="rounded-full border border-graphite bg-ink/50 px-5 py-2.5 text-sm text-bone backdrop-blur-sm transition-colors hover:border-lime hover:text-lime"
            >
              {intent}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer({ t, name }: { t: SiteContent["footer"]; name: string }) {
  return (
    <footer className="relative z-10 border-t border-graphite bg-ink px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-4">
        <p className="font-display text-sm font-semibold">{name}</p>
        <p className="text-xs text-bone-dim">{t.built}</p>
        <p className="font-mono text-[11px] text-bone-dim/60">
          © {new Date().getFullYear()} · {t.rights}
        </p>
      </div>
    </footer>
  );
}
