import type { Locale } from "@/lib/i18n";
import { contactBase, contactPath } from "@/content/contact";
import { guides, guidePath, getGuide } from "@/content/guides";

// Service pages: one per discipline people search for, each grounded in real
// work from content/work.ts. Same rule as the rest of the site: no invented
// clients, prices, timelines or metrics. `key` pairs the TR and EN pages.

export type Service = {
  key: string;
  slug: string;
  name: string; // short name for lists and breadcrumbs
  title: string; // <title>, carries the main search phrase
  description: string; // meta description
  h1: string;
  lead: string;
  offers: { name: string; desc: string }[];
  approach: string[];
  work: string[]; // work slugs
  faq: { q: string; a: string }[];
  terms: string[]; // the phrases this page answers for (schema + llms.txt)
};

type Services = {
  base: string; // URL segment under the locale
  hub: { title: string; description: string; h1: string; lead: string; who: string };
  labels: { offers: string; approach: string; work: string; faq: string; cta: string; ctaLine: string; all: string; home: string };
  items: Service[];
};

const tr: Services = {
  base: "hizmetler",
  hub: {
    title: "Hizmetler: Yapay Zeka Uzmanı, Web ve Grafik Tasarımcı",
    description:
      "Ataberk Soylu, İstanbul'da yapay zeka uzmanı, yapay zeka artist, web tasarımcısı, web geliştiricisi, grafik ve UI/UX tasarımcısı olarak markalar için çalışıyor.",
    h1: "Yapay zeka, tasarım ve web: tek elden.",
    lead: "Bir markanın kimliğini, sitesini, filmini ve onu besleyen yapay zekâ sistemini aynı kişiyle, aynı dille kurabilirsin. Aşağıda her disiplinin ne kapsadığı ve hangi gerçek işlerde kullanıldığı var.",
    who: "Ataberk Soylu, İstanbul merkezli bir creative technologist ve multi designer: yapay zekâ, grafik ve arayüz tasarımı, motion ve web geliştirmeyi tek üretim sürecinde birleştiriyor. Yaratıcı teknoloji stüdyosu Oneavex'in kurucusu ve çok markalı içerik zekâsı ModdTeam'in geliştiricisi; üretken sanat ve yapay zekâ yaratıcılığı üzerine yüksek lisans tezini tamamladı. Türkiye genelinde ve uzaktan çalışıyor.",
  },
  labels: {
    offers: "Neler yapıyorum",
    approach: "Nasıl çalışıyorum",
    work: "Bu alandaki işler",
    faq: "Sık sorulanlar",
    cta: "Projeni anlat",
    ctaLine: "Aklındaki işi kısaca yaz; kapsamı ve yolu birlikte netleştirelim.",
    all: "Tüm hizmetler",
    home: "Ana sayfa",
  },
  items: [
    {
      key: "ai",
      slug: "yapay-zeka-uzmani",
      name: "Yapay Zeka Uzmanı",
      title: "Yapay Zeka Uzmanı & AI Agent Geliştirme | İstanbul",
      description:
        "İstanbul'da yapay zeka uzmanı ve yapay zeka mühendisi: özel AI agent geliştirme, çok ajanlı sistemler, iş akışı otomasyonu ve marka hafızası kuran içerik zekâsı.",
      h1: "Yapay zeka uzmanı ve AI agent geliştirici",
      lead: "İşini anlayan, araçlarını kullanan ve her üretimden öğrenen yapay zekâ sistemleri kuruyorum. Sohbet penceresi değil; ekibinin yanında gerçekten iş yapan ajanlar.",
      offers: [
        { name: "Özel AI agent geliştirme", desc: "Belirli bir işi baştan sona yürüten ajanlar: brief okur, araç kullanır, çıktısını denetler, sonucu kayda geçirir." },
        { name: "Çok ajanlı sistemler", desc: "Üretimi tek modele yüklemek yerine rollere bölmek: stratejist, art direktör, üretim ve kalite kontrol ayrı ajanlar olarak çalışır." },
        { name: "İş akışı otomasyonu", desc: "Araçlarını birbirine bağlayan, tekrarlayan işleri senin yerine yürüten ve onay gereken yerde duran akışlar." },
        { name: "Marka hafızası ve içerik zekâsı", desc: "Markanın sesi, paleti, yasakları ve işe yaramış desenleri tek bir hafızada; her yeni içerik bu hafızadan üretilir ve denetlenir." },
        { name: "Yapay zeka danışmanlığı", desc: "Hangi işin yapay zekâya devredilebileceğini, hangisinin insanda kalması gerektiğini birlikte ayırıyoruz; sonra küçük ve çalışan bir sistemle başlıyoruz." },
      ],
      approach: [
        "Önce iş: hangi karar ve hangi tekrar ortadan kalkacak, onu netleştiriyoruz.",
        "Sistemi rollere bölüyorum; her rolün girdisi, çıktısı ve denetimi tanımlı.",
        "Yayın, gönderim gibi geri alınamayan adımlar insan onayı olmadan çalışmaz.",
        "Sistem kullanıldıkça öğrenir: onaylanan desenler hafızaya, tek seferlik denemeler günlüğe yazılır.",
      ],
      work: ["modd-ai", "web-development-agent"],
      faq: [
        { q: "Yapay zeka uzmanı olarak ne tür işler yapıyorsun?", a: "Markalar ve ekipler için özel AI agent'lar, çok ajanlı üretim sistemleri, iş akışı otomasyonları ve marka hafızası tutan içerik zekâsı kuruyorum. ModdTeam ve Web Development Agent bu sistemlerin çalışan örnekleri." },
        { q: "Hazır bir chatbot ile özel AI agent arasındaki fark ne?", a: "Hazır bir chatbot soruya cevap verir. Özel bir agent senin araçlarına bağlanır, işi adım adım yürütür, çıktısını kendi kurallarınla denetler ve onay gereken yerde durur." },
        { q: "Yapay zekâ markamın sesini bozmaz mı?", a: "Bu yüzden her sistemin merkezinde marka hafızası var: ses, palet ve yasaklı ifadeler tanımlı, her üretim yayından önce bunlara göre kontrol ediliyor." },
        { q: "İstanbul dışından çalışabilir miyiz?", a: "Evet. İstanbul merkezliyim; Türkiye genelinde ve uzaktan çalışıyorum." },
      ],
      terms: ["yapay zeka uzmanı", "yapay zeka mühendisi", "yapay zeka danışmanı", "AI agent geliştirme", "yapay zeka otomasyon uzmanı", "üretken yapay zeka uzmanı", "çok ajanlı sistemler", "yapay zeka danışmanlığı"],
    },
    {
      key: "ai-art",
      slug: "yapay-zeka-artist",
      name: "Yapay Zeka Artist",
      title: "Yapay Zeka Reklam Filmi & AI Video | İstanbul",
      description:
        "İstanbul'da yapay zeka artist: yapay zekâ destekli reklam filmleri, AI video prodüksiyon, sinematik kampanya görselleri ve üretken sanat.",
      h1: "Yapay zeka artist: AI video, reklam filmi ve görsel",
      lead: "Yapay zekâyı bir efekt olarak değil, bir yönetmenlik aracı olarak kullanıyorum. Konseptten son kareye, markanın hikâyesini anlatan filmler ve kampanya görselleri.",
      offers: [
        { name: "Yapay zeka reklam filmi", desc: "Senaryo, storyboard, görsel dil ve kurgu ile baştan sona yapay zekâ destekli sinematik reklam filmleri." },
        { name: "AI video prodüksiyon", desc: "Ürün lansmanı, sosyal medya ve kampanya için kısa formatlı yapay zekâ videoları, motion ile birleştirilmiş." },
        { name: "Kampanya ve marka görselleri", desc: "Markanın paletine ve tonuna bağlı kalan, metni ve logosu doğru yerleşmiş üretken görseller." },
        { name: "Üretken sanat", desc: "Yüksek lisans tezimin konusu olan üretken sanat ve yapay zekâ yaratıcılığı üzerine özgün işler ve deneyler." },
      ],
      approach: [
        "Her iş bir fikir ve bir storyboard ile başlar; araç seçimi sonra gelir.",
        "Görsel dil markanın paletine ve kurallarına bağlanır, sahneler bu dile göre üretilir.",
        "Üretilen kareler motion, kurgu ve ses ile tek bir filme dönüşür.",
        "Teslimden önce her kare marka uyumu ve teknik kalite için gözden geçirilir.",
      ],
      work: ["oneavex-ai-studio", "ecombox"],
      faq: [
        { q: "Yapay zeka artist ne yapar?", a: "Yapay zekâ araçlarını bir yönetmen ve tasarımcı gözüyle kullanarak film, kampanya görseli ve sanat işi üretir. Benim işim fikri, görsel dili ve kurguyu kurmak; yapay zekâ bu dilin üretim aracı." },
        { q: "Yapay zekâ ile reklam filmi çekmek mümkün mü?", a: "Evet. Oneavex'te yapay zekâ destekli video, motion design ve sinematik reklam işleri üretiyorum; set kurmadan kampanya filmi üretmek mümkün." },
        { q: "Üretilen görseller markama uygun olur mu?", a: "Her üretim markanın paleti, tonu ve kurallarıyla sınırlanır; uymayan kareler teslim edilmez." },
      ],
      terms: ["yapay zeka artist", "yapay zeka sanatçısı", "AI artist", "yapay zeka reklam filmi", "AI video prodüksiyon", "yapay zeka video", "üretken sanat"],
    },
    {
      key: "web-design",
      slug: "web-tasarim",
      name: "Web Tasarımcısı",
      title: "Web Sitesi Yaptırmak: Kurumsal Web Tasarım | İstanbul",
      description:
        "İstanbul'da web tasarımcısı: kurumsal web sitesi, gayrimenkul ve proje lansman siteleri, sinematik ve interaktif web tasarımı. Tasarım ve geliştirme tek elden.",
      h1: "Web tasarımcısı: markanı taşıyan siteler",
      lead: "Bir sitenin ilk saniyede markanın kalitesini anlatması gerekir. Tasarımı da kodu da ben yapıyorum; çizdiğim şey, yayına giden şeyle aynı.",
      offers: [
        { name: "Kurumsal web sitesi", desc: "Şirketin ne yaptığını, kime yaptığını ve neden ona güvenilmesi gerektiğini net anlatan, hızlı ve bakımı kolay siteler." },
        { name: "Gayrimenkul ve proje lansman siteleri", desc: "Konut ve ticari projeler için kaydırdıkça anlatan, lead formu ve galeriyle satışa çalışan siteler." },
        { name: "Sinematik ve interaktif web", desc: "Kaydırmayla oynayan video, hareket ve 3B ile hikâyeyi anlatan, Awwwards çizgisinde deneysel deneyimler." },
        { name: "Landing page ve kampanya sayfası", desc: "Tek bir amaca, tek bir aksiyona odaklanan lansman ve kampanya sayfaları." },
      ],
      approach: [
        "Markayı ve hedef kitleyi okuyup sitenin tek cümlelik fikrini buluyorum.",
        "Tasarımı gerçek içerikle, masaüstü ve telefon için birlikte kuruyorum.",
        "Siteyi Next.js ile geliştirip hız, erişilebilirlik ve arama motoru için ayarlıyorum.",
        "Gerçek cihazlarda test edip yayına alıyorum; sonrası için düzenlenebilir bırakıyorum.",
      ],
      work: ["ala-cekmekoy", "the-lock", "ucay-360", "dbh-group", "fidan-property"],
      faq: [
        { q: "Web tasarımı ve geliştirmeyi birlikte mi yapıyorsun?", a: "Evet. Tasarımı da kodu da ben yapıyorum; bu yüzden tasarımda vaat edilen hareket ve detay, yayındaki sitede de aynen çalışıyor." },
        { q: "Hangi sektörlerde site yaptın?", a: "Gayrimenkul ve konut projeleri (A'lâ Çekmeköy Nefes, The Lock Adres Barbarossa, Fidan Property), iklimlendirme ve enerji (Üçay 360) ve çok sektörlü bir holding (DBH Group). Hepsi İşler bölümünde canlı linkleriyle duruyor." },
        { q: "Site telefonda da iyi çalışır mı?", a: "Her site masaüstü ve telefon için birlikte tasarlanıyor ve gerçek cihazlarda test ediliyor; ağır efektler zayıf cihazlarda hafifletiliyor." },
        { q: "Site Google'da bulunur mu?", a: "Sayfa başlıkları, açıklamalar, yapısal veri, site haritası ve hız arama motorları için baştan ayarlanıyor." },
      ],
      terms: ["web tasarımcısı", "web tasarım İstanbul", "kurumsal web sitesi tasarımı", "gayrimenkul web sitesi", "interaktif web sitesi", "freelance web tasarımcı", "web sitesi yaptırmak", "kurumsal site yaptırmak"],
    },
    {
      key: "web-dev",
      slug: "web-gelistirme",
      name: "Web Geliştiricisi",
      title: "Web Geliştirici: Next.js, WebGL, 3D Web | İstanbul",
      description:
        "İstanbul'da web geliştiricisi ve frontend geliştirici: Next.js ve React ile hızlı siteler, WebGL ve Three.js ile 3B ve interaktif deneyimler, web ve mobil uygulamalar.",
      h1: "Web geliştiricisi: Next.js, WebGL ve 3B web",
      lead: "Fikri çalışan bir ürüne döküyorum: hızlı, erişilebilir ve her cihazda akıcı. Bu sitenin kendisi, partikülleri ve 3B sahneleriyle bu işin bir örneği.",
      offers: [
        { name: "Next.js ve React geliştirme", desc: "Hızlı açılan, arama motoruna uygun, yönetimi kolay web siteleri ve platformlar." },
        { name: "WebGL ve Three.js", desc: "Tarayıcıda çalışan 3B sahneler, partikül sistemleri ve shader'larla özgün etkileşimler." },
        { name: "Web ve mobil uygulamalar", desc: "Bir fikri her ekranda kullanımı kolay bir ürüne çeviren uygulamalar; React Native ile iOS ve Android dahil." },
        { name: "Performans ve cihaz uyumu", desc: "Ağır görsellerin zayıf telefonlarda ve Windows makinelerde de akıcı çalışması için ölçüm ve iyileştirme." },
      ],
      approach: [
        "Teknolojiyi işe göre seçiyorum: çoğu site için Next.js, gerektiğinde WebGL ya da React Native.",
        "Hareketi GSAP ve shader'larla, kaydırmaya bağlı ve kesintisiz kuruyorum.",
        "Gerçek cihazlarda, düşük güçlü GPU'lar dahil test edip sorunları cihazda teşhis ediyorum.",
        "Yayını Vercel gibi altyapılarla otomatikleştirip izlenebilir bırakıyorum.",
      ],
      work: ["modd-ai-web-experience", "ala-cekmekoy", "patika", "web-development-agent"],
      faq: [
        { q: "Hangi teknolojilerle çalışıyorsun?", a: "Next.js, React, TypeScript, Tailwind CSS, GSAP, Three.js, WebGL/GLSL; mobil için Expo ve React Native. Gerektiğinde WordPress ile de çalışıyorum." },
        { q: "3B ve partikül efektleri siteyi yavaşlatmaz mı?", a: "Doğru kurulursa yavaşlatmaz. Bu sitede shader'lar paralel derleniyor, çözünürlük cihaza göre ayarlanıyor ve zayıf cihazlarda daha hafif bir sürüm çalışıyor." },
        { q: "Mobil uygulama da geliştiriyor musun?", a: "Evet. Patika, React Native ile iOS ve Android için geliştirdiğim bir odak uygulaması." },
      ],
      terms: ["web geliştiricisi", "frontend geliştirici", "Next.js geliştirici", "React geliştirici", "WebGL geliştirici", "Three.js", "mobil uygulama geliştirme", "3D web sitesi", "interaktif web sitesi"],
    },
    {
      key: "graphic",
      slug: "grafik-tasarim",
      name: "Grafik Tasarımcı",
      title: "Grafik Tasarımcı & Marka Kimliği | İstanbul",
      description:
        "İstanbul'da grafik tasarımcı ve art director: marka kimliği, görsel sistemler, kampanya ve sosyal medya tasarımı, yapay zekâ destekli tasarım.",
      h1: "Grafik tasarımcı ve art director",
      lead: "Bir marka her temas noktasında aynı karakterle görünmeli: logoda, sitede, filmde, gönderide. Ben o dili kuruyor ve her mecraya taşıyorum.",
      offers: [
        { name: "Marka kimliği", desc: "Konumlandırmadan logoya, paletten tipografiye; markanın tek bakışta tanınan görsel dünyası." },
        { name: "Görsel sistemler", desc: "Kimliği her yeni işte yeniden icat etmek yerine kurallara bağlayan, ekibin de kullanabileceği sistemler." },
        { name: "Kampanya ve sosyal medya tasarımı", desc: "Metni ve logosu doğru yerleşmiş, markanın paletinde kalan kampanya ve gönderi tasarımları." },
        { name: "Art direction", desc: "Fotoğraf, video ve yapay zekâ üretimlerinde görsel yönü belirlemek ve tutarlılığı korumak." },
      ],
      approach: [
        "Markanın neyi temsil ettiğini ve neyi asla yapmayacağını yazıya döküyorum.",
        "Kimliği bir sistem olarak tasarlıyorum: renk, tip, grid, görsel dil ve yasaklar.",
        "Sistemi gerçek mecralarda (site, gönderi, film) deneyip düzeltiyorum.",
        "Yapay zekâyı üretimi hızlandırmak için kullanıyorum, kararları değil.",
      ],
      work: ["ecombox", "modd-ai", "oneavex-ai-studio"],
      faq: [
        { q: "Sadece grafik tasarım işi de alıyor musun?", a: "Evet. Marka kimliği, kampanya ya da sosyal medya tasarımı tek başına bir iş olabilir; istenirse site ve video ile aynı dilde devam eder." },
        { q: "Yapay zekâ destekli tasarım ne demek?", a: "Kararları ve görsel yönü ben veriyorum; yapay zekâ varyasyon ve üretim hızını artırıyor. Her çıktı markanın kurallarına göre seçilip düzeltiliyor." },
        { q: "Creative direction da yapıyor musun?", a: "Evet; kampanya, film ve dijital ürünlerde creative ve art direction yapıyorum." },
      ],
      terms: ["grafik tasarımcı", "tasarımcı", "marka kimliği tasarımı", "logo tasarımcısı", "art director", "kreatif direktör", "sosyal medya tasarımı"],
    },
    {
      key: "ux",
      slug: "ui-ux-tasarim",
      name: "UI/UX Tasarımcı",
      title: "UI/UX Tasarım & Mobil Uygulama Arayüzü | İstanbul",
      description:
        "İstanbul'da UI/UX tasarımcı ve ürün tasarımcısı: web ve mobil uygulama arayüz tasarımı, kullanıcı deneyimi, tasarım sistemleri ve prototipleme.",
      h1: "UI/UX ve ürün tasarımcısı",
      lead: "İyi bir arayüz kendini anlatmaz; kullanıcıyı işine ulaştırır. Web ve mobil ürünlerde akışı, ekranları ve tasarım sistemini kuruyorum, sonra kodunu da yazıyorum.",
      offers: [
        { name: "Uygulama arayüz tasarımı", desc: "Web ve mobil uygulamalar için net akışlar, okunaklı ekranlar ve tutarlı bileşenler." },
        { name: "Kullanıcı deneyimi", desc: "Kullanıcının ne yapmaya geldiğini bulup oraya en kısa yoldan götüren akışlar." },
        { name: "Tasarım sistemleri", desc: "Renk, tip, boşluk ve bileşen kuralları; ürün büyüdükçe dağılmayan bir arayüz dili." },
        { name: "Prototip ve geliştirme", desc: "Tıklanabilir prototip yerine çoğu zaman doğrudan çalışan ürün: tasarım ve kod aynı elden." },
      ],
      approach: [
        "Kullanıcının asıl işini ve en sık yaptığı adımları çıkarıyorum.",
        "Akışı ekranlardan önce kuruyorum; sonra arayüzü gerçek içerikle tasarlıyorum.",
        "Tasarımı bileşen sistemi olarak kodluyorum, böylece tutarlılık korunuyor.",
        "Gerçek kullanımda gözlemleyip düzeltiyorum.",
      ],
      work: ["patika", "modd-ai"],
      faq: [
        { q: "Hem UI hem UX tasarımı yapıyor musun?", a: "Evet. Akışı ve deneyimi kuruyor, arayüzü tasarlıyor ve çoğu zaman ürünü kendim geliştiriyorum." },
        { q: "Mobil uygulama tasarımı yaptın mı?", a: "Patika, ürün tasarımını ve geliştirmesini yaptığım bir mobil odak uygulaması; ModdTeam ise çok markalı bir web platformu." },
      ],
      terms: ["UI/UX tasarımcı", "ürün tasarımcısı", "arayüz tasarımı", "mobil uygulama tasarımı", "kullanıcı deneyimi tasarımı"],
    },
    {
      key: "motion",
      slug: "motion-tasarim",
      name: "Motion Tasarımcı",
      title: "Motion Tasarım & 3D Animasyon | İstanbul",
      description:
        "İstanbul'da motion tasarımcı: motion graphics, 3D görselleştirme, web animasyonu, yapay zekâ destekli video ve sinematik reklam kurgusu.",
      h1: "Motion tasarımcı ve 3D görselleştirme",
      lead: "Hareket, bir markanın nasıl hissettirdiğini anlatır. Ekranda, filmde ve web'de zamanlamayı ve duyguyu tasarlıyorum.",
      offers: [
        { name: "Motion graphics", desc: "Logo animasyonu, ürün anlatımı ve sosyal medya için hareketli grafikler." },
        { name: "3D görselleştirme", desc: "Ürün, mekân ve marka için 3B sahneler; videoda ya da doğrudan tarayıcıda." },
        { name: "Web animasyonu", desc: "Kaydırmaya bağlı, akıcı ve titremeyen site animasyonları; GSAP ve WebGL ile." },
        { name: "Kurgu ve storyboard", desc: "Fikri sahnelere bölüp ritmi, geçişleri ve sesi tek bir filme bağlamak." },
      ],
      approach: [
        "Önce ritim: hangi anın neden hareket ettiğini storyboard'da belirliyorum.",
        "Hareketi markanın karakterine göre ayarlıyorum; her şeyi oynatmak yerine doğru anı oynatıyorum.",
        "Web'de hareketi performansla birlikte tasarlıyorum, telefonda da akıcı kalsın diye.",
      ],
      work: ["oneavex-ai-studio", "modd-ai-web-experience", "ecombox"],
      faq: [
        { q: "Motion tasarımı sadece video için mi?", a: "Hayır. Videoda, sosyal medyada ve web sitelerinde hareket tasarlıyorum; bu sitedeki kuş, büst ve geçit sahneleri bunun örnekleri." },
        { q: "3D işleri tarayıcıda da çalışır mı?", a: "Evet. WebGL ve Three.js ile 3B sahneleri doğrudan sitenin içinde çalıştırıyorum; Lab sayfasında canlı örnekleri var." },
      ],
      terms: ["motion tasarımcı", "motion graphics", "3D tasarımcı", "3D görselleştirme", "web animasyonu", "animasyon"],
    },
    {
      key: "real-estate",
      slug: "gayrimenkul-web-sitesi",
      name: "Gayrimenkul Web Sitesi",
      title: "Konut Projesi & Gayrimenkul Web Sitesi | İstanbul",
      description:
        "Konut ve ticari projeler için lansman sitesi: kaydırdıkça anlatan proje sitesi, lead formu, e-katalog, yabancı yatırımcı için çok dilli portföy ve AI tanıtım filmi. İstanbul.",
      h1: "Gayrimenkul ve konut projesi web siteleri",
      lead: "Bir konut projesini alıcı daha şantiyeyi görmeden sitede görür. Projeyi bir film gibi anlatan, rakamlarını net veren ve her ekranda bilgi formunu elinin altında tutan siteler kuruyorum.",
      offers: [
        { name: "Proje lansman sitesi", desc: "Tek bir proje için kaydırdıkça ilerleyen video, blok ve daire bilgileri, konum ve yaşam alanları; satış ofisine giden bilgi formu her an görünür." },
        { name: "Kurumsal gayrimenkul sitesi", desc: "Geliştirici firmanın projelerini, mimari dilini, tanıtım filmlerini ve e-kataloğunu tek akışta toplayan site." },
        { name: "Yabancı yatırımcı portföy sitesi", desc: "Konum, durum, tür ve fiyatla filtrelenen proje araması, bölge rehberleri ve çok dilli içerikle uluslararası alıcıya yönelik portföy." },
        { name: "Lead formu ve takip", desc: "Formdan gelen talebin satış ekibine ulaşması ve hangi kaynaktan geldiğinin görülmesi." },
        { name: "AI tanıtım filmi ve görseller", desc: "Proje henüz yükselirken yapay zekâ destekli dikey tanıtım filmleri ve sosyal medya görselleri." },
      ],
      approach: [
        "Projenin tek cümlelik fikrini buluyoruz: alıcıya ilk saniyede ne hissettirmeli?",
        "Rakamlar, plan tipleri, konum ve görseller gerçek içerikle sitenin akışına yerleşiyor.",
        "Video ve hareket telefonda da akıcı çalışacak şekilde kuruluyor; ağır sahneler zayıf cihazlarda hafifliyor.",
        "Form, site haritası ve arama motoru ayarlarıyla site satış ofisine çalışır halde yayına çıkıyor.",
      ],
      work: ["ala-cekmekoy", "the-lock", "fidan-property", "dbh-group"],
      faq: [
        { q: "Hangi gayrimenkul projelerinin sitesini yaptın?", a: "A'lâ Çekmeköy Nefes (9 blok, 72 konut), The Lock Adres Barbarossa (4 blok, 286 konut ve 100 ticari alan), yabancı yatırımcılar için Fidan Property ve inşaat ile gayrimenkulde de faaliyet gösteren DBH Group. Hepsi canlı linkleriyle İşler bölümünde." },
        { q: "Proje henüz inşaat halindeyken site yapılabilir mi?", a: "Evet. Render, plan ve tanıtım filmiyle lansman sitesi inşaat başlamadan yayına alınabilir; proje ilerledikçe içerik güncellenir." },
        { q: "Site yabancı alıcılar için birden fazla dilde olabilir mi?", a: "Evet. Fidan Property gibi uluslararası alıcıya yönelik siteler çok dilli kuruluyor." },
        { q: "Bir proje sitesi ne kadar tutar?", a: "Kapsama göre fiyatlanıyor: tek sayfalık lansman sitesi ile çok projeli kurumsal site farklı. İletişim formundan projeyi anlat, net teklif göndereyim." },
      ],
      terms: ["gayrimenkul web sitesi", "konut projesi web sitesi", "proje lansman sitesi", "inşaat firması web sitesi", "emlak web sitesi tasarımı", "gayrimenkul web tasarım İstanbul"],
    },
  ],
};

