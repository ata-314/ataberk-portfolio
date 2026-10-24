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
  keywords: string[]; // the searches this guide answers (meta keywords, Article schema, topic chips)
  faq: { q: string; a: string }[]; // short answers, also as FAQPage data
};

type Guides = {
  base: string;
  hub: { title: string; description: string; h1: string; lead: string };
  labels: { all: string; read: string; updated: string; related: string; service: string; cta: string; toc: string; minutes: string; topics: string; faq: string; more: string; author: string; authorBio: string };
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
  labels: {
    all: "Tüm yazılar", read: "Oku", updated: "Güncellendi", related: "Yazıda geçen işler", service: "İlgili hizmet",
    cta: "Kendi projen için konuşalım: aklındakini kısaca yaz.", toc: "Bu yazıda", minutes: "dk okuma", topics: "Konular",
    faq: "Kısa cevaplar", more: "Diğer yazılar", author: "Yazar",
    authorBio: "İstanbul'da tasarım, motion, yapay zekâ ve web geliştirmeyi tek üretim sürecinde birleştiren creative technologist.",
  },
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
      keywords: ["konut projesi web sitesi", "proje lansman sitesi", "gayrimenkul web sitesi", "inşaat firması web sitesi", "emlak projesi tanıtım sitesi", "konut projesi landing page"],
      faq: [
        { q: "Konut projesi sitesi tek sayfa mı olmalı?", a: "Tek bir projenin lansman sitesi için çoğu zaman evet: proje yukarıdan aşağı bir hikâye gibi anlatılır ve bilgi formu her an yakında olur. Birden fazla projesi olan geliştirici firmalar için çok sayfalı kurumsal site daha uygundur." },
        { q: "Lansman sitesine ne zaman başlanmalı?", a: "Render, plan ve temel proje bilgileri hazır olduğunda. Site inşaat başlamadan yayına alınabilir ve proje ilerledikçe güncellenir." },
        { q: "Formda hangi bilgiler istenmeli?", a: "Ad, telefon, e-posta ve ilgilenilen daire tipi çoğu zaman yeterli. Form kısaldıkça doldurulma ihtimali artar; KVKK onayı eklenmeli." },
      ],
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
      keywords: ["AI agent nedir", "özel AI agent geliştirme", "yapay zeka ajanı", "çok ajanlı sistem", "yapay zeka otomasyon", "işletmeler için yapay zeka"],
      faq: [
        { q: "AI agent ile chatbot aynı şey mi?", a: "Hayır. Chatbot soruya cevap verir; agent bir işi adım adım yürütür, araçlarını kullanır, çıktısını denetler ve onay gereken yerde durur." },
        { q: "Bir AI agent hangi araçlara bağlanabilir?", a: "Dosyalar, veritabanları, takvim, e-posta, sosyal medya hesapları ve API'si olan çoğu sistem. Hangi araca hangi yetkiyle bağlanacağı baştan tanımlanır." },
        { q: "Küçük bir işletme için AI agent mantıklı mı?", a: "Her hafta tekrar eden, kuralı tarif edilebilen bir iş varsa evet. En iyisi tek bir işle başlayıp sonucu görmek." },
      ],
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
    {
      key: "website-cost",
      slug: "web-sitesi-fiyatlari",
      title: "Web Sitesi Fiyatları Neye Göre Değişir? Teklif İstemeden Önce Bilinmesi Gerekenler",
      description:
        "Kurumsal site, proje lansman sitesi ya da e-ticaret: bir web sitesinin fiyatını belirleyen şeyler, hazır tema ile özel tasarım farkı, gizli maliyetler ve doğru teklif için hazırlanacak brief.",
      h1: "Web sitesi fiyatları neye göre değişir?",
      lead: "“Bir web sitesi ne kadar?” sorusunun tek bir cevabı yok, çünkü “web sitesi” tek bir şey değil. Bu yazıda fiyatı neyin belirlediğini, hazır tema ile özel tasarımın farkını ve doğru teklif alabilmek için neleri hazırlaman gerektiğini anlatıyorum.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "web-design",
      work: ["ucay-360", "the-lock", "fidan-property"],
      keywords: ["web sitesi fiyatları", "web sitesi yaptırmak", "kurumsal web sitesi fiyat", "web tasarım fiyatları 2026", "özel web sitesi tasarımı", "web sitesi teklifi"],
      faq: [
        { q: "Hazır tema mı, özel tasarım mı?", a: "Hazır tema daha hızlı ve genellikle daha ucuzdur ama marka çoğu zaman temaya uyar. Özel tasarımda site markaya göre kurulur; farklılaşmak, hız ve uzun vadeli esneklik önemliyse özel tasarım öne çıkar." },
        { q: "Teklif istemek için ne hazırlamalıyım?", a: "Sitenin amacı, hedef kitle, sayfa listesi, beğendiğin birkaç örnek site, elindeki içerikler (metin, görsel, logo) ve istediğin yayın tarihi. Bu bilgiler ne kadar netse teklif o kadar doğru olur." },
        { q: "Site yayına çıktıktan sonra ek maliyet olur mu?", a: "Alan adı ve barındırma gibi düzenli giderler olur; içerik güncellemeleri, yeni sayfalar ve bakım ise anlaşmaya göre ayrıca planlanır. Teklifte bunların açıkça yazması gerekir." },
      ],
      sections: [
        {
          h2: "“Web sitesi” tek bir şey değil",
          body: [
            "Beş sayfalık bir kurumsal site ile kaydırdıkça oynayan videolu bir proje lansman sitesi, ya da filtreli arama yapılan çok dilli bir portföy aynı işler değildir. Fiyatı belirleyen ilk şey sitenin türü ve kapsamıdır.",
            "Örneğin Üçay 360'ın kaydırmayla ilerleyen sinematik açılışı, The Lock'un projeyi, konumu, filmleri ve e-kataloğu taşıyan kurumsal akışı ve Fidan Property'nin konum, durum, tür ve fiyatla filtrelenen proje araması üç farklı iş yüküdür.",
          ],
        },
        {
          h2: "Fiyatı belirleyen başlıca şeyler",
          body: ["Bir teklifin arkasında çoğu zaman şu kalemler vardır:"],
          list: [
            "Sayfa sayısı ve her sayfanın ne kadar özel tasarlandığı.",
            "Hazır tema mı, sıfırdan özel tasarım mı.",
            "Hareket, video, 3B ve etkileşim düzeyi.",
            "Arama, filtreleme, form, üyelik, ödeme gibi işlevler.",
            "Dil sayısı.",
            "İçeriği kimin hazırladığı: metin, fotoğraf, video, çeviri.",
            "Yönetim paneli ihtiyacı: içeriği kim, ne sıklıkla güncelleyecek.",
            "Takvim: sıkışık bir yayın tarihi, işi yeniden planlamayı gerektirir.",
          ],
        },
        {
          h2: "Hazır tema ile özel tasarım arasındaki fark",
          body: [
            "Hazır temalar hızlı başlangıç sağlar; ama sayfa yapısı, hareket ve detay temanın izin verdiği kadardır. Çoğu zaman marka temaya uyar, tema markaya değil.",
            "Özel tasarımda site markanın kendisinden çıkar: yapı, tipografi, hareket ve içerik akışı o markaya göre kurulur. Tasarımı ve kodu aynı kişi yaptığında, tasarımda görülen detay yayındaki sitede de aynen çalışır.",
          ],
        },
        {
          h2: "Sık gözden kaçan maliyetler",
          body: ["Teklifleri karşılaştırırken şunların dahil olup olmadığına bak:"],
          list: [
            "Alan adı, barındırma ve e-posta.",
            "Metin yazımı, fotoğraf ve video çekimi, çeviri.",
            "Arama motoru için temel ayarlar: sayfa başlıkları, açıklamalar, site haritası, yapısal veri.",
            "KVKK aydınlatma metni ve çerez bildirimi.",
            "Yayından sonraki bakım, güncelleme ve küçük değişiklikler.",
          ],
        },
        {
          h2: "Ucuz site neden pahalıya gelebilir?",
          body: [
            "Yavaş açılan, telefonda bozulan ya da Google'da bulunmayan bir site, reklam ve sosyal medya bütçesinin bir kısmını boşa harcatır. Sonradan düzeltmek çoğu zaman baştan doğru yapmaktan daha fazla iş çıkarır.",
            "Bu yüzden fiyatı sitenin ne iş yapacağıyla birlikte düşünmek gerekir: bir lansman sitesinin işi talep toplamaksa, form ve hız fiyattan önce gelir.",
          ],
        },
        {
          h2: "Doğru teklif için brief",
          body: ["Kısa ama net bir brief, hem doğru fiyat hem de doğru iş demektir:"],
          list: [
            "Sitenin tek cümlelik amacı ve hedef kitlesi.",
            "Sayfa listesi ve olmazsa olmaz işlevler.",
            "Beğendiğin üç örnek site ve neden beğendiğin.",
            "Elindeki içerikler: logo, metin, görsel, video.",
            "Dil sayısı ve istenen yayın tarihi.",
          ],
        },
      ],
    },
    {
      key: "ai-commercial",
      slug: "ai-reklam-filmi-nasil-uretilir",
      title: "AI Reklam Filmi Nasıl Üretilir? Yapay Zeka ile Tanıtım Filmi Süreci",
      description:
        "Yapay zekâ destekli reklam ve tanıtım filmi nasıl üretilir: fikir ve senaryo, storyboard, görsel dil, üretim, kurgu ve ses. Neyin işe yaradığı, nerede dikkat edilmesi gerektiği ve marka tutarlılığı.",
      h1: "AI reklam filmi nasıl üretilir?",
      lead: "Yapay zekâ ile film üretmek bir komut yazıp sonucu beklemek değil. İyi bir AI reklam filmi, klasik bir prodüksiyonun disipliniyle başlar: fikir, senaryo, storyboard, ışık ve kurgu. Modeller bu sürecin araçlarıdır. Bu yazıda süreci adım adım anlatıyorum.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "ai-art",
      work: ["oneavex-ai-studio", "ecombox"],
      keywords: ["AI reklam filmi", "yapay zeka reklam filmi", "AI tanıtım filmi", "yapay zeka ile video üretimi", "AI video prodüksiyon", "yapay zeka reklam ajansı"],
      faq: [
        { q: "AI reklam filmi klasik çekimin yerini tutar mı?", a: "Bazı işlerde evet, bazılarında hayır. Henüz var olmayan bir mekânı, zor bir sahneyi ya da hızlı varyasyonları göstermekte çok güçlü; gerçek ürünün birebir doğruluğunun kritik olduğu yerlerde çekimle birlikte kullanmak daha güvenli." },
        { q: "Marka logosu ve ürün doğru görünür mü?", a: "Ürün ve logo doğruluğu sürecin baştan planlanan parçası olmalı. Gerektiğinde ürün ve logo gerçek görsellerle yerleştirilir ve her kare yayından önce kontrol edilir." },
        { q: "Dikey ve yatay formatlar birlikte üretilebilir mi?", a: "Evet. Storyboard aşamasında hedef formatlar belirlenirse, sosyal medya için dikey ve web ya da TV için yatay versiyonlar aynı görsel dille hazırlanabilir." },
      ],
      sections: [
        {
          h2: "Önce fikir, sonra model",
          body: [
            "Bir AI filmini iyi yapan şey modelin kendisi değil, arkasındaki fikirdir. Filmin tek cümlelik fikri, kime ne hissettireceği ve izleyiciye hangi aksiyonu aldıracağı en başta netleşmelidir.",
            "Oneavex'te AI video üretimini gerçek sinematografi disipliniyle birleştiriyoruz: storyboard, ürün doğruluğu, ışık ve kurgu önce geliyor; modeller araç.",
          ],
        },
        {
          h2: "Senaryo ve storyboard",
          body: [
            "Senaryo, filmin süresine ve formatına göre sahnelere bölünür. Her sahne için kamera açısı, hareket, ışık ve geçiş bir storyboard üzerinde tarif edilir. Bu aşama, üretimde kaybolacak zamanı baştan kazandırır.",
          ],
        },
        {
          h2: "Görsel dil ve marka tutarlılığı",
          body: [
            "Bir markanın filmleri birbirine benzemeli: aynı palet, aynı ışık, aynı ton. Bunun için markanın renkleri, tipografisi ve kaçınılacak şeyler üretimden önce yazılır ve her sahne bu kurallara göre üretilir.",
            "Metin ve logo yerleşimi ayrı bir dikkat ister; yanlış yazılmış bir logo ya da bozuk bir harf, en iyi görüntüyü bile yayınlanamaz hale getirir.",
          ],
        },
        {
          h2: "Üretim: sahne sahne",
          body: [
            "Her sahne ayrı üretilir, birkaç varyasyondan en iyisi seçilir. Aynı görüntü üzerinde tekrar tekrar düzeltme yapmak yerine, sahne gerektiğinde baştan ve temiz bir tarifle yeniden üretilir; bu, kalitenin kat kat bozulmasını önler.",
          ],
        },
        {
          h2: "Kurgu, ses ve son dokunuş",
          body: [
            "Sahneler bir araya geldiğinde film kurguda kurulur: ritim, geçişler, müzik ve ses efektleri. Motion design ile metinler, logolar ve ürün bilgileri eklenir; renk düzeltmesiyle bütün sahneler aynı görsel dile çekilir.",
          ],
        },
        {
          h2: "Formatlar ve yayın",
          body: ["Film nerede yayınlanacaksa ona göre teslim edilir:"],
          list: [
            "Instagram ve TikTok için dikey, kısa versiyonlar.",
            "Web sitesi ve YouTube için yatay versiyon.",
            "Reklam için farklı uzunlukta kesitler.",
            "Siteye gömülecekse hızlı yüklenecek şekilde sıkıştırılmış dosyalar.",
          ],
        },
        {
          h2: "Nerede dikkat etmeli?",
          body: [
            "Telif ve kullanım hakları, gerçek kişilerin benzerliği ve ürünün doğru temsili baştan konuşulmalı. Yapay zekâ ile üretilen görüntülerin markanın iddialarını abartmaması, özellikle gayrimenkul gibi alıcının karar verdiği sektörlerde önemlidir.",
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
  labels: {
    all: "All guides", read: "Read", updated: "Updated", related: "Work cited", service: "Related service",
    cta: "Let's talk about your project: tell me what you have in mind.", toc: "In this guide", minutes: "min read", topics: "Topics",
    faq: "Short answers", more: "More guides", author: "Author",
    authorBio: "Istanbul-based creative technologist joining design, motion, AI and web development in one production process.",
  },
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
      keywords: ["real estate launch website", "property launch website", "residential project website", "real estate developer website", "property landing page", "real estate website design Turkey"],
      faq: [
        { q: "Should a project launch site be a single page?", a: "For one development, usually yes: the project is told top to bottom like a story and the enquiry form is always close. Developers with several projects are better served by a multi-page site." },
        { q: "When should the launch site be built?", a: "Once renders, plans and the core project facts are ready. It can go live before construction starts and grow with the project." },
        { q: "What should the enquiry form ask?", a: "Name, phone, email and unit type of interest are usually enough. Shorter forms get filled in more often; add the consent your privacy law requires." },
      ],
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
      keywords: ["what is an AI agent", "custom AI agent development", "AI agents for business", "multi-agent system", "AI workflow automation", "hire AI agent developer"],
      faq: [
        { q: "Is an AI agent the same as a chatbot?", a: "No. A chatbot answers questions; an agent carries out a task step by step, uses its tools, checks its output and stops where approval is needed." },
        { q: "What tools can an AI agent connect to?", a: "Files, databases, calendars, email, social accounts and most systems with an API. Which tool it may use, and with what permission, is defined up front." },
        { q: "Does an AI agent make sense for a small business?", a: "If there is a task repeated every week with rules you can describe, yes. Start with that one task and look at the result." },
      ],
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
    {
      key: "website-cost",
      slug: "website-cost",
      title: "What Does a Website Cost? What Drives the Price Before You Ask for a Quote",
      description:
        "Corporate site, launch site or e-commerce: what sets the price of a website, template versus custom design, the costs people miss, and the brief that gets you an accurate quote.",
      h1: "What drives the cost of a website?",
      lead: "“How much is a website?” has no single answer, because “a website” is not one thing. This guide covers what sets the price, the difference between a template and a custom design, and what to prepare to get an accurate quote.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "web-design",
      work: ["ucay-360", "the-lock", "fidan-property"],
      keywords: ["website cost", "how much does a website cost", "custom website design price", "website design quote", "hire a web designer", "website development cost 2026"],
      faq: [
        { q: "Template or custom design?", a: "A template is faster and usually cheaper, but the brand often bends to the template. A custom design is built from the brand; if standing out, speed and long-term flexibility matter, custom wins." },
        { q: "What should I prepare before asking for a quote?", a: "The site's purpose, its audience, a page list, a few sites you like, the content you have (copy, images, logo) and the launch date you want. The clearer these are, the more accurate the quote." },
        { q: "Are there costs after launch?", a: "Recurring costs such as domain and hosting, plus content updates, new pages and maintenance, planned separately by agreement. A good quote spells these out." },
      ],
      sections: [
        {
          h2: "“A website” is not one thing",
          body: [
            "A five-page corporate site, a launch site with scroll-driven video and a multilingual portfolio with filtered search are different jobs. The first thing that sets the price is the type and scope of the site.",
            "Üçay 360's scroll-driven cinematic opening, The Lock's corporate flow carrying the project, location, films and e-catalogue, and Fidan Property's project search filtered by location, status, type and price are three different workloads.",
          ],
        },
        {
          h2: "What mainly drives the price",
          body: ["Behind most quotes are these items:"],
          list: [
            "Number of pages, and how custom each one is.",
            "A template or a design from scratch.",
            "The level of motion, video, 3D and interaction.",
            "Features such as search, filters, forms, accounts or payments.",
            "Number of languages.",
            "Who prepares the content: copy, photography, video, translation.",
            "Whether a content management panel is needed, and who updates it how often.",
            "Timeline: a tight launch date means replanning the work.",
          ],
        },
        {
          h2: "Template versus custom design",
          body: [
            "Templates give a quick start, but structure, motion and detail only go as far as the template allows. Most of the time the brand fits the template, not the other way round.",
            "A custom design grows out of the brand: structure, type, motion and content flow are built for it. When the same person designs and codes, the detail in the design works the same way on the live site.",
          ],
        },
        {
          h2: "Costs people miss",
          body: ["When comparing quotes, check whether these are included:"],
          list: [
            "Domain, hosting and email.",
            "Copywriting, photo and video shoots, translation.",
            "Search basics: page titles, descriptions, sitemap, structured data.",
            "Privacy notice and cookie consent where required.",
            "Maintenance, updates and small changes after launch.",
          ],
        },
        {
          h2: "Why a cheap site can end up expensive",
          body: [
            "A site that opens slowly, breaks on phones or can't be found on Google wastes part of the ad and social budget. Fixing it later is often more work than doing it right the first time.",
            "So weigh the price against the site's job: if a launch site exists to collect enquiries, the form and speed come before the price.",
          ],
        },
        {
          h2: "The brief that gets an accurate quote",
          body: ["A short, clear brief means both the right price and the right work:"],
          list: [
            "The site's one-line purpose and its audience.",
            "A page list and the must-have features.",
            "Three sites you like, and why.",
            "The content you have: logo, copy, images, video.",
            "Number of languages and the launch date you want.",
          ],
        },
      ],
    },
    {
      key: "ai-commercial",
      slug: "how-ai-commercials-are-made",
      title: "How Is an AI Commercial Made? The Process Behind AI Brand Films",
      description:
        "How an AI-driven commercial or brand film is made: idea and script, storyboard, visual language, production, edit and sound. What works, where to be careful, and keeping a brand consistent.",
      h1: "How is an AI commercial made?",
      lead: "Making a film with AI is not typing a prompt and waiting. A good AI commercial starts with the discipline of a classic production: idea, script, storyboard, light and edit. The models are tools within that process. This guide walks through it step by step.",
      published: "2026-10-25",
      updated: "2026-10-25",
      service: "ai-art",
      work: ["oneavex-ai-studio", "ecombox"],
      keywords: ["AI commercial", "AI brand film", "AI video production", "AI advertising agency", "AI generated commercial", "hire AI video artist"],
      faq: [
        { q: "Can an AI commercial replace a live shoot?", a: "For some work, yes; for some, no. It is very strong at showing a place that doesn't exist yet, a difficult scene or fast variations; where exact product accuracy is critical, combining it with a shoot is safer." },
        { q: "Will the logo and product look right?", a: "Product and logo accuracy should be planned from the start. Where needed they are placed from real assets, and every frame is checked before release." },
        { q: "Can vertical and horizontal versions be made together?", a: "Yes. If the target formats are set at the storyboard stage, vertical cuts for social and horizontal ones for web or TV can share one visual language." },
      ],
      sections: [
        {
          h2: "Idea first, model second",
          body: [
            "What makes an AI film good is not the model but the idea behind it. The film's one-line idea, what it should make whom feel and what action it should prompt need to be clear at the start.",
            "At Oneavex we join AI video production with the discipline of real cinematography: storyboard, product accuracy, light and edit come first; the models are tools.",
          ],
        },
        {
          h2: "Script and storyboard",
          body: [
            "The script is split into scenes to suit the film's length and format. For each scene, camera angle, movement, light and transition are described on a storyboard. This stage saves the time that would otherwise be lost in production.",
          ],
        },
        {
          h2: "Visual language and brand consistency",
          body: [
            "A brand's films should look like each other: the same palette, the same light, the same tone. So the brand's colours, type and things to avoid are written down before production and every scene is made to those rules.",
            "Text and logo placement need their own care; a misspelled logo or a broken letter makes even the best shot unusable.",
          ],
        },
        {
          h2: "Production, scene by scene",
          body: [
            "Each scene is produced on its own and the best of several variations is chosen. Rather than correcting the same image again and again, a scene is regenerated from a clean description when needed, which keeps quality from degrading pass after pass.",
          ],
        },
        {
          h2: "Edit, sound and finishing",
          body: [
            "Once the scenes are in, the film is built in the edit: rhythm, transitions, music and sound effects. Motion design adds copy, logos and product details; colour grading pulls every scene into one look.",
          ],
        },
        {
          h2: "Formats and release",
          body: ["The film is delivered for where it will run:"],
          list: [
            "Short vertical cuts for Instagram and TikTok.",
            "A horizontal version for the website and YouTube.",
            "Cut-downs of different lengths for ads.",
            "Compressed files that load fast when embedded on a site.",
          ],
        },
        {
          h2: "Where to be careful",
          body: [
            "Copyright and usage rights, the likeness of real people and an accurate depiction of the product should be agreed up front. AI imagery should not overstate a brand's claims, especially in sectors like real estate where buyers make decisions based on it.",
          ],
        },
      ],
    },
  ],
};

export const guides: Record<Locale, Guides> = { tr, en };

export const guidePath = (locale: Locale, slug?: string) => `/${locale}/${guides[locale].base}${slug ? `/${slug}` : ""}`;

// Reading time at a steady 200 words a minute.
export const readingMinutes = (g: Guide) =>
  Math.max(1, Math.round([g.lead, ...g.sections.flatMap((s) => [...s.body, ...(s.list ?? [])])].join(" ").split(/\s+/).length / 200));

// Anchor id for a section heading, for the table of contents.
export const sectionId = (h2: string) =>
  h2
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const getGuide = (locale: Locale, slug: string) => guides[locale].items.find((g) => g.slug === slug);

export function guideAlternates(key: string) {
  const tr = guides.tr.items.find((g) => g.key === key)!;
  const en = guides.en.items.find((g) => g.key === key)!;
  return { tr: guidePath("tr", tr.slug), en: guidePath("en", en.slug), "x-default": guidePath("tr", tr.slug) };
}
