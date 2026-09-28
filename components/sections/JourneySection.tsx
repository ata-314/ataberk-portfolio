"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";
import { servicesContent } from "./Services";
import { journeyState } from "../three/scroll-state";
import { HELIX_SHARE, frontCard, helixOffset } from "../gl/helix";
import type { JourneyCard } from "../gl/cards-layer";

gsap.registerPlugin(useGSAP, ScrollTrigger);


const SERVICE_PALETTE: [string, string][] = [
  ["#8b5cf6", "#3b82f6"], ["#3b82f6", "#22d3ee"], ["#d946ef", "#8b5cf6"],
  ["#6366f1", "#14b8a6"], ["#f472b6", "#a855f7"], ["#22d3ee", "#6366f1"],
];
const WORK_PALETTE: [string, string, string][] = [
  ["#3df5c4", "#2a5bff", "[= ◇ ⌒ ◇ =]"], ["#b6ff3e", "#0fa6a0", "</ ⌁ ⌁ />"],
  ["#ff5ad1", "#6a3dff", "▷ ◯ ◁"], ["#5fd7ff", "#8b5cf6", "{ ∿ ∿ }"],
  ["#ffb23e", "#ff3e6c", "◈ ◈ ◈"], ["#7cf9ff", "#1dd3a0", "⌖ ⟡ ⌖"],
];

type Entry = JourneyCard & { description: string; href?: string };

// The journey: one pinned scene. The services and the selected work wrap
// round the bird as curved glass cards on a helix (drawn by the stage);
// scrolling descends along it, and the card at the front is named in the
// HUD panel. Past the last card the descent carries on through galaxies of
// data. Everything the cards say is also here as HTML for readers and
// search engines.
export function JourneySection({ locale }: { locale: Locale }) {
  const tr = locale === "tr";
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const [front, setFront] = useState(0);
  const [inGalaxies, setInGalaxies] = useState(false);

  const services = servicesContent[locale];
  const projects = work[locale];
  const entries: Entry[] = [
    ...services.items.map(([title, description], i) => ({
      kind: tr ? "Hizmet" : "Service",
      title,
      meta: String(i + 1).padStart(2, "0"),
      mark: "✦ ✦ ✦",
      a: SERVICE_PALETTE[i % 6][0],
      b: SERVICE_PALETTE[i % 6][1],
      description,
    })),
    ...projects.items.map((item, i) => ({
      kind: tr ? "İş" : "Work",
      title: item.title,
      meta: `${item.category} · ${item.year}`,
      mark: WORK_PALETTE[i % 6][2],
      a: WORK_PALETTE[i % 6][0],
      b: WORK_PALETTE[i % 6][1],
      description: item.idea,
      href: `/${locale}/work/${item.slug}`,
    })),
  ];
  const cardsJson = JSON.stringify(entries.map(({ kind, title, meta, mark, a, b }) => ({ kind, title, meta, mark, a, b })));

  useGSAP(() => {
    const section = root.current;
    if (!section) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let last = -1;
    let lastGalaxies = false;
    const apply = (progress: number) => {
      journeyState.progress = progress;
      const offset = helixOffset(Math.min(1, progress / HELIX_SHARE), entries.length);
      const f = frontCard(offset, entries.length);
      if (f !== last) { last = f; setFront(f); }
      const g = progress > HELIX_SHARE + 0.02;
      if (g !== lastGalaxies) { lastGalaxies = g; setInGalaxies(g); }
    };
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${entries.length * 90 + 500}%`,
      pin: true,
      scrub: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
      onToggle: (self) => { journeyState.active = self.isActive ? 1 : 0; section.dataset.active = String(self.isActive); },
    });
    apply(trigger.progress);
    journeyState.active = trigger.isActive ? 1 : 0;
    const settle = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(settle);
      journeyState.active = 0;
      journeyState.progress = 0;
    };
  }, { scope: root, dependencies: [entries.length] });

  // A click on a card in the stage: work cards dive into their case study.
  useEffect(() => {
    const onPick = (event: Event) => {
      const index = (event as CustomEvent<number>).detail;
      const entry = entries[index];
      if (!entry?.href) return;
      const flash = document.createElement("div");
      flash.className = "journey-dive";
      document.body.appendChild(flash);
      router.prefetch(entry.href);
      gsap.fromTo(flash, { opacity: 0 }, {
        opacity: 1, duration: 0.55, ease: "power2.in",
        onComplete: () => {
          router.push(entry.href!);
          gsap.to(flash, { opacity: 0, duration: 0.7, delay: 0.4, onComplete: () => flash.remove() });
        },
      });
    };
    addEventListener("journey-card", onPick);
    return () => removeEventListener("journey-card", onPick);
  });

  const current = entries[front];

  return (
    <section ref={root} id="journey" className="journey-section relative z-20 h-svh">
      <script type="application/json" data-journey-cards dangerouslySetInnerHTML={{ __html: cardsJson }} />
      <div className="journey-heading hero-copy">
        <p className="hud-label">{tr ? "Yolculuk" : "Journey"}</p>
        <h2 className="font-display mt-2 leading-[0.92]" style={{ fontSize: "clamp(1.8rem, 3.4vw, 3.4rem)" }}>
          {inGalaxies ? (tr ? "Veri galaksileri" : "Data galaxies") : tr ? "Fikirden deneyime" : "From idea to experience"}
        </h2>
      </div>
      {current && !inGalaxies && (
        <div key={front} className="journey-panel hero-copy">
          <p className="hud-label">{String(front + 1).padStart(2, "0")} / {entries.length} · {current.kind}</p>
          <h3 className="hud-glitch font-display mt-3 text-2xl leading-tight md:text-3xl" data-text={current.title} data-glitching="true">
            {current.title}
          </h3>
          <p className="mt-3 font-mono text-[11.5px] leading-[1.8] tracking-[0.06em] text-bone/80 uppercase">{current.description}</p>
          {current.href ? (
            <a href={current.href} onClick={(e) => { e.preventDefault(); dispatchEvent(new CustomEvent("journey-card", { detail: front })); }} className="hud-link mt-4 inline-block text-[#a796ff]">
              {tr ? "-> Projeyi incele" : "-> Open case study"}
            </a>
          ) : (
            <a href="#contact" className="hud-link mt-4 inline-block text-[#a796ff]">{tr ? "-> Bu konuda konuşalım" : "-> Let's talk about it"}</a>
          )}
        </div>
      )}
      <ol className="sr-only">
        {entries.map((entry) => (
          <li key={entry.title}>
            {entry.href ? <a href={entry.href}>{entry.title}</a> : entry.title} — {entry.description}
          </li>
        ))}
      </ol>
    </section>
  );
}
