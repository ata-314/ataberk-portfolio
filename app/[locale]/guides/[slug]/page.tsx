import { notFound } from "next/navigation";
import { GuideArticle, guideMetadata } from "@/components/guides/GuidePages";
import { owns } from "@/components/services/routes";
import { guides, getGuide } from "@/content/guides";

export const generateStaticParams = () => guides.en.items.map((g) => ({ locale: "en", slug: g.slug }));
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  return owns(locale, "en") ? guideMetadata(locale, slug) : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!owns(locale, "en")) notFound();
  const guide = getGuide(locale, slug);
  if (!guide) notFound();
  return <GuideArticle locale={locale} guide={guide} />;
}
