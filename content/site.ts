import type { Locale } from "@/lib/i18n";

// Site-wide copy, typed per locale. EN is written natively.
// No invented clients, awards, metrics, emails or social handles.

export type SiteContent = {
  name: string;
  title: string;
  tagline: string;
  nav: { work: string; capabilities: string; about: string; lab: string; contact: string; menu: string; close: string };
  hero: { scrollHint: string; intro: string };
  manifesto: { line: string; sub: string };
  capabilities: {
    heading: string;
    lead: string;
    systems: { key: string; name: string; items: string[]; bridge: string }[];
  };
  aiSystems: {
    heading: string;
    lead: string;
    entries: { name: string; desc: string }[];
  };
  aboutPreview: { heading: string; line: string; cta: string };
  about: {
    heading: string;
    intro: string;
    bio: string[];
    ventures: { name: string; desc: string }[];
    thesis: string;
    collaboration: { heading: string; areas: string[] };
  };
  lab: {
    heading: string;
    lead: string;
    entries: { name: string; desc: string; status: string }[];
  };
  contact: {
    heading: string;
    line: string;
    intents: string[];
    note: string;
  };
  footer: { rights: string; built: string };
  notFound: { title: string; body: string; back: string };
  a11y: { skip: string; openCase: string };
};

const capabilitiesShared = [
  {
    key: "design",
    items: ["Creative Direction", "Art Direction", "UI/UX", "Product Design", "Brand Identity", "Visual Systems"],
  },
  {
    key: "motion",
    items: ["Motion Design", "AI Video Production", "Storyboarding", "Cinematic Advertising", "Editing", "3D Visualization"],
  },
  {
    key: "development",
    items: ["Interactive Web", "Next.js / React", "Three.js / R3F", "WebGL / GLSL", "GSAP", "Spatial Experiences"],
  },
  {
    key: "ai",
    items: ["Generative AI", "Multi-Agent Systems", "Creative Automation", "Content Intelligence", "AI-Assisted Design Systems", "Prompt & Visual Direction"],
  },
];

