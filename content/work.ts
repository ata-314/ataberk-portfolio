import type { Locale } from "@/lib/i18n";

// Real projects only — facts from the 2026-08-16 creative brief and the
// working systems in this workspace. No invented clients, metrics or outcomes.
// Visuals are code-based system visualizations, explicitly labeled as such,
// until real media lands in the repo.

export type CaseSection = {
  kind: "challenge" | "approach" | "system" | "technical" | "outcome";
  title: string;
  body: string[];
};

export type WorkItem = {
  slug: string;
  title: string;
  category: string;
  year: string;
  role: string;
  personal: boolean;
  idea: string; // one-line creative idea
  layout: "featured" | "wide" | "split" | "typographic" | "system";
  visual: "field" | "agents" | "studio" | "spatial" | "web" | "film";
  // The working product, when it is public: opened in a new tab.
  live?: { url: string; label: string; host: string };
  // Shown at the top of its case study: a capture of the product, or its film.
  media?: { image: string; aspect: number } | { video: string; poster: string; aspect: number };
  sections: CaseSection[];
};

type WorkContent = { heading: string; open: string; items: WorkItem[] };

const tr: WorkContent = {
  heading: "Seçili İşler",
  open: "Projeyi incele",
  items: [
    {
      slug: "modd-ai",
      title: "ModdTeam",
      live: { url: "https://www.moddteam.com/login", label: "Sistemi aç", host: "moddteam.com" },
      category: "AI İçerik Zekâsı",
      year: "2026",
      role: "Kurucu · Sistem Tasarımı · Creative Direction",
      personal: true,
      idea: "Markanın hafızasını taşıyan, üreten ve kalitesini kendisi denetleyen çok markalı içerik zekâsı.",
      layout: "featured",
      visual: "field",
      sections: [
        {
          kind: "challenge",
          title: "Problem",
          body: [
            "Sosyal içerik üretimi; marka sesi, geçmiş performans ve görsel kimlik hafızası olmadan her seferinde sıfırdan başlar. Ajans modelinde bu, tutarsızlık ve tekrar demektir.",
          ],
        },
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Her marka için bir Brand Brain: ses, palet, yasaklı ifadeler ve onaylanmış desenler tek kartta yaşar. İçerik hafızası her üretimden öğrenir; kalite kontrol katmanı yayın öncesi her işi denetler.",
            "Üretim, tek bir modele değil rollere bölünmüş bir yaratıcı ekibe dağıtılır: stratejist, art direktör, üretim tasarımcısı ve QA.",
          ],
        },
        {
          kind: "system",
          title: "Sistem",
          body: [
            "Markdown tabanlı ajan mimarisi · marka izolasyonu · onay kapılı yayın kuyruğu · Instagram entegrasyonu · içerik zekâsı v2 (hafıza, DNA, ses örnekleri, kalite kontrol).",
          ],
        },
        {
          kind: "technical",
          title: "Teknik",
          body: [
            "Claude tabanlı çok-ajanlı sistem · Next.js studio arayüzü · Neon + Vercel Blob · onay kapısı olmadan hiçbir içerik dışarı çıkmaz.",
          ],
        },
      ],
    },
    {
      slug: "ala-cekmekoy",
      title: "A'lâ Çekmeköy Nefes",
      live: { url: "https://www.alacekmekoynefes.com", label: "Siteyi aç", host: "alacekmekoynefes.com" },
      category: "Web Deneyimi",
      year: "2026",
      role: "Tasarım · Geliştirme",
      personal: false,
      idea: "Çekmeköy'ün orman dokusunun yanında 72 konutluk bir projeyi, kaydırdıkça oynayan bir film gibi anlatan lansman sitesi.",
      layout: "featured",
      visual: "web",
      media: { image: "/work/ala-cekmekoy.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Tek ekranlık bir kaydırma deneyimi: proje videosu kaydırmayla ilerliyor, cam paneller projenin rakamlarını (14.300 m² arazi, 9 blok, 72 konut) ve yaşam alanlarını taşıyor, bilgi formu her an elinizin altında.",
          ],
        },
        { kind: "technical", title: "Teknik", body: ["Next.js · Tailwind CSS · GSAP · Lenis · kaydırmayla kontrol edilen video · lead formu."] },
      ],
    },
    {
      slug: "ucay-360",
      title: "Üçay 360",
      live: { url: "https://www.ucay360.com.tr", label: "Siteyi aç", host: "ucay360.com.tr" },
      category: "Web Deneyimi",
      year: "2026",
      role: "Tasarım · Geliştirme",
      personal: false,
      idea: "İklimlendirme, enerji ve e-mobiliteyi tek noktadan sunan bir marka için kaydırmayla oynayan sinematik bir site.",
      layout: "wide",
      visual: "web",
      media: { image: "/work/ucay-360.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Açılış, kaydırmayla ilerleyen bir film: mağazadan eve, ısı pompasından bataryaya, elektrikli araç şarjından güneş panellerine markanın bütün hizmetleri tek sahnede dolaşılır. Site bölüm bölüm, her adım gözden geçirilerek kuruldu.",
          ],
        },
        { kind: "technical", title: "Teknik", body: ["Next.js · Tailwind CSS · Framer Motion · kaydırmayla kontrol edilen video · cam navigasyon."] },
      ],
    },
    {
      slug: "dbh-group",
      title: "DBH Group",
      live: { url: "https://dbh-group-site.vercel.app", label: "Siteyi aç", host: "dbh-group-site.vercel.app" },
      category: "Web Deneyimi",
      year: "2026",
      role: "Tasarım · Geliştirme",
      personal: false,
      idea: "İnşaat, gayrimenkul, maden, teknoloji, enerji ve turizmde faaliyet gösteren bir grup için sinematik bir ana sayfa.",
      layout: "wide",
      visual: "web",
      media: { image: "/work/dbh-group.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Açılışta grubun logosu bir mozaikten kurulup sahneye dönüşüyor; ardından kaydırdıkça grubun altı alanı tam ekran bölümler halinde akıyor: inşaat, gayrimenkul, maden, teknoloji, enerji ve turizm.",
          ],
        },
        { kind: "technical", title: "Teknik", body: ["Next.js · Tailwind CSS · GSAP · Lenis."] },
      ],
    },
    {
      slug: "the-lock",
      title: "The Lock Adres Barbarossa",
      live: { url: "https://www.thelock.com.tr", label: "Siteyi aç", host: "thelock.com.tr" },
      category: "Web Deneyimi",
      year: "2026",
      role: "Tasarım · Geliştirme",
      personal: false,
      idea: "“Zamanın İçinde Zamansız Mimari”: İstanbul'da 4 blok, 286 konut ve 100 ticari alandan oluşan bir proje için kurumsal tanıtım sitesi.",
      layout: "wide",
      visual: "web",
      media: { image: "/work/the-lock.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Projenin taş, ışık ve suyla kurulan mimari dili sitenin tonunu belirliyor: gün batımında bir açılış, ölçülü tipografi ve projeyi, konumu, tanıtım filmlerini ve e-kataloğu taşıyan sade bir akış.",
          ],
        },
        { kind: "technical", title: "Teknik", body: ["Next.js."] },
      ],
    },
    {
      slug: "fidan-property",
      title: "Fidan Property",
      live: { url: "https://www.fidanproperty.com", label: "Siteyi aç", host: "fidanproperty.com" },
      category: "Gayrimenkul Platformu",
      year: "2026",
      role: "Tasarım · Geliştirme",
      personal: false,
      idea: "İstanbul ve Bodrum'da gayrimenkul ve gayrimenkul yoluyla Türk vatandaşlığı arayan yabancı yatırımcılar için portföy sitesi.",
      layout: "split",
      visual: "web",
      media: { image: "/work/fidan-property.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Uluslararası bir kitleye yönelik çok dilli bir site: konum, durum, tür ve fiyatla filtrelenen proje araması, bölge rehberleri, blog ve yatırım odaklı bir anlatım.",
          ],
        },
        { kind: "technical", title: "Teknik", body: ["WordPress · Elementor · gayrimenkul arama ve filtreleme."] },
      ],
    },
    {
      slug: "patika",
      title: "Patika",
      category: "Mobil Uygulama",
      year: "2026",
      role: "Ürün Tasarımı · Geliştirme",
      personal: true,
      idea: "Odak seanslarını sanal dostların büyümesi, görevler, istatistikler ve yaşayan bir yuvayla birleştiren mobil uygulama.",
      layout: "system",
      visual: "agents",
      media: { image: "/work/patika.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Odaklanmak bir dostu beslemek demek: her seans dostunu büyütür ve yuvasına yeni eşyalar kazandırır. Yuva, dostların çim ve gölet sınırları içinde kendi hareketleriyle dolaştığı izometrik bir dünya.",
            "Görevler seanslara bağlanır, özet ekranı seriyi, haftalık ritmi ve neye odaklanıldığını gösterir; ambiyans sesleri ve dokunsal geri bildirim deneyimi tamamlar.",
          ],
        },
        { kind: "technical", title: "Teknik", body: ["Expo · React Native · TypeScript · AsyncStorage · Jest · iOS ve Android sürüm derlemeleri."] },
      ],
    },
    {
      slug: "web-development-agent",
      title: "Web Development Agent",
      category: "Yaratıcı Otomasyon",
      year: "2026",
      role: "Sistem Mimarı · Geliştirici",
      personal: true,
      idea: "Brief'ten deploy'a birden fazla web projesini yöneten, öğrendiğini bilgi tabanına yazan ajan altyapısı.",
      layout: "system",
      visual: "agents",
      sections: [
        {
          kind: "challenge",
          title: "Problem",
          body: [
            "Her web projesi aynı disiplinleri ister: keşif, spec, üretim, QA, deploy. Bu disiplin insan hafızasında dağınık yaşar ve projeler arasında taşınmaz.",
          ],
        },
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Ajanın kendisi bir tasarım nesnesi: görev yönlendirme kuralları, sekiz operasyonel beceri, proje kartları ve doğrulanmış bir WebGL/motion bilgi tabanı. Her proje ajanı daha yetkin bırakır.",
            "Bu portfolyo sitesi, ajanın kendi boru hattından çıkan ilk işlerden biri — hero'daki sistem, bilgi tabanındaki desenlerle inşa edildi.",
          ],
        },
        {
          kind: "system",
          title: "Sistem",
          body: [
            "Görev → beceri yönlendirmesi · bağlam bütçeleri · staging/production onay kapıları · öğrenme durumu takibi (kaynak → not → doğrulama prototipi).",
          ],
        },
        {
          kind: "technical",
          title: "Teknik",
          body: [
            "Claude Code + markdown mimarisi · GitHub + Vercel otomasyonu · Playwright görsel doğrulama · çift repo senkronu.",
          ],
        },
      ],
    },
    {
      slug: "oneavex-ai-studio",
      title: "Oneavex AI Studio",
      category: "AI Video & Motion",
      year: "2025—",
      role: "Kurucu · Creative Direction",
      personal: true,
      idea: "Yapay zekâ destekli video, motion design ve sinematik reklam üretimi için stüdyo pratiği.",
      layout: "wide",
      visual: "studio",
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Oneavex; yaratıcı teknoloji ve dijital iletişim stüdyosu olarak kuruldu. AI video üretimini gerçek sinematografi disipliniyle birleştirir: storyboard, ürün doğruluğu, ışık ve kurgu önce gelir; modeller araçtır.",
          ],
        },
        {
          kind: "system",
          title: "Kapsam",
          body: [
            "Sinematik ürün filmleri · marka kampanyaları · motion design · AI destekli görsel üretim boru hatları.",
          ],
        },
      ],
    },
    {
      slug: "modd-ai-web-experience",
      title: "MODD-AI Web Experience",
      category: "Yaratıcı Web",
      year: "2026",
      role: "Tasarım · Geliştirme",
      personal: true,
      idea: "Kod, partikül ve scroll etkileşimleriyle markanın kendisini anlatan WebGL web deneyimi.",
      layout: "split",
      visual: "web",
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Landing bir broşür değil, ürünün kendisinin bir kanıtı: üretken sistemler sayfanın dokusunu oluşturur, scroll anlatının zamanlamasını yönetir.",
          ],
        },
        {
          kind: "technical",
          title: "Teknik",
          body: ["Next.js · Tailwind · GSAP · Vercel staging boru hattı."],
        },
      ],
    },
    {
      slug: "ecombox",
      title: "Ecombox",
      category: "AI Kampanya",
      year: "2025",
      role: "Creative Direction · AI Üretim",
      personal: false,
      idea: "Veri görselleştirme ve sinematik reklam dilini birleştiren yaratıcı kampanya çalışması.",
      layout: "typographic",
      visual: "film",
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Ürün anlatımı, yapay zekâ üretimi ve veri görselleştirmesi tek kampanya dilinde: bilgi yoğunluğu sinematik tempoya çevrilir.",
          ],
        },
      ],
    },
    {
      slug: "spatial-3d-web",
      title: "3D Web & Digital Twin",
      category: "Mekânsal Deneyim",
      year: "2025—",
      role: "Araştırma · Prototipleme",
      personal: true,
      idea: "Three.js ve WebGL ile dijital ikiz ve mekânsal web deneyimi araştırmaları.",
      layout: "split",
      visual: "spatial",
      sections: [
        {
          kind: "approach",
          title: "Yaratıcı yaklaşım",
          body: [
            "Mekânın dijital ikizi yalnızca geometri değil; veri, durum ve etkileşimin aynı sahnede yaşamasıdır. GLB boru hatları, CRM bağlantıları ve VR/AR yüzeyleri üzerine süren araştırma pratiği.",
          ],
        },
      ],
    },
  ],
};

