import type { Locale } from "@/lib/i18n";

// Guides (/tr/rehber, /en/guides): long answers to the questions clients search
// before they hire, each tied to a service and to real work. Same rule as the
// rest of the site: no invented statistics, prices or outcomes; examples are
// the projects in content/work.ts. `key` pairs the TR and EN articles.

export type GuideSection = { h2: string; body: string[]; list?: string[] };

export type Guide = {
  key: string;
  slug: string;
  title: string; // <title>, carries the searched question
  description: string;
  h1: string;
  lead: string;
  published: string; // ISO date
  updated: string;
  sections: GuideSection[];
  service: string; // service key this guide leads to
  work: string[]; // work slugs cited
};

type Guides = {
  base: string;
  hub: { title: string; description: string; h1: string; lead: string };
  labels: { all: string; read: string; updated: string; related: string; service: string; cta: string };
  items: Guide[];
};

const tr: Guides = {
  base: "rehber",
  hub: {
    title: "Rehber: Web Sitesi, Yapay Zeka ve Tasarım Üzerine Yazılar",
    description: "Konut projesi lansman sitesinden özel AI agent'lara: proje başlatmadan önce sorulan sorulara, gerçek işlerden örneklerle cevaplar.",
    h1: "Rehber",
    lead: "Bir projeye başlamadan önce sorulan sorulara uzun ve net cevaplar. Örnekler, yaptığım gerçek işlerden.",
  },
  labels: { all: "Tüm yazılar", read: "Oku", updated: "Güncellendi", related: "Yazıda geçen işler", service: "İlgili hizmet", cta: "Kendi projen için konuşalım: aklındakini kısaca yaz." },
  items: [
    {
      key: "real-estate-launch",
      slug: "konut-projesi-lansman-sitesi",
      title: "Konut Projesi Lansman Sitesi Nasıl Olmalı? Satışa Çalışan Sitenin Parçaları",
      description:
        "Bir konut projesinin lansman sitesinde neler olmalı: ilk ekran, proje rakamları, plan tipleri, konum, her an görünen bilgi formu, telefon hızı, yabancı alıcı ve arama motoru. Kontrol listesiyle.",
      h1: "Konut projesi lansman sitesi nasıl olmalı?",
      lead: "Alıcı bir projeyi şantiyeden önce sitesinde görür. Lansman sitesinin işi projeyi güzel göstermekten fazlası: doğru kişiyi bilgi formuna, oradan satış ofisine götürmek. Aşağıda böyle bir sitenin parçaları ve yayından önce bakılacaklar var.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "real-estate",
      work: ["ala-cekmekoy", "the-lock", "fidan-property"],
      sections: [
        {
          h2: "Lansman sitesinin tek bir işi var",
          body: [
            "Kurumsal bir sitenin birçok görevi olabilir; bir proje lansman sitesinin görevi tek: ilgilenen alıcıdan bilgi talebi almak. Her bölüm bu soruya göre değerlendirilmeli: bu ekran alıcıyı forma yaklaştırıyor mu, uzaklaştırıyor mu?",
            "Bu yüzden lansman sitesi çoğu zaman tek, uzun bir sayfadır. Ziyaretçi menüler arasında kaybolmaz; proje bir hikâye gibi yukarıdan aşağı anlatılır ve form her an bir dokunuş uzaklıktadır.",
          ],
        },
        {
          h2: "İlk ekran: projenin fikri ve görüntüsü",
          body: [
            "İlk saniyede üç şey anlaşılmalı: proje ne, nerede ve neden farklı. Bunu en hızlı anlatan şey güçlü bir görüntü ya da kısa bir film ile tek cümlelik bir fikirdir.",
            "A'lâ Çekmeköy Nefes'te proje videosu kaydırdıkça ilerliyor; ziyaretçi ormanın yanındaki projeyi bir film izler gibi dolaşıyor. The Lock Adres Barbarossa'da ise gün batımında bir açılış ve ölçülü tipografi, projenin “zamanın içinde zamansız mimari” fikrini taşıyor.",
          ],
        },
        {
          h2: "Rakamlar net ve ilk bakışta",
          body: [
            "Alıcının aradığı bilgiler bellidir: arazi büyüklüğü, blok ve konut sayısı, plan tipleri, sosyal alanlar, teslim tarihi. Bunlar bir PDF'in içine gömülmemeli, sayfada okunur olmalı.",
            "A'lâ Çekmeköy Nefes'te 14.300 m² arazi, 9 blok ve 72 konut cam paneller üzerinde, kaydırırken görünüyor. The Lock'ta 4 blok, 286 konut ve 100 ticari alan ilk anlatımın parçası.",
          ],
        },
        {
          h2: "Plan tipleri ve daire bilgisi",
          body: [
            "Her plan tipi için oda sayısı, brüt ve net metrekare ve kat planı görseli ayrı ayrı gösterilmeli. Alıcı kendine uygun daireyi bulduğunda, formda o tipi seçebilmeli; satış ekibi de kimin neyle ilgilendiğini baştan bilir.",
          ],
        },
        {
          h2: "Konum ve çevre",
          body: [
            "Harita, ulaşım bağlantıları ve yakındaki okul, hastane, alışveriş gibi noktalar alıcının en çok sorduğu sorulardır. Süre ve mesafe verilecekse doğrulanmış bilgiler kullanılmalı; abartılı vaat, ilk görüşmede güveni bozar.",
          ],
        },
        {
          h2: "Bilgi formu her an görünür olmalı",
          body: [
            "Form, sayfanın en altında saklanmamalı. Telefonda sabit bir buton, masaüstünde görünür bir alan ve her bölümün sonunda bir çağrı olmalı.",
            "Form kısa tutulmalı: ad, telefon, e-posta ve ilgilenilen daire tipi çoğu zaman yeterlidir. KVKK aydınlatma metni ve açık rıza onayı forma eklenmeli. Talebin satış ekibine anında ulaşması ve hangi kaynaktan (reklam, sosyal medya, arama) geldiğinin görülmesi, pazarlama bütçesinin nereye gideceğine karar vermeyi kolaylaştırır.",
          ],
        },
        {
          h2: "Telefonda hızlı ve akıcı",
          body: [
            "Reklamlardan ve sosyal medyadan gelen ziyaretçilerin büyük kısmı siteyi telefondan açar. Video ve hareket, telefonda da akıcı çalışacak şekilde hazırlanmalı; ağır sahneler zayıf cihazlarda hafiflemeli. Güzel ama geç açılan bir site, reklam bütçesinin bir kısmını boşa harcar.",
          ],
        },
        {
          h2: "Film ve hareket hikâyeye hizmet etmeli",
          body: [
            "Kaydırmayla oynayan video, 3B ve hareket bir projeyi gerçekten hissettirebilir; ama her efektin bir görevi olmalı. Bir hareket projeyi anlatmıyorsa, sadece yükleme süresi ekler.",
            "İnşaat henüz başlamadıysa render ve planlarla, yapay zekâ destekli tanıtım filmleriyle de güçlü bir lansman yapılabilir; site proje ilerledikçe gerçek fotoğraflarla güncellenir.",
          ],
        },
        {
          h2: "Yabancı alıcı için",
          body: [
            "Proje yabancı yatırımcıya da satılacaksa site birden fazla dilde olmalı; fiyat, konum ve süreç bilgisi her dilde aynı netlikte verilmeli. Gayrimenkul yoluyla vatandaşlık gibi konular ayrı ve anlaşılır bölümler ister.",
            "Fidan Property, İstanbul ve Bodrum'da gayrimenkul arayan yabancı yatırımcılar için kuruldu: konum, durum, tür ve fiyatla filtrelenen proje araması, bölge rehberleri ve çok dilli içerik bu yüzden var.",
          ],
        },
        {
          h2: "Arama motorunda bulunmak",
          body: [
            "İnsanlar projeyi adıyla ve semtiyle arar: “proje adı + semt”, “semt + satılık konut”. Sayfa başlığı, açıklama, görsellerin alternatif metinleri ve yapısal veri bu aramalara göre ayarlanmalı; site haritası Google Search Console'a gönderilmeli.",
          ],
        },
        {
          h2: "Yayından önce kontrol listesi",
          body: ["Lansman günü gelmeden bunların hepsine bakılmalı:"],
          list: [
            "İlk ekranda projenin adı, yeri ve fikri tek bakışta anlaşılıyor.",
            "Arazi, blok, konut sayısı, plan tipleri ve teslim tarihi sayfada yazılı.",
            "Bilgi formu telefonda ve masaüstünde her an bir dokunuş uzaklıkta.",
            "Form kısa, KVKK onayı var, talep satış ekibine anında ulaşıyor.",
            "Site telefonda hızlı açılıyor, video ve hareket akıcı.",
            "Konum bilgileri doğrulanmış, harita çalışıyor.",
            "Yabancı alıcı hedefleniyorsa diğer diller eksiksiz.",
            "Sayfa başlığı, açıklama ve site haritası arama motoru için hazır.",
          ],
        },
      ],
    },
    {
      key: "custom-ai-agent",
      slug: "ozel-ai-agent-nedir",
      title: "Özel AI Agent Nedir? İşletmeler İçin Ne Yapar, Nasıl Kurulur?",
      description:
        "Özel AI agent ile hazır chatbot arasındaki fark, bir agent'ın parçaları, hangi işlerin yapay zekâya devredilebileceği, çok ajanlı sistemler ve küçük başlayıp büyütmenin yolu. Gerçek sistemlerden örneklerle.",
      h1: "Özel AI agent nedir, işletmene ne kazandırır?",
      lead: "“Yapay zekâ kullanalım” kararı çoğu zaman bir sohbet penceresiyle başlar ve orada kalır. Özel bir AI agent ise bir işi baştan sona yürütür: araçlarını kullanır, kendi çıktısını denetler ve onay gereken yerde durur. Bu yazıda farkı, parçaları ve nasıl başlanacağını anlatıyorum.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "ai",
      work: ["modd-ai", "web-development-agent"],
      sections: [
        {
          h2: "Chatbot ile agent arasındaki fark",
          body: [
            "Hazır bir chatbot soruya cevap verir; işi yapmak yine sana kalır. Bir agent ise bir hedefe doğru adım adım ilerler: brief'i okur, gereken bilgiyi bulur, araçlarını kullanır, sonucu üretir, kendi kurallarına göre kontrol eder ve kayda geçirir.",
            "Fark, cevap ile iş arasındaki farktır. Chatbot “şu postu nasıl yazarım?” sorusuna öneri verir; agent markanın sesine uygun postu yazar, görsel brief'ini hazırlar, yasaklı ifadelere karşı denetler ve onaya sunar.",
          ],
        },
        {
          h2: "Bir agent'ın parçaları",
          body: ["Çalışan bir agent birkaç parçadan oluşur:"],
          list: [
            "Talimatlar: işin tanımı, kuralları ve neyin iyi sayıldığı.",
            "Araçlar: bağlandığı sistemler; dosyalar, veritabanı, takvim, sosyal medya hesabı gibi.",
            "Hafıza: markanın sesi, geçmiş işler ve işe yaramış desenler.",
            "Denetim: çıktının yayından önce kurallara göre kontrolü.",
            "İnsan onayı: geri alınamayan adımlardan (yayınlamak, göndermek, ödeme) önce duran bir kapı.",
          ],
        },
        {
          h2: "Hangi işler agent'a uygun?",
          body: [
            "En iyi adaylar tekrar eden, kuralı tarif edilebilen ve birkaç adımdan oluşan işlerdir: bir brief'ten içerik taslağı üretmek, gelen talepleri sınıflamak, düzenli raporları hazırlamak, bir web projesini keşiften yayına aynı disiplinle yürütmek.",
            "İnsanda kalması gerekenler de bellidir: strateji, son karar, müşteriyle ilişki ve markanın riskli konularda ne diyeceği. İyi bir sistem bu sınırı baştan çizer.",
          ],
        },
        {
          h2: "Tek model değil, roller: çok ajanlı sistemler",
          body: [
            "Karmaşık bir işi tek bir modele yüklemek yerine rollere bölmek daha güvenilir sonuç verir. Her rolün girdisi, çıktısı ve denetimi tanımlı olur; hata nerede çıktıysa orada yakalanır.",
            "ModdTeam'de içerik üretimi stratejist, art direktör, üretim tasarımcısı ve kalite kontrol rollerine bölünmüş durumda. Her markanın sesi, paleti ve yasaklı ifadeleri bir hafızada tutuluyor; her üretim yayından önce bu hafızaya göre denetleniyor ve onay kapısından geçmeden hiçbir içerik dışarı çıkmıyor.",
          ],
        },
        {
          h2: "Sistem kullanıldıkça öğrenmeli",
          body: [
            "Bir agent'ın değeri zamanla artmalı. Onaylanan desenler hafızaya, tek seferlik denemeler günlüğe yazılırsa sistem her işten biraz daha yetkin çıkar.",
            "Web Development Agent bu şekilde çalışıyor: görev yönlendirme kuralları, operasyonel beceriler ve doğrulanmış bir bilgi tabanıyla web projelerini brief'ten yayına yürütüyor ve her projeden öğrendiğini bilgi tabanına ekliyor. Bu portfolyo sitesi de o boru hattından çıktı.",
          ],
        },
        {
          h2: "Güvenlik ve kontrol",
          body: [
            "Bir agent'a araç vermek, ona yetki vermek demektir. Bu yüzden API anahtarları gibi gizli bilgiler agent'ın göremeyeceği yerde tutulmalı, markalar arası bilgi birbirinden ayrılmalı ve yayın, gönderim gibi geri alınamayan her adım insan onayına bağlanmalı.",
          ],
        },
        {
          h2: "Nasıl başlanır?",
          body: ["Büyük bir dönüşüm planı yerine küçük ve çalışan bir sistemle başlamak en sağlıklısı:"],
          list: [
            "Ekibin her hafta tekrar ettiği tek bir işi seç.",
            "O işin girdisini, çıktısını ve iyi sonucun ölçüsünü yaz.",
            "Agent'ı yalnızca o iş için kur; insan onayını sona koy.",
            "Birkaç hafta kullan, hataları kurallara dönüştür.",
            "İşe yarıyorsa ikinci işe genişlet.",
          ],
        },
      ],
    },
  ],
};

