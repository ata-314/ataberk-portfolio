"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

const copy = {
  tr: {
    ask: "Ne arıyorsunuz?",
    items: ["Web siteleri", "Uygulamalar", "AI agent'lar", "Otomasyon", "AI film & video"],
    prompt: "Bana bir şey sor…",
  },
  en: {
    ask: "What are you looking for?",
    items: ["Websites", "Apps", "AI agents", "Automation", "AI film & video"],
    prompt: "Ask me anything…",
  },
};

// Bottom-left HUD, desktop only: a short "what are you looking for" index
// into the services and a prompt pill that opens the contact scene. It
// arrives once the opening has handed over to the journey and leaves after
// the work scene.
export function HudDock({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const services = document.querySelector("#services");
      // Held from services through the work helix; later scenes set their
      // own copy along the left edge.
      const after = document.querySelector("#work")?.closest("[data-scene]")?.nextElementSibling;
      const past = services ? services.getBoundingClientRect().top < innerHeight * 0.6 : false;
      const atEnd = after ? after.getBoundingClientRect().top < innerHeight * 0.7 : false;
      setShown(past && !atEnd);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    addEventListener("scroll", request, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", request); };
  }, []);

  return (
    <aside
      aria-label={t.ask}
      data-shown={shown}
      className="hud-dock pointer-events-none fixed bottom-8 left-8 z-[90] hidden flex-col gap-5 lg:flex"
    >
      <div>
        <p className="hud-label !text-[11px] !text-white/85">{t.ask}</p>
        <ul className="mt-3 flex flex-col gap-2">
          {t.items.map((item) => (
            <li key={item}>
              <a href="#services" className="hud-dock-link pointer-events-auto">
                <span aria-hidden>-&gt; </span>
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <a href="#contact" className="hud-pill hud-link pointer-events-auto w-fit px-5 py-2.5 !text-[11px] !text-white/60">
        {t.prompt}
      </a>
    </aside>
  );
}
