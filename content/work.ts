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
  sections: CaseSection[];
};

type WorkContent = { heading: string; open: string; items: WorkItem[] };

const tr: WorkContent = {
  heading: "Seçili İşler",
  open: "Projeyi incele",
  items: [
    {
      slug: "modd-ai",
      title: "MODD-AI",
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
          body: ["Next.js · Tailwind · framer-motion · Vercel staging boru hattı."],
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
      title: "MODD-AI",
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
          body: ["Next.js · Tailwind · framer-motion · Vercel staging pipeline."],
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
