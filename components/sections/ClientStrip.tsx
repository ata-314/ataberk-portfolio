import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { clientLogos, contactPage } from "@/content/contact";
import "./client-strip.css";

// The brands behind the work, their marks drifting by in one band. Each logo opens
// its case page; the second copy only closes the loop and is hidden from readers.
export function ClientStrip({ locale, className = "" }: { locale: Locale; className?: string }) {
  const row = (copy: boolean) => (
    <ul className="cs-row" aria-hidden={copy || undefined}>
      {clientLogos.map((c) => (
        <li key={c.slug}>
          <Link href={`/${locale}/work/${c.slug}`} tabIndex={copy ? -1 : undefined} className="cs-logo" aria-label={c.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt={copy ? "" : c.name} width={c.w} height={c.hgt} loading="lazy" decoding="async" style={{ ["--h" as string]: c.h }} />
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <section data-section="clients" aria-label={contactPage[locale].clients} className={`client-strip ${className}`}>
      <p className="cs-label">{contactPage[locale].clients}</p>
      <div className="cs-track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
