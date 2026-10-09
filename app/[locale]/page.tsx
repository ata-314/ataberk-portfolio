import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { isLocale } from "@/lib/i18n";
import { site } from "@/content/site";
import StageLoader from "@/components/gl/StageLoader";
import { Hero } from "@/components/hero/Hero";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Reveal } from "@/components/motion/Reveal";
import { Manifesto } from "@/components/sections/Manifesto";
import { WorkSection } from "@/components/sections/WorkSection";
import { Services } from "@/components/sections/Services";
import { Voyage } from "@/components/sections/Voyage";
import { AISystems } from "@/components/sections/AISystems";
import { FlightGap } from "@/components/sections/FlightGap";
import {
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
  // The stage waits for the bird bake before its first frame; start the
  // download with the page instead of after the stage's script has run.
  preload("/models/bird-bake.bin", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });

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
        <Voyage locale={locale} />
        <Services locale={locale} />
        <FlightGap />
        <AboutPreview locale={locale} t={t.aboutPreview} about={t.about} />
        <FlightGap />
        <WorkSection locale={locale} />
        <FlightGap size="lg" />
        <Manifesto line={t.manifesto.line} sub={t.manifesto.sub} />
        <FlightGap size="lg" />
        <AISystems locale={locale} t={t.aiSystems} />
        <FlightGap size="lg" />
        <ContactFinale locale={locale} t={t.contact} />
        <Footer t={t.footer} name={t.name} />
      </main>
    </SmoothScroll>
  );
}
