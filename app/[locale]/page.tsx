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

const visualLabel = {
  tr: "Deneysel sistem görselleştirmesi",
  en: "Experimental system visualization",
};

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
            intro: t.hero.intro,
            ctaWork: locale === "tr" ? "Seçili İşler" : "View Selected Work",
            ctaAbout: t.nav.about,
            scrollHint: t.hero.scrollHint,
            locale,
          }}
        />
        <WorkSection locale={locale} visualLabel={visualLabel[locale]} />
        <Manifesto line={t.manifesto.line} sub={t.manifesto.sub} />
        <Capabilities t={t.capabilities} />
        <AISystems t={t.aiSystems} />
        <AboutPreview locale={locale} t={t.aboutPreview} />
        <ContactFinale t={t.contact} />
        <Footer t={t.footer} name={t.name} />
      </main>
    </SmoothScroll>
  );
}
