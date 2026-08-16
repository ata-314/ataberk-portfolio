import type { Locale } from "@/lib/i18n";

// Copy drafted per locale (EN written natively, not translated word-for-word).
// Facts come from the 2026-08-16 creative brief — nothing invented.

type WorkItem = { title: string; category: string; blurb: string };
type Capability = { system: string; items: string[] };

export type HomeContent = {
  name: string;
  title: string;
  tagline: string;
  hero: { scrollHint: string; ctaWork: string; ctaAbout: string };
  work: { heading: string; note: string; items: WorkItem[] };
  capabilities: { heading: string; systems: Capability[] };
  about: { heading: string; beats: string[]; thesis: string };
  contact: { heading: string; lead: string; intents: string[] };
};

const capabilityItems: Capability[] = [
  {
    system: "Design",
    items: ["Creative Direction", "Art Direction", "UI/UX Design", "Product Design", "Brand Identity", "Visual Systems"],
  },
  {
    system: "Motion & Visual Storytelling",
    items: ["Motion Design", "AI Video Production", "Cinematic Advertising", "Storyboarding", "Editing & Compositing", "3D Visualization"],
  },
  {
    system: "Creative Development",
    items: ["Interactive Web Design", "Next.js & React", "Three.js & React Three Fiber", "WebGL & GLSL", "GSAP & ScrollTrigger", "Spatial & 3D Web"],
  },
  {
    system: "AI Systems",
    items: ["Generative AI Workflows", "Multi-Agent Systems", "Creative Automation", "Content Intelligence", "AI-Assisted Design Systems", "Prompt & Visual Direction"],
  },
];

export const home: Record<Locale, HomeContent> = {
  tr: {
    name: "Ataberk Soylu",
    title: "Creative Technologist & Multi Designer",
    tagline: "Yapay zekâ, motion, 3D ve web arasında akıllı dijital deneyimler tasarlıyorum.",
    hero: { scrollHint: "Kaydır — sistem kurulsun", ctaWork: "Seçili İşler", ctaAbout: "Hakkımda" },
    work: {
      heading: "Seçili İşler",
      note: "Vaka sayfaları hazırlanıyor",
      items: [
        { title: "MODD-AI", category: "AI İçerik Zekâsı", blurb: "Çok markalı içerik zekâsı: Brand Brain, içerik hafızası ve agent tabanlı yaratıcı üretim sistemi." },
        { title: "Web Development Agent", category: "Yaratıcı Otomasyon", blurb: "Brief'ten deploy'a birden fazla web projesini yöneten Claude tabanlı agent altyapısı." },
        { title: "Oneavex AI Studio", category: "AI Video & Motion", blurb: "Yapay zekâ destekli video, motion design ve sinematik reklam çalışmaları." },
        { title: "3D Web & Digital Twin", category: "Mekânsal Deneyim", blurb: "Three.js ve WebGL ile dijital ikiz ve mekânsal web deneyimi araştırmaları." },
        { title: "MODD-AI Web Experience", category: "Yaratıcı Web", blurb: "Kod, partikül ve scroll etkileşimleriyle hazırlanan WebGL web deneyimi." },
        { title: "AI Reklam Filmleri", category: "AI Film — ROBX · YADA", blurb: "Ürün doğruluğu ve gerçekçi sinematografiyle yapay zekâ reklam filmleri." },
      ],
    },
    capabilities: { heading: "Yetenek Sistemleri", systems: capabilityItems },
    about: {
      heading: "Yaklaşım",
      beats: [
        "Disiplinler arasında çalışıyorum — tasarım, motion, yapay zekâ ve kod aynı yaratıcı sistemin parçaları.",
        "Görsel fikri sunumda bırakmıyorum; çalışan bir deneyime dönüştürüyorum.",
        "Yeni teknolojiyi gösteriş için değil, anlatıyı ve deneyimi güçlendirmek için kullanıyorum.",
      ],
      thesis: "Akademik altyapım üretken sanat, yapay zekâ yaratıcılığı ve NFT dönüşümü üzerine yüksek lisans tezime dayanıyor.",
    },
    contact: {
      heading: "İletişim",
      lead: "Şunlar için konuşabiliriz:",
      intents: ["Yeni proje", "İş birliği", "Yaratıcı teknoloji danışmanlığı", "Pozisyon / ekip görüşmesi"],
    },
  },
  en: {
    name: "Ataberk Soylu",
    title: "Creative Technologist & Multi Designer",
    tagline: "Designing intelligent digital experiences across AI, motion, 3D and the web.",
    hero: { scrollHint: "Scroll — let the system assemble", ctaWork: "View Selected Work", ctaAbout: "About Me" },
    work: {
      heading: "Selected Work",
      note: "Case studies in progress",
      items: [
        { title: "MODD-AI", category: "AI Content Intelligence", blurb: "Multi-brand content intelligence: Brand Brain, content memory and agent-based creative production." },
        { title: "Web Development Agent", category: "Creative Automation", blurb: "Claude-based agent infrastructure running multiple web projects from brief to deployment." },
        { title: "Oneavex AI Studio", category: "AI Video & Motion", blurb: "AI-assisted video, motion design and cinematic advertising work." },
        { title: "3D Web & Digital Twin", category: "Spatial Experience", blurb: "Digital-twin and spatial web experience research with Three.js and WebGL." },
        { title: "MODD-AI Web Experience", category: "Creative Web", blurb: "A WebGL web experience built from code, particles and scroll interaction." },
        { title: "AI Commercial Films", category: "AI Film — ROBX · YADA", blurb: "AI-produced commercials with product accuracy and realistic cinematography." },
      ],
    },
    capabilities: { heading: "Capability Systems", systems: capabilityItems },
    about: {
      heading: "Approach",
      beats: [
        "I work across disciplines — design, motion, AI and code are parts of one creative system.",
        "I don't leave a visual idea in a deck; I turn it into a working experience.",
        "I use new technology to strengthen the story and the experience, never for show.",
      ],
      thesis: "My academic background is a master's thesis on generative art, AI creativity and the NFT transformation.",
    },
    contact: {
      heading: "Contact",
      lead: "Things worth talking about:",
      intents: ["A new project", "Collaboration", "Creative technology consulting", "A role / team conversation"],
    },
  },
};