const en: Services = {
  base: "services",
  hub: {
    title: "Services: AI Specialist, Web and Graphic Designer",
    description:
      "Ataberk Soylu works from Istanbul as an AI specialist, AI artist, web designer, web developer, graphic and UI/UX designer for brands.",
    h1: "AI, design and the web, from one hand.",
    lead: "Build a brand's identity, website, film and the AI system behind them with one person, in one language. Below is what each discipline covers and the real work it shows up in.",
    who: "Ataberk Soylu is an Istanbul-based creative technologist and multi designer who joins AI, graphic and interface design, motion and web development in one production process. He founded the creative technology studio Oneavex, builds the multi-brand content intelligence ModdTeam, and completed a master's thesis on generative art and AI creativity. He works across Türkiye and remotely.",
  },
  labels: {
    offers: "What I do",
    approach: "How I work",
    work: "Work in this field",
    faq: "Questions",
    cta: "Tell me about your project",
    ctaLine: "Write a few lines about the work; we'll shape the scope and the path together.",
    all: "All services",
    home: "Home",
  },
  items: [
    {
      key: "ai",
      slug: "ai-specialist",
      name: "AI Specialist",
      title: "AI Specialist & Custom AI Agent Developer | Istanbul",
      description:
        "AI specialist and AI engineer in Istanbul: custom AI agents, multi-agent systems, workflow automation and content intelligence that keeps a brand's memory.",
      h1: "AI specialist and AI agent developer",
      lead: "I build AI systems that understand the work, use your tools and learn from every run. Not a chat window: agents that actually work next to your team.",
      offers: [
        { name: "Custom AI agents", desc: "Agents that run one job end to end: read the brief, use tools, check their output, record the result." },
        { name: "Multi-agent systems", desc: "Production split into roles instead of one model: strategist, art director, production and QA as separate agents." },
        { name: "Workflow automation", desc: "Flows that connect your tools, take repetitive work off your hands and stop where approval is needed." },
        { name: "Brand memory and content intelligence", desc: "A brand's voice, palette, bans and proven patterns in one memory; every new piece is produced and checked against it." },
        { name: "AI consulting", desc: "We separate what AI can take over from what stays human, then start with a small system that works." },
      ],
      approach: [
        "Work first: which decision and which repetition goes away.",
        "The system is split into roles, each with defined input, output and checks.",
        "Irreversible steps such as publishing or sending never run without human approval.",
        "The system learns as it's used: approved patterns go to memory, one-offs to a log.",
      ],
      work: ["modd-ai", "web-development-agent"],
      faq: [
        { q: "What kind of AI work do you do?", a: "Custom AI agents, multi-agent production systems, workflow automation and content intelligence that keeps a brand's memory. ModdTeam and the Web Development Agent are working examples." },
        { q: "How is a custom AI agent different from a chatbot?", a: "A chatbot answers questions. A custom agent connects to your tools, runs the job step by step, checks its output against your rules and stops where approval is needed." },
        { q: "Can you work outside Istanbul?", a: "Yes. I'm based in Istanbul and work across Türkiye and remotely." },
      ],
      terms: ["AI specialist", "AI engineer", "AI consultant", "custom AI agents", "AI automation", "multi-agent systems"],
    },
    {
      key: "ai-art",
      slug: "ai-artist",
      name: "AI Artist",
      title: "AI Commercials & AI Video Production | Istanbul",
      description:
        "AI artist in Istanbul: AI-driven commercials, AI video production, cinematic campaign visuals and generative art.",
      h1: "AI artist: AI video, commercials and visuals",
      lead: "I use AI as a directing tool, not an effect. From concept to final frame, films and campaign visuals that tell a brand's story.",
      offers: [
        { name: "AI commercials", desc: "Cinematic commercials built with AI from script, storyboard and visual language to the edit." },
        { name: "AI video production", desc: "Short-form AI video for launches, social and campaigns, joined with motion." },
        { name: "Campaign and brand visuals", desc: "Generated visuals held to the brand's palette and tone, with type and logo placed right." },
        { name: "Generative art", desc: "Original work and experiments in generative art and AI creativity, the subject of my master's thesis." },
      ],
      approach: [
        "Every piece starts with an idea and a storyboard; tools come after.",
        "The visual language is tied to the brand's palette and rules.",
        "Generated frames become one film through motion, editing and sound.",
        "Every frame is reviewed for brand fit and technical quality before delivery.",
      ],
      work: ["oneavex-ai-studio", "ecombox"],
      faq: [
        { q: "What does an AI artist do?", a: "Uses AI tools with a director's and designer's eye to make films, campaign visuals and art. My job is the idea, the visual language and the edit; AI is the production tool." },
        { q: "Can a commercial be made with AI?", a: "Yes. At Oneavex I produce AI-driven video, motion design and cinematic commercials without a physical set." },
      ],
      terms: ["AI artist", "AI video production", "AI commercial", "generative art", "AI filmmaker"],
    },
    {
      key: "web-design",
      slug: "web-design",
      name: "Web Designer",
      title: "Web Designer & Corporate Website Design | Istanbul",
      description:
        "Web designer in Istanbul: corporate websites, real estate and launch sites, cinematic and interactive web design. Design and development from one hand.",
      h1: "Web designer: sites that carry your brand",
      lead: "A site has to show a brand's quality in its first second. I design and build it; what I draw is what ships.",
      offers: [
        { name: "Corporate websites", desc: "Fast, easy-to-maintain sites that say clearly what a company does, for whom, and why to trust it." },
        { name: "Real estate and launch sites", desc: "Scroll-told sites for residential and commercial projects, with galleries and lead forms." },
        { name: "Cinematic, interactive web", desc: "Scroll-driven video, motion and 3D in the experimental, Awwwards line." },
        { name: "Landing and campaign pages", desc: "Launch and campaign pages built around one goal and one action." },
      ],
      approach: [
        "I read the brand and audience and find the site's one-line idea.",
        "Design is built with real content, for desktop and phone together.",
        "The site is developed in Next.js and tuned for speed, accessibility and search.",
        "Tested on real devices, then shipped and left editable.",
      ],
      work: ["ala-cekmekoy", "the-lock", "ucay-360", "dbh-group", "fidan-property"],
      faq: [
        { q: "Do you design and develop?", a: "Yes. I do both, so the motion and detail promised in design work the same on the live site." },
        { q: "Which sectors have you built for?", a: "Residential and real estate projects (A'lâ Çekmeköy Nefes, The Lock Adres Barbarossa, Fidan Property), HVAC and energy (Üçay 360) and a multi-sector group (DBH Group), all live under Work." },
      ],
      terms: ["web designer", "web design Istanbul", "corporate website design", "real estate website", "interactive website", "freelance web designer"],
    },
    {
      key: "web-dev",
      slug: "web-development",
      name: "Web Developer",
      title: "Creative Web Developer: WebGL, Three.js | Istanbul",
      description:
        "Web and frontend developer in Istanbul: fast sites in Next.js and React, 3D and interactive experiences in WebGL and Three.js, web and mobile apps.",
      h1: "Web developer: Next.js, WebGL and 3D web",
      lead: "I turn ideas into working products: fast, accessible and smooth on every device. This site, with its particles and 3D scenes, is one example.",
      offers: [
        { name: "Next.js and React", desc: "Fast, search-friendly, easy-to-run websites and platforms." },
        { name: "WebGL and Three.js", desc: "3D scenes, particle systems and shaders running in the browser." },
        { name: "Web and mobile apps", desc: "Products that feel at home on every screen, including iOS and Android with React Native." },
        { name: "Performance and device fit", desc: "Measuring and tuning so heavy visuals stay smooth on weak phones and Windows machines." },
      ],
      approach: [
        "Tech chosen for the job: Next.js for most sites, WebGL or React Native when needed.",
        "Motion built with GSAP and shaders, tied to scroll and free of jank.",
        "Tested on real devices, low-power GPUs included, with on-device diagnostics.",
        "Deploys automated and observable on platforms like Vercel.",
      ],
      work: ["modd-ai-web-experience", "ala-cekmekoy", "patika", "web-development-agent"],
      faq: [
        { q: "Which technologies do you use?", a: "Next.js, React, TypeScript, Tailwind CSS, GSAP, Three.js, WebGL/GLSL; Expo and React Native for mobile; WordPress when it fits." },
        { q: "Don't 3D and particles slow a site down?", a: "Not when built right. Here shaders compile in parallel, resolution adapts to the device and weak devices get a lighter version." },
      ],
      terms: ["web developer", "frontend developer", "Next.js developer", "React developer", "WebGL developer", "Three.js developer", "creative developer", "creative web developer"],
    },
    {
      key: "graphic",
      slug: "graphic-design",
      name: "Graphic Designer",
      title: "Graphic Designer & Brand Identity | Istanbul",
      description:
        "Graphic designer and art director in Istanbul: brand identity, visual systems, campaign and social design, AI-assisted design.",
      h1: "Graphic designer and art director",
      lead: "A brand should look like itself at every touchpoint: logo, site, film, post. I build that language and carry it across media.",
      offers: [
        { name: "Brand identity", desc: "From positioning to logo, palette and type: a visual world recognised at a glance." },
        { name: "Visual systems", desc: "Rules that keep an identity consistent, usable by the team too." },
        { name: "Campaign and social design", desc: "Campaign and post designs that stay in the brand's palette, with type and logo placed right." },
        { name: "Art direction", desc: "Setting and holding the visual direction across photo, video and AI production." },
      ],
      approach: [
        "I write down what the brand stands for and what it never does.",
        "The identity is designed as a system: colour, type, grid, imagery and bans.",
        "The system is tried on real media and corrected.",
        "AI speeds up production, not decisions.",
      ],
      work: ["ecombox", "modd-ai", "oneavex-ai-studio"],
      faq: [
        { q: "Do you take graphic design work on its own?", a: "Yes. Identity, campaign or social design can be a project by itself, and can continue into the site and film in the same language." },
        { q: "Do you do creative direction?", a: "Yes, for campaigns, films and digital products." },
      ],
      terms: ["graphic designer", "designer", "brand identity design", "logo designer", "art director", "creative director"],
    },
    {
      key: "ux",
      slug: "ui-ux-design",
      name: "UI/UX Designer",
      title: "UI/UX Designer and Product Designer | Istanbul",
      description:
        "UI/UX and product designer in Istanbul: web and mobile app interfaces, user experience, design systems and prototyping.",
      h1: "UI/UX and product designer",
      lead: "A good interface gets people to their task. I design flows, screens and design systems for web and mobile products, then write the code.",
      offers: [
        { name: "App interface design", desc: "Clear flows, readable screens and consistent components for web and mobile apps." },
        { name: "User experience", desc: "Finding what people came to do and the shortest way there." },
        { name: "Design systems", desc: "Colour, type, spacing and component rules that hold as a product grows." },
        { name: "Prototype and build", desc: "Often a working product instead of a clickable prototype: design and code from one hand." },
      ],
      approach: [
        "Find the user's real task and most frequent steps.",
        "Build the flow before the screens, then design with real content.",
        "Code the design as a component system so it stays consistent.",
        "Watch real use and correct.",
      ],
      work: ["patika", "modd-ai"],
      faq: [
        { q: "Do you do both UI and UX?", a: "Yes. I shape the flow and experience, design the interface and usually build the product." },
      ],
      terms: ["UI/UX designer", "product designer", "interface design", "mobile app design", "UX design"],
    },
    {
      key: "motion",
      slug: "motion-design",
      name: "Motion Designer",
      title: "Motion Designer & 3D Animation | Istanbul",
      description:
        "Motion designer in Istanbul: motion graphics, 3D visualization, web animation, AI-driven video and cinematic commercial editing.",
      h1: "Motion designer and 3D visualization",
      lead: "Motion is how a brand feels. I design timing and emotion on screen, in film and on the web.",
      offers: [
        { name: "Motion graphics", desc: "Logo animation, product explainers and motion for social." },
        { name: "3D visualization", desc: "3D scenes for products, spaces and brands, on video or live in the browser." },
        { name: "Web animation", desc: "Scroll-tied, smooth, flicker-free site animation with GSAP and WebGL." },
        { name: "Editing and storyboard", desc: "Breaking an idea into scenes and tying rhythm, transitions and sound into one film." },
      ],
      approach: [
        "Rhythm first: the storyboard decides which moment moves and why.",
        "Motion is tuned to the brand's character; the right moment moves, not everything.",
        "On the web, motion is designed together with performance so phones stay smooth.",
      ],
      work: ["oneavex-ai-studio", "modd-ai-web-experience", "ecombox"],
      faq: [
        { q: "Is motion design only for video?", a: "No. I design motion for video, social and websites; the bird, bust and portal scenes on this site are examples." },
      ],
      terms: ["motion designer", "motion graphics", "3D designer", "3D visualization", "web animation"],
    },
    {
      key: "real-estate",
      slug: "real-estate-website-design",
      name: "Real Estate Website",
      title: "Real Estate Website Design | Istanbul, Türkiye",
      description:
        "Launch websites for residential and commercial projects: scroll-told project sites, enquiry forms, e-catalogues, multilingual portfolios for foreign investors and AI launch films.",
      h1: "Real estate and residential project websites",
      lead: "Buyers see a development on its website long before they see the site itself. I build sites that tell a project like a film, give its figures plainly and keep the enquiry form within reach on every screen.",
      offers: [
        { name: "Project launch site", desc: "One development told through scroll-driven video, blocks and units, location and amenities, with the enquiry form to the sales office always in view." },
        { name: "Developer website", desc: "A developer's projects, architectural language, launch films and e-catalogue gathered in one flow." },
        { name: "Portfolio for foreign investors", desc: "Project search filtered by location, status, type and price, area guides and multilingual content for international buyers." },
        { name: "Enquiry forms and tracking", desc: "Every enquiry reaches the sales team, with the channel it came from." },
        { name: "AI launch films and visuals", desc: "AI-driven vertical launch films and social visuals while the building is still going up." },
      ],
      approach: [
        "We find the project's one-line idea: what should a buyer feel in the first second?",
        "Figures, unit types, location and visuals are set into the flow as real content.",
        "Video and motion are built to stay smooth on phones; heavy scenes lighten on weaker devices.",
        "Forms, sitemap and search settings are in place, so the site works for the sales office from launch day.",
      ],
      work: ["ala-cekmekoy", "the-lock", "fidan-property", "dbh-group"],
      faq: [
        { q: "Which real estate projects have you built sites for?", a: "A'lâ Çekmeköy Nefes (9 blocks, 72 homes), The Lock Adres Barbarossa (4 blocks, 286 homes and 100 commercial units), Fidan Property for foreign investors, and DBH Group, which also works in construction and real estate. All are live, linked from the Work section." },
        { q: "Can the site launch before construction starts?", a: "Yes. With renders, plans and a launch film the site can go live before ground is broken, and grows with the project." },
        { q: "Can the site serve foreign buyers in several languages?", a: "Yes. Sites for international buyers, like Fidan Property, are built multilingual." },
        { q: "Do you work with developers outside Türkiye?", a: "Yes. I'm based in Istanbul and work remotely in English and Turkish." },
      ],
      terms: ["real estate website design", "property launch website", "residential project website", "real estate developer website", "property website Turkey", "real estate web designer"],
    },
  ],
};

