import type { Locale } from "@/lib/i18n";
import type { Guide } from "@/content/guides";

// Two guides for people about to hire someone for a website (2026-11-01): what to
// check before and while hiring, and how long a website takes. Same rules as
// content/guides.ts: no invented prices, durations or outcomes; examples are the
// projects in content/work.ts. Joined into `guides` at the end of that file.

const tr: Guide[] = [
  {
    key: "hiring-website",
    slug: "web-sitesi-yaptirirken-dikkat-edilmesi-gerekenler",
    title: "Web Sitesi Yaptırırken Nelere Dikkat Edilmeli?",
    description:
      "Web sitesi yaptırmadan önce ve yaptırırken bakılacaklar: sitenin amacı, kiminle çalışılacağı, alan adı ve kodun sahipliği, içerik, telefon hızı, SEO, KVKK ve teklifte yazması gerekenler. Kontrol listesiyle.",
    h1: "Web sitesi yaptırırken nelere dikkat edilmeli?",
    lead: "Bir web sitesi yaptırmak, birkaç ekran tasarlatmaktan fazlası: alan adından form mesajlarının kime düştüğüne kadar sonradan değiştirmesi zor kararlar içerir. Aşağıda iş başlamadan ve sürerken bakılacakları, yaptığım projelerden örneklerle sıraladım.",
    published: "2026-11-01",
    updated: "2026-11-01",
    service: "web-design",
    work: ["ala-cekmekoy", "ucay-360", "the-lock", "fidan-property"],
    keywords: [
      "web sitesi yaptırmak", "web sitesi yaptırırken dikkat edilmesi gerekenler", "web tasarım firması seçimi",
      "web tasarımcı seçerken", "web sitesi teklifi", "web sitesi yaptırma",
    ],
    faq: [
      { q: "Alan adı kimin adına kayıtlı olmalı?", a: "Sitenin sahibi olan şirketin ya da kişinin. Alan adı tasarımcının hesabında dursa bile kayıt bilgileri ve erişim size ait olmalı; aksi halde iş ilişkisi bittiğinde siteyi taşımak zorlaşır." },
      { q: "Tasarımcının portfolyosuna nasıl bakmalıyım?", a: "Ekran görüntülerine değil, canlı sitelere bakın: telefonunuzda açın, formu deneyin, ne kadar hızlı açıldığını görün. Portfolyodaki işlerin sizinkine benzer bir ihtiyacı çözüp çözmediğine bakın." },
      { q: "Teklifte mutlaka ne yazmalı?", a: "Sayfa listesi ve kapsam, kaç tur düzeltme yapılacağı, takvim ve ara teslimler, neyin teslim edileceği (tasarım dosyaları, kod, erişimler), yayın sonrası bakım ve alan adı, barındırma gibi düzenli giderler." },
    ],
    sections: [
      {
        h2: "Önce sitenin işini netleştirin",
        body: [
          "“Bir web sitemiz olsun” bir amaç değil. Site ne iş yapacak: bilgi talebi mi toplayacak, şirketi yatırımcıya mı tanıtacak, ürün mü satacak, katalog mu sunacak? Bu cevap sayfa yapısını, tasarımı ve bütçeyi belirler.",
          "Örneğin bir konut projesinin lansman sitesinin tek bir işi vardır: ilgilenen alıcıdan bilgi talebi almak. A'lâ Çekmeköy Nefes'te bu yüzden site tek ve uzun bir sayfa; proje kaydırdıkça bir film gibi anlatılıyor ve bilgi formu her an elinizin altında. Birden fazla hizmeti olan bir şirket için ise her hizmetin kendi sayfası olan kurumsal bir site daha doğru.",
        ],
      },
      {
        h2: "Kiminle çalışacağınızı nasıl seçersiniz",
        body: ["Fiyat karşılaştırmadan önce şunlara bakın:"],
        list: [
          "Canlı işler: portfolyodaki siteleri telefonunuzda açın; yavaş açılan ya da telefonda bozulan bir site, sizinkinin de öyle olabileceğini gösterir.",
          "Benzer ihtiyaç: daha önce sizinkine benzer bir sorunu (lansman, kurumsal tanıtım, çok dilli katalog) çözmüş mü?",
          "Kimin yaptığı: tasarımı ve kodu kim yapıyor; iş başka birine devrediliyorsa bunu baştan bilin.",
          "Süreç: işin nasıl ilerleyeceği, ara teslimlerin ne zaman geleceği ve kiminle konuşacağınız net mi?",
        ],
      },
      {
        h2: "Alan adı, barındırma ve kod kimin?",
        body: [
          "En sık yaşanan sorunlardan biri, iş ilişkisi bittiğinde alan adının ya da sitenin başkasının hesabında kalması. Bunu baştan konuşun:",
        ],
        list: [
          "Alan adı sizin adınıza kayıtlı olmalı ve erişim bilgileri sizde olmalı.",
          "Barındırmanın (hosting) nerede olduğu ve hesabın kime ait olduğu yazılı olmalı.",
          "Özel kodlanmış bir sitede kaynak kodun teslim edilip edilmeyeceği teklifte yazmalı.",
          "İçerik paneli varsa giriş bilgileri size verilmeli.",
        ],
      },
      {
        h2: "İçeriği kim hazırlayacak?",
        body: [
          "Bir sitenin takvimini en çok uzatan şey çoğu zaman tasarım ya da kod değil, içeriktir: metinler, fotoğraflar, renderlar, videolar, logolar. Kimin neyi ne zaman hazırlayacağı baştan belli olmalı.",
          "Gerçek görseller stok fotoğraftan her zaman daha güçlüdür. The Lock Adres Barbarossa'nın sitesi projenin kendi tanıtım filmleri ve e-kataloğu üzerine kuruldu; sitenin tonu bu malzemeden geldi.",
        ],
      },
      {
        h2: "Hazır tema mı, özel tasarım mı?",
        body: [
          "Hazır tema hızlıdır ve genellikle daha ucuzdur, ama marka temaya uyar. Özel tasarımda site markaya göre kurulur. İkisi de doğru olabilir; önemli olan ihtiyaca göre seçmek.",
          "Fidan Property, WordPress ve Elementor ile kuruldu: çok dilli, konum, durum, tür ve fiyatla filtrelenen bir portföyün içeriği panelden kolayca güncellenebilmeliydi. Üçay 360 ise kaydırmayla ilerleyen sinematik bir anlatım istediği için özel kodlandı. Fiyat farklarını web sitesi fiyatları rehberinde anlattım.",
        ],
      },
      {
        h2: "Telefonda hız ve deneme",
        body: [
          "Ziyaretçilerin büyük kısmı telefondan gelir. Tasarım masaüstünde onaylanıp telefonda hiç denenmemişse ilk izlenim orada kaybedilir.",
          "Ara teslimlerde siteyi kendi telefonunuzda, mobil veriyle açın. Videolar, büyük görseller ve animasyonlar sitenin karakterini taşır, ama telefon için ayrıca hazırlanmaları gerekir.",
        ],
      },
      {
        h2: "Arama motoru baştan düşünülmeli",
        body: ["SEO yayından sonra eklenen bir şey değil; sitenin nasıl kurulduğuyla başlar. Sorulacaklar:"],
        list: [
          "Her sayfanın kendi başlığı ve açıklaması olacak mı?",
          "Metinler görselin ya da animasyonun içinde değil, sayfada mı?",
          "Site haritası ve Google Search Console kaydı yapılacak mı?",
          "Eski bir site varsa, eski adresler yenilerine yönlendirilecek mi?",
          "Birden fazla dil varsa her dilin kendi adresi olacak mı?",
        ],
      },
      {
        h2: "Form, KVKK ve mesajların gideceği yer",
        body: [
          "Formu dolduran müşterinin mesajı kimsenin bakmadığı bir kutuya düşüyorsa sitenin bütün emeği boşa gider. Mesajların hangi e-postaya gideceği ve kimin cevap vereceği yayından önce belli olmalı.",
          "Türkiye'de kişisel veri toplayan her form için KVKK aydınlatma metni gerekir; istatistik ya da reklam araçları kullanılıyorsa çerez bilgilendirmesi de. Bunların sitede yerinde olup olmadığını sorun.",
        ],
      },
      {
        h2: "Teklifte yazması gerekenler",
        body: ["Sözlü anlaşmalar iş ilerledikçe farklı hatırlanır. Teklifte açıkça görmek isteyecekleriniz:"],
        list: [
          "Sayfa listesi ve her sayfanın kapsamı",
          "Kaç tur düzeltme yapılacağı",
          "Takvim ve ara teslimler",
          "Neyin teslim edileceği: tasarım dosyaları, kod, erişim bilgileri",
          "Alan adı, barındırma, lisanslar gibi düzenli giderler",
          "Yayın sonrası bakım ve güncellemelerin nasıl yapılacağı",
        ],
      },
      {
        h2: "Kontrol listesi",
        body: ["İşe başlamadan önce bunlara bakın:"],
        list: [
          "Sitenin tek cümlelik bir işi var mı?",
          "Portfolyodaki siteleri telefonunuzda açtınız mı?",
          "Alan adı ve barındırma sizin adınıza mı?",
          "İçeriği kimin hazırlayacağı belli mi?",
          "SEO ve eski adreslerin yönlendirmesi konuşuldu mu?",
          "Form mesajlarının kime gideceği ve KVKK metni belli mi?",
          "Teklifte kapsam, düzeltme turu, takvim ve teslim edilecekler yazıyor mu?",
        ],
      },
    ],
  },
  {
    key: "website-timeline",
    slug: "web-sitesi-ne-kadar-surede-yapilir",
    title: "Web Sitesi Ne Kadar Sürede Yapılır?",
    description:
      "Bir web sitesinin yapım süresini neler belirler: aşamalar, sayfa sayısı, özel tasarım, video ve animasyon, dil sayısı, içerik ve onaylar. Süreyi uzatan ve kısaltan şeyler, gerçek projelerden örneklerle.",
    h1: "Web sitesi ne kadar sürede yapılır?",
    lead: "Kısa cevap: kapsama göre değişir ve net takvim, kapsam konuşulduktan sonra teklifte yazılır. Ama süreyi neyin belirlediğini bilmek, hem gerçekçi bir tarih koymanızı hem de işi hızlandırmanızı sağlar. Aşağıda bir sitenin aşamalarını ve süreyi etkileyen şeyleri anlattım.",
    published: "2026-11-01",
    updated: "2026-11-01",
    service: "web-dev",
    work: ["ala-cekmekoy", "ucay-360", "dbh-group", "fidan-property"],
    keywords: [
      "web sitesi ne kadar sürede yapılır", "web sitesi yapım süresi", "web sitesi kaç günde biter",
      "web tasarım süreci", "web sitesi yapım aşamaları",
    ],
    faq: [
      { q: "Tek sayfalık bir site daha mı hızlı biter?", a: "Genellikle evet: tasarlanacak ve test edilecek ekran sayısı azdır. Ama kaydırmaya bağlı video ya da 3D gibi özel bir deneyim içeriyorsa, o bölümün üretimi süreyi belirler." },
      { q: "Süreyi en çok ne uzatır?", a: "Çoğu zaman tasarım ya da kod değil, geç gelen içerik ve uzayan onaylar. Metinler, görseller ve kararı verecek kişi baştan belliyse iş planlandığı gibi ilerler." },
      { q: "Siteyi parça parça yayına alabilir miyiz?", a: "Evet. Önce ana sayfayı ya da tek sayfalık bir lansman sitesini yayına alıp diğer sayfaları sonra eklemek, acil bir tarihe yetişmenin iyi bir yoludur." },
    ],
    sections: [
      {
        h2: "Bir sitenin aşamaları",
        body: ["Her proje biraz farklı ilerler, ama çoğu site şu aşamalardan geçer:"],
        list: [
          "Özet ve kapsam: sitenin amacı, hedef kitle, sayfa listesi, örnek siteler.",
          "Görüşme ve teklif: kapsam, takvim ve fiyat tek dokümanda.",
          "Tasarım yönü: renk, tipografi ve hareket dilinin ilk örnekleri.",
          "Tasarım: sayfaların telefon ve masaüstü halleri.",
          "Geliştirme: tasarımın koda dökülmesi, formlar ve entegrasyonlar.",
          "İçerik: metinlerin, görsellerin ve videoların yerleştirilmesi.",
          "Test: farklı telefonlarda, tarayıcılarda ve hızlarda deneme.",
          "Yayın: alan adı, güvenlik sertifikası, Search Console ve form testleri.",
        ],
      },
      {
        h2: "Süreyi belirleyen başlıca şeyler",
        body: ["Aynı “web sitesi” kelimesi çok farklı işleri anlatır. Süreyi en çok etkileyenler:"],
        list: [
          "Sayfa sayısı ve sayfa tipleri: tek sayfalık lansman sitesi ile çok sayfalı kurumsal site aynı sürede bitmez.",
          "Özel tasarım ya da hazır tema: özel tasarımda her ekran sıfırdan kurulur.",
          "Video, animasyon ve 3D: kaydırmaya bağlı video ya da gerçek zamanlı sahneler ayrı bir üretim ister.",
          "Dil sayısı: her dil, içeriğin yeniden hazırlanması ve test edilmesi demek.",
          "Entegrasyonlar: filtreleme, arama, CRM ya da ödeme gibi bağlantılar.",
          "İçeriğin hazır olup olmadığı ve kararı kimin verdiği.",
        ],
      },
      {
        h2: "Gerçek projelerde ne fark etti",
        body: [
          "A'lâ Çekmeköy Nefes tek sayfalık bir lansman sitesi: proje videosu kaydırmayla ilerliyor, cam paneller projenin rakamlarını taşıyor. Sayfa tek olduğu için iş, videonun kaydırmayla akıcı oynamasına ve telefonda hızlı açılmasına yoğunlaştı.",
          "Üçay 360'ın açılışı mağazadan eve, ısı pompasından güneş panellerine uzanan, kaydırmayla ilerleyen bir film. Site bölüm bölüm, her adım gözden geçirilerek kuruldu; bu tür bir anlatımda her sahne ayrı bir onay demek.",
          "DBH Group'ta grubun altı alanı tam ekran bölümler halinde akıyor; her alan için görüntü ve metin hazır olmadan o bölüm bitmiyor. Fidan Property ise çok dilli ve filtrelenebilir bir portföy: burada süreyi tasarımdan çok içerik ve dil sayısı belirliyor.",
        ],
      },
      {
        h2: "Süreyi uzatan şeyler",
        body: ["Planlanan tarihi kaçırtan şeyler çoğu zaman tekniğin dışındadır:"],
        list: [
          "Metinlerin ve görsellerin geç gelmesi",
          "Kararın birden fazla kişide olması ve geri bildirimlerin çelişmesi",
          "İş sürerken kapsamın büyümesi: “bir sayfa daha”, “bir dil daha”",
          "Ara teslimlere geç dönülmesi",
          "Alan adı ya da eski site erişimlerinin son ana kalması",
        ],
      },
      {
        h2: "İşi hızlandırmanın yolları",
        list: [
          "İçeriği baştan hazırlayın ya da kimin hazırlayacağını netleştirin.",
          "Kararı verecek tek bir kişi belirleyin.",
          "Beğendiğiniz birkaç örnek siteyi ve nedenini paylaşın; tasarım yönü hızla oturur.",
          "Ara teslimlere birkaç gün içinde, toplu geri bildirimle dönün.",
          "Acil bir tarih varsa önce ana sayfayı ya da tek sayfalık bir versiyonu yayına alın, gerisini sonra ekleyin.",
        ],
        body: ["Takvimin büyük kısmı sizin elinizde:"],
      },
      {
        h2: "Yayın haftasında yapılacaklar",
        body: ["Site hazır olsa bile yayına çıkış kendi başına bir iştir:"],
        list: [
          "Alan adı yönlendirmesi ve güvenlik sertifikası (https)",
          "Formların gerçekten mesaj gönderdiğinin denenmesi",
          "KVKK aydınlatma metni ve çerez bilgilendirmesi",
          "Site haritasının Search Console'a gönderilmesi",
          "Eski site varsa eski adreslerin yeni sayfalara yönlendirilmesi",
        ],
      },
    ],
  },
];

