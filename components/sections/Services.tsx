"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";
import { ServiceArt } from "./ServiceArt";
import "./services.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
    // Per card too, so on phones only the vignettes on screen keep animating.
    const cards = new IntersectionObserver(entries => {
      entries.forEach(entry => { (entry.target as HTMLElement).dataset.visible = String(entry.isIntersecting); });
    });
    section.querySelectorAll(".service-card").forEach(card => cards.observe(card));
    return () => { observer.disconnect(); cards.disconnect(); };
  }, []);

  // Entrance: cards surface out of the page's depth — pushed back in Z,
  // tipped away and dark, they rise and tilt up to the glass plane as the
  // section scrolls in, their vignettes lighting up a beat later. Scrubbed
  // like the rest of the site, so scrolling back sinks them again.
  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    const mm = gsap.matchMedia();
    mm.add({ desktop: "(min-width: 1024px) and (min-height: 640px)", reduce: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
      if (conditions?.reduce) return;
      const aura = section.querySelector<HTMLElement>(".services-aura");
      const auraState = (self: ScrollTrigger) => { section.dataset.aura = self.progress < 1 ? "in" : "done"; };
      gsap.fromTo(aura, { "--dot": 0, "--aura-s": 0.55 }, {
        "--dot": 7, "--aura-s": 1, ease: "power1.in",
        scrollTrigger: { trigger: section, start: "top 95%", end: "top 12%", scrub: 0.6, onUpdate: auraState, onRefresh: auraState },
      });
      const cards = gsap.utils.toArray<HTMLElement>(".service-card", section);
      const depth = { "--ey": "170px", "--ez": "-560px", "--erx": "34deg", opacity: 0 };
      const rest = { "--ey": "0px", "--ez": "0px", "--erx": "0deg", opacity: 1 };
      const entering = (self: ScrollTrigger) => { section.dataset.entering = String(self.progress < 1); };
      const groups = conditions?.desktop ? [cards] : cards.map(card => [card]);
      groups.forEach(group => {
        const trigger = conditions?.desktop ? section.querySelector("[data-services-grid]") : group[0];
        gsap.timeline({ scrollTrigger: { trigger, start: "top 96%", end: conditions?.desktop ? "top 28%" : "top 55%", scrub: 0.6, onUpdate: entering, onRefresh: entering } })
          .fromTo(group, depth, { ...rest, ease: "power3.out", duration: 1, stagger: 0.14 })
          .fromTo(group.map(card => card.querySelector(".service-visual")), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: "power2.out", duration: 0.7, stagger: 0.14 }, 0.35);
      });
    });
    return () => { mm.revert(); delete section.dataset.aura; };
  }, { scope: root });

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
