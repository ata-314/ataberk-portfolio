import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { home } from "@/content/home";
import { Hero } from "@/components/hero/Hero";
import { BirdCompanion } from "@/components/three/BirdCompanion";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = home[locale];
  const other = locale === "tr" ? "en" : "tr";

  return (
    <main>
      {/* Hologram eagle — assembles from the hero streams, flies with page scroll */}
      <BirdCompanion />
      {/* Hero — "Creative Intelligence Field / Terrain of Mind" (V2, approved) */}
      <Hero
        t={{
          name: t.name,
          title: t.title,
          tagline: t.tagline,
          ctaWork: t.hero.ctaWork,
          ctaAbout: t.hero.ctaAbout,
          scrollHint: t.hero.scrollHint,
          otherLocale: other,
        }}
      />

      {/* Selected Work — candidate index; case pages ship as they're confirmed */}
      <section id="work" className="border-t border-graphite px-6 py-24 md:px-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {t.work.heading}
          </h2>
          <span className="font-mono text-xs tracking-widest text-bone-dim/60 uppercase">
            {t.work.note}
          </span>
        </div>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-sm bg-graphite md:grid-cols-2">
          {t.work.items.map((item) => (
            <li key={item.title} className="group bg-ink p-8 transition-colors hover:bg-coal md:p-10">
              <p className="font-mono text-xs tracking-widest text-lime/80 uppercase">
                {item.category}
              </p>
              <h3 className="font-display mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-bone-dim">
                {item.blurb}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Capabilities — four systems, no skill bars */}
      <section id="capabilities" className="border-t border-graphite px-6 py-24 md:px-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
          {t.capabilities.heading}
        </h2>
        <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {t.capabilities.systems.map((cap, i) => (
            <div key={cap.system}>
              <p className="font-mono text-xs tracking-widest text-bone-dim/60">
                0{i + 1}
              </p>
              <h3 lang="en" className="font-display mt-2 text-lg font-semibold">
                {cap.system}
              </h3>
              <ul className="mt-5 space-y-2.5 border-l border-graphite pl-4">
                {cap.items.map((item) => (
                  <li key={item} lang="en" className="text-sm text-bone-dim">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* About — approach manifesto, not a biography */}
      <section id="about" className="border-t border-graphite px-6 py-24 md:px-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
          {t.about.heading}
        </h2>
        <div className="mt-14 max-w-3xl space-y-8">
          {t.about.beats.map((beat) => (
            <p key={beat} className="text-xl leading-relaxed text-bone md:text-2xl">
              {beat}
            </p>
          ))}
          <p className="border-l-2 border-lime pl-5 text-sm leading-relaxed text-bone-dim">
            {t.about.thesis}
          </p>
        </div>
      </section>

      {/* Contact — channel lands once decided; intents are the real content */}
      <section id="contact" className="border-t border-graphite px-6 py-24 pb-32 md:px-16">
        <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
          {t.contact.heading}
        </h2>
        <p className="mt-8 text-lg text-bone-dim">{t.contact.lead}</p>
        <ul className="mt-6 flex max-w-2xl flex-wrap gap-3">
          {t.contact.intents.map((intent) => (
            <li
              key={intent}
              className="rounded-full border border-graphite px-5 py-2.5 text-sm text-bone transition-colors hover:border-lime hover:text-lime"
            >
              {intent}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
