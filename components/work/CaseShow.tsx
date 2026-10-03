"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Fact } from "@/content/work-gallery";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// A case study in the site's own matter, as scenes the scroll plays:
// · Fly-through — the project's screens hang in depth, alternating sides,
//   and the scroll carries the camera through them; the one in front comes
//   level and lights up with a lime edge, the rest sit back in the dark.
//   The pointer tilts the whole space. The title sits over it.
// · Facts — the figures the product states, lighting up as they arrive.
// · Ring — the phone screens on a ring that turns with the scroll.
// An app (no desktop screens) flies through its phone screens instead.
// With reduced motion the scenes are laid out at rest.
type Props = {
  locale: "tr" | "en";
  title: string;
  kicker: string;
  back: string;
  live?: { url: string; label: string; host: string };
  desktop: string[];
  phone: string[];
  facts?: Fact[];
  ringTitle: string;
  chapter: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function CaseShow({ locale, title, kicker, back, live, desktop, phone, facts, ringTitle, chapter }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const portrait = desktop.length === 0;
  const screens = portrait ? phone : desktop;
  // The ring needs enough phones to close: repeat the set up to six.
  const ring = phone.length > 1 && !portrait ? Array.from({ length: Math.max(phone.length, 6) }, (_, i) => phone[i % phone.length]) : [];

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.still = "true";
      return;
    }
    const narrow = innerWidth < 768;

    // Fly-through.
    const fly = el.querySelector<HTMLElement>("[data-fly]");
    const space = el.querySelector<HTMLElement>("[data-space]");
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-screen]"));
    const hud = el.querySelector<HTMLElement>("[data-hud]");
    if (fly && space && items.length) {
      const gap = narrow ? 1100 : 1400;
      const span = items.length - 1 + 0.25;
      const st = { t: 0, target: 0, mx: 0, my: 0, tx: 0, ty: 0 };
      let shown = -1;
      const place = () => {
        items.forEach((s, i) => {
          const z = -i * gap + st.t * gap * span;
          const side = i % 2 ? 1 : -1;
          const near = Math.max(0, Math.min(1, 1 - Math.abs(z) / gap));
          const x = side * (1 - near) * (narrow ? 14 : 22);
          const fade = z > 500 ? Math.max(0, 1 - (z - 500) / 400) : 1;
          s.style.transform = `translate3d(${x}vw, ${(1 - near) * -4}vh, ${z}px) rotateY(${side * (1 - near) * -22}deg)`;
          s.style.opacity = String(fade);
          s.style.setProperty("--near", near.toFixed(3));
        });
        space.style.transform = `rotateY(${st.mx * 6}deg) rotateX(${-st.my * 5}deg)`;
        const c = Math.min(items.length, Math.round(st.t * span) + 1);
        if (c !== shown && hud) {
          shown = c;
          hud.textContent = `${pad(c)} / ${pad(items.length)}`;
        }
      };
      ScrollTrigger.create({
        trigger: fly, start: "top top", end: "bottom bottom",
        onUpdate: (s) => { st.target = s.progress; },
      });
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        st.tx = e.clientX / innerWidth - 0.5;
        st.ty = e.clientY / innerHeight - 0.5;
      };
      addEventListener("pointermove", onMove, { passive: true });
      const tick = () => {
        st.t += (st.target - st.t) * 0.12;
        st.mx += (st.tx - st.mx) * 0.06;
        st.my += (st.ty - st.my) * 0.06;
        place();
      };
      gsap.ticker.add(tick);
      place();
      gsap.from(el.querySelectorAll("[data-rise]"), { y: 60, opacity: 0, duration: 1.3, stagger: 0.08, ease: "power4.out", delay: 0.15 });
      return () => {
        gsap.ticker.remove(tick);
        removeEventListener("pointermove", onMove);
      };
    }
  }, { scope: root });

  // Facts and the ring, in their own context so the fly-through's cleanup
  // above does not cut them short.
  useGSAP(() => {
    const el = root.current;
    if (!el || el.dataset.still === "true") return;
    el.querySelectorAll<HTMLElement>("[data-fact]").forEach((b) => {
      ScrollTrigger.create({
        trigger: b, start: "top 75%",
        onEnter: () => b.classList.add("on"), onLeaveBack: () => b.classList.remove("on"),
      });
    });
    const ringEl = el.querySelector<HTMLElement>("[data-ring]");
    const car = el.querySelector<HTMLElement>("[data-carousel]");
    if (ringEl && car) {
      gsap.fromTo(car, { rotateY: 0 }, {
        rotateY: -360, ease: "none",
        scrollTrigger: { trigger: ringEl, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
    }
  }, { scope: root });

  return (
    <div ref={root} className="fly-case" style={{ "--count": screens.length, "--ring": ring.length } as React.CSSProperties}>
      <section data-fly className="fly" data-portrait={String(portrait)} aria-label={title}>
        <div className="fly-stage">
          <div data-space className="fly-space">
            {screens.map((src, i) => (
              <div key={src} data-screen className="fly-screen">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${title} — ${i + 1}`} decoding="async" loading={i < 2 ? "eager" : "lazy"} />
              </div>
            ))}
          </div>
          <div className="fly-vignette" aria-hidden="true" />
          <div className="fly-top">
            <Link href={`/${locale}#work`} className="link-draw text-sm text-bone-dim transition-colors hover:text-bone">← {back}</Link>
            {live && (
              <a href={live.url} target="_blank" rel="noopener noreferrer" className="case-live">
                {live.label} <span aria-hidden="true">↗</span>
                <em>{live.host}</em>
              </a>
            )}
          </div>
          <div className="fly-title">
            <p data-rise className="case-kicker">{kicker}</p>
            <h1 data-rise className="font-display case-title">{title}</h1>
          </div>
          <div className="fly-hud">
            <span className="case-kicker">{chapter}</span>
            <b data-hud className="font-display">{`01 / ${pad(screens.length)}`}</b>
          </div>
        </div>
      </section>

      {facts && facts.length > 0 && (
        <section className="fly-facts" aria-label={title}>
          {facts.map((f) => (
            <div key={f.value + f.en}>
              <b data-fact className="font-display">{f.value}</b>
              <span className="case-kicker">{f[locale]}</span>
            </div>
          ))}
        </section>
      )}

      {ring.length > 0 && (
        <section data-ring className="fly-ring" aria-label={ringTitle}>
          <div className="fly-ring-stage">
            <h2 className="font-display">{ringTitle}</h2>
            <div className="fly-floor" aria-hidden="true" />
            <div data-carousel className="fly-carousel">
              {ring.map((src, i) => (
                <div key={i} className="fly-phone" style={{ "--i": i } as React.CSSProperties}>
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={i < phone.length ? `${title} — ${i + 1}` : ""} loading="lazy" decoding="async" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
