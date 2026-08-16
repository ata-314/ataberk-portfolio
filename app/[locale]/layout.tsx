import type { Metadata } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, isLocale, type Locale } from "@/lib/i18n";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "../globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jbMono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

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
  return {
    title: "Ataberk Soylu — Creative Technologist & Multi Designer",
    description: meta[l].description,
    alternates: {
      languages: { tr: "/tr", en: "/en" },
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

  return (
    <html lang={locale}>
      <body
        className={`${archivo.variable} ${inter.variable} ${jbMono.variable} antialiased`}
      >
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
