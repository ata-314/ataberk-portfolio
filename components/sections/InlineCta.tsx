import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { contactPage, contactPath } from "@/content/contact";

// A line and the contact button between home sections, so a visitor who is
// convinced halfway down doesn't have to reach the closing form (by 2026-11-01
// stats, few did: most stop around the services and work).
const lines = {
  services: {
    tr: "Bunlardan biri sana lazım mı? Kısaca anlat, kapsamına göre dönüş yapayım.",
    en: "Need one of these? Tell me briefly and I'll come back with a scope.",
  },
  work: {
    tr: "Benzer bir iş mi düşünüyorsun?",
    en: "Thinking of something similar?",
  },
};

export function InlineCta({ locale, after }: { locale: Locale; after: keyof typeof lines }) {
  return (
    <section data-section={`cta-${after}`} className="relative z-20 px-5 py-12 md:px-10 md:py-16">
      <div data-reveal className="mx-auto flex max-w-[88rem] flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <p className="font-display max-w-2xl text-2xl leading-tight font-semibold tracking-[-0.03em] text-balance md:text-3xl">
          {lines[after][locale]}
        </p>
        <Link href={contactPath(locale)} data-track="cta_contact" className="hero-cta shrink-0">
          {contactPage[locale].cta} <span aria-hidden>↗</span>
        </Link>
      </div>
    </section>
  );
}
