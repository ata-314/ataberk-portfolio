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
    return () => observer.disconnect();
  }, []);

  // Desktop: the section pins and the cards orbit the bird at the centre of
  // the screen on a tilted helix — near cards large and bright, far ones
  // small and dim — then leave the orbit and unfold into the bento grid.
  // Depth is projected here (not by nested CSS 3D) so every card shares one
  // vanishing point at the bird. Scrubbed, so scrolling back winds them up.
  // Smaller screens keep the per-card rise out of the page's depth.
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
      if (!conditions?.desktop) {
        const entering = (self: ScrollTrigger) => { section.dataset.entering = String(self.progress < 1); };
        cards.forEach(card => {
          gsap.timeline({ scrollTrigger: { trigger: card, start: "top 96%", end: "top 55%", scrub: 0.6, onUpdate: entering, onRefresh: entering } })
            .fromTo(card, { "--ey": "170px", "--ez": "-560px", "--erx": "34deg", opacity: 0 }, { "--ey": "0px", "--ez": "0px", "--erx": "0deg", opacity: 1, ease: "power3.out", duration: 1 })
            .fromTo(card.querySelector(".service-visual"), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: "power2.out", duration: 0.7 }, 0.35);
        });
        return;
      }
      const grid = section.querySelector<HTMLElement>("[data-services-grid]");
      const heading = section.querySelector<HTMLElement>(".services-heading");
      if (!grid || !heading) return;
      const smooth = (x: number, a: number, b: number) => {
        const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return t * t * (3 - 2 * t);
      };
      let vw = 0, vh = 0;
      let homes: { x: number; y: number }[] = [];
      const measure = () => {
        vw = section.clientWidth; vh = section.clientHeight;
        homes = cards.map(card => ({
          x: card.offsetLeft + card.offsetWidth / 2,
          y: card.offsetTop + card.offsetHeight / 2,
        }));
        const inner = section.querySelector<HTMLElement>(".services-inner")!;
        homes.forEach(home => { home.x += inner.offsetLeft; home.y += inner.offsetTop; });
      };
      const apply = (progress: number) => {
        section.dataset.entering = String(progress < 0.999);
        const orbit = smooth(progress, 0, 0.62);
        const unfold = smooth(progress, 0.5, 0.9);
        const arrive = smooth(progress, 0, 0.12);
        const cx = vw / 2, cy = vh * 0.52;
        const radius = Math.min(vw * 0.36, 560);
        const lens = 1500;
        cards.forEach((card, i) => {
          const { x: homeX, y: homeY } = homes[i];
          const angle = (i / cards.length) * Math.PI * 2 + orbit * Math.PI * 1.35 - Math.PI * 0.5;
          const depth = Math.cos(angle);
          // Helix: around the bird, tilted so the ring reads in depth, and
          // stacked a little in height so the cards wind rather than circle.
          const x = Math.sin(angle) * radius;
          const z = depth * radius * 0.85 - radius * 0.35 - (1 - arrive) * 900;
          const y = (i - (cards.length - 1) / 2) * 38 * (1 - orbit * 0.4) - depth * radius * 0.16;
          const s = lens / (lens - z);
          const size = 0.66 * s;
          const tx = mix(cx + x * s - homeX, 0, unfold);
          const ty = mix(cy + y * s - homeY, 0, unfold);
          const scale = mix(size, 1, unfold);
          const turn = mix(-Math.sin(angle) * 32, 0, unfold);
          const near = (depth + 1) / 2;
          card.style.setProperty("--hx", `${tx.toFixed(1)}px`);
          card.style.setProperty("--hy", `${ty.toFixed(1)}px`);
          card.style.setProperty("--hs", scale.toFixed(4));
          card.style.setProperty("--hry", `${turn.toFixed(2)}deg`);
          card.style.opacity = String(mix((0.28 + 0.72 * near) * arrive, 1, unfold));
          card.style.filter = unfold > 0.98 ? "" : `brightness(${mix(0.55 + 0.45 * near, 1, unfold).toFixed(3)})`;
          card.style.zIndex = String(unfold > 0.5 ? 1 : Math.round(near * 10));
        });
        heading.style.opacity = String(smooth(progress, 0.62, 0.9));
        heading.style.transform = `translateY(${((1 - smooth(progress, 0.62, 0.9)) * 24).toFixed(1)}px)`;
      };
      const mix = (a: number, b: number, t: number) => a + (b - a) * t;
      measure();
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=185%",
        pin: true,
        scrub: true,
        onUpdate: self => apply(self.progress),
        onRefresh: self => { measure(); apply(self.progress); },
      });
      apply(trigger.progress);
      return () => {
        cards.forEach(card => {
          ["--hx", "--hy", "--hs", "--hry"].forEach(v => card.style.removeProperty(v));
          card.style.opacity = card.style.filter = card.style.zIndex = "";
        });
        heading.style.opacity = heading.style.transform = "";
      };
    });
    return () => { mm.revert(); delete section.dataset.aura; delete section.dataset.entering; };
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
