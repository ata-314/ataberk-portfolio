import { BASE_URL, PROFILES } from "@/lib/url";
import { site } from "@/content/site";
import { work } from "@/content/work";
import { services, servicePath } from "@/content/services";

// /llms.txt: a plain summary for AI answer engines (llmstxt.org), built from
// the same content as the pages so it never drifts from them.
export const dynamic = "force-static";

export function GET() {
  const tr = services.tr;
  const en = services.en;
  const lines = [
    "# Ataberk Soylu",
    "",
    `> ${en.hub.who}`,
    "",
    tr.hub.who,
    "",
    "Contact: ataberk@ataberksoylu.com · Location: İstanbul, Türkiye (works remotely) · Languages: Turkish, English",
    `Profiles: ${PROFILES.map((p) => `[${p.name}](${p.url})`).join(" · ")}`,
    "",
    "## Hizmetler (TR)",
    "",
    ...tr.items.map((s) => `- [${s.name}](${BASE_URL}${servicePath("tr", s.slug)}): ${s.description}`),
    "",
    "## Services (EN)",
    "",
    ...en.items.map((s) => `- [${s.name}](${BASE_URL}${servicePath("en", s.slug)}): ${s.description}`),
    "",
    "## Work",
    "",
    ...work.en.items.map((w) => `- [${w.title}](${BASE_URL}/en/work/${w.slug}): ${w.category}, ${w.year}. ${w.idea}`),
    "",
    "## About",
    "",
    `- [About (TR)](${BASE_URL}/tr/about): ${site.tr.about.bio[0]}`,
    `- [About (EN)](${BASE_URL}/en/about): ${site.en.about.bio[0]}`,
    `- [Lab](${BASE_URL}/en/lab): ${site.en.lab.lead}`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
