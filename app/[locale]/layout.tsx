import type { Metadata } from "next";
import { Archivo, Audiowide, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, isLocale, type Locale } from "@/lib/i18n";
import { BASE_URL } from "@/lib/url";
import { site } from "@/content/site";
import { services } from "@/content/services";
import { PERSON_ID, PROFILES } from "@/lib/url";

import { Nav } from "@/components/nav/Nav";
import { Tracker } from "@/components/track/Tracker";
import "../globals.css";

// The width axis gives the film strip its condensed titles.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"], axes: ["wdth"] });
// Futuristic display face for the hero name (human decision 2026-09-26),
// a technical grotesk for supporting hero copy, and a code mono for labels
// and the glyphs that build the name.
const audiowide = Audiowide({ variable: "--font-audiowide", subsets: ["latin", "latin-ext"], weight: "400" });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "800"],
});

// Titles and descriptions carry the phrases people search for, in each language.
const meta: Record<Locale, { title: string; description: string; jobTitle: string; knowsAbout: string[] }> = {
  tr: {
    title: "Ataberk Soylu — Yapay Zeka Uzmanı, Web ve Grafik Tasarımcı | İstanbul",
    description:
      "Ataberk Soylu: İstanbul'da yapay zeka uzmanı, yapay zeka artist, web tasarımcısı ve web geliştiricisi, grafik ve UI/UX tasarımcı. AI agent, AI video, sinematik web siteleri ve marka kimliği.",
    jobTitle: "Creative Technologist, Yapay Zeka Uzmanı ve Multi Designer",
    knowsAbout: [
      "Yapay zeka", "Yapay zeka mühendisliği", "AI agent geliştirme", "Çok ajanlı sistemler", "Yapay zeka reklam filmi",
      "Üretken sanat", "Web tasarımı", "Web geliştirme", "Grafik tasarım", "Marka kimliği", "UI/UX tasarım",
      "Motion tasarım", "3D görselleştirme",
    ],
  },
  en: {
    title: "Ataberk Soylu — AI Specialist, Web and Graphic Designer | Istanbul",
    description:
      "Ataberk Soylu: AI specialist, AI artist, web designer and developer, graphic and UI/UX designer in Istanbul. AI agents, AI video, cinematic websites and brand identity.",
    jobTitle: "Creative Technologist, AI Specialist and Multi Designer",
    knowsAbout: [
      "Artificial intelligence", "AI engineering", "AI agents", "Multi-agent systems", "AI video production",
      "Generative art", "Web design", "Web development", "Graphic design", "Brand identity", "UI/UX design",
      "Motion design", "3D visualization",
    ],
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l: Locale = isLocale(locale) ? locale : "tr";
  const title = meta[l].title;
  return {
    metadataBase: new URL(BASE_URL),
    title: { default: title, template: "%s — Ataberk Soylu" },
    description: meta[l].description,
    alternates: {
      canonical: `/${l}`,
      languages: { tr: "/tr", en: "/en", "x-default": "/tr" },
    },
    authors: [{ name: "Ataberk Soylu", url: BASE_URL }],
    creator: "Ataberk Soylu",
    openGraph: {
      title,
      description: meta[l].description,
      url: `/${l}`,
      siteName: "Ataberk Soylu",
      locale: l === "tr" ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: meta[l].description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = site[locale];

  const m = meta[locale];
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Ataberk Soylu",
      givenName: "Ataberk",
      familyName: "Soylu",
      jobTitle: m.jobTitle,
      description: m.description,
      url: `${BASE_URL}/${locale}`,
      image: `${BASE_URL}/brand/logo.png`,
      email: "mailto:ataberk@ataberksoylu.com",
      address: { "@type": "PostalAddress", addressLocality: "İstanbul", addressCountry: "TR" },
      knowsLanguage: ["tr", "en"],
      knowsAbout: m.knowsAbout,
      hasOccupation: services[locale].items.map((s) => ({ "@type": "Occupation", name: s.name })),
      worksFor: { "@type": "Organization", name: "Oneavex" },
      sameAs: PROFILES.map((p) => p.url),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "Ataberk Soylu",
      url: BASE_URL,
      inLanguage: ["tr", "en"],
      publisher: { "@id": PERSON_ID },
    },
  ];

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Windows takes the lite glass before first paint (see components/gl/perf.ts). */}
        <script dangerouslySetInnerHTML={{ __html: `if(/Windows/i.test(navigator.userAgent))document.documentElement.dataset.perf="lite"` }} />
      </head>
      <body
        className={`${archivo.variable} ${audiowide.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <noscript>
          <style>{`header, [data-hero-identity] { opacity: 1 !important; pointer-events: auto !important; }`}</style>
        </noscript>
        <a href="#content" className="skip-link">
          {t.a11y.skip}
        </a>
        <Nav locale={locale} t={t.nav} />
        {children}
        <Tracker />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </body>
    </html>
  );
}
