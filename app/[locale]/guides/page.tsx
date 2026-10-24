import { notFound } from "next/navigation";
import { GuideHub, guideHubMetadata } from "@/components/guides/GuidePages";
import { hubParams, owns } from "@/components/services/routes";

export const generateStaticParams = hubParams("en");
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return owns(locale, "en") ? guideHubMetadata(locale) : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!owns(locale, "en")) notFound();
  return <GuideHub locale={locale} />;
}