export const services: Record<Locale, Services> = { tr, en };

export const servicePath = (locale: Locale, slug?: string) =>
  `/${locale}/${services[locale].base}${slug ? `/${slug}` : ""}`;

export function getService(locale: Locale, slug: string) {
  return services[locale].items.find((s) => s.slug === slug);
}

// The same service in the other locale, for hreflang alternates.
export function serviceAlternates(key: string) {
  const tr = services.tr.items.find((s) => s.key === key)!;
  const en = services.en.items.find((s) => s.key === key)!;
  return { tr: servicePath("tr", tr.slug), en: servicePath("en", en.slug), "x-default": servicePath("tr", tr.slug) };
}

// The same page in the other language: service pages have their own words for
// the path (/tr/hizmetler/web-tasarim ↔ /en/services/web-design).
export function translatePath(pathname: string, from: Locale, to: Locale) {
  const [, , base, slug] = pathname.split("/");
  if (base === contactBase[from]) return contactPath(to);
  if (base === guides[from].base) {
    const key = slug ? getGuide(from, slug)?.key : undefined;
    const target = key ? guides[to].items.find((g) => g.key === key) : undefined;
    return guidePath(to, target?.slug);
  }
  if (base === services[from].base) {
    const key = slug ? getService(from, slug)?.key : undefined;
    const target = key ? services[to].items.find((s) => s.key === key) : undefined;
    return servicePath(to, target?.slug);
  }
  return pathname.replace(`/${from}`, `/${to}`);
}
