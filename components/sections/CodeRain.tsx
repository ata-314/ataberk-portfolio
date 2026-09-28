"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01<>{}[]/=+*:;.ABCDEFXYZ#%&";

// Sparse columns of code falling behind the portrait: thin, cold and slow,
// each column with its own speed, fading toward its tail. Canvas 2D, only
// while visible.
export function CodeRain({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, visible = false, w = 0, h = 0, dpr = 1;
    type Column = { x: number; y: number; speed: number; length: number; glyphs: string[]; alpha: number };
    let columns: Column[] = [];
    const cell = 13;
    const resize = () => {
      dpr = Math.min(devicePixelRatio, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      columns = [];
      for (let x = cell; x < w; x += cell) {
        if (Math.random() < 0.72) continue;
        columns.push({
          x,
          y: Math.random() * h,
          speed: 18 + Math.random() * 55,
          length: 6 + Math.floor(Math.random() * 22),
          glyphs: Array.from({ length: 40 }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]),
          alpha: 0.25 + Math.random() * 0.55,
        });
      }
    };
    let last = performance.now();
    const draw = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = `10px ui-monospace, monospace`;
      ctx.textAlign = "center";
      for (const c of columns) {
        c.y += c.speed * dt;
        if (c.y - c.length * cell > h) c.y = -Math.random() * h * 0.3;
        for (let i = 0; i < c.length; i++) {
          const y = c.y - i * cell;
          if (y < -cell || y > h + cell) continue;
          const head = i === 0 ? 1 : 0;
          const a = c.alpha * (1 - i / c.length) * (head ? 1.6 : 0.8);
          ctx.fillStyle = head ? `rgba(235,242,255,${Math.min(1, a)})` : `rgba(150,175,215,${a})`;
          if (Math.random() < 0.02) c.glyphs[i] = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          ctx.fillText(c.glyphs[i % c.glyphs.length], c.x, y);
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
    });
    resize();
    observer.observe(canvas);
    addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} aria-hidden className={className} />;
}
