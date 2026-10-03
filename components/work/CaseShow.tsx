"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Case study scenes in the manner of a product page. Each scene is a tall
// runway with a sticky stage, and the scroll plays it:
// · Laptop — the lid opens and the machine settles in, then the site's own
//   chapters scroll by on its screen, holding on each.
// · Statement — the project's idea, its words lighting up in turn.
// · Phones — the phones rise and fan out; the centre one steps through
//   the rest of the screens when there are more than three.
// With reduced motion the scenes are laid out at rest, without runways.
type Props = {
  title: string;
  desktop: string[];
  phone: string[];
  statement: string;
  host?: string;
};

export function CaseShow({ title, desktop, phone, statement, host }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.still = "true";
      return;
    }
    const scrub = 0.6;

    const mac = el.querySelector<HTMLElement>("[data-mac]");
    if (mac) {
      const strip = mac.querySelector("[data-strip]");
      const n = desktop.length;
      // Closed, seen from a little above (the lid's back toward us), it
      // opens as it comes into view and the camera comes down level with
      // the screen; it is fully open as the stage pins.
      gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: mac, start: "top 95%", end: "top top", scrub },
      })
        .fromTo(mac.querySelector("[data-lid]"), { rotateX: 86 }, { rotateX: 0, duration: 1, ease: "power1.inOut" }, 0)
        .fromTo(mac.querySelector("[data-device]"), { scale: 0.82, rotateX: 26 }, { scale: 1, rotateX: 0, duration: 1, ease: "power1.inOut" }, 0)
        .fromTo(mac.querySelector("[data-glow]"), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.5)
        .fromTo(mac.querySelector("[data-screen-on]"), { opacity: 1 }, { opacity: 0, duration: 0.35 }, 0.6);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: mac, start: "top top", end: "bottom bottom", scrub },
      });
      tl.to({}, { duration: 0.4 });
      // The chapters: a slide to each, then a hold.
      for (let i = 1; i < n; i++) {
        tl.to(strip, { yPercent: (-100 * i) / n, duration: 0.7, ease: "power2.inOut" }, 0.4 + (i - 1) * 1.2);
        tl.set(mac.querySelectorAll("[data-dot]"), { attr: { "data-on": (j: number) => String(j === i) } }, 0.4 + (i - 1) * 1.2 + 0.35);
      }
      tl.to({}, { duration: 0.6 });
    }

    const words = el.querySelectorAll("[data-word]");
    const statementEl = el.querySelector("[data-statement]");
    if (words.length && statementEl) {
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: statementEl, start: "top 75%", end: "bottom 45%", scrub },
      });
    }

    const phones = el.querySelector<HTMLElement>("[data-phones]");
    if (phones) {
      const items = phones.querySelectorAll<HTMLElement>("[data-phone]");
      const centre = Math.floor(items.length / 2);
      const narrow = innerWidth < 768;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: phones, start: "top top", end: "bottom bottom", scrub },
      });
      items.forEach((p, i) => {
        const off = i - centre;
        tl.fromTo(p, { yPercent: 70 + Math.abs(off) * 25, opacity: 0, rotateY: 0, rotateZ: 0, xPercent: -off * 40 },
          { yPercent: 0, opacity: 1, xPercent: 0, duration: 1, ease: "power3.out" }, Math.abs(off) * 0.15);
        if (off) {
          tl.to(p, {
            xPercent: off * (narrow ? 8 : 14), rotateY: -off * 16, rotateZ: off * 3, yPercent: Math.abs(off) * 6,
            duration: 0.9, ease: "power2.inOut",
          }, 1.2);
        } else {
          tl.to(p, { scale: 1.06, duration: 0.9, ease: "power2.inOut" }, 1.2);
        }
      });
      // More screens than phones: the centre one steps through the rest.
      const extra = phones.querySelectorAll<HTMLElement>("[data-extra]");
      extra.forEach((img, i) => {
        tl.fromTo(img, { opacity: 0, yPercent: 6 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: "power2.out" }, 2.3 + i * 0.9);
      });
      tl.to({}, { duration: 0.6 });
    }
  }, { scope: root });

  // Phones on stage: up to three; the rest play inside the centre one.
  const shown = phone.length > 3 ? [phone[1], phone[0], phone[3]] : phone;
  const extra = phone.length > 3 ? phone.filter((_, i) => i !== 0 && i !== 1 && i !== 3) : [];

  return (
    <div ref={root} className="show">
      {desktop.length > 0 && (
        <section data-mac className="show-mac" style={{ "--chapters": desktop.length } as React.CSSProperties} aria-label={title}>
          <div className="show-stage show-stage-mac">
            <div data-glow className="show-glow" aria-hidden="true" />
            <div data-device className="mac">
              <div data-lid className="mac-lid">
                <div className="mac-back" aria-hidden="true" />
                <div className="mac-bezel">
                  <span className="mac-camera" aria-hidden="true" />
                  <div className="mac-screen">
                    <div data-strip className="mac-strip">
                      {desktop.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={src} src={src} alt={`${title} — ${i + 1}`} decoding="async" loading={i ? "lazy" : "eager"} />
                      ))}
                    </div>
                    <div data-screen-on className="mac-off" aria-hidden="true" />
                    <div className="mac-sheen" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <div className="mac-base" aria-hidden="true"><span /></div>
            </div>
            <div className="show-meta">
              {host && <span className="show-host">{host}</span>}
              {desktop.length > 1 && (
                <span className="show-dots" aria-hidden="true">
                  {desktop.map((src, i) => <i key={src} data-dot data-on={String(i === 0)} />)}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      <section data-statement className="show-statement">
        <p className="font-display">
          {statement.split(" ").map((w, i) => (
            <span key={i} data-word>{w} </span>
          ))}
        </p>
      </section>

      {shown.length > 0 && (
        <section data-phones className="show-phones" aria-label={title}>
          <div className="show-stage">
            <div className="phones-row">
              {shown.map((src, i) => (
                <div key={src} data-phone className="iphone" data-centre={String(i === Math.floor(shown.length / 2))}>
                  <div className="iphone-screen">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${title} — ${i + 1}`} loading="lazy" decoding="async" />
                    {i === Math.floor(shown.length / 2) && extra.map((x) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={x} data-extra src={x} alt="" className="iphone-extra" loading="lazy" decoding="async" />
                    ))}
                    <span className="iphone-island" aria-hidden="true" />
                    <span className="iphone-sheen" aria-hidden="true" />
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
