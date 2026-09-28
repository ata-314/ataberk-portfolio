"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import type { Locale } from "@/lib/i18n";
import { work } from "@/content/work";
import { servicesContent } from "../sections/Services";
import type { HelixCard } from "./CardHelix";
import { exp, frontIndex } from "./state";

const Experience = dynamic(() => import("./Experience"), { ssr: false });

const SERVICE_PALETTE: [string, string][] = [
  ["#8b5cf6", "#3b82f6"], ["#3b82f6", "#22d3ee"], ["#d946ef", "#8b5cf6"],
  ["#6366f1", "#14b8a6"], ["#f472b6", "#a855f7"], ["#22d3ee", "#6366f1"],
];
const WORK_PALETTE: [string, string, string][] = [
  ["#3df5c4", "#2a5bff", "[= ◇ ⌒ ◇ =]"], ["#b6ff3e", "#0fa6a0", "</ ⌁ ⌁ />"],
  ["#ff5ad1", "#6a3dff", "▷ ◯ ◁"], ["#5fd7ff", "#8b5cf6", "{ ∿ ∿ }"],
  ["#ffb23e", "#ff3e6c", "◈ ◈ ◈"], ["#7cf9ff", "#1dd3a0", "⌖ ⟡ ⌖"],
];

type Entry = HelixCard & { description: string };

// The home page's journey: the 3D world behind, and the HTML stations that
// drive it — the opening, the card helix (with the HUD panel naming the
// card in front), and the galaxies.
export function HomeExperience({ locale, tagline, sceneNames }: { locale: Locale; tagline: string; sceneNames: { sea: string; sky: string; galaxies: string } }) {
  const tr = locale === "tr";
  const router = useRouter();
  const services = servicesContent[locale];
  const projects = work[locale];
  const [entries] = useState<Entry[]>(() => [
    ...services.items.map(([title, description], i) => ({
      kind: tr ? "Hizmet" : "Service", title, meta: String(i + 1).padStart(2, "0"), mark: "✦ ✦ ✦",
      a: SERVICE_PALETTE[i % 6][0], b: SERVICE_PALETTE[i % 6][1], description,
    })),
    ...projects.items.map((item, i) => ({
      kind: tr ? "İş" : "Work", title: item.title, meta: `${item.category} · ${item.year}`, mark: WORK_PALETTE[i % 6][2],
      a: WORK_PALETTE[i % 6][0], b: WORK_PALETTE[i % 6][1], description: item.idea, href: `/${locale}/work/${item.slug}`,
    })),
  ]);
  const [front, setFront] = useState(0);

  // Site chrome waits for this flag (set by the old stage before).
  useEffect(() => { document.documentElement.dataset.stageIntro = "done"; document.documentElement.dataset.stageSettled = "true"; }, []);

  useEffect(() => {
    let raf = 0, last = -1;
    const tick = () => {
      const f = frontIndex(exp.helix, entries.length);
      if (f !== last) { last = f; setFront(f); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [entries.length]);

  const open = useCallback((index: number) => {
    const entry = entries[index];
    if (!entry?.href) {
      document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
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
  }, [entries, router]);

  const current = entries[front];
  const hint = tr ? "Kaydır" : "Scroll";

  return (
    <>
      <Experience cards={entries} title="ATABERK" subtitle="CREATIVE TECHNOLOGIST & DESIGNER" onOpen={open} />

      <section data-station="intro" data-scene={sceneNames.sea} className="relative z-10 h-[170svh]">
        <div className="sticky top-0 flex h-svh flex-col justify-end px-5 pb-10 md:px-10 md:pb-12">
          <div className="hero-copy grid gap-6 md:grid-cols-12 md:items-end">
            <p className="max-w-[34ch] font-mono text-[12px] leading-[1.8] tracking-[0.08em] text-bone/85 uppercase md:col-span-5">{tagline}</p>
            <p className="hud-label md:col-span-3 md:col-start-10 md:text-right">{hint} ↓</p>
          </div>
        </div>
      </section>

      <section data-station="helix" data-scene={sceneNames.sky} className="relative z-10" style={{ height: `${entries.length * 55 + 100}svh` }}>
        <div className="sticky top-0 h-svh">
          <div className="journey-heading hero-copy">
            <p className="hud-label">{tr ? "Hizmetler & seçili işler" : "Services & selected work"}</p>
            <h2 className="font-display mt-2 leading-[0.92]" style={{ fontSize: "clamp(1.8rem, 3.4vw, 3.4rem)" }}>
              {tr ? "Fikirden deneyime" : "From idea to experience"}
            </h2>
          </div>
          {current && (
            <div key={front} className="journey-panel hero-copy">
              <p className="hud-label">{String(front + 1).padStart(2, "0")} / {entries.length} · {current.kind}</p>
              <h3 className="hud-glitch font-display mt-3 text-2xl leading-tight md:text-3xl" data-text={current.title} data-glitching="true">
                {current.title}
              </h3>
              <p className="mt-3 font-mono text-[11.5px] leading-[1.8] tracking-[0.06em] text-bone/80 uppercase">{current.description}</p>
              <button type="button" onClick={() => open(front)} className="hud-link pointer-events-auto mt-4 inline-block text-[#a796ff]">
                {current.href ? (tr ? "-> Projeyi incele" : "-> Open case study") : tr ? "-> Bu konuda konuşalım" : "-> Let's talk about it"}
              </button>
            </div>
          )}
        </div>
        <ol className="sr-only">
          {entries.map((entry) => (
            <li key={entry.title}>{entry.href ? <a href={entry.href}>{entry.title}</a> : entry.title} — {entry.description}</li>
          ))}
        </ol>
      </section>

      <section data-station="galaxy" data-scene={sceneNames.galaxies} className="relative z-10 h-[260svh]">
        <div className="sticky top-0 flex h-svh items-end px-5 pb-12 md:px-10">
          <div className="hero-copy max-w-xl">
            <p className="hud-label">{tr ? "Derinlik" : "Depth"}</p>
            <h2 className="font-display mt-2 leading-[0.92]" style={{ fontSize: "clamp(2rem, 4.6vw, 4.6rem)" }}>
              {tr ? "Veri galaksileri" : "Data galaxies"}
            </h2>
            <p className="mt-4 font-mono text-[12px] leading-[1.8] tracking-[0.06em] text-bone/75 uppercase">
              {tr ? "Her proje bir sistem; her sistem kendi yörüngesinde dönen verilerden oluşur." : "Every project is a system; every system is data turning in its own orbit."}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
