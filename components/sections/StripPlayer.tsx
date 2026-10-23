"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { stripCopy, stripFilms, stripFilmSrc } from "@/content/strip";
import { stripState } from "../three/scroll-state";

// How long the stage takes to fly the film's grains into the frame (and
// home again), before the picture takes over (or after it has left).
const GATHER_MS = 780;
const LEAVE_MS = 260;

// The full film, opened from the strip. The frame is placed first so the
// stage can fly the film's grains into it (stripState.rect); once they have
// gathered the picture rises out of them with a light sweeping across, and
// plays with sound. Closing (the button, Escape, the veil, or a deliberate
// scroll) lets the picture go and the grains fly home to the band.
export function StripPlayer({ locale, film, onClosed }: { locale: Locale; film: number; onClosed: () => void }) {
  const t = stripCopy[locale];
  const item = stripFilms[film];
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<"gather" | "shown" | "leave">("gather");
  const [muted, setMuted] = useState(false);

  // Publish the frame's box and open the film on the stage.
  useLayoutEffect(() => {
    const place = () => {
      const r = frame.current?.getBoundingClientRect();
      if (r) stripState.rect = [r.left, r.top, r.right, r.bottom];
    };
    place();
    stripState.open = film;
    stripState.hover = -1;
    addEventListener("resize", place);
    // Without the stage there are no grains to wait for.
    const wait = stripState.pick ? GATHER_MS : 0;
    const timer = setTimeout(() => setPhase((p) => (p === "gather" ? "shown" : p)), wait);
    return () => {
      clearTimeout(timer);
      removeEventListener("resize", place);
    };
  }, [film]);

  // Plays with sound once shown (the click allows it); muted if refused.
  useEffect(() => {
    const v = video.current;
    if (!v || phase !== "shown") return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      void v.play().catch(() => {});
    });
  }, [phase]);

  const close = useCallback(() => {
    setPhase((p) => {
      if (p === "leave") return p;
      video.current?.pause();
      setTimeout(() => {
        stripState.open = -1;
        setTimeout(onClosed, stripState.pick ? GATHER_MS : 0);
      }, LEAVE_MS);
      return "leave";
    });
  }, [onClosed]);

  // The page holds still while the film is open: a deliberate scroll,
  // a swipe or Escape closes it instead.
  useEffect(() => {
    let travel = 0;
    let touchY = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      travel += Math.abs(e.deltaY);
      if (travel > 90) close();
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (Math.abs(e.touches[0].clientY - touchY) > 60) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(e.key)) {
        e.preventDefault();
        close();
      }
    };
    addEventListener("wheel", onWheel, { passive: false });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: false });
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("wheel", onWheel);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("keydown", onKey);
    };
  }, [close]);

  // The progress line under the picture.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const v = video.current;
      if (v && bar.current && v.duration) bar.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div className="strip-player" data-phase={phase} role="dialog" aria-modal="true" aria-label={item.title}>
      <button type="button" className="strip-player-veil" aria-label={t.close} tabIndex={-1} onClick={close} />
      <div ref={frame} className="strip-player-frame">
        <video
          ref={video}
          src={stripFilmSrc(item.slug)}
          poster={`/strip/${item.slug}-1.jpg`}
          playsInline
          loop
          preload="auto"
          aria-label={t.pause}
          onClick={toggle}
        />
        <span className="strip-player-sweep" aria-hidden />
        <span className="strip-player-track" aria-hidden><i ref={bar} /></span>
      </div>
      <div className="strip-player-meta">
        <h3 className="strip-player-title">{item.title}</h3>
        <span className="strip-player-kind">{t.kind}</span>
      </div>
      <div className="strip-player-tools">
        <button
          type="button"
          aria-label={muted ? t.soundOn : t.soundOff}
          onClick={() => {
            const v = video.current;
            if (!v) return;
            v.muted = !v.muted;
            setMuted(v.muted);
          }}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
          )}
        </button>
        <button type="button" aria-label={t.close} onClick={close} autoFocus>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </div>
  );
}