const tr: SiteContent = {
  name: "Ataberk Soylu",
  title: "Creative Technologist & Multi Designer",
  tagline: "Yapay zekâ, motion, 3D ve web arasında akıllı dijital deneyimler tasarlıyorum.",
  nav: { work: "İşler", capabilities: "Yetenekler", about: "Hakkında", lab: "Lab", contact: "İletişim", menu: "Menü", close: "Kapat" },
  hero: {
    scrollHint: "Kaydır",
    intro: "Kod karakterlerinden oluşan yaşayan bir sistem — bu sitenin tamamı aynı dijital maddeden inşa edildi.",
  },
  manifesto: {
    line: "Fikirleri akıllı görsel sistemlere dönüştürüyorum.",
    sub: "Tasarım, motion, yapay zekâ ve kod — ayrı beceriler değil, tek yaratıcı sistemin organları.",
  },
  capabilities: {
    heading: "Yetenek Sistemleri",
    lead: "Dört sistem, tek ağ. Her disiplin diğerini besler — bir sisteme yaklaş, bağlantılarını gör.",
    systems: [
      { ...capabilitiesShared[0], name: "Design", bridge: "Yön ve kimlik: diğer üç sistemin dilini belirler." },
      { ...capabilitiesShared[1], name: "Motion & Storytelling", bridge: "Zamanlama ve duygu: tasarımı anlatıya, AI çıktısını sinemaya çevirir." },
      { ...capabilitiesShared[2], name: "Creative Development", bridge: "Fikri çalışan deneyime döker: bu sitenin kendisi bu sistemin çıktısı." },
      { ...capabilitiesShared[3], name: "AI Systems", bridge: "Ölçek ve hafıza: diğer sistemlerin üretimini çoğaltır ve denetler." },
    ],
  },
  aiSystems: {
    heading: "AI Sistemleri & Deneyler",
    lead: "Görsel işin arkasında çalışan, üretim yapan gerçek sistemler.",
    entries: [
      { name: "MODD-AI · Brand Brain", desc: "Marka hafızası tek kartta: ses, palet, yasaklar, kanıtlanmış desenler. İçerik zekâsı her üretimden öğrenir." },
      { name: "Multi-agent creative team", desc: "Stratejist → art direktör → üretim → QA. Üretim tek modele değil, rollere dağılır." },
      { name: "Web Development Agent", desc: "Brief'ten deploy'a web projelerini yöneten, bilgi tabanıyla öğrenen ajan altyapısı — bu site onun boru hattından çıktı." },
      { name: "Content intelligence", desc: "Hafıza, DNA, ses örnekleri ve kalite kontrol: yayın öncesi her iş denetimden geçer." },
    ],
  },
  aboutPreview: {
    heading: "Yaklaşım",
    line: "Görsel fikri sunumda bırakmıyorum; çalışan bir deneyime dönüştürüyorum.",
    cta: "Hakkında",
  },
  about: {
    heading: "Hakkında",
    intro: "Disiplinler arasında çalışıyorum — ve aralarındaki çizgileri her projede biraz daha siliyorum.",
    bio: [
      "Creative Technologist & Multi Designer olarak tasarım, motion, yapay zekâ ve web geliştirmeyi aynı üretim sürecinde birleştiriyorum. Bir işin konsepti, arayüzü, hareketi ve arkasındaki sistem — hepsi tek elden, tek dille tasarlanıyor.",
      "Yeni teknolojiyi gösteriş için değil, anlatıyı ve deneyimi güçlendirmek için kullanıyorum. Bir efekt hikâyeye hizmet etmiyorsa sahnede yeri yok.",
    ],
    ventures: [
      { name: "Oneavex", desc: "Kurucusu olduğum yaratıcı teknoloji ve dijital iletişim stüdyosu — AI video, motion ve sinematik reklam işleri." },
      { name: "MODD-AI", desc: "Geliştirdiğim çok markalı içerik zekâsı: Brand Brain, agent tabanlı üretim ve kalite kontrol sistemleri." },
    ],
    thesis: "Akademik altyapım; üretken sanat, yapay zekâ yaratıcılığı ve NFT dönüşümü üzerine tamamladığım yüksek lisans tezine dayanıyor.",
    collaboration: {
      heading: "Birlikte çalışma alanları",
      areas: ["Premium web deneyimleri", "AI içerik ve video sistemleri", "Marka ve kampanya sistemleri", "Creative direction / senior tasarım rolleri"],
    },
  },
  lab: {
    heading: "Lab",
    lead: "Bu sitenin altındaki sistemler dahil — küçük, gerçek deneyler.",
    entries: [
      { name: "Code Field", desc: "Bu sitenin hero'su: glyph atlası, akış alanı ve scroll'la yönetilen faz sistemi.", status: "Canlı — bu sayfada" },
      { name: "Terrain of Mind", desc: "Sıvı veri arazisi çalışması: fbm yüzey, ışık taşıyan veri kanalları.", status: "Arşiv — hero v2" },
      { name: "GLB → Glyph kuş", desc: "İskelet animasyonlu kartalın pozisyon dokusuna bake edilip kod karakterlerine dönüştürülmesi.", status: "Canlı — bu sayfada" },
    ],
  },
  contact: {
    heading: "İletişim",
    line: "Daha önce var olmayan bir şeyi birlikte tasarlayalım.",
    intents: ["Yeni proje", "İş birliği", "Creative technology danışmanlığı", "Pozisyon / ekip görüşmesi"],
    note: "İletişim kanalları yakında bu sayfada.",
  },
  footer: { rights: "Tüm hakları saklıdır.", built: "Bu site, kendi geliştirdiğim web ajanının boru hattından çıktı." },
  notFound: { title: "404", body: "Bu sayfa sistemde yok — belki henüz üretilmedi.", back: "Ana sayfaya dön" },
  a11y: { skip: "İçeriğe atla", openCase: "Vaka çalışmasını aç" },
};

