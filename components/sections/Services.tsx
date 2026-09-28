"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import type { Locale } from "@/lib/i18n";

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

// Native SVG artwork stays sharp, small and decorative. CSS animates the
// individual layers, so these previews need no additional canvas or runtime.
function ServiceGraphic({ kind }: { kind: number }) {
  return (
    <svg viewBox="0 0 480 240" fill="none" aria-hidden="true" focusable="false" className={`service-art service-art-${kind}`}>
      {kind === 0 && <>
        <g className="art-float"><rect x="61" y="25" width="358" height="204" rx="12" className="art-panel" />
          <path d="M61 53H419" className="art-line" /><circle cx="77" cy="39" r="2" fill="currentColor" /><circle cx="86" cy="39" r="2" fill="currentColor" /><circle cx="95" cy="39" r="2" fill="currentColor" />
          <rect x="80" y="74" width="54" height="5" rx="2" className="art-muted" /><path d="M80 107H215M80 120H191" stroke="currentColor" strokeWidth="9" />
          <path d="M80 143H180M80 152H161" className="art-line" /><rect x="80" y="173" width="66" height="18" rx="9" className="art-accent" />
          <g className="art-orbit" style={{ transformOrigin: "320px 133px" }}><ellipse cx="320" cy="133" rx="60" ry="60" className="art-line" /><ellipse cx="320" cy="133" rx="28" ry="60" className="art-line" /><ellipse cx="320" cy="133" rx="60" ry="22" className="art-line" /><path d="M260 133H380M320 73V193" className="art-line" /><circle cx="360" cy="90" r="5" className="art-accent" /></g>
        </g></>}
      {kind === 1 && <>
        <g transform="rotate(-9 213 125)"><rect x="152" y="19" width="112" height="207" rx="22" className="art-panel" /><rect x="187" y="28" width="42" height="6" rx="3" className="art-muted" /><rect x="165" y="55" width="86" height="69" rx="10" className="art-muted" /><path d="M177 103L193 86L209 92L237 68" className="art-signal" /><path d="M166 145H237M166 157H220M166 188H237" className="art-line" /></g>
        <g className="art-float"><rect x="240" y="82" width="105" height="126" rx="17" className="art-panel" /><circle cx="292" cy="122" r="21" className="art-line" /><path d="M282 122L290 130L304 114" className="art-signal" /><path d="M262 166H323M273 179H312" className="art-line" /></g>
      </>}
      {kind === 2 && <>
        <path d="M107 120H205Q222 120 222 103V68H345M222 120V173H345" className="art-line" />
        <path d="M107 120H205Q222 120 222 103V68H345M222 120V173H345" className="art-flow" />
        {[[80,93],[198,93],[325,41],[325,146]].map(([x,y],i) => <g key={i}><rect x={x} y={y} width="54" height="54" rx="15" className="art-panel" /><path d={`M${x+18} ${y+27}h18M${x+27} ${y+18}v18`} className={i === 1 ? "art-signal" : "art-line"} /></g>)}
        <circle cx="222" cy="120" r="7" className="art-accent art-pulse" />
      </>}
      {kind === 3 && <>
        <g className="art-orbit" style={{ transformOrigin: "240px 120px" }}><ellipse cx="240" cy="120" rx="127" ry="76" className="art-line" /><ellipse cx="240" cy="120" rx="90" ry="100" transform="rotate(50 240 120)" className="art-line" /><circle cx="116" cy="104" r="7" className="art-accent" /><circle cx="347" cy="160" r="5" fill="currentColor" /><circle cx="275" cy="40" r="5" fill="currentColor" /></g>
        <rect x="205" y="85" width="70" height="70" rx="22" className="art-panel" /><path d="M223 111V128M240 103V137M257 111V128" className="art-signal art-pulse" />
      </>}
      {kind === 4 && <>
        <rect x="73" y="28" width="334" height="161" rx="12" className="art-panel" /><g className="art-landscape"><circle cx="298" cy="83" r="29" className="art-muted" /><path d="M87 174L168 78L233 164L282 108L393 174Z" className="art-muted" /><path d="M87 174L168 78L233 164L282 108L393 174" className="art-line" /></g>
        <circle cx="240" cy="108" r="25" className="art-panel" /><path d="M234 97L251 108L234 119Z" fill="currentColor" />
        <path d="M81 213H400" className="art-line" />{[85,140,195,250,305,360].map(x => <rect key={x} x={x} y="204" width="43" height="18" rx="3" className="art-muted" />)}<path d="M100 199V228" className="art-signal art-playhead" />
      </>}
      {kind === 5 && <>
        <g transform="rotate(-8 191 116)"><rect x="89" y="37" width="203" height="158" rx="8" className="art-panel" /><path d="M119 165L165 66H190L232 165M140 124H213" stroke="currentColor" strokeWidth="12" /><path d="M110 177H269" className="art-line" /></g>
        <g className="art-float"><rect x="276" y="87" width="102" height="126" rx="9" className="art-panel" /><rect x="288" y="99" width="78" height="53" rx="4" className="art-accent" /><circle cx="301" cy="176" r="10" fill="#e5e1d6" /><circle cx="327" cy="176" r="10" fill="#7d9690" /><circle cx="353" cy="176" r="10" fill="#434a46" /></g>
      </>}
    </svg>
  );
}

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
              <span className="service-beam" aria-hidden="true" />
              <div className="service-visual"><span className="service-halo" aria-hidden="true" /><ServiceGraphic kind={index} /></div>
              <div className="service-copy"><h3>{title}</h3><p>{description}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
