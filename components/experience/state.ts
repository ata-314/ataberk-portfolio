// Scroll-driven state for the experience. Each station is an element on the
// page marked data-station; its local progress 0..1 is measured every frame
// and read by the scene (plain mutable object — never React state).
export const exp = {
  intro: 0, // 0 at the top of the page → 1 when the intro has scrolled away
  helix: 0, // descent through the card helix
  galaxy: 0, // descent through the galaxies
  after: 0, // the remaining sections
  pointer: [0, 0] as [number, number],
  hovered: -1,
};

export type Station = "intro" | "helix" | "galaxy" | "after";

// Local progress of a station element: 0 when its top reaches the top of the
// viewport, 1 when its bottom reaches the bottom (sticky-style runs).
export function measureStations() {
  const vh = innerHeight;
  document.querySelectorAll<HTMLElement>("[data-station]").forEach((el) => {
    const key = el.dataset.station as Station;
    const r = el.getBoundingClientRect();
    const run = Math.max(1, r.height - vh);
    const t = key === "intro" ? -r.top / Math.max(1, r.height) : -r.top / run;
    exp[key] = Math.min(1, Math.max(0, t));
  });
}

// Helix layout shared by the scene and the HUD panel.
export const HELIX = {
  radius: 2.9,
  arc: 0.95, // card width, radians
  height: 1.7,
  angleStep: 1.12,
  yStep: 1.45,
  top: -2.4, // first card's height
  tilt: 0.28, // lean along the helix pitch
  // The card level with the eagle faces the camera from this far round, so
  // it frames the eagle instead of covering it.
  side: 0.78,
};

export function helixDepth(t: number, count: number) {
  // Depth the camera and the eagle have descended to for helix progress t.
  return -HELIX.top + t * (count - 1) * HELIX.yStep;
}

export function frontIndex(t: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.round(t * (count - 1))));
}
