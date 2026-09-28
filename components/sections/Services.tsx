"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { ServiceArt } from "./ServiceArt";
import "./services.css";

const content = {
  tr: {
    heading: "Fikirden deneyime.",
    lead: "Tasarım, yazılım ve yapay zekâyı bir araya getirerek markanız için çalışan dijital deneyimler üretiyorum.",
    items: [
      ["Web Siteleri & Dijital Platformlar", "Markanızın karakterini taşıyan, hızlı ve ölçeklenebilir web deneyimleri."],
      ["Mobil & Web Uygulamaları", "Bir fikri, her ekranda kullanımı kolay bir ürüne dönüştüren uygulamalar."],
      ["İş Akışı Otomasyonları", "Araçlarınızı birbirine bağlayan, tekrarlayan işleri sizin yerinize yürüten akışlar."],
      ["Özel AI Agent Geliştirme", "İşinizi anlayan, araçlarınızı kullanan ve sizinle birlikte çalışan yapay zekâ ajanları."],
      ["AI Reklam Filmleri & Video", "Konseptten son kareye, markanızın hikâyesini anlatan yapay zekâ destekli filmler."],
      ["AI Destekli Tasarım & Marka Stratejisi", "Doğru konumlandırmadan özgün görsel kimliğe, tutarlı bir marka dünyası."],
    ],
  },
  en: {
    heading: "From idea to experience.",
    lead: "I bring design, code and AI together to build digital experiences that work for your brand.",
    items: [
      ["Websites & Digital Platforms", "Fast, scalable web experiences with your brand’s character at their core."],
      ["Mobile & Web Apps", "Turning ideas into intuitive products that feel at home on every screen."],
      ["Workflow Automation", "Connected tools and thoughtful workflows that take repetitive work off your hands."],
      ["Custom AI Agents", "Purpose-built agents that understand your business and work with your tools."],
      ["AI Films & Video", "From first concept to final frame, AI-powered films that tell your brand’s story."],
      ["AI-Assisted Design & Brand Strategy", "From clear positioning to a distinctive identity, a coherent world for your brand."],
    ],
  },
};

export function Services({ locale }: { locale: Locale }) {
  const root = useRef<HTMLElement>(null);
  const t = content[locale];
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      section.dataset.active = String(entry.isIntersecting);
    }, { rootMargin: "100px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const follow = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 3}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 3}deg`);
  };

  return (
    <section ref={root} id="services" aria-labelledby="services-heading" className="services-section relative z-20 px-5 md:px-10">
      <div className="services-aura" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="services-inner mx-auto max-w-[88rem]">
        <div className="services-heading">
          <div><p className="services-label">{locale === "tr" ? "Hizmetler" : "Services"}</p><h2 id="services-heading">{t.heading}</h2></div>
          <p className="services-lead">{t.lead}</p>
        </div>
        <div className="services-grid" data-services-grid>
          {t.items.map(([title, description], index) => (
            <article key={title} className={`service-card service-card-${index}`} onPointerMove={follow} onPointerLeave={event => {
              event.currentTarget.style.setProperty("--rx", "0deg");
              event.currentTarget.style.setProperty("--ry", "0deg");
            }}>
              <span className="service-beam" aria-hidden="true" /><span className="service-flare" aria-hidden="true" />
              <div className="service-visual"><span className="service-halo" aria-hidden="true" /><ServiceArt kind={index} locale={locale} /></div>
              <div className="service-copy"><h3>{title}</h3><p>{description}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
