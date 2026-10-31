import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacyPage, privacyMetadata } from "@/components/legal/PrivacyPage";
import { hubParams, owns } from "@/components/services/routes";

export const generateStaticParams = hubParams("tr");
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return owns(locale, "tr") ? privacyMetadata(locale) : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!owns(locale, "tr")) notFound();
  return <PrivacyPage locale={locale} />;
}
