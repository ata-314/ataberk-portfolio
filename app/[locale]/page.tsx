import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { site } from "@/content/site";
import StageLoader from "@/components/gl/StageLoader";
import { Hero } from "@/components/hero/Hero";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Reveal } from "@/components/motion/Reveal";
import { Manifesto } from "@/components/sections/Manifesto";
import { WorkSection } from "@/components/sections/WorkSection";
import { Capabilities } from "@/components/sections/Capabilities";
import {
  AISystems,
  AboutPreview,
  ContactFinale,
  Footer,
} from "@/components/sections/HomeSections";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = site[locale];

  return (
    <SmoothScroll>
      <main id="content">
        <StageLoader />
        <Reveal />
        <Hero
          t={{
            name: t.name,
            title: t.title,
            tagline: t.tagline,
            ctaWork: locale === "tr" ? "Seçili işler" : "Selected work",
            ctaAbout: t.nav.about,
            locale,
          }}
        />
        <AboutPreview locale={locale} t={t.aboutPreview} about={t.about} />
        <WorkSection locale={locale} />
        <Manifesto line={t.manifesto.line} sub={t.manifesto.sub} />
        <Capabilities t={t.capabilities} />
        <AISystems t={t.aiSystems} />
        <ContactFinale t={t.contact} />
        <Footer t={t.footer} name={t.name} />
      </main>
    </SmoothScroll>
  );
}