const en: Guides = {
  base: "guides",
  hub: {
    title: "Guides: Websites, AI and Design",
    description: "From real estate launch websites to custom AI agents: long answers to the questions asked before a project starts, with examples from real work.",
    h1: "Guides",
    lead: "Long, plain answers to the questions people ask before starting a project. The examples come from work I have shipped.",
  },
  labels: { all: "All guides", read: "Read", updated: "Updated", related: "Work cited", service: "Related service", cta: "Let's talk about your project: tell me what you have in mind." },
  items: [
    {
      key: "real-estate-launch",
      slug: "real-estate-launch-website",
      title: "What a Real Estate Launch Website Needs: The Parts That Sell Homes",
      description:
        "What belongs on a residential project's launch website: the first screen, project figures, unit types, location, an always-visible enquiry form, phone speed, foreign buyers and search. With a launch checklist.",
      h1: "What a real estate launch website needs",
      lead: "Buyers meet a development on its website before they see the building. A launch site has to do more than look good: it has to bring the right person to the enquiry form and on to the sales office. Here are the parts of such a site, and what to check before it goes live.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "real-estate",
      work: ["ala-cekmekoy", "the-lock", "fidan-property"],
      sections: [
        {
          h2: "A launch site has one job",
          body: [
            "A corporate website can serve many purposes; a project launch site serves one: getting an enquiry from an interested buyer. Every section should be judged by that: does this screen bring the buyer closer to the form, or further away?",
            "That is why a launch site is often a single long page. Visitors don't get lost in menus; the project is told top to bottom like a story, and the form is always one tap away.",
          ],
        },
        {
          h2: "The first screen: the idea and the image",
          body: [
            "In the first second three things should be clear: what the project is, where it is and why it is different. A strong image or a short film with a one-line idea says this fastest.",
            "On A'lâ Çekmeköy Nefes the project film advances as you scroll, so visitors move through a development beside the forest as if watching a film. On The Lock Adres Barbarossa a sunset opening and restrained type carry the project's idea of “timeless architecture within time”.",
          ],
        },
        {
          h2: "Figures, plainly and early",
          body: [
            "Buyers look for the same facts: land size, number of blocks and homes, unit types, amenities, completion date. They should be readable on the page, not buried in a PDF.",
            "On A'lâ Çekmeköy Nefes 14,300 m² of land, 9 blocks and 72 homes sit on glass panels as you scroll. On The Lock, 4 blocks, 286 homes and 100 commercial units are part of the opening story.",
          ],
        },
        {
          h2: "Unit types and floor plans",
          body: [
            "Each unit type deserves its own room count, gross and net area and floor plan image. When buyers find the unit that suits them they should be able to pick it in the form, so the sales team knows from the start who wants what.",
          ],
        },
        {
          h2: "Location and surroundings",
          body: [
            "Maps, transport links and nearby schools, hospitals and shopping are what buyers ask about most. If times and distances are given, use verified figures; overpromising breaks trust at the first meeting.",
          ],
        },
        {
          h2: "The enquiry form, always in view",
          body: [
            "The form should not hide at the bottom of the page. A fixed button on phones, a visible area on desktop and a call at the end of each section all help.",
            "Keep the form short: name, phone, email and unit type of interest are usually enough, plus the consent your market's privacy law requires. Enquiries should reach the sales team at once, with the channel they came from (ads, social, search), so marketing spend goes where it works.",
          ],
        },
        {
          h2: "Fast and smooth on a phone",
          body: [
            "Most visitors arriving from ads and social media open the site on a phone. Video and motion should be prepared to run smoothly there, with heavy scenes lightened on weaker devices. A beautiful site that opens late wastes part of the ad budget.",
          ],
        },
        {
          h2: "Film and motion should serve the story",
          body: [
            "Scroll-driven video, 3D and motion can make a project felt; but every effect needs a job. Motion that doesn't tell the project only adds loading time.",
            "Before construction starts, a strong launch can be built from renders, plans and AI-driven launch films; the site then grows with real photography as the project rises.",
          ],
        },
        {
          h2: "For foreign buyers",
          body: [
            "If the project is also sold abroad, the site needs more than one language, with price, location and process just as clear in each. Topics such as citizenship by investment deserve their own clear sections.",
            "Fidan Property was built for foreign investors looking for property in Istanbul and Bodrum: that is why it has project search filtered by location, status, type and price, area guides and multilingual content.",
          ],
        },
        {
          h2: "Being found in search",
          body: [
            "People search a project by its name and its district: “project name + district”, “district + homes for sale”. Page titles, descriptions, image alt text and structured data should answer those searches, and the sitemap should be submitted to Google Search Console.",
          ],
        },
        {
          h2: "Pre-launch checklist",
          body: ["Before launch day, check all of these:"],
          list: [
            "The first screen makes the project's name, place and idea clear at a glance.",
            "Land, blocks, number of homes, unit types and completion date are written on the page.",
            "The enquiry form is one tap away on phone and desktop.",
            "The form is short, has the required consent and reaches the sales team at once.",
            "The site opens fast on a phone; video and motion run smoothly.",
            "Location details are verified and the map works.",
            "If foreign buyers are a target, the other languages are complete.",
            "Page titles, descriptions and the sitemap are ready for search engines.",
          ],
        },
      ],
    },
    {
      key: "custom-ai-agent",
      slug: "what-is-a-custom-ai-agent",
      title: "What Is a Custom AI Agent? What It Does for a Business and How to Start",
      description:
        "How a custom AI agent differs from a chatbot, the parts of an agent, which work can be handed to AI, multi-agent systems and how to start small and grow. With examples from working systems.",
      h1: "What is a custom AI agent, and what can it do for your business?",
      lead: "A decision to “use AI” often starts with a chat window and stays there. A custom AI agent carries a piece of work from start to finish: it uses its tools, checks its own output and stops where approval is needed. This guide covers the difference, the parts and how to begin.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "ai",
      work: ["modd-ai", "web-development-agent"],
      sections: [
        {
          h2: "Chatbot or agent",
          body: [
            "An off-the-shelf chatbot answers questions; the work is still yours. An agent moves step by step toward a goal: it reads the brief, finds what it needs, uses its tools, produces the result, checks it against its rules and records it.",
            "The difference is the one between an answer and a job done. A chatbot suggests how to write a post; an agent writes the post in the brand's voice, prepares the visual brief, checks it against banned phrases and puts it up for approval.",
          ],
        },
        {
          h2: "The parts of an agent",
          body: ["A working agent is made of a few parts:"],
          list: [
            "Instructions: what the job is, its rules and what counts as good.",
            "Tools: the systems it connects to, such as files, a database, a calendar or a social account.",
            "Memory: the brand's voice, past work and patterns that have worked.",
            "Review: checking the output against the rules before it goes anywhere.",
            "Human approval: a gate before any step that can't be undone (publishing, sending, paying).",
          ],
        },
        {
          h2: "Which work suits an agent?",
          body: [
            "The best candidates are repeated, rule-describable, multi-step tasks: drafting content from a brief, sorting incoming requests, preparing regular reports, running a web project from discovery to launch with the same discipline every time.",
            "What stays with people is just as clear: strategy, the final call, client relationships and what the brand says on sensitive topics. A good system draws that line from the start.",
          ],
        },
        {
          h2: "Roles, not one model: multi-agent systems",
          body: [
            "Splitting complex work into roles gives more reliable results than loading it onto one model. Each role has a defined input, output and check, so a mistake is caught where it happens.",
            "In ModdTeam, content production is split into strategist, art director, production designer and quality control roles. Each brand's voice, palette and banned phrases live in one memory; every piece is checked against it before release, and nothing leaves without passing the approval gate.",
          ],
        },
        {
          h2: "The system should learn as it is used",
          body: [
            "An agent's value should grow over time. If approved patterns go into memory and one-off experiments into a log, the system comes out of every job a little more capable.",
            "Web Development Agent works this way: with routing rules, operational skills and a verified knowledge base it runs web projects from brief to launch and adds what each project teaches to its knowledge base. This portfolio came out of that pipeline.",
          ],
        },
        {
          h2: "Security and control",
          body: [
            "Giving an agent tools means giving it authority. Secrets such as API keys should sit where the agent can't read them, information should stay separated between brands, and every irreversible step, like publishing or sending, should wait for a person's approval.",
          ],
        },
        {
          h2: "How to start",
          body: ["Rather than a grand transformation plan, start with one small system that works:"],
          list: [
            "Pick one task the team repeats every week.",
            "Write down its input, its output and what a good result looks like.",
            "Build the agent for that task only, with human approval at the end.",
            "Use it for a few weeks and turn its mistakes into rules.",
            "If it works, extend it to the next task.",
          ],
        },
      ],
    },
  ],
};

export const guides: Record<Locale, Guides> = { tr, en };

export const guidePath = (locale: Locale, slug?: string) => `/${locale}/${guides[locale].base}${slug ? `/${slug}` : ""}`;

export const getGuide = (locale: Locale, slug: string) => guides[locale].items.find((g) => g.slug === slug);

export function guideAlternates(key: string) {
  const tr = guides.tr.items.find((g) => g.key === key)!;
  const en = guides.en.items.find((g) => g.key === key)!;
  return { tr: guidePath("tr", tr.slug), en: guidePath("en", en.slug), "x-default": guidePath("tr", tr.slug) };
}
