import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/url";

// Search and AI answer engines are welcome everywhere public; named so the
// intent is explicit. Private stats and the API stay out.
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"];

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/stats", "/api/"];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }, { userAgent: AI_BOTS, allow: "/", disallow }],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
