import { notFound } from "next/navigation";
import { getService } from "@/content/services";
import { ServiceDetail } from "@/components/services/ServicePages";
import { detailMetadata, detailParams, owns } from "@/components/services/routes";

export const generateStaticParams = detailParams("tr");
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  return owns(locale, "tr") ? detailMetadata(locale, slug) : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const item = owns(locale, "tr") ? getService(locale, slug) : undefined;
  if (!item) notFound();
  return <ServiceDetail locale={locale as "tr"} item={item} />;
}
