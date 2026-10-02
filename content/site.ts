import type { LabEntry } from "@/components/lab/LabExperiment";
import type { Locale } from "@/lib/i18n";

// Site-wide copy, typed per locale. EN is written natively.
// No invented clients, awards, metrics, emails or social handles.

export type SiteContent = {
  name: string;
  title: string;
  tagline: string;
  nav: { work: string; capabilities: string; about: string; lab: string; contact: string; menu: string; close: string };
  manifesto: { line: string; sub: string };
  capabilities: {
    heading: string;
    lead: string;
    systems: { key: string; name: string; items: string[]; bridge: string }[];
  };
  aiSystems: {
    label: string;
    heading: string;
    lead: string;
    entries: { name: string; tag: string; desc: string }[];
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
    label: string;
    lead: string;
    stats: string[];
    note: string;
    entries: LabEntry[];
  };
  contact: {
    heading: string;
    line: string;
    intents: string[];
    cta: string;
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
  name: "Ataberk",
  title: "Creative Technologist & Multi Designer",
  tagline: "Yapay zekâ, motion, 3D ve web arasında akıllı dijital deneyimler tasarlıyorum.",
  nav: { work: "İşler", capabilities: "Yetenekler", about: "Hakkında", lab: "Lab", contact: "İletişim", menu: "Menü", close: "Kapat" },
  manifesto: {
    line: "Fikirleri akıllı görsel sistemlere dönüştürüyorum.",
    sub: "Tasarım, motion, yapay zekâ ve kod — ayrı beceriler değil, tek yaratıcı sistemin organları.",
  },
  capabilities: {
    heading: "Yetenek Sistemleri",
    lead: "Dört disiplin, tek üretim süreci. Her biri diğerini besliyor.",
    systems: [
      { ...capabilitiesShared[0], name: "Design", bridge: "Yön ve kimlik: diğer üç sistemin dilini belirler." },
      { ...capabilitiesShared[1], name: "Motion & Storytelling", bridge: "Zamanlama ve duygu: tasarımı anlatıya, AI çıktısını sinemaya çevirir." },
      { ...capabilitiesShared[2], name: "Creative Development", bridge: "Fikri çalışan deneyime döker: bu sitenin kendisi bu sistemin çıktısı." },
      { ...capabilitiesShared[3], name: "AI Systems", bridge: "Ölçek ve hafıza: diğer sistemlerin üretimini çoğaltır ve denetler." },
    ],
  },
  aiSystems: {
    label: "Sistemler",
    heading: "AI Sistemleri & Deneyler",
    lead: "Görsel işin arkasında çalışan, üretim yapan gerçek sistemler.",
    entries: [
      { name: "MODD-AI · Brand Brain", tag: "Marka hafızası", desc: "Marka hafızası tek kartta: ses, palet, yasaklar, kanıtlanmış desenler. İçerik zekâsı her üretimden öğrenir." },
      { name: "Multi-agent creative team", tag: "Orkestrasyon", desc: "Stratejist → art direktör → üretim → QA. Üretim tek modele değil, rollere dağılır." },
      { name: "Web Development Agent", tag: "Ajan altyapısı", desc: "Brief'ten deploy'a web projelerini yöneten, bilgi tabanıyla öğrenen ajan altyapısı — bu site onun boru hattından çıktı." },
      { name: "Content intelligence", tag: "Kalite kontrol", desc: "Hafıza, DNA, ses örnekleri ve kalite kontrol: yayın öncesi her iş denetimden geçer." },
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
    label: "Lab · Deneyler",
    lead: "Bu sitenin altında çalışan sistemler. Ana sayfada gördüğün her hareket aşağıdaki deneylerden birinden geliyor ve her biri burada, sitenin kendi verisinden canlı çiziliyor.",
    stats: ["6 deney", "WebGL2 · Canvas", "Gerçek bake verisi", "Mobilde test edildi"],
    note: "Bu sayfa da bir deney: kuş ve büst, ana sahnenin GPU'ya yüklediği aynı dosyalardan okunuyor.",
    entries: [
      { kind: "bird", name: "Tanecik Kuş", desc: "Animasyonlu bir GLB kartal, 16 kanat karesi boyunca 9.000 yüzey noktasına bake edildi. Tarayıcıda GPU her noktayı komşularıyla birleştirip yüz binlerce taneciği kuşun derisine yayıyor; kuş kendi davranışlarıyla, kaydırmaya göre uçuyor.", tech: ["WebGL2", "Half-float bake", "GPGPU", "Davranış motoru"], status: "Canlı · Ana sayfa", live: true },
      { kind: "bust", name: "Hologram Büst", desc: "120.000 noktalık bir 3B tarama. Kuşun taneleri bölüme girerken bu yüze dönüşüyor; derinliği okuyan bir tarama çizgisi yüzeyi baştan aşağı aydınlatıyor.", tech: ["Nokta bulutu", "Morph", "Derinlik taraması"], status: "Canlı · Hakkında", live: true },
      { kind: "brain", name: "Brand Brain", desc: "Marka hafızası boncuklardan bir beyin: ses, palet, yasaklar ve desenler kendi bölgelerine yerleşiyor. Yüzey sıvı gibi dalgalanıyor, imleç boncukları su gibi aralıyor.", tech: ["Canvas 2D", "Yay fiziği", "Derinlik sıralama"], status: "Canlı · AI Sistemleri", live: true },
      { kind: "voyage", name: "Geçit", desc: "İsimden kopan kod karakterleri bir X'te toplanıyor, X bir portala açılıyor ve kamera vokselden bir tünele dalıyor. Hepsi tek bir kaydırma zaman çizgisinde.", tech: ["Simülasyon", "Voxel tünel", "Scroll zaman çizgisi"], status: "Canlı · Ana sayfa", live: true },
      { kind: "helix", name: "İş Sarmalı", desc: "Seçili işler, tanelerden bir sarmal üzerinde dönen cam kartlar. Kaydırma sarmalı çeviriyor; bir karta dokununca proje kendi dünyasına açılıyor.", tech: ["Instancing", "Scroll pin", "Cam malzeme"], status: "Canlı · Seçili İşler", live: true },
      { kind: "forensics", name: "Mobil GPU Adli İncelemesi", desc: "Kuş bir Mali GPU'lu telefonda formsuz bir buluta dönüşüyordu. Ekrana yazan bir teşhis paneli ve çizim modlarıyla bulundu: vertex shader dokuları varsayılan olarak düşük hassasiyette okunuyor, 2048'in üstündeki komşu indeksleri kayıyordu. Çözüm tek satır: precision highp sampler2D.", tech: ["Cihazda teşhis", "GLSL hassasiyeti", "Mali-G610"], status: "Çözüldü · Ekim 2026", live: false, phases: ["lowp · 16-bit indeksler", "highp · 32-bit indeksler"] },
    ],
  },
  contact: {
    heading: "İletişim",
    line: "Daha önce var olmayan bir şeyi birlikte tasarlayalım.",
    intents: ["Yeni proje", "İş birliği", "Creative technology danışmanlığı", "Pozisyon / ekip görüşmesi"],
    cta: "GitHub üzerinden ulaş",
    note: "Kısa bir proje özeti, zamanlama ve hedefle başlayabiliriz.",
  },
  footer: { rights: "Tüm hakları saklıdır.", built: "Bu site, kendi geliştirdiğim web ajanının boru hattından çıktı." },
  notFound: { title: "404", body: "Bu sayfa sistemde yok — belki henüz üretilmedi.", back: "Ana sayfaya dön" },
  a11y: { skip: "İçeriğe atla", openCase: "Vaka çalışmasını aç" },
};

const en: SiteContent = {
  name: "Ataberk",
  title: "Creative Technologist & Multi Designer",
  tagline: "Designing intelligent digital experiences across AI, motion, 3D and the web.",
  nav: { work: "Work", capabilities: "Capabilities", about: "About", lab: "Lab", contact: "Contact", menu: "Menu", close: "Close" },
  manifesto: {
    line: "I turn ideas into intelligent visual systems.",
    sub: "Design, motion, AI and code — not separate skills, but organs of one creative system.",
  },
  capabilities: {
    heading: "Capability Systems",
    lead: "Four disciplines, one production process. Each one feeds the others.",
    systems: [
      { ...capabilitiesShared[0], name: "Design", bridge: "Direction and identity: sets the language the other three systems speak." },
      { ...capabilitiesShared[1], name: "Motion & Storytelling", bridge: "Timing and emotion: turns design into narrative and AI output into cinema." },
      { ...capabilitiesShared[2], name: "Creative Development", bridge: "Pours the idea into a working experience — this site is an output of this system." },
      { ...capabilitiesShared[3], name: "AI Systems", bridge: "Scale and memory: multiplies and reviews what the other systems produce." },
    ],
  },
  aiSystems: {
    label: "Systems",
    heading: "AI Systems & Experiments",
    lead: "Real systems that work and produce behind the visual work.",
    entries: [
      { name: "MODD-AI · Brand Brain", tag: "Brand memory", desc: "Brand memory on one card: voice, palette, banned phrases, proven patterns. Content intelligence learns from every production." },
      { name: "Multi-agent creative team", tag: "Orchestration", desc: "Strategist → art director → production → QA. Output is distributed across roles, not thrown at one model." },
      { name: "Web Development Agent", tag: "Agent infrastructure", desc: "Agent infrastructure running web projects from brief to deployment, learning through a knowledge base — this site shipped through its pipeline." },
      { name: "Content intelligence", tag: "Quality control", desc: "Memory, DNA, voice samples and quality control: every piece passes review before publishing." },
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
    label: "Lab · Experiments",
    lead: "The systems running underneath this site. Every motion on the home page comes from one of the experiments below, and each is drawn here live from the site's own data.",
    stats: ["6 experiments", "WebGL2 · Canvas", "Real bake data", "Tested on phones"],
    note: "This page is an experiment too: the bird and the bust are read from the same files the home stage uploads to the GPU.",
    entries: [
      { kind: "bird", name: "Grain Bird", desc: "An animated GLB eagle baked to 9,000 surface samples across 16 wing-beat frames. In the browser the GPU joins every sample to its neighbours and spreads hundreds of thousands of grains over the bird's skin; it flies with its own behaviours, driven by scroll.", tech: ["WebGL2", "Half-float bake", "GPGPU", "Behaviour engine"], status: "Live · Home", live: true },
      { kind: "bust", name: "Hologram Bust", desc: "A 120,000-point 3D scan. As the section enters, the bird's grains become this face; a scan line that reads depth lights the surface from top to bottom.", tech: ["Point cloud", "Morph", "Depth scan"], status: "Live · About", live: true },
      { kind: "brain", name: "Brand Brain", desc: "Brand memory as a brain of beads: voice, palette, banned phrases and patterns settle into their own regions. The surface ripples like liquid and the pointer parts the beads like water.", tech: ["Canvas 2D", "Spring physics", "Depth sorting"], status: "Live · AI Systems", live: true },
      { kind: "voyage", name: "The Gate", desc: "Code characters torn from the name gather into an X, the X opens into a portal and the camera dives into a tunnel of voxels, all on one scroll timeline.", tech: ["Simulation", "Voxel tunnel", "Scroll timeline"], status: "Live · Home", live: true },
      { kind: "helix", name: "Work Helix", desc: "Selected work as glass cards turning on a helix of grains. Scrolling turns the helix; tapping a card opens the project into its own world.", tech: ["Instancing", "Scroll pin", "Glass material"], status: "Live · Selected Work", live: true },
      { kind: "forensics", name: "Mobile GPU Forensics", desc: "On a phone with a Mali GPU the bird fell apart into a shapeless cloud. An on-screen diagnostic readout and draw modes found it: vertex-shader textures default to low precision, so neighbour indices above 2048 drifted. The fix is one line: precision highp sampler2D.", tech: ["On-device diagnostics", "GLSL precision", "Mali-G610"], status: "Solved · Oct 2026", live: false, phases: ["lowp · 16-bit indices", "highp · 32-bit indices"] },
    ],
  },
  contact: {
    heading: "Contact",
    line: "Let's create something that has never existed before.",
    intents: ["A new project", "Collaboration", "Creative technology consulting", "A role / team conversation"],
    cta: "Start on GitHub",
    note: "A short project outline, timeline and objective is enough to start.",
  },
  footer: { rights: "All rights reserved.", built: "This site shipped through the web agent I build." },
  notFound: { title: "404", body: "This page doesn't exist in the system — perhaps it hasn't been generated yet.", back: "Back to home" },
  a11y: { skip: "Skip to content", openCase: "Open case study" },
};

export const site: Record<Locale, SiteContent> = { tr, en };
