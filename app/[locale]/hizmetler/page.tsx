import { notFound } from "next/navigation";
import { ServiceHub } from "@/components/services/ServicePages";
import { hubMetadata, hubParams, owns } from "@/components/services/routes";

export const generateStaticParams = hubParams("tr");
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return owns(locale, "tr") ? hubMetadata(locale) : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!owns(locale, "tr")) notFound();
  return <ServiceHub locale={locale} />;
}
