import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/url";
import { work } from "@/content/work";
import { services, servicePath, serviceAlternates } from "@/content/services";

const BASE = BASE_URL;
const abs = (paths: Record<string, string>) =>
  Object.fromEntries(Object.entries(paths).map(([k, v]) => [k, `${BASE}${v}`]));

// Every page in both languages, each entry naming its translation (hreflang).
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pair = (path: string, priority: number): MetadataRoute.Sitemap =>
    (["tr", "en"] as const).map((l) => ({
      url: `${BASE}/${l}${path}`,
      lastModified,
      changeFrequency: "monthly",
      priority,
      alternates: { languages: abs({ tr: `/tr${path}`, en: `/en${path}`, "x-default": `/tr${path}` }) },
    }));

  return [
    ...pair("", 1),
    ...pair("/about", 0.8),
    ...pair("/lab", 0.6),
    ...work.tr.items.flatMap((w) => pair(`/work/${w.slug}`, 0.8)),
    ...(["tr", "en"] as const).map((l) => ({
      url: `${BASE}${servicePath(l)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.9,
      alternates: { languages: abs({ tr: servicePath("tr"), en: servicePath("en"), "x-default": servicePath("tr") }) },
    })),
    ...(["tr", "en"] as const).flatMap((l) =>
      services[l].items.map((s) => ({
        url: `${BASE}${servicePath(l, s.slug)}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.9,
        alternates: { languages: abs(serviceAlternates(s.key)) },
      })),
    ),
  ];
}
