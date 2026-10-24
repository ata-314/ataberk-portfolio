import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { contactPage, contactPath } from "@/content/contact";

export function contactMetadata(locale: Locale): Metadata {
  const p = contactPage[locale];
  return {
    title: p.title,
    description: p.description,
    alternates: {
      canonical: contactPath(locale),
      languages: { tr: contactPath("tr"), en: contactPath("en"), "x-default": contactPath("tr") },
    },
    openGraph: { title: p.title, description: p.description, url: contactPath(locale), type: "website", images: [`/${locale}/opengraph-image`] },
  };
}
