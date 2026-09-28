import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { site } from "@/content/site";
import StageLoader from "@/components/gl/StageLoader";
import { Hero } from "@/components/hero/Hero";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Reveal } from "@/components/motion/Reveal";
import { Manifesto } from "@/components/sections/Manifesto";
import { JourneySection } from "@/components/sections/JourneySection";
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
  const tr = locale === "tr";
  // Journey chapters, named in the HUD scene chip.
  const scene = {
    sea: tr ? "Veri denizi" : "Data sea",
    sky: tr ? "Yolculuk · Hizmetler & İşler" : "Journey · Services & Work",
    limb: tr ? "Atmosfer · Hakkında" : "Atmosphere · About",
    helix: tr ? "Sarmal" : "Helix",
    lab: tr ? "Lab · AI sistemleri" : "Lab · AI systems",
    signal: tr ? "Sinyal · İletişim" : "Signal · Contact",
  };

  return (
    <SmoothScroll>
      <main id="content">
        <StageLoader />
        <Reveal />
        <div data-scene={scene.sea}>
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
        </div>
        <div data-scene={scene.sky}><JourneySection locale={locale} /></div>
        <div data-scene={scene.limb}><AboutPreview locale={locale} t={t.aboutPreview} about={t.about} /></div>
        <div data-scene={scene.helix}><Manifesto line={t.manifesto.line} sub={t.manifesto.sub} /></div>
        <div data-scene={scene.lab}><AISystems t={t.aiSystems} locale={locale} /></div>
        <div data-scene={scene.signal}><ContactFinale t={t.contact} /></div>
        <Footer t={t.footer} name={t.name} />
      </main>
    </SmoothScroll>
  );
}
