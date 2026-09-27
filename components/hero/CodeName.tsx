"use client";

import { useEffect, useRef } from "react";
import { scrollState } from "../three/scroll-state";

// Dense glyphs carry the letterforms; a few light ones keep it reading as code.
const CHARSET = "01#$%&@0189<>{}[]/\\*+=?ABDEHKMNRSWX";
const BONE = "255, 255, 250";
const LIME = "200, 255, 62";
// Room around the name for glyphs the pointer scatters.
const PAD = 160;
// Extra headroom above the name for glyphs that disperse upward on scroll.
const PAD_TOP = 440;
// Entrance: each glyph surfaces from inside the page — rising a little from
// below and swelling from a pinpoint — behind a front that opens at the
// centre of the name. SURFACE is one glyph's rise time in seconds.
const SURFACE = 0.95;

// Cheap stable hash → [0, 1).
const hash = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Glyph = {
  hx: number; hy: number; // home (canvas CSS px)
  x: number; y: number;
  vx: number; vy: number;
  col: number; row: number;
  cover: number; seed: number;
  delay: number; // entrance start, seconds after assembly begins
};

// The display name as a field of code particles. Every covered cell of the
// typeset letterforms owns one glyph with position, velocity and a home.
// Springs hold the name together; the pointer pushes glyphs away and drags
// them along its motion, a click bursts them, and displaced glyphs heat up
// (lime, faster mutation) until they settle back. On entrance the glyphs
// surface out of the page after the field has landed. The real text stays in the DOM
// (transparent once drawn) for layout, a11y and no-JS.
export function CodeName({
  words,
  label,
  className,
  fill = false,
}: {
  words: string[];
  label?: string;
  className?: string;
  // Scale the name to span its container exactly, instead of only shrinking.
  fill?: boolean;
}) {
  const root = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const heading = root.current;
    const canvas = canvasRef.current;
    if (!heading || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    const identity = heading.closest<HTMLElement>("[data-hero-identity]");
    const textEls = Array.from(heading.querySelectorAll<HTMLSpanElement>("[data-code-text]"));

    let glyphs: Glyph[] = [];
    let cell = 8;
    let dpr = 1;
    let doneSeen = -1;
    // Scroll dispersal: as the bird forms, the name breaks into its code
    // glyphs, which drift up and away and fade. Fully reversible.
    let scatter = 0;
    let nameCx = 0;
    let nameCy = 0;
    let rectLeft = 0;
    let rectTop = 0;
    let atlasBone: HTMLCanvasElement | null = null;
    let atlasLime: HTMLCanvasElement | null = null;
    let frame = 0;
    let last = 0;
    let visible = true;
    let assembleStart = -1;
    // Raw cursor (x, y) and a damped follower (sx, sy) with its velocity:
    // the glyphs only ever feel the follower, so motion stays liquid.
    const pointer = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, vx: 0, vy: 0, active: false, armed: false };

    // The glyphs use the site's code mono (next/font exposes its family on body).
    const codeFont = `${getComputedStyle(document.body).getPropertyValue("--font-jetbrains").trim() || "ui-monospace"}, ui-monospace, monospace`;
    const makeAtlas = (rgb: string) => {
      const size = Math.ceil(cell * dpr);
      const atlas = document.createElement("canvas");
      atlas.width = size * CHARSET.length;
      atlas.height = size;
      const a = atlas.getContext("2d")!;
      a.fillStyle = `rgb(${rgb})`;
      a.font = `800 ${Math.round(size * 1.1)}px ${codeFont}`;
      a.textAlign = "center";
      a.textBaseline = "middle";
      for (let i = 0; i < CHARSET.length; i++) a.fillText(CHARSET[i], i * size + size / 2, size / 2 + size * 0.04);
      return atlas;
    };

    // Keep the name on one line at any width: start from the CSS size and
    // scale down only when the typeset line would overflow its block.
    const fit = () => {
      heading.style.fontSize = "";
      const container = heading.parentElement ?? identity;
      const avail = fill
        ? (container?.clientWidth ?? innerWidth)
        : (identity?.clientWidth ?? innerWidth) * 0.88;
      const natural = heading.querySelector<HTMLElement>("[data-code-text]")?.offsetWidth ?? heading.scrollWidth;
      if (fill || natural > avail) {
        const size = parseFloat(getComputedStyle(heading).fontSize);
        heading.style.fontSize = `${Math.floor(size * (avail / natural) * 100) / 100}px`;
      }
    };

    const build = () => {
      fit();
      const style = getComputedStyle(heading);
      const fontSize = parseFloat(style.fontSize);
      cell = Math.max(3, fontSize / 34);
      dpr = Math.min(devicePixelRatio || 1, 2);
      atlasBone = makeAtlas(BONE);
      atlasLime = makeAtlas(LIME);
      const font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      const box = heading.getBoundingClientRect();
      const w = Math.ceil(box.width + PAD * 2);
      const h = Math.ceil(box.height + PAD_TOP + PAD);
      nameCx = w / 2;
      nameCy = PAD_TOP + box.height / 2;
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.style.left = `${-PAD}px`;
      canvas.style.top = `${-PAD_TOP}px`;

      // Rasterize every character at 1/cell scale: anti-aliasing yields
      // per-cell coverage. x comes from DOM Ranges (exact tracking/kerning),
      // the baseline from a zero-size inline-block marker per word.
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const mask = document.createElement("canvas");
      mask.width = cols;
      mask.height = rows;
      const m = mask.getContext("2d", { willReadFrequently: true })!;
      m.scale(1 / cell, 1 / cell);
      m.font = font;
      m.fillStyle = "#fff";
      const range = document.createRange();
      for (const el of textEls) {
        const marker = document.createElement("span");
        marker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
        el.appendChild(marker);
        const baseline = marker.getBoundingClientRect().top - box.top + PAD_TOP;
        marker.remove();
        const node = el.firstChild;
        const text = node?.textContent ?? "";
        for (let c = 0; node && c < text.length; c++) {
          range.setStart(node, c);
          range.setEnd(node, c + 1);
          const r = range.getBoundingClientRect();
          m.fillText(text[c], r.left - box.left + PAD, baseline);
        }
      }
      const data = m.getImageData(0, 0, cols, rows).data;
      const next: Glyph[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cover = data[(row * cols + col) * 4 + 3] / 255;
          if (cover < 0.3) continue;
          const hx = col * cell;
          const hy = row * cell;
          const seed = hash(col, row);
          // The front opens at the name's centre and warps with a slow
          // wave, so letters surface in an organic order, not left to right.
          const fromCentre = Math.abs(hx - w / 2) / (w / 2);
          const warp = 0.14 * Math.sin(col * 0.19 + 1.3) + 0.08 * Math.sin(row * 0.41 + col * 0.07);
          const delay = Math.max(0, fromCentre * 0.75 + warp + seed * 0.22);
          next.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, col, row, cover, seed, delay });
        }
      }
      glyphs = next;
    };

    const step = (now: number, dt: number) => {
      if (pointer.active) {
        if (!pointer.armed) {
          pointer.armed = true;
          pointer.sx = pointer.x;
          pointer.sy = pointer.y;
        }
        const follow = 1 - Math.exp(-12 * dt);
        const nx = pointer.sx + (pointer.x - pointer.sx) * follow;
        const ny = pointer.sy + (pointer.y - pointer.sy) * follow;
        const blend = 1 - Math.exp(-10 * dt);
        pointer.vx += ((nx - pointer.sx) / dt - pointer.vx) * blend;
        pointer.vy += ((ny - pointer.sy) / dt - pointer.vy) * blend;
        pointer.sx = nx;
        pointer.sy = ny;
      } else {
        pointer.vx *= Math.exp(-6 * dt);
        pointer.vy *= Math.exp(-6 * dt);
      }
      const mx = pointer.sx - rectLeft;
      const my = pointer.sy - rectTop;
      const radius = Math.max(90, cell * 20);
      const t = now / 1000;
      for (const g of glyphs) {
        // Soft spring and light damping: displaced glyphs drift home like
        // matter in water rather than snapping back.
        const k = 30;
        g.vx += (g.hx - g.x) * k * dt;
        g.vy += (g.hy - g.y) * k * dt;
        if (pointer.active) {
          const dx = g.x - mx;
          const dy = g.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < radius * radius) {
            const d = Math.sqrt(d2) + 0.001;
            // Smoothstep falloff: no hard edge where the force switches on.
            const q = 1 - d / radius;
            const falloff = q * q * (3 - 2 * q);
            // Seeded strength and a sideways swirl break the clean ring, so
            // the code parts like disturbed particles; the cursor's own
            // motion carries glyphs along in its wake.
            const push = falloff * 2600 * (0.55 + g.seed * 0.9);
            const swirl = (g.seed - 0.5) * 1.2;
            g.vx += ((dx - dy * swirl) / d) * push * dt + pointer.vx * falloff * 1.1 * dt;
            g.vy += ((dy + dx * swirl) / d) * push * dt + pointer.vy * falloff * 1.1 * dt;
          }
        }
        // A faint idle drift keeps the settled name breathing.
        g.vx += Math.sin(t * 1.3 + g.seed * 40) * 6 * dt;
        g.vy += Math.cos(t * 1.1 + g.seed * 31) * 6 * dt;
        const damping = Math.exp(-4.8 * dt);
        g.vx *= damping;
        g.vy *= damping;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
      }
    };

    const draw = (now: number) => {
      const t = now / 1000;
      const size = Math.ceil(cell * dpr);
      const assembly = assembleStart < 0 ? -1 : (now - assembleStart) / 1000;
      if (assembly < 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (scatter > 0.999) {
        ctx.globalAlpha = 1;
        return;
      }
      for (const g of glyphs) {
        // Surfacing: 0 → 1 per glyph, eased with smootherstep.
        const u = Math.min(1, Math.max(0, (assembly - g.delay) / SURFACE));
        if (u <= 0) continue;
        const e = u * u * u * (u * (u * 6 - 15) + 10);
        const dx = g.x - g.hx;
        const dy = g.y - g.hy;
        const displaced = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (cell * 6));
        // Dispersal: glyphs leave in a seeded order, rising up and away from
        // the name's centre, mutating faster and fading as they go.
        const k0 = Math.min(1, Math.max(0, scatter * 1.4 - g.seed * 0.4));
        const k = k0 * k0 * (3 - 2 * k0);
        const rate = 0.5 + g.seed * 2.5 + (1 - e) * 14 + displaced * 22 + k * 30;
        const glyph = Math.floor(g.seed * 997 + t * rate) % CHARSET.length;
        const bright = Math.min(1, 0.92 + displaced * 0.3);
        // Lime marks energy: a share of glyphs glint while surfacing, and
        // displaced glyphs heat up.
        const hot = (u < 0.6 && g.seed > 0.55) || displaced * (0.4 + g.seed) > 0.62 || (k > 0.04 && g.seed > 0.45);
        const fade = Math.min(1, u / 0.35);
        const alpha = bright * Math.min(1, g.cover * 1.65) * fade * (1 - displaced * 0.25) * (1 - k);
        if (alpha < 0.01) continue;
        // Rises from slightly below its home and swells from a pinpoint.
        const scale = 0.3 + 0.7 * e;
        const drawn = size * scale;
        const inset = (cell - cell * scale) / 2;
        let x = g.x + inset + Math.sin(g.seed * 19 + u * 5) * cell * 0.8 * (1 - e);
        let y = g.y + inset + cell * 4.5 * (1 - e);
        if (k > 0) {
          const ox = g.hx - nameCx;
          const oy = g.hy - nameCy;
          const ol = Math.hypot(ox, oy) + 1;
          const angle = g.seed * 43.98;
          const reach = k * (90 + g.seed * 260);
          x += (ox / ol * 0.55 + Math.cos(angle) * 0.45) * reach + Math.sin(t * 2 + g.seed * 30) * k * cell;
          y += (oy / ol * 0.35 + Math.sin(angle) * 0.35 - 0.9) * reach;
        }
        // A faint offset lime echo gives moving glyphs depth; settled ones
        // skip it, halving the draw calls at rest.
        if (e < 1 || displaced > 0.05 || k > 0) {
          ctx.globalAlpha = alpha * 0.16;
          ctx.drawImage(atlasLime!, glyph * size, 0, size, size, (x + 1.5) * dpr, (y + 2) * dpr, drawn, drawn);
        }
        ctx.globalAlpha = alpha;
        ctx.drawImage(hot ? atlasLime! : atlasBone!, glyph * size, 0, size, size, x * dpr, y * dpr, drawn, drawn);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      // Real elapsed time (capped), integrated in ≤1/60s substeps, so the
      // springs run in real time even when the page renders slowly.
      const elapsed = Math.min(Math.max((now - last) / 1000, 0), 0.1);
      last = now;
      if (!visible || (identity && identity.style.visibility === "hidden")) return;
      // The name waits for the field to settle. If the stage never reports
      // it, it follows 1.6s after the copy is released.
      if (doneSeen < 0 && html.dataset.stageIntro === "done") doneSeen = now;
      if (
        assembleStart < 0 &&
        (html.dataset.stageSettled === "true" ||
          html.dataset.stageStatic === "true" ||
          (doneSeen >= 0 && now - doneSeen > 1600))
      ) {
        assembleStart = now;
      }
      const rect = canvas.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      const scatterTarget = Math.min(1, Math.max(0, (scrollState.hero.current - 0.05) / 0.2));
      scatter += (scatterTarget - scatter) * (1 - Math.exp(-8 * elapsed));
      if (Math.abs(scatterTarget - scatter) < 0.0005) scatter = scatterTarget;
      const steps = Math.max(1, Math.ceil(elapsed * 60));
      for (let i = 0; i < steps; i++) step(now, elapsed / steps);
      draw(now);
    };

    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      build();
      heading.dataset.codeReady = "true";
      if (reduced) {
        assembleStart = 0;
        draw(5000);
        return;
      }
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    void document.fonts.ready.then(start);

    // Rebuild only when the width changes: height-only resizes are a phone's
    // URL bar showing or hiding during scroll, and a rebuild there made the
    // name jump mid-dispersal.
    let lastWidth = innerWidth;
    const onResize = () => {
      if (!glyphs.length || innerWidth === lastWidth) return;
      lastWidth = innerWidth;
      build();
      if (reduced) draw(5000);
    };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.armed = false;
    };
    // Click / tap: a radial burst from the contact point.
    const onDown = (e: PointerEvent) => {
      if (reduced) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const reach = Math.max(160, cell * 34);
      for (const g of glyphs) {
        const dx = g.x - mx;
        const dy = g.y - my;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        if (d > reach) continue;
        const f = (1 - d / reach) * (900 + g.seed * 700);
        g.vx += (dx / d) * f;
        g.vy += (dy / d) * f;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
    });
    observer.observe(heading);
    addEventListener("resize", onResize);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      delete heading.dataset.codeReady;
    };
  }, [fill]);

  return (
    <h1 ref={root} aria-label={label ?? words.join(" ")} className={`relative ${className ?? ""}`}>
      {words.map((word, i) => (
        <span key={word} aria-hidden>
          {i > 0 ? " " : null}
          <span data-code-text className="code-name-text">{word}</span>
        </span>
      ))}
      <canvas ref={canvasRef} aria-hidden className="code-name-canvas" />
    </h1>
  );
}
