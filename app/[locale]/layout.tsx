import type { Metadata } from "next";
import { Archivo, Orbitron } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, isLocale, type Locale } from "@/lib/i18n";
import { site } from "@/content/site";
import { Nav } from "@/components/nav/Nav";
import { Cursor } from "@/components/cursor/Cursor";
import "../globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const BASE_URL = "https://ataberk-portfolio-rho.vercel.app";

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
        className={`${archivo.variable} ${orbitron.variable} antialiased`}
      >
        <a href="#content" className="skip-link">
          {t.a11y.skip}
        </a>
        <Nav locale={locale} t={t.nav} />
        {children}
        <Cursor />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