const en: Guide[] = [
  {
    key: "hiring-website",
    slug: "hiring-someone-to-build-a-website",
    title: "Hiring Someone to Build a Website: What to Check",
    description:
      "What to check before and while you hire someone to build your website: its job, who to work with, who owns the domain and code, content, phone speed, SEO, privacy and what the proposal should say. With a checklist.",
    h1: "Hiring someone to build a website: what to check",
    lead: "Having a website built is more than getting a few screens designed: from the domain to where form messages land, it involves decisions that are hard to change later. Below are the things to check before and during the work, with examples from projects I've built.",
    published: "2026-11-01",
    updated: "2026-11-01",
    service: "web-design",
    work: ["ala-cekmekoy", "ucay-360", "the-lock", "fidan-property"],
    keywords: [
      "hire a web designer", "what to look for when hiring a web designer", "website proposal", "choosing a web design agency",
      "questions to ask a web designer", "getting a website built",
    ],
    faq: [
      { q: "Whose name should the domain be registered in?", a: "The company's or person who owns the site. Even if it sits in the designer's account, the registration and access should be yours; otherwise moving the site gets hard when the relationship ends." },
      { q: "How should I look at a designer's portfolio?", a: "Look at live sites, not screenshots: open them on your phone, try the form, see how fast they load. Check whether the work solved a need similar to yours." },
      { q: "What must the proposal say?", a: "The page list and scope, how many rounds of revisions, the timeline and interim deliveries, what is handed over (design files, code, access), post-launch maintenance and recurring costs such as domain and hosting." },
    ],
    sections: [
      {
        h2: "First, settle what the site is for",
        body: [
          "“We need a website” is not a goal. What will the site do: collect enquiries, introduce the company to investors, sell products, present a catalogue? The answer shapes the page structure, the design and the budget.",
          "A residential project's launch site, for example, has one job: to get enquiries from interested buyers. That is why A'lâ Çekmeköy Nefes is a single long page; the project unfolds like a film as you scroll and the enquiry form is always at hand. A company with several services is better served by a corporate site where each service has its own page.",
        ],
      },
      {
        h2: "How to choose who you work with",
        body: ["Before comparing prices, check:"],
        list: [
          "Live work: open the portfolio sites on your phone; a site that loads slowly or breaks on a phone suggests yours might too.",
          "A similar need: have they solved a problem like yours before (a launch, a corporate introduction, a multilingual catalogue)?",
          "Who does the work: who designs and who codes; if the work is passed to someone else, know it from the start.",
          "Process: is it clear how the work will run, when interim deliveries come and who you'll talk to?",
        ],
      },
      {
        h2: "Who owns the domain, hosting and code?",
        body: ["One of the most common problems: when the relationship ends, the domain or the site stays in someone else's account. Settle it at the start:"],
        list: [
          "The domain should be registered in your name, with the access details in your hands.",
          "Where the site is hosted and whose account it is should be written down.",
          "For a custom-coded site, the proposal should say whether the source code is handed over.",
          "If there is a content panel, you should get the login.",
        ],
      },
      {
        h2: "Who prepares the content?",
        body: [
          "What stretches a website's timeline most is usually not design or code but content: copy, photos, renders, videos, logos. Who prepares what, and by when, should be clear from the start.",
          "Real imagery always beats stock photos. The Lock Adres Barbarossa's site was built on the project's own films and e-catalogue; the site's tone came from that material.",
        ],
      },
      {
        h2: "A theme or a custom design?",
        body: [
          "A theme is fast and usually cheaper, but the brand bends to the theme. A custom design builds the site around the brand. Either can be right; what matters is choosing for the need.",
          "Fidan Property was built with WordPress and Elementor: the content of a multilingual portfolio filtered by location, status, type and price had to be easy to update from a panel. Üçay 360 was custom-coded because it wanted a cinematic story that plays as you scroll. I cover the price differences in the website cost guide.",
        ],
      },
      {
        h2: "Speed on a phone, and trying it yourself",
        body: [
          "Most visitors arrive on a phone. If the design was approved on a desktop and never tried on a phone, the first impression is lost there.",
          "At each interim delivery, open the site on your own phone over mobile data. Videos, large images and animation carry the site's character, but they need preparing for phones separately.",
        ],
      },
      {
        h2: "Plan for search from the start",
        body: ["SEO isn't added after launch; it starts with how the site is built. Ask:"],
        list: [
          "Will each page have its own title and description?",
          "Is the text on the page, not inside images or animation?",
          "Will a sitemap and Google Search Console be set up?",
          "If there is an old site, will its addresses redirect to the new ones?",
          "If there are several languages, will each have its own address?",
        ],
      },
      {
        h2: "Forms, privacy and where messages go",
        body: [
          "If a customer's message lands in an inbox nobody checks, all the work on the site is wasted. Which email receives messages and who answers should be settled before launch.",
          "Any form that collects personal data needs a privacy notice (KVKK in Türkiye, GDPR in the EU), plus a cookie notice if analytics or ad tools are used. Ask whether these are in place.",
        ],
      },
      {
        h2: "What the proposal should say",
        body: ["Verbal agreements get remembered differently as work goes on. What you'll want to see written down:"],
        list: [
          "The page list and the scope of each page",
          "How many rounds of revisions",
          "The timeline and interim deliveries",
          "What is handed over: design files, code, access details",
          "Recurring costs such as domain, hosting and licences",
          "How maintenance and updates work after launch",
        ],
      },
      {
        h2: "Checklist",
        body: ["Before the work starts, check:"],
        list: [
          "Does the site have a one-sentence job?",
          "Did you open the portfolio sites on your phone?",
          "Are the domain and hosting in your name?",
          "Is it clear who prepares the content?",
          "Were SEO and redirects from old addresses discussed?",
          "Is it clear where form messages go, and is there a privacy notice?",
          "Does the proposal state scope, revision rounds, timeline and deliverables?",
        ],
      },
    ],
  },
  {
    key: "website-timeline",
    slug: "how-long-does-a-website-take",
    title: "How Long Does It Take to Build a Website?",
    description:
      "What decides how long a website takes: the stages, page count, custom design, video and animation, languages, content and approvals. What slows it down and what speeds it up, with examples from real projects.",
    h1: "How long does it take to build a website?",
    lead: "The short answer: it depends on the scope, and a firm timeline is written in the proposal once the scope is agreed. But knowing what drives the time helps you set a realistic date and speed the work up. Below are a site's stages and the things that affect how long it takes.",
    published: "2026-11-01",
    updated: "2026-11-01",
    service: "web-dev",
    work: ["ala-cekmekoy", "ucay-360", "dbh-group", "fidan-property"],
    keywords: [
      "how long does it take to build a website", "website timeline", "website development time",
      "web design process", "website project stages",
    ],
    faq: [
      { q: "Is a one-page site faster?", a: "Usually, yes: there are fewer screens to design and test. But if it includes a special experience such as scroll-driven video or 3D, producing that part sets the pace." },
      { q: "What slows a website down most?", a: "Most often not design or code but late content and long approvals. When copy, images and the person who decides are clear from the start, the work runs as planned." },
      { q: "Can we launch the site in parts?", a: "Yes. Launching the home page or a one-page launch site first and adding the other pages later is a good way to meet an urgent date." },
    ],
    sections: [
      {
        h2: "The stages of a website",
        body: ["Every project runs a little differently, but most sites go through these stages:"],
        list: [
          "Brief and scope: the site's goal, audience, page list, example sites.",
          "Call and proposal: scope, timeline and price in one document.",
          "Design direction: first samples of colour, type and motion.",
          "Design: phone and desktop versions of the pages.",
          "Development: the design in code, forms and integrations.",
          "Content: placing copy, images and videos.",
          "Testing: on different phones, browsers and connection speeds.",
          "Launch: domain, security certificate, Search Console and form tests.",
        ],
      },
      {
        h2: "What mainly drives the time",
        body: ["The same word, “website”, covers very different work. What affects the time most:"],
        list: [
          "Page count and page types: a one-page launch site and a multi-page corporate site don't take the same time.",
          "Custom design or a theme: in a custom design every screen is built from scratch.",
          "Video, animation and 3D: scroll-driven video or real-time scenes are a production of their own.",
          "Languages: each one means preparing and testing the content again.",
          "Integrations: filtering, search, a CRM or payments.",
          "Whether the content is ready, and who makes the decisions.",
        ],
      },
      {
        h2: "What made the difference on real projects",
        body: [
          "A'lâ Çekmeköy Nefes is a one-page launch site: the project video advances as you scroll and glass panels carry the project's figures. With a single page, the work centred on the video playing smoothly with the scroll and loading fast on a phone.",
          "Üçay 360 opens with a film that plays as you scroll, from the shop to the home, from heat pumps to solar panels. The site was built section by section, each step reviewed; in this kind of story every scene is its own approval.",
          "At DBH Group the group's six fields flow as full-screen sections; a section isn't done until its imagery and copy are. Fidan Property is a multilingual, filterable portfolio: here content and the number of languages set the pace more than design.",
        ],
      },
      {
        h2: "What slows it down",
        body: ["What makes a project miss its date is usually outside the technical work:"],
        list: [
          "Copy and images arriving late",
          "Decisions spread across several people, with conflicting feedback",
          "Scope growing mid-way: “one more page”, “one more language”",
          "Slow replies to interim deliveries",
          "Domain or old-site access left to the last minute",
        ],
      },
      {
        h2: "How to speed it up",
        body: ["Much of the timeline is in your hands:"],
        list: [
          "Prepare the content up front, or settle who will.",
          "Name one person who decides.",
          "Share a few sites you like and why; the design direction settles fast.",
          "Reply to interim deliveries within a few days, with consolidated feedback.",
          "If the date is urgent, launch the home page or a one-page version first and add the rest later.",
        ],
      },
      {
        h2: "Launch week",
        body: ["Even with the site ready, going live is a job of its own:"],
        list: [
          "Domain setup and a security certificate (https)",
          "Testing that the forms really send messages",
          "A privacy notice and cookie information",
          "Submitting the sitemap to Search Console",
          "Redirecting old addresses to the new pages, if there was an old site",
        ],
      },
    ],
  },
];

export const hiringGuides: Record<Locale, Guide[]> = { tr, en };