const en: WorkContent = {
  heading: "Selected Work",
  open: "View case study",
  items: [
    {
      slug: "modd-ai",
      title: "ModdTeam",
      live: { url: "https://www.moddteam.com/login", label: "Open the system", host: "moddteam.com" },
      category: "AI Content Intelligence",
      year: "2026",
      role: "Founder · System Design · Creative Direction",
      personal: true,
      idea: "Multi-brand content intelligence that remembers, produces and quality-checks its own creative output.",
      layout: "featured",
      visual: "field",
      sections: [
        {
          kind: "challenge",
          title: "Problem",
          body: [
            "Social content production restarts from zero without a memory of brand voice, past performance and visual identity. In an agency model that means inconsistency and repetition.",
          ],
        },
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "A Brand Brain per brand: voice, palette, banned phrases and proven patterns live on one card. Content memory learns from every production; a quality-control layer reviews everything before publishing.",
            "Production is distributed across creative roles — strategist, art director, production designer, QA — not thrown at a single model.",
          ],
        },
        {
          kind: "system",
          title: "System",
          body: [
            "Markdown agent architecture · brand isolation · approval-gated publish queue · Instagram integration · content intelligence v2 (memory, DNA, voice samples, QC).",
          ],
        },
        {
          kind: "technical",
          title: "Technical",
          body: [
            "Claude-based multi-agent system · Next.js studio interface · Neon + Vercel Blob · nothing ships without a human approval gate.",
          ],
        },
      ],
    },
    {
      slug: "ala-cekmekoy",
      title: "A'lâ Çekmeköy Nefes",
      live: { url: "https://www.alacekmekoynefes.com", label: "Open the site", host: "alacekmekoynefes.com" },
      category: "Web Experience",
      year: "2026",
      role: "Design · Development",
      personal: false,
      idea: "A launch site that tells a 72-home project beside Çekmeköy's forest like a film played by scrolling.",
      layout: "featured",
      visual: "web",
      media: { image: "/work/ala-cekmekoy.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "A single-screen scroll experience: the project film advances with the scroll, glass panels carry the project's figures (14,300 m² of land, 9 blocks, 72 homes) and its living spaces, and the enquiry form is always at hand.",
          ],
        },
        { kind: "technical", title: "Technical", body: ["Next.js · Tailwind CSS · GSAP · Lenis · scroll-driven video · lead form."] },
      ],
    },
    {
      slug: "ucay-360",
      title: "Üçay 360",
      live: { url: "https://www.ucay360.com.tr", label: "Open the site", host: "ucay360.com.tr" },
      category: "Web Experience",
      year: "2026",
      role: "Design · Development",
      personal: false,
      idea: "A cinematic, scroll-played site for a brand that brings climate control, energy and e-mobility together.",
      layout: "wide",
      visual: "web",
      media: { image: "/work/ucay-360.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "The opening is a film played by scrolling: from the store to the home, from the heat pump to the battery, from EV charging to the solar roof, every service of the brand in one scene. The site was built section by section, each step reviewed.",
          ],
        },
        { kind: "technical", title: "Technical", body: ["Next.js · Tailwind CSS · Framer Motion · scroll-driven video · glass navigation."] },
      ],
    },
    {
      slug: "dbh-group",
      title: "DBH Group",
      live: { url: "https://dbh-group-site.vercel.app", label: "Open the site", host: "dbh-group-site.vercel.app" },
      category: "Web Experience",
      year: "2026",
      role: "Design · Development",
      personal: false,
      idea: "A cinematic homepage for a group working across construction, real estate, mining, technology, energy and tourism.",
      layout: "wide",
      visual: "web",
      media: { image: "/work/dbh-group.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "The opening builds the group's logo from a mosaic that opens into the scene; scrolling then runs through its six fields as full-screen chapters: construction, real estate, mining, technology, energy and tourism.",
          ],
        },
        { kind: "technical", title: "Technical", body: ["Next.js · Tailwind CSS · GSAP · Lenis."] },
      ],
    },
    {
      slug: "the-lock",
      title: "The Lock Adres Barbarossa",
      live: { url: "https://www.thelock.com.tr", label: "Open the site", host: "thelock.com.tr" },
      category: "Web Experience",
      year: "2026",
      role: "Design · Development",
      personal: false,
      idea: "“Timeless architecture within time”: a corporate site for an Istanbul project of 4 blocks, 286 homes and 100 commercial units.",
      layout: "wide",
      visual: "web",
      media: { image: "/work/the-lock.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "The project's architecture of stone, light and water sets the site's tone: an opening at sunset, measured typography and a quiet flow through the project, its location, films and e-catalogue.",
          ],
        },
        { kind: "technical", title: "Technical", body: ["Next.js."] },
      ],
    },
    {
      slug: "fidan-property",
      title: "Fidan Property",
      live: { url: "https://www.fidanproperty.com", label: "Open the site", host: "fidanproperty.com" },
      category: "Real Estate Platform",
      year: "2026",
      role: "Design · Development",
      personal: false,
      idea: "A portfolio site for foreign investors looking for property in Istanbul and Bodrum, and for Turkish citizenship through real estate.",
      layout: "split",
      visual: "web",
      media: { image: "/work/fidan-property.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "A multilingual site for an international audience: project search filtered by location, status, type and price, area guides, a blog and an investment-led story.",
          ],
        },
        { kind: "technical", title: "Technical", body: ["WordPress · Elementor · property search and filtering."] },
      ],
    },
    {
      slug: "patika",
      title: "Patika",
      category: "Mobile App",
      year: "2026",
      role: "Product Design · Development",
      personal: true,
      idea: "A mobile app that joins focus sessions with growing virtual companions, tasks, statistics and a living home.",
      layout: "system",
      visual: "agents",
      media: { image: "/work/patika.jpg", aspect: 1600 / 992 },
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "Focusing means feeding a companion: every session grows it and earns new things for its home. The home is an isometric world where companions wander on their own within the grass and pond.",
            "Tasks are tied to sessions, and the summary shows the streak, the weekly rhythm and what you focused on; ambient sounds and haptics complete the experience.",
          ],
        },
        { kind: "technical", title: "Technical", body: ["Expo · React Native · TypeScript · AsyncStorage · Jest · iOS and Android release builds."] },
      ],
    },
    {
      slug: "web-development-agent",
      title: "Web Development Agent",
      category: "Creative Automation",
      year: "2026",
      role: "System Architect · Developer",
      personal: true,
      idea: "Agent infrastructure that runs web projects from brief to deployment — and writes what it learns into a knowledge base.",
      layout: "system",
      visual: "agents",
      sections: [
        {
          kind: "challenge",
          title: "Problem",
          body: [
            "Every web project demands the same disciplines: discovery, spec, build, QA, deployment. That discipline usually lives scattered in human memory and never transfers between projects.",
          ],
        },
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "The agent itself is a designed object: task routing rules, eight operational skills, project cards and a verified WebGL/motion knowledge base. Every project leaves the agent more capable.",
            "This portfolio is one of the first works shipped through the agent's own pipeline — the hero system was built from patterns in its knowledge base.",
          ],
        },
        {
          kind: "system",
          title: "System",
          body: [
            "Task → skill routing · context budgets · staging/production approval gates · learning-status tracking (source → notes → verification prototype).",
          ],
        },
        {
          kind: "technical",
          title: "Technical",
          body: [
            "Claude Code + markdown architecture · GitHub + Vercel automation · Playwright visual verification · dual-repo sync.",
          ],
        },
      ],
    },
    {
      slug: "oneavex-ai-studio",
      title: "Oneavex AI Studio",
      category: "AI Video & Motion",
      year: "2025—",
      role: "Founder · Creative Direction",
      personal: true,
      idea: "A studio practice for AI-assisted video, motion design and cinematic advertising.",
      layout: "wide",
      visual: "studio",
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "Oneavex was founded as a creative technology and digital communication studio. It pairs AI video production with real cinematography discipline: storyboard, product accuracy, light and edit come first; models are instruments.",
          ],
        },
        {
          kind: "system",
          title: "Scope",
          body: [
            "Cinematic product films · brand campaigns · motion design · AI-assisted visual production pipelines.",
          ],
        },
      ],
    },
    {
      slug: "modd-ai-web-experience",
      title: "MODD-AI Web Experience",
      category: "Creative Web",
      year: "2026",
      role: "Design · Development",
      personal: true,
      idea: "A WebGL web experience where the brand explains itself through code, particles and scroll.",
      layout: "split",
      visual: "web",
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "The landing is not a brochure but evidence of the product itself: generative systems form the page's fabric, scroll conducts the narrative timing.",
          ],
        },
        {
          kind: "technical",
          title: "Technical",
          body: ["Next.js · Tailwind · GSAP · Vercel staging pipeline."],
        },
      ],
    },
    {
      slug: "ecombox",
      title: "Ecombox",
      category: "AI Campaign",
      year: "2025",
      role: "Creative Direction · AI Production",
      personal: false,
      idea: "Campaign work joining data visualization with cinematic advertising language.",
      layout: "typographic",
      visual: "film",
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "Product storytelling, AI production and data visualization in one campaign language: information density translated into cinematic tempo.",
          ],
        },
      ],
    },
    {
      slug: "spatial-3d-web",
      title: "3D Web & Digital Twin",
      category: "Spatial Experience",
      year: "2025—",
      role: "Research · Prototyping",
      personal: true,
      idea: "Digital-twin and spatial web experience research with Three.js and WebGL.",
      layout: "split",
      visual: "spatial",
      sections: [
        {
          kind: "approach",
          title: "Creative approach",
          body: [
            "A digital twin is not just geometry; it is data, state and interaction living in one scene. Ongoing research across GLB pipelines, CRM connections and VR/AR surfaces.",
          ],
        },
      ],
    },
  ],
};

export const work: Record<Locale, WorkContent> = { tr, en };

export function getWorkItem(locale: Locale, slug: string): WorkItem | undefined {
  return work[locale].items.find((w) => w.slug === slug);
}
