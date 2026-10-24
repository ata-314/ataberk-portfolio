import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { BASE_URL, PERSON_ID } from "@/lib/url";
import { site } from "@/content/site";
import { work } from "@/content/work";
import { contactPage, contactPath, clientWork } from "@/content/contact";
import { Footer } from "@/components/sections/HomeSections";
import { ContactForm } from "@/components/sections/ContactForm";
import { ClientStrip } from "@/components/sections/ClientStrip";
import "@/components/services/services-page.css";
import "@/components/page/subpage.css";
import { PageMotion } from "@/components/page/PageMotion";
import { Faq } from "@/components/page/PageHero";
import "./contact-page.css";

const EMAIL = "ataberk@ataberksoylu.com";

// Topic preselected on each service page's form, by service key (content/services.ts),
// as an index into site.contact.intents.
const SERVICE_INTENT: Record<string, number> = { "web-design": 0, "web-dev": 0, ux: 0, "real-estate": 0, "ai-art": 1, motion: 1, ai: 2, graphic: 3 };

// The form with a line above it, closing service and case pages so a visitor can
// write from where they are instead of being sent to the home page.
export function ContactBlock({ locale, heading, serviceKey }: { locale: Locale; heading: string; serviceKey?: string }) {
  const c = site[locale].contact;
  const at = serviceKey ? SERVICE_INTENT[serviceKey] : undefined;
  return (
    <section id="contact" className="contact-block">
      <h2 className="svc-h2 max-w-2xl text-balance">{heading}</h2>
      <p className="mt-4 max-w-xl text-bone-dim">{c.note}</p>
      <div className="mt-10 max-w-[46rem]">
        <ContactForm locale={locale} intents={c.intents} t={c.form} initial={at === undefined ? undefined : c.intents[at]} />
      </div>
    </section>
  );
}

export function ContactPage({ locale }: { locale: Locale }) {
  const p = contactPage[locale];
  const c = site[locale].contact;
  const url = `${BASE_URL}${contactPath(locale)}`;
  const clients = clientWork
    .map((slug) => work[locale].items.find((w) => w.slug === slug))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "@id": `${url}#page`,
      name: p.title,
      description: p.description,
      url,
      inLanguage: locale,
      about: { "@id": PERSON_ID },
      mainEntity: {
        "@type": "ProfessionalService",
        name: "Ataberk Soylu",
        url: `${BASE_URL}/${locale}`,
        email: EMAIL,
        founder: { "@id": PERSON_ID },
        address: { "@type": "PostalAddress", addressLocality: "İstanbul", addressCountry: "TR" },
        areaServed: "Worldwide",
        availableLanguage: ["Turkish", "English"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faq.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <main id="content" className="sub-page relative z-10">
      <PageMotion />
      <div className="px-6 pt-32 md:px-10 md:pt-44">
        {/* Phones: intro, form, then the steps; desktop: the form beside both. */}
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
          <header className="lg:col-span-5">
            <h1 className="sub-title font-display">{p.h1}</h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-bone-dim">{p.lead}</p>
            <a href={`mailto:${EMAIL}`} data-track="email" className="link-draw mt-8 inline-block text-bone">
              {EMAIL} <span aria-hidden className="text-lime">↗</span>
            </a>
          </header>
          <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
            <ContactForm locale={locale} intents={c.intents} t={c.form} />
          </div>
          <section className="lg:col-span-5 lg:pt-14">
              <h2 className="text-sm text-bone-dim">{p.steps.heading}</h2>
              <ol className="contact-steps mt-5">
                {p.steps.items.map((s) => (
                  <li key={s.name}>
                    <span className="font-display font-semibold text-bone">{s.name}</span>
                    <span className="text-bone-dim">{s.desc}</span>
                  </li>
                ))}
              </ol>
          </section>
        </div>
      </div>

      <ClientStrip locale={locale} className="mt-16" />

      <div className="px-6 md:px-10" style={{ paddingBlock: "var(--space-section)" }}>
        <div className="mx-auto max-w-7xl space-y-24">
          <section>
            <h2 className="svc-h2">{p.clients}</h2>
            <ul className="contact-clients mt-8">
              {clients.map((w) => (
                <li key={w.slug}>
                  <Link href={`/${locale}/work/${w.slug}`} className="link-draw">
                    {w.title}
                  </Link>
                  <span className="text-sm text-bone-dim">{w.category}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="grid grid-cols-12 gap-6">
            <h2 className="svc-h2 col-span-12 md:col-span-4">{p.faq.heading}</h2>
            <div className="col-span-12 md:col-span-8">
              <Faq items={p.faq.items} />
            </div>
          </section>
        </div>
      </div>
      <Footer t={site[locale].footer} name={site[locale].name} locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
