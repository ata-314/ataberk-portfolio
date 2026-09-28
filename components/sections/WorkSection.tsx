"use client";

import { useRef, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";
import "./work.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Each project's card light: two hues and a glyph mark for the header line.
const PALETTES: [string, string, string][] = [
  ["#3df5c4", "#2a5bff", "[= ◇ ⌒ ◇ =]"],
  ["#b6ff3e", "#0fa6a0", "</ ⌁ ⌁ />"],
  ["#ff5ad1", "#6a3dff", "▷ ◯ ◁"],
  ["#5fd7ff", "#8b5cf6", "{ ∿ ∿ }"],
  ["#ffb23e", "#ff3e6c", "◈ ◈ ◈"],
  ["#7cf9ff", "#1dd3a0", "⌖ ⟡ ⌖"],
];

// Galaxies · Work. Desktop: the section pins and the project cards travel a
// vertical helix around the bird at the centre of the screen — the card at
// the front of the turn is large and lit, its title glitching in; the rest
// recede into the dark. Clicking a card dives into it: the card grows to
// fill the screen, then the case study opens. Phones get a stacked list of
// the same cards.
export function WorkSection({ locale }: { locale: Locale }) {
  const t = work[locale];
  const tr = locale === "tr";
  const root = useRef<HTMLElement>(null);
  const router = useRouter();

  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>(".work-card", section);
      const titles = cards.map((card) => card.querySelector<HTMLElement>(".hud-glitch"));
      let front = -1;
      const n = cards.length;
      const apply = (progress: number) => {
        const vw = innerWidth, vh = innerHeight;
        const radius = Math.min(vw * 0.3, 440);
        const lens = 1400;
        // Scroll turns the helix: one card comes round to the front per step.
        const turn = progress * (n - 1);
        let best = 0, bestZ = -Infinity;
        cards.forEach((card, i) => {
          const rel = i - turn;
          const angle = rel * 1.05;
          const z = Math.cos(angle) * radius - radius * 0.2;
          const x = Math.sin(angle) * radius * 1.25;
          const y = rel * 150;
          const s = lens / (lens - z);
          const visible = Math.max(0, 1 - Math.abs(rel) / 2.4);
          const near = (Math.cos(angle) + 1) / 2;
          card.style.transform = `translate(-50%, -50%) translate3d(${(vw / 2 + x * s).toFixed(1)}px, ${(vh * 0.5 + y * s).toFixed(1)}px, 0) scale(${(0.62 * s).toFixed(4)}) rotateY(${(-Math.sin(angle) * 38).toFixed(2)}deg)`;
          card.style.opacity = (visible * (0.25 + 0.75 * near)).toFixed(3);
          card.style.filter = `brightness(${(0.45 + 0.55 * near).toFixed(3)})`;
          card.style.zIndex = String(Math.round(near * 20));
          card.style.pointerEvents = visible > 0.3 && near > 0.8 ? "auto" : "none";
          if (visible > 0 && z > bestZ) { bestZ = z; best = i; }
        });
        if (best !== front) {
          front = best;
          const title = titles[best];
          if (title) {
            title.dataset.glitching = "false";
            void title.offsetWidth;
            title.dataset.glitching = "true";
          }
          section.dataset.front = String(best);
        }
      };
      section.dataset.helix = "true";
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: `+=${n * 70}%`,
        pin: true,
        scrub: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });
      apply(trigger.progress);
      return () => {
        delete section.dataset.helix;
        cards.forEach((card) => {
          card.style.transform = card.style.opacity = card.style.filter = card.style.zIndex = card.style.pointerEvents = "";
        });
      };
    });
    return () => mm.revert();
  }, { scope: root });

  // Dive: the clicked card grows to fill the screen before the case opens.
  const dive = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    const card = event.currentTarget;
    const box = card.getBoundingClientRect();
    const ghost = card.cloneNode(true) as HTMLElement;
    ghost.classList.add("work-card-dive");
    Object.assign(ghost.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, transform: "none", opacity: "1", filter: "none" });
    document.body.appendChild(ghost);
    router.prefetch(href);
    gsap.to(ghost, {
      left: 0, top: 0, width: innerWidth, height: innerHeight, borderRadius: 0, duration: 0.85, ease: "expo.inOut",
      onComplete: () => {
        router.push(href);
        gsap.to(ghost, { opacity: 0, duration: 0.6, delay: 0.35, onComplete: () => ghost.remove() });
      },
    });
  };

  return (
    <section ref={root} id="work" className="work-section relative z-20 px-5 md:px-10">
      <div className="work-heading mx-auto max-w-[88rem]">
        <p className="hud-label">{tr ? "Galaksiler · seçili işler" : "Galaxies · selected work"}</p>
        <h2 className="font-display mt-3 leading-[0.92]" style={{ fontSize: "clamp(2.6rem, 6vw, 6rem)" }}>
          {t.heading}
        </h2>
      </div>
      <ul className="work-cards">
        {t.items.map((item, index) => {
          const [a, b, mark] = PALETTES[index % PALETTES.length];
          const href = `/${locale}/work/${item.slug}`;
          return (
            <li key={item.slug} className="work-card-slot">
              <a
                href={href}
                onClick={(event) => dive(event, href)}
                data-cursor="view"
                className="work-card"
                style={{ ["--a" as string]: a, ["--b" as string]: b }}
              >
                <span className="work-card-art" aria-hidden />
                <span className="work-card-body">
                  <span className="work-card-mark" aria-hidden>{mark}</span>
                  <span className="hud-glitch font-display work-card-title" data-text={item.title}>
                    {item.title}
                  </span>
                  <span className="work-card-meta">
                    {item.category} · {item.year}
                  </span>
                  <span className="work-card-idea">{item.idea}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