const en: SiteContent = {
  name: "Ataberk Soylu",
  title: "Creative Technologist & Multi Designer",
  tagline: "Designing intelligent digital experiences across AI, motion, 3D and the web.",
  nav: { work: "Work", capabilities: "Capabilities", about: "About", lab: "Lab", contact: "Contact", menu: "Menu", close: "Close" },
  hero: {
    scrollHint: "Scroll",
    intro: "A living system of code characters — this entire site is built from the same digital matter.",
  },
  manifesto: {
    line: "I turn ideas into intelligent visual systems.",
    sub: "Design, motion, AI and code — not separate skills, but organs of one creative system.",
  },
  capabilities: {
    heading: "Capability Systems",
    lead: "Four systems, one network. Each discipline feeds the others — approach one and see its connections.",
    systems: [
      { ...capabilitiesShared[0], name: "Design", bridge: "Direction and identity: sets the language the other three systems speak." },
      { ...capabilitiesShared[1], name: "Motion & Storytelling", bridge: "Timing and emotion: turns design into narrative and AI output into cinema." },
      { ...capabilitiesShared[2], name: "Creative Development", bridge: "Pours the idea into a working experience — this site is an output of this system." },
      { ...capabilitiesShared[3], name: "AI Systems", bridge: "Scale and memory: multiplies and reviews what the other systems produce." },
    ],
  },
  aiSystems: {
    heading: "AI Systems & Experiments",
    lead: "Real systems that work and produce behind the visual work.",
    entries: [
      { name: "MODD-AI · Brand Brain", desc: "Brand memory on one card: voice, palette, banned phrases, proven patterns. Content intelligence learns from every production." },
      { name: "Multi-agent creative team", desc: "Strategist → art director → production → QA. Output is distributed across roles, not thrown at one model." },
      { name: "Web Development Agent", desc: "Agent infrastructure running web projects from brief to deployment, learning through a knowledge base — this site shipped through its pipeline." },
      { name: "Content intelligence", desc: "Memory, DNA, voice samples and quality control: every piece passes review before publishing." },
    ],
  },
  aboutPreview: {
    heading: "Approach",
    line: "I don't leave a visual idea in a deck; I turn it into a working experience.",
    cta: "About",
  },
  about: {
    heading: "About",
    intro: "I work across disciplines — and erase the lines between them a little more with every project.",
    bio: [
      "As a Creative Technologist & Multi Designer I join design, motion, AI and web development in a single production process. A work's concept, interface, movement and the system behind it are designed by one hand, in one language.",
      "I use new technology to strengthen the story and the experience, never for show. If an effect doesn't serve the narrative, it doesn't belong on stage.",
    ],
    ventures: [
      { name: "Oneavex", desc: "The creative technology and digital communication studio I founded — AI video, motion and cinematic advertising work." },
      { name: "MODD-AI", desc: "The multi-brand content intelligence I build: Brand Brain, agent-based production and quality-control systems." },
    ],
    thesis: "My academic background is a master's thesis on generative art, AI creativity and the NFT transformation.",
    collaboration: {
      heading: "Collaboration areas",
      areas: ["Premium web experiences", "AI content and video systems", "Brand and campaign systems", "Creative direction / senior design roles"],
    },
  },
  lab: {
    heading: "Lab",
    lead: "Small, real experiments — including the systems underneath this site.",
    entries: [
      { name: "Code Field", desc: "This site's hero: glyph atlas, flow field and a scroll-driven phase system.", status: "Live — on this page" },
      { name: "Terrain of Mind", desc: "Liquid data terrain study: fbm surface with light-carrying data channels.", status: "Archive — hero v2" },
      { name: "GLB → Glyph bird", desc: "A skinned eagle baked into a position texture and re-rendered as code characters.", status: "Live — on this page" },
    ],
  },
  contact: {
    heading: "Contact",
    line: "Let's create something that has never existed before.",
    intents: ["A new project", "Collaboration", "Creative technology consulting", "A role / team conversation"],
    note: "Contact channels land on this page soon.",
  },
  footer: { rights: "All rights reserved.", built: "This site shipped through the web agent I build." },
  notFound: { title: "404", body: "This page doesn't exist in the system — perhaps it hasn't been generated yet.", back: "Back to home" },
  a11y: { skip: "Skip to content", openCase: "Open case study" },
};

export const site: Record<Locale, SiteContent> = { tr, en };
