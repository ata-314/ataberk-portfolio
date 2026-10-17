import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/i18n";
import { services, servicePath, getService, serviceAlternates } from "@/content/services";

// Shared route logic: TR serves /tr/hizmetler, EN serves /en/services. Each
// folder only exists for its own locale; the other locale 404s.

export const hubParams = (locale: Locale) => () => [{ locale }];

export const detailParams = (locale: Locale) => () =>
  services[locale].items.map((s) => ({ locale, slug: s.slug }));

export function owns(locale: string, owner: Locale): locale is Locale {
  return isLocale(locale) && locale === owner;
}

export function hubMetadata(locale: Locale): Metadata {
  const h = services[locale].hub;
  return {
    title: h.title,
    description: h.description,
    alternates: {
      canonical: servicePath(locale),
      languages: { tr: servicePath("tr"), en: servicePath("en"), "x-default": servicePath("tr") },
    },
    openGraph: { title: h.title, description: h.description, url: servicePath(locale), type: "website" },
  };
}

export function detailMetadata(locale: Locale, slug: string): Metadata {
  const item = getService(locale, slug);
  if (!item) return {};
  return {
    title: { absolute: `${item.title} — Ataberk Soylu` },
    description: item.description,
    keywords: item.terms,
    alternates: { canonical: servicePath(locale, slug), languages: serviceAlternates(item.key) },
    openGraph: { title: item.title, description: item.description, url: servicePath(locale, slug), type: "website" },
  };
}
