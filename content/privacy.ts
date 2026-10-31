import type { Locale } from "@/lib/i18n";

// Privacy notice (KVKK m.10 aydınlatma, GDPR Art. 13), the consent banner and the
// legal lines in the footer and under the contact form. The site is run by a real
// person, not a company. Keep every statement true to the code: what Tracker.tsx,
// /api/t and /api/contact collect, and the retention in app/api/cron/purge.

export const privacyBase: Record<Locale, string> = { tr: "gizlilik", en: "privacy" };
export const privacyPath = (locale: Locale) => `/${locale}/${privacyBase[locale]}`;

export const OWNER = { name: "Ataberk Soylu", city: { tr: "İstanbul, Türkiye", en: "Istanbul, Türkiye" } };
export const UPDATED = "2026-11-01";

type Section = { heading: string; body?: string[]; items?: string[] };
type Row = { key: string; what: string; kind: string; keep: string };

export type PrivacyContent = {
  title: string;
  description: string;
  h1: string;
  lead: string;
  updated: string;
  sections: Section[];
  storage: { heading: string; cols: [string, string, string, string]; rows: Row[] };
  manage: { heading: string; body: string; button: string };
  banner: { title: string; body: string; more: string; accept: string; reject: string };
  footer: { privacy: string; cookies: string };
  formNote: { before: string; link: string; after: string };
};

