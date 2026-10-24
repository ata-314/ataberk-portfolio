import type { Locale } from "@/lib/i18n";

// The contact page (/tr/iletisim, /en/contact): a light page every "start a
// project" button leads to, so nobody has to scroll the home stage to reach the
// form. Same rule as the rest of the site: no invented prices, timelines or metrics.

export const contactBase: Record<Locale, string> = { tr: "iletisim", en: "contact" };
export const contactPath = (locale: Locale) => `/${locale}/${contactBase[locale]}`;

type ContactPage = {
  title: string;
  description: string;
  h1: string;
  lead: string;
  cta: string; // the short button label used site-wide
  steps: { heading: string; items: { name: string; desc: string }[] };
  clients: string;
  faq: { heading: string; items: { q: string; a: string }[] };
};

// Client work shown on the contact page as proof, linked to its case page.
export const clientWork = ["ala-cekmekoy", "ucay-360", "dbh-group", "the-lock", "fidan-property", "ecombox"];

export const contactPage: Record<Locale, ContactPage> = {
  tr: {
    title: "İletişim ve Proje Teklifi | Yapay Zeka, Web ve Tasarım",
    description:
      "Web sitesi, yapay zekâ reklam filmi, AI agent ya da marka tasarımı için projeni anlat. Ataberk Soylu kapsamı okuyup sana özel teklifle dönüyor. İstanbul ve uzaktan.",
    h1: "Projeni anlat.",
    lead: "Fiyat, işin kapsamına göre belirleniyor. Ne yapmak istediğini kısaca yaz; okuyup e-postayla dönüyorum. Gönderdikten sonra istersen WhatsApp'tan hemen konuşalım.",
    cta: "Projeni anlat",
    steps: {
      heading: "Sonrasında ne oluyor",
      items: [
        { name: "Özetini okurum", desc: "Ne istediğini, ne zamana ve hangi hedefle istediğini." },
        { name: "Kısa bir görüşme", desc: "Kapsamı ve yolu birlikte netleştiriyoruz." },
        { name: "Net teklif", desc: "Kapsam, takvim ve fiyat tek dokümanda." },
        { name: "Üretim ve yayın", desc: "Ara teslimlerle ilerliyor, senin onayınla yayına çıkıyor." },
      ],
    },
    clients: "Birlikte çalıştığım markalardan",
    faq: {
      heading: "Sık sorulanlar",
      items: [
        { q: "Bir proje ne kadar tutar?", a: "Her proje kapsamına göre fiyatlanıyor. Formu doldur; kapsamı konuştuktan sonra net bir teklif gönderiyorum." },
        { q: "Hangi işleri alıyorsun?", a: "Web sitesi ve web uygulamaları, yapay zekâ destekli reklam filmi ve video, özel AI agent ve otomasyon, marka kimliği, grafik ve UI/UX tasarım." },
        { q: "İstanbul dışından ya da yurt dışından çalışabilir miyiz?", a: "Evet. İstanbul merkezliyim; Türkiye genelinde ve yurt dışıyla uzaktan, Türkçe ve İngilizce çalışıyorum." },
      ],
    },
  },
  en: {
    title: "Contact and Project Enquiry | AI, Web and Design",
    description:
      "Tell Ataberk Soylu about your website, AI commercial, AI agent or brand design project and get a proposal built for your scope. Based in Istanbul, working worldwide.",
    h1: "Tell me about your project.",
    lead: "Pricing follows the scope of the work. Write a few lines about what you want to make; I read every message and reply by email. Once it's sent, we can also talk straight away on WhatsApp.",
    cta: "Start a project",
    steps: {
      heading: "What happens next",
      items: [
        { name: "I read your brief", desc: "What you want, by when and to what end." },
        { name: "A short call", desc: "We pin down the scope and the route together." },
        { name: "A clear proposal", desc: "Scope, timeline and price in one document." },
        { name: "Production and launch", desc: "Built in reviewed stages, launched on your approval." },
      ],
    },
    clients: "From brands I've worked with",
    faq: {
      heading: "Questions",
      items: [
        { q: "How much does a project cost?", a: "Every project is priced on its scope. Fill in the form; once we've talked it through I send a clear proposal." },
        { q: "What kind of work do you take on?", a: "Websites and web apps, AI-driven commercials and video, custom AI agents and automation, brand identity, graphic and UI/UX design." },
        { q: "Do you work with clients outside Türkiye?", a: "Yes. I'm based in Istanbul and work remotely with clients worldwide, in English and Turkish." },
      ],
    },
  },
};
