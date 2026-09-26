"use client";

import { useEffect, useRef } from "react";

// Dense glyphs carry the letterforms; a few light ones keep it reading as code.
const CHARSET = "01#$%&@0189<>{}[]/\\*+=?ABDEHKMNRSWX";
const BONE = "243, 239, 231";
const LIME = "200, 255, 62";

// Cheap stable hash → [0, 1).
const hash = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Cell = { x: number; y: number; col: number; row: number; cover: number; seed: number };
type Line = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; cells: Cell[]; rows: number; w: number; h: number };

// The display name set as living code: each line's letterforms are rasterized
// into a coverage grid, and every covered cell draws a monospace glyph. Code
// streams fall through each column (bright lime head, decaying trail), glyphs
// keep mutating, and the pointer excites nearby cells. The real text stays in
// the DOM (transparent once the canvas draws) for layout, a11y and no-JS.
export function CodeName({ lines, className }: { lines: string[]; className?: string }) {
  const root = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = root.current;
    if (!heading) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    const textEls = Array.from(heading.querySelectorAll<HTMLSpanElement>("[data-code-text]"));
    const canvases = Array.from(heading.querySelectorAll<HTMLCanvasElement>("canvas"));
    let built: Line[] = [];
    let cell = 8;
    let dpr = 1;
    let atlasBone: HTMLCanvasElement | null = null;
    let atlasLime: HTMLCanvasElement | null = null;
    let frame = 0;
    let visible = true;
    let revealStart = -1;
    const pointer = { x: -1e4, y: -1e4 };
    const identity = heading.closest<HTMLElement>("[data-hero-identity]");

    const makeAtlas = (rgb: string) => {
      const size = Math.ceil(cell * dpr);
      const atlas = document.createElement("canvas");
      atlas.width = size * CHARSET.length;
      atlas.height = size;
      const a = atlas.getContext("2d")!;
      a.fillStyle = `rgb(${rgb})`;
      a.font = `700 ${Math.round(size * 1.05)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      a.textAlign = "center";
      a.textBaseline = "middle";
      for (let i = 0; i < CHARSET.length; i++) a.fillText(CHARSET[i], i * size + size / 2, size / 2 + size * 0.04);
      return atlas;
    };

    const build = () => {
      const style = getComputedStyle(heading);
      const fontSize = parseFloat(style.fontSize);
      cell = Math.max(4, fontSize / 30);
      dpr = Math.min(devicePixelRatio || 1, 3);
      atlasBone = makeAtlas(BONE);
      atlasLime = makeAtlas(LIME);
      const font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      built = textEls.map((el, i) => {
        const canvas = canvases[i];
        const box = el.getBoundingClientRect();
        const w = Math.ceil(box.width + cell * 2);
        const h = Math.ceil(box.height + cell * 2);
        canvas.width = Math.ceil(w * dpr);
        canvas.height = Math.ceil(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        canvas.style.left = `${-cell}px`;
        canvas.style.top = `${-cell}px`;
        const ctx = canvas.getContext("2d")!;
        const cols = Math.ceil(w / cell);
        const rows = Math.ceil(h / cell);
        // Rasterize the line at 1/cell scale: the rasterizer's anti-aliasing
        // yields per-cell coverage. Each glyph is placed at its real DOM x so
        // tracking and kerning match the typeset line exactly.
        const mask = document.createElement("canvas");
        mask.width = cols;
        mask.height = rows;
        const m = mask.getContext("2d", { willReadFrequently: true })!;
        m.scale(1 / cell, 1 / cell);
        m.font = font;
        m.fillStyle = "#fff";
        // Font metrics disagree with the DOM's inline box, so read the real
        // baseline from a zero-size inline-block marker.
        const marker = document.createElement("span");
        marker.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
        el.appendChild(marker);
        const baseline = marker.getBoundingClientRect().top - box.top;
        marker.remove();
        const node = el.firstChild;
        if (node) {
          const range = document.createRange();
          const text = node.textContent ?? "";
          for (let c = 0; c < text.length; c++) {
            range.setStart(node, c);
            range.setEnd(node, c + 1);
            const r = range.getBoundingClientRect();
            m.fillText(text[c], r.left - box.left + cell, baseline + cell);
          }
        }
        const data = m.getImageData(0, 0, cols, rows).data;
        const cells: Cell[] = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const cover = data[(row * cols + col) * 4 + 3] / 255;
            if (cover > 0.3) cells.push({ x: col * cell, y: row * cell, col: col + i * 997, row, cover, seed: hash(col + i * 997, row) });
          }
        }
        return { canvas, ctx, cells, rows, w, h };
      });
    };

    const draw = (now: number) => {
      const t = now / 1000;
      const size = Math.ceil(cell * dpr);
      const reveal = revealStart < 0 ? 0 : Math.min(1, (now - revealStart) / 2400);
      for (const line of built) {
        const { ctx, cells, rows, canvas } = line;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const rect = canvas.getBoundingClientRect();
        for (const c of cells) {
          // Scattered code converges into the letter mask; no solid text body.
          const progress = Math.max(0, Math.min(1, (reveal - c.seed * .18) / .82));
          const ease = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
          const settling = 1 - ease;
          const startX = hash(c.col, c.row + 91) * (line.w - cell);
          const startY = hash(c.col + 27, c.row + 53) * (line.h - cell);
          const x = startX + (c.x - startX) * ease;
          const y = startY + (c.y - startY) * ease;
          const colSeed = hash(c.col, 7.3);
          const speed = 5 + colSeed * 11;
          const span = rows + 14 + colSeed * 18;
          const head = (t * speed + colSeed * span * 3) % span;
          const behind = head - c.row;
          const trail = behind >= 0 ? Math.exp(-behind * 0.22) : 0;
          const px = rect.left + c.x + cell / 2 - pointer.x;
          const py = rect.top + c.y + cell / 2 - pointer.y;
          const near = Math.exp(-(px * px + py * py) / (2 * 70 * 70));
          const rate = 0.6 + c.seed * 3 + trail * 10 + near * 14 + settling * 20;
          const glyph = Math.floor(c.seed * 997 + t * rate) % CHARSET.length;
          const wave = 0.08 * Math.sin(c.col * 0.09 - t * 1.4 + c.row * 0.05);
          const bright = Math.min(1, 0.72 + wave + trail * 0.35 + near * 0.3 + settling * 0.4);
          // Lime stays an accent: stream heads, a sparse subset under the pointer,
          // and cells still decoding on entrance.
          const hot = behind >= 0 && behind < 1.2 ? 1 : Math.max(c.seed < 0.22 ? near : 0, settling);
          const atlas = hot > 0.5 ? atlasLime! : atlasBone!;
          ctx.globalAlpha = bright * Math.min(1, c.cover * 1.2) * Math.min(1, reveal * 8) * (.4 + ease * .6);
          ctx.drawImage(atlas, glyph * size, 0, size, size, x * dpr, y * dpr, size, size);
        }
      }
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      // Skip work while off-screen or while the scroll timeline hides the
      // identity block (GSAP autoAlpha sets visibility: hidden).
      if (!visible || (identity && identity.style.visibility === "hidden")) return;
      if (revealStart < 0 && (html.dataset.stageIntro === "done" || html.dataset.stageStatic === "true")) {
        revealStart = now;
      }
      draw(now);
    };

    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      build();
      heading.dataset.codeReady = "true";
      if (reduced) {
        revealStart = 0;
        draw(performance.now() + 5000);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    void document.fonts.ready.then(start);

    const onResize = () => {
      if (!built.length) return;
      build();
      if (reduced) draw(performance.now() + 5000);
    };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
    });
    observer.observe(heading);
    addEventListener("resize", onResize);
    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onMove);
      delete heading.dataset.codeReady;
    };
  }, []);

  return (
    <h1 ref={root} aria-label={lines.join(" ")} className={className}>
      {lines.map((line, i) => (
        <span key={line} aria-hidden className="hero-line">
          <span className="relative block" style={{ ["--d" as string]: `${0.1 + i * 0.1}s` }}>
            <span data-code-text className="code-name-text">{line}</span>
            <canvas className="code-name-canvas" />
          </span>
        </span>
      ))}
    </h1>
  );
}