const tr: PrivacyContent = {
  title: "Gizlilik ve KVKK Aydınlatma Metni",
  description: "ataberksoylu.com hangi kişisel verileri, neden ve ne kadar süreyle işler; çerez tercihleri ve KVKK kapsamındaki hakların.",
  h1: "Gizlilik ve KVKK Aydınlatma Metni",
  lead:
    "Bu site bir şirketin değil, benim, Ataberk Soylu'nun kişisel sitesi. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) m.10 uyarınca hangi verini neden işlediğimi aşağıda açıkça yazıyorum. Avrupa Birliği'nden ziyaret ediyorsan aynı bilgiler GDPR m.13 için de geçerli.",
  updated: "Son güncelleme: 1 Kasım 2026",
  sections: [
    {
      heading: "Veri sorumlusu",
      body: ["Ataberk Soylu (gerçek kişi), İstanbul, Türkiye. İletişim: ataberk@ataberksoylu.com"],
    },
    {
      heading: "İletişim formu",
      body: [
        "Formu gönderdiğinde adın, e-posta adresin, mesajın, seçtiğin konu ve sayfanın dili; yazarsan şirket/site adın ve telefonun kaydedilir. Formu kötüye kullanımdan (spam, aşırı gönderim) korumak için IP adresinin tuzlanmış, geri çevrilemeyen bir özeti de saklanır; ham IP adresin saklanmaz.",
        "Amaç: talebine dönüş yapmak, proje ve teklif görüşmesini yürütmek. Hukuki sebep: bir sözleşmenin kurulmasıyla doğrudan ilgili olması (KVKK m.5/2-c) ve formu güvende tutmaktaki meşru menfaatim (m.5/2-f).",
        "Ziyaret istatistiklerine onay verdiysen, mesajın bu tarayıcıdaki ziyaret kaydına bağlanır; IP adresinden çıkarılan yaklaşık şehir/ülke ve cihaz türü (ör. “Mobil · iOS · Safari”) mesaja eklenir. Onay vermediysen bu bağlantı kurulmaz.",
      ],
    },
    {
      heading: "Ziyaret istatistikleri (yalnızca onay verirsen)",
      body: [
        "Sitede Google Analytics, reklam pikseli veya başka bir üçüncü taraf takip aracı yok. Kendi yazdığım basit bir istatistik sistemi var ve yalnızca alttaki banner'da “Kabul et” dersen çalışır. Çalıştığında şunları kaydeder:",
      ],
      items: [
        "Tarayıcında saklanan rastgele bir ziyaretçi kimliği ve oturum sayısı",
        "Gezdiğin sayfalar, sayfada geçen süre, ne kadar aşağı kaydırdığın, görünen bölümler",
        "Tıkladığın bağlantı ve butonlar; bir form alanına odaklandığın (yazdığın içerik değil); bir şey kopyaladığın (metnin kendisi değil, yalnızca uzunluğu); sayfa hataları",
        "Nereden geldiğin: önceki sayfa adresi, kampanya etiketleri (UTM), reklam tıklamasının türü (ör. “Google Ads”)",
        "Dil, saat dilimi, ekran ve pencere boyutu, cihaz/tarayıcı/işletim sistemi türü, açık/koyu tema, bağlantı hızı türü, sayfa yüklenme süresi",
        "IP adresinden çıkarılan yaklaşık ülke, bölge ve şehir; IP adresinin tuzlanmış özeti (aynı ağdan gelen ziyaretleri gruplamak için)",
      ],
    },
    {
      heading: "Kişiye özel bağlantılar",
      body: [
        "Bazı kişilere portfolyomu ataberksoylu.com/isim biçiminde, o kişiye özel bir bağlantıyla gönderiyorum. Böyle bir bağlantıyla geldiysen ve istatistiklere onay verirsen, ziyaretin o bağlantıyla eşleşir: bağlantıyı gönderdiğim kişinin siteyi açıp açmadığını, hangi sayfalara baktığını ve bağlantının başka bir ağdan ya da şehirden açılıp açılmadığını görebilirim. Onay vermezsen bağlantı adresten silinir ve hiçbir şey kaydedilmez.",
        "Amaç: gönderdiğim tanıtımın ilgi görüp görmediğini anlamak. Hukuki sebep: açık rızan (m.5/1).",
      ],
    },
    {
      heading: "Toplamadıklarım",
      items: [
        "Parmak izi (canvas, ses, font taraması) yok; tarayıcını gizlice tanımlayan bir kimlik üretilmiyor",
        "Formu doldururken yazdıkların, gönder'e basmadan hiçbir yere gitmiyor",
        "Ham IP adresi ve tam konum saklanmıyor",
        "Verilerin satılmıyor, reklam için kullanılmıyor, kimseyle paylaşılmıyor (aşağıdaki hizmet sağlayıcılar dışında)",
      ],
    },
    {
      heading: "Verilerin kime ve nereye aktarılır",
      body: [
        "Site ve veriler şu hizmet sağlayıcıların altyapısında çalışır: Vercel Inc. (barındırma ve sunucu, ABD), Neon (veritabanı, sunucular Frankfurt/Almanya), Google LLC (Google Workspace e-postası; form mesajları e-posta olarak bana iletilir). Sunucular Türkiye dışında olduğu için verilerin yurt dışına aktarılır (KVKK m.9).",
        "İstatistik verilerinin aktarımı için dayanak, banner'da verdiğin açık rızadır. Form mesajlarının aktarımı, talebini yanıtlayabilmem için zorunludur.",
        "Kanunen yetkili bir kamu kurumu talep ederse veriler yalnızca bu talep kapsamında paylaşılır.",
      ],
    },
    {
      heading: "Saklama süresi",
      items: [
        "Form mesajları: 2 yıl, sonra otomatik silinir",
        "Ziyaret ve etkileşim kayıtları: 12 ay, sonra otomatik silinir",
        "Tarayıcındaki istatistik verileri: onayını geri çektiğinde hemen silinir",
        "Daha erken silinmesini istersen yazman yeterli",
      ],
    },
    {
      heading: "KVKK m.11 kapsamındaki hakların",
      body: ["Bana başvurarak şunları isteyebilirsin:"],
      items: [
        "Kişisel verinin işlenip işlenmediğini ve işlendiyse bilgisini öğrenmek",
        "İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenmek",
        "Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilmek",
        "Eksik veya yanlış işlenmişse düzeltilmesini, silinmesini ya da yok edilmesini ve bunun aktarılan kişilere bildirilmesini istemek",
        "Yalnızca otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç çıkmasına itiraz etmek",
        "Kanuna aykırı işleme nedeniyle zarara uğradıysan zararın giderilmesini talep etmek",
      ],
    },
    {
      heading: "Nasıl başvurursun",
      body: [
        "ataberk@ataberksoylu.com adresine adını ve talebini yazman yeterli. Başvurunu en geç 30 gün içinde, ücretsiz yanıtlarım. Yanıtımı yeterli bulmazsan Kişisel Verileri Koruma Kurulu'na (kvkk.gov.tr) şikâyette bulunabilirsin. AB'de yaşıyorsan kendi ülkendeki veri koruma otoritesine de başvurabilirsin.",
      ],
    },
  ],
  storage: {
    heading: "Tarayıcında sakladıklarım",
    cols: ["Anahtar", "Ne için", "Tür", "Süre"],
    rows: [
      { key: "ab_consent", what: "İstatistik tercihin (kabul / ret)", kind: "Zorunlu", keep: "Sen silene kadar" },
      { key: "ab_fab", what: "Köşedeki iletişim butonunun açıklamasını bir kez göstermek", kind: "İşlevsel", keep: "Sekme kapanınca" },
      { key: "ab_visitor, ab_session, ab_seen", what: "Rastgele ziyaretçi kimliği ve oturum sayımı", kind: "İstatistik (onaylı)", keep: "Onayını geri çekene kadar" },
      { key: "ab_ref", what: "Kişiye özel bağlantının adı", kind: "İstatistik (onaylı)", keep: "Onayını geri çekene kadar" },
    ],
  },
  manage: {
    heading: "Tercihini değiştir",
    body: "Onayını istediğin zaman geri çekebilir ya da yeniden verebilirsin. Geri çektiğinde tarayıcındaki istatistik verileri silinir ve kayıt durur.",
    button: "Çerez tercihlerini aç",
  },
  banner: {
    title: "Ziyaret istatistikleri",
    body: "Kabul edersen hangi sayfalara baktığın, nereden geldiğin ve yaklaşık konumun kendi istatistik sistemimde (sunucular yurt dışında) kaydedilir. Reddedersen hiçbir şey kaydedilmez; site aynen çalışır.",
    more: "Ayrıntılar",
    accept: "Kabul et",
    reject: "Reddet",
  },
  footer: { privacy: "Gizlilik ve KVKK", cookies: "Çerez tercihleri" },
  formNote: {
    before: "Bilgilerin yalnızca sana dönüş yapmak için kullanılır. ",
    link: "Aydınlatma metni",
    after: "",
  },
};

