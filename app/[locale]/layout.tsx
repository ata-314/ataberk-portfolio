import type { Metadata } from "next";
import { Archivo, Audiowide, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, isLocale, type Locale } from "@/lib/i18n";
import { BASE_URL } from "@/lib/url";
import { site } from "@/content/site";
import { Nav } from "@/components/nav/Nav";
import "../globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"] });
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

const meta: Record<Locale, { description: string }> = {
  tr: {
    description:
      "Ataberk Soylu — Creative Technologist & Multi Designer. Yapay zekâ, motion, 3D ve web arasında akıllı dijital deneyimler.",
  },
  en: {
    description:
      "Ataberk Soylu — Creative Technologist & Multi Designer. Intelligent digital experiences across AI, motion, 3D and the web.",
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
  const title = "Ataberk Soylu — Creative Technologist & Multi Designer";
  return {
    metadataBase: new URL(BASE_URL),
    title: { default: title, template: "%s — Ataberk Soylu" },
    description: meta[l].description,
    alternates: {
      canonical: `/${l}`,
      languages: { tr: "/tr", en: "/en" },
    },
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

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Ataberk Soylu",
    jobTitle: "Creative Technologist & Multi Designer",
    url: `${BASE_URL}/${locale}`,
    sameAs: ["https://github.com/ata-314"],
    knowsAbout: [
      "Creative Direction",
      "UI/UX Design",
      "WebGL",
      "Motion Design",
      "Generative AI",
      "Multi-Agent Systems",
    ],
  };

  return (
    <html lang={locale}>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
