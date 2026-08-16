import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { work } from "@/content/work";

const BASE = "https://ataberk-portfolio-rho.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    entries.push(
      { url: `${BASE}/${locale}`, changeFrequency: "monthly", priority: 1 },
      { url: `${BASE}/${locale}/about`, changeFrequency: "monthly", priority: 0.8 },
      { url: `${BASE}/${locale}/lab`, changeFrequency: "monthly", priority: 0.6 },
      ...work[locale].items.map((w) => ({
        url: `${BASE}/${locale}/work/${w.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      })),
    );
  }
  return entries;
}
