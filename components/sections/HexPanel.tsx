"use client";

import { useEffect, useRef } from "react";

// The Lab panel: a wide field of hexagon cells, each lit by a slowly moving
// colour current and bulging toward a lens at the centre (or the pointer),
// like looking through a honeycomb of glass at living data. Canvas 2D,
// throttled to visible frames only.
export function HexPanel({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;
    let w = 0, h = 0, dpr = 1;
    const lens = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const resize = () => {
      dpr = Math.min(devicePixelRatio, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    // Smooth pseudo-noise from a few sines — cheap and plenty for colour.
    const field = (x: number, y: number, t: number) =>
      0.5 + 0.25 * Math.sin(x * 3.1 + t * 0.6 + Math.sin(y * 2.3 - t * 0.4) * 1.5) + 0.25 * Math.sin(y * 4.2 - t * 0.5 + Math.cos(x * 1.7 + t * 0.3) * 1.8);

    const draw = (now: number) => {
      raf = 0;
      if (!visible) return;
      const t = now / 1000;
      lens.x += (lens.tx - lens.x) * 0.06;
      lens.y += (lens.ty - lens.y) * 0.06;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const r = Math.max(10, w / 58);
      const hx = r * Math.sqrt(3);
      const hy = r * 1.5;
      for (let row = -1; row * hy < h + r; row++) {
        for (let col = -1; col * hx < w + hx; col++) {
          const cx = col * hx + (row % 2 ? hx / 2 : 0);
          const cy = row * hy;
          const nx = cx / w, ny = cy / h;
          const dx = nx - lens.x, dy = (ny - lens.y) * (h / w);
          const d = Math.sqrt(dx * dx + dy * dy);
          const bulge = Math.exp(-d * d * 18);
          // Fade out toward the panel's right edge, as in the reference.
          const edge = Math.min(1, (1 - nx) * 3.5) * Math.min(1, nx * 6);
          const v = field(nx * 2.2, ny * 2.2, t);
          // Dark iridescence: teal through violet, lit mostly at the lens.
          const hue = (170 + v * 120 + nx * 50) % 360;
          const light = 8 + v * 22 + bulge * 34;
          const size = r * (0.8 + bulge * 0.16);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = Math.PI / 6 + (k * Math.PI) / 3;
            const px = cx + dx * bulge * 40 + Math.cos(a) * size;
            const py = cy + dy * bulge * 40 + Math.sin(a) * size;
            if (k) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = `hsla(${hue}, 55%, ${light}%, ${0.25 + edge * 0.7})`;
          ctx.fill();
          ctx.strokeStyle = `hsla(${hue}, 80%, ${Math.min(90, light + 30)}%, ${0.15 + bulge * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    observer.observe(canvas);
    const onMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      lens.tx = (event.clientX - box.left) / box.width;
      lens.ty = (event.clientY - box.top) / box.height;
    };
    const onLeave = () => { lens.tx = 0.5; lens.ty = 0.5; };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    resize();
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
