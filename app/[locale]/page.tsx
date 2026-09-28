import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { site } from "@/content/site";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Reveal } from "@/components/motion/Reveal";
import { Manifesto } from "@/components/sections/Manifesto";
import { HomeExperience } from "@/components/experience/HomeExperience";
import {
  AISystems,
  AboutPreview,
  ContactFinale,
  Footer,
} from "@/components/sections/HomeSections";

// Home: one 3D world (the chrome eagle, the card helix, the galaxies) behind
// the page, driven by scroll through its stations, then the closing
// sections over the deep field.
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = site[locale];
  const tr = locale === "tr";
  // Chapters, named in the HUD scene chip.
  const scene = {
    sea: tr ? "Boşluk · Başlangıç" : "Void · Opening",
    sky: tr ? "Sarmal · Hizmetler & İşler" : "Helix · Services & Work",
    galaxies: tr ? "Galaksiler" : "Galaxies",
    limb: tr ? "Hakkında" : "About",
    helix: tr ? "Manifesto" : "Manifesto",
    lab: tr ? "Lab · AI sistemleri" : "Lab · AI systems",
    signal: tr ? "Sinyal · İletişim" : "Signal · Contact",
  };

  return (
    <SmoothScroll>
      <main id="content">
        <Reveal />
        <HomeExperience locale={locale} tagline={t.tagline} sceneNames={scene} />
        <div data-station="after" className="relative z-10">
          <div data-scene={scene.limb}><AboutPreview locale={locale} t={t.aboutPreview} about={t.about} /></div>
          <div data-scene={scene.helix}><Manifesto line={t.manifesto.line} sub={t.manifesto.sub} /></div>
          <div data-scene={scene.lab}><AISystems t={t.aiSystems} locale={locale} /></div>
          <div data-scene={scene.signal}><ContactFinale t={t.contact} /></div>
          <Footer t={t.footer} name={t.name} />
        </div>
      </main>
    </SmoothScroll>
  );
}
