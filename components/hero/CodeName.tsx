"use client";

import { useEffect, useRef } from "react";

// Dense glyphs carry the letterforms; a few light ones keep it reading as code.
const CHARSET = "01#$%&@0189<>{}[]/\\*+=?ABDEHKMNRSWX";
const BONE = "255, 255, 250";
const LIME = "200, 255, 62";
// Room around the name for glyphs the pointer scatters.
const PAD = 160;
// Entrance: code streams fall from the top of the viewport through each
// column of the name; a glyph locks in as its column's stream passes it.
const RAIN_TRAIL = 26;
const RAIN_END = 3.4;

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
};

// The display name as a field of code particles. Every covered cell of the
// typeset letterforms owns one glyph with position, velocity and a home.
// Springs hold the name together; the pointer pushes glyphs away and drags
// them along its motion, a click bursts them, and displaced glyphs heat up
// (lime, faster mutation) until they settle back. On entrance the glyphs
// are written by code streams raining from above. The real text stays in the DOM
// (transparent once drawn) for layout, a11y and no-JS.
export function CodeName({ words, label, className }: { words: string[]; label?: string; className?: string }) {
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
    let rows = 1;
    let padTop = PAD;
    let rainH = 1;
    // Per-column stream timing (seconds) and the columns that carry rain.
    let colDelay = new Float32Array(0);
    let colSpeed = new Float32Array(0);
    let rainCols: number[] = [];
    let atlasBone: HTMLCanvasElement | null = null;
    let atlasLime: HTMLCanvasElement | null = null;
    let frame = 0;
    let last = 0;
    let visible = true;
    let assembleStart = -1;
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, active: false };

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
      const avail = (identity?.clientWidth ?? innerWidth) * 0.88;
      const natural = heading.scrollWidth;
      if (natural > avail) {
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
      // Extend the canvas up to the top of the viewport so the rain enters
      // from the screen edge rather than out of nowhere above the name.
      padTop = Math.min(1200, Math.max(PAD, Math.ceil(box.top) + 24));
      const w = Math.ceil(box.width + PAD * 2);
      const h = Math.ceil(box.height + padTop + PAD);
      canvas.width = Math.ceil(w * dpr);
      canvas.height = Math.ceil(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.style.left = `${-PAD}px`;
      canvas.style.top = `${-padTop}px`;

      // Rasterize every character at 1/cell scale: anti-aliasing yields
      // per-cell coverage. x comes from DOM Ranges (exact tracking/kerning),
      // the baseline from a zero-size inline-block marker per word.
      const cols = Math.ceil(w / cell);
      rows = Math.ceil(h / cell);
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
        const baseline = marker.getBoundingClientRect().top - box.top + padTop;
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
      rainH = h;
      colDelay = new Float32Array(cols);
      colSpeed = new Float32Array(cols);
      const inName = new Uint8Array(cols);
      for (let col = 0; col < cols; col++) {
        colDelay[col] = hash(col, 3.1) * 0.95;
        colSpeed[col] = (h + RAIN_TRAIL * cell * 2) / (1.05 + hash(col, 5.7) * 0.7);
      }
      const next: Glyph[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cover = data[(row * cols + col) * 4 + 3] / 255;
          if (cover < 0.3) continue;
          const hx = col * cell;
          const hy = row * cell;
          const seed = hash(col, row);
          inName[col] = 1;
          next.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, col, row, cover, seed });
        }
      }
      glyphs = next;
      // Every letter column streams; a sparse share of the columns around the
      // name rain too, so the name reads as written out of a code shower.
      rainCols = [];
      for (let col = 0; col < cols; col++) {
        if (inName[col] ? hash(col, 9.2) < 0.7 : hash(col, 9.2) < 0.12) rainCols.push(col);
      }
    };

    const step = (now: number, dt: number) => {
      const rect = canvas.getBoundingClientRect();
      const mx = pointer.x - rect.left;
      const my = pointer.y - rect.top;
      const radius = Math.max(70, cell * 16);
      const pvx = pointer.vx;
      const pvy = pointer.vy;
      const t = now / 1000;
      for (const g of glyphs) {
        const k = 60;
        g.vx += (g.hx - g.x) * k * dt;
        g.vy += (g.hy - g.y) * k * dt;
        if (pointer.active) {
          const dx = g.x - mx;
          const dy = g.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < radius * radius) {
            const d = Math.sqrt(d2) + 0.001;
            const falloff = 1 - d / radius;
            // Seeded strength and a sideways swirl break the clean ring, so
            // the code scatters like disturbed particles.
            const push = falloff * falloff * 5200 * (0.55 + g.seed * 0.9);
            const swirl = (g.seed - 0.5) * 1.4;
            g.vx += ((dx - dy * swirl) / d) * push * dt + pvx * falloff * 0.9 * dt * 60;
            g.vy += ((dy + dx * swirl) / d) * push * dt + pvy * falloff * 0.9 * dt * 60;
          }
        }
        // A faint idle drift keeps the settled name breathing.
        g.vx += Math.sin(t * 1.3 + g.seed * 40) * 6 * dt;
        g.vy += Math.cos(t * 1.1 + g.seed * 31) * 6 * dt;
        const damping = Math.exp(-7.5 * dt);
        g.vx *= damping;
        g.vy *= damping;
        g.x += g.vx * dt;
        g.y += g.vy * dt;
      }
      pointer.vx *= Math.exp(-10 * dt);
      pointer.vy *= Math.exp(-10 * dt);
    };

    const draw = (now: number) => {
      const t = now / 1000;
      const size = Math.ceil(cell * dpr);
      const assembly = assembleStart < 0 ? -1 : (now - assembleStart) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const g of glyphs) {
        const dx = g.x - g.hx;
        const dy = g.y - g.hy;
        const displaced = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (cell * 6));
        const colSeed = hash(g.col, 7.3);
        const speed = 5 + colSeed * 11;
        const span = rows + 14 + colSeed * 18;
        const head = (t * speed + colSeed * span * 3) % span;
        const behind = head - g.row;
        const trail = behind >= 0 ? Math.exp(-behind * 0.25) : 0;
        const rate = 0.5 + g.seed * 2.5 + trail * 8 + displaced * 22;
        const glyph = Math.floor(g.seed * 997 + t * rate) % CHARSET.length;
        const bright = Math.min(1, 0.9 + trail * 0.2 + displaced * 0.3);
        // A glyph appears when its column's stream head reaches its home row,
        // flashing lime for a moment as it locks in.
        const since = assembly < 0 ? -1 : assembly - revealAt(g.col, g.hy);
        const fadeIn = Math.min(1, Math.max(0, since * 7));
        const locking = since >= 0 && since < 0.35;
        // Lime marks energy: stream heads, freshly written glyphs and a share of displaced glyphs.
        const hot = (behind >= 0 && behind < 1.1) || displaced * (0.4 + g.seed) > 0.62 || locking;
        const alpha = bright * Math.min(1, g.cover * 1.65) * fadeIn * (1 - displaced * 0.25);
        if (alpha < 0.01) continue;
        // A faint offset lime echo gives each glyph depth without a backing.
        ctx.globalAlpha = alpha * 0.16;
        ctx.drawImage(atlasLime!, glyph * size, 0, size, size, (g.x + 1.5) * dpr, (g.y + 2) * dpr, size, size);
        ctx.globalAlpha = alpha;
        ctx.drawImage(hot ? atlasLime! : atlasBone!, glyph * size, 0, size, size, g.x * dpr, g.y * dpr, size, size);
      }
      if (assembly >= 0 && assembly < RAIN_END) drawRain(assembly, t, size);
      ctx.globalAlpha = 1;
    };

    // Stream head y (canvas CSS px) of a column at a given intro time.
    const headY = (col: number, a: number) => -RAIN_TRAIL * cell + colSpeed[col] * (a - colDelay[col]);
    const revealAt = (col: number, y: number) => colDelay[col] + (y + RAIN_TRAIL * cell) / colSpeed[col];

    // Matrix-style streams: a lime head snapped to the glyph grid with a
    // decaying bone trail above it, fading in from the screen edge and out
    // below the name.
    const drawRain = (a: number, t: number, size: number) => {
      const edge = cell * 14;
      for (const col of rainCols) {
        const head = headY(col, a);
        if (head < 0 || head - RAIN_TRAIL * cell > rainH) continue;
        const headRow = Math.floor(head / cell);
        const length = Math.round(RAIN_TRAIL * (0.55 + hash(col, 1.9) * 0.45));
        const x = col * cell * dpr;
        for (let k = 0; k < length; k++) {
          const row = headRow - k;
          const y = row * cell;
          if (y < 0 || y > rainH) continue;
          const ramp = Math.min(1, y / edge, (rainH - y) / edge);
          const alpha = Math.exp(-k * 0.14) * ramp * (k === 0 ? 1 : 0.55);
          if (alpha < 0.02) continue;
          const glyph = Math.floor(hash(col, row) * 997 + t * (k === 0 ? 30 : 9)) % CHARSET.length;
          ctx.globalAlpha = alpha;
          ctx.drawImage(k === 0 ? atlasLime! : atlasBone!, glyph * size, 0, size, size, x, y * dpr, size, size);
        }
      }
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      // Real elapsed time (capped), integrated in ≤1/60s substeps, so the
      // springs run in real time even when the page renders slowly.
      const elapsed = Math.min(Math.max((now - last) / 1000, 0), 0.1);
      last = now;
      if (!visible || (identity && identity.style.visibility === "hidden")) return;
      if (assembleStart < 0 && (html.dataset.stageIntro === "done" || html.dataset.stageStatic === "true")) {
        assembleStart = now;
      }
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

    const onResize = () => {
      if (!glyphs.length) return;
      build();
      if (reduced) draw(5000);
    };
    const onMove = (e: PointerEvent) => {
      if (pointer.active) {
        pointer.vx = pointer.vx * 0.5 + (e.clientX - pointer.x) * 0.5;
        pointer.vy = pointer.vy * 0.5 + (e.clientY - pointer.y) * 0.5;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
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
  }, []);

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