const en: PrivacyContent = {
  title: "Privacy Notice",
  description: "What personal data ataberksoylu.com processes, why and for how long; cookie settings and your rights under KVKK and GDPR.",
  h1: "Privacy Notice",
  lead:
    "This is my personal site, Ataberk Soylu's, not a company's. Below is what personal data I process and why, as Türkiye's data protection law (KVKK, Law No. 6698, Art. 10) and, for visitors from the EU, the GDPR (Art. 13) require.",
  updated: "Last updated: 1 November 2026",
  sections: [
    {
      heading: "Controller",
      body: ["Ataberk Soylu (a private individual), Istanbul, Türkiye. Contact: ataberk@ataberksoylu.com"],
    },
    {
      heading: "Contact form",
      body: [
        "When you send the form, your name, email address, message, the topic you picked and the page language are stored; your company/site and phone too, if you fill them in. To protect the form from abuse (spam, flooding), a salted, irreversible hash of your IP address is kept; your raw IP address is not stored.",
        "Purpose: to reply to you and run the project and quote conversation. Legal basis: steps prior to entering a contract (KVKK Art. 5/2-c; GDPR Art. 6(1)(b)) and my legitimate interest in keeping the form safe (KVKK Art. 5/2-f; GDPR Art. 6(1)(f)).",
        "If you accepted visit statistics, your message is linked to this browser's visit record, and the approximate city/country derived from your IP and your device type (e.g. “Mobile · iOS · Safari”) are added to it. Without consent, no such link is made.",
      ],
    },
    {
      heading: "Visit statistics (only with your consent)",
      body: [
        "The site has no Google Analytics, ad pixels or other third-party trackers. It has a simple statistics system I wrote myself, which runs only if you choose “Accept” in the banner. When it runs, it records:",
      ],
      items: [
        "A random visitor ID stored in your browser, and a session count",
        "The pages you view, time on page, how far you scroll, the sections you see",
        "The links and buttons you click; that you focused a form field (not what you typed); that you copied something (only its length, never the text); page errors",
        "Where you came from: the previous page address, campaign tags (UTM), the type of ad click (e.g. “Google Ads”)",
        "Language, time zone, screen and window size, device/browser/OS type, light/dark theme, connection speed type, page load time",
        "The approximate country, region and city derived from your IP address; a salted hash of your IP address (to group visits from the same network)",
      ],
    },
    {
      heading: "Personal links",
      body: [
        "I send my portfolio to some people with a link made for them, like ataberksoylu.com/name. If you came through such a link and accept statistics, your visit is matched to it: I can see whether the person I sent it to opened the site, which pages they viewed, and whether the link was opened from another network or city. If you don't consent, the link is removed from the address and nothing is recorded.",
        "Purpose: to learn whether what I sent was of interest. Legal basis: your explicit consent (KVKK Art. 5/1; GDPR Art. 6(1)(a)).",
      ],
    },
    {
      heading: "What I don't collect",
      items: [
        "No fingerprinting (canvas, audio, font probing); no hidden ID is built from your browser",
        "Nothing you type in the form goes anywhere until you press send",
        "No raw IP address or precise location is stored",
        "Your data is not sold, used for advertising or shared (except with the providers below)",
      ],
    },
    {
      heading: "Who receives your data, and where",
      body: [
        "The site and its data run on these providers: Vercel Inc. (hosting and servers, USA), Neon (database, servers in Frankfurt, Germany), Google LLC (Google Workspace email; form messages are forwarded to me by email). As the servers are outside Türkiye, your data is transferred abroad (KVKK Art. 9).",
        "The basis for transferring statistics is the explicit consent you give in the banner. Transferring form messages is necessary to answer your request.",
        "Data is disclosed to a public authority only when the law requires it, and only within that request.",
      ],
    },
    {
      heading: "How long it is kept",
      items: [
        "Form messages: 2 years, then deleted automatically",
        "Visit and interaction records: 12 months, then deleted automatically",
        "Statistics data in your browser: deleted as soon as you withdraw consent",
        "Write to me if you want anything deleted sooner",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Under KVKK Art. 11 and the GDPR you can ask to know whether and how your data is processed, its purpose and who receives it; to have it corrected, deleted or restricted; to object to processing; to receive it in a portable form (GDPR); to withdraw consent at any time; and to be compensated for damage from unlawful processing.",
      ],
    },
    {
      heading: "How to make a request",
      body: [
        "Email ataberk@ataberksoylu.com with your name and request. I answer within 30 days, free of charge. If you're not satisfied, you can complain to Türkiye's Personal Data Protection Authority (kvkk.gov.tr) or, in the EU, to your local data protection authority.",
      ],
    },
  ],
  storage: {
    heading: "What I store in your browser",
    cols: ["Key", "Purpose", "Type", "Kept"],
    rows: [
      { key: "ab_consent", what: "Your statistics choice (accept / reject)", kind: "Necessary", keep: "Until you clear it" },
      { key: "ab_fab", what: "Showing the corner contact button's label once", kind: "Functional", keep: "Until the tab closes" },
      { key: "ab_visitor, ab_session, ab_seen", what: "Random visitor ID and session count", kind: "Statistics (consented)", keep: "Until you withdraw consent" },
      { key: "ab_ref", what: "The name of a personal link", kind: "Statistics (consented)", keep: "Until you withdraw consent" },
    ],
  },
  manage: {
    heading: "Change your choice",
    body: "You can withdraw or give consent again at any time. Withdrawing deletes the statistics data in your browser and stops recording.",
    button: "Open cookie settings",
  },
  banner: {
    title: "Visit statistics",
    body: "If you accept, the pages you view, where you came from and your approximate location are recorded in my own statistics system (servers outside Türkiye). If you reject, nothing is recorded and the site works the same.",
    more: "Details",
    accept: "Accept",
    reject: "Reject",
  },
  footer: { privacy: "Privacy", cookies: "Cookie settings" },
  formNote: {
    before: "Your details are used only to reply to you. ",
    link: "Privacy notice",
    after: "",
  },
};

export const privacy: Record<Locale, PrivacyContent> = { tr, en };
