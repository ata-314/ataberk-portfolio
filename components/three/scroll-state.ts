// Shared scroll progress refs — written by ScrollTriggers, read inside
// render loops. Plain mutable refs on purpose: never React state (R3F pitfall).
export const scrollState = {
  hero: { current: 0 }, // 0..1 across the hero's sticky runway
  page: { current: 0 }, // 0..1 across the whole document
};

// Bird → bust morph. The stage writes morph (0 = bird, 1 = bust) and flags
// driven once it can render the bust from its own particles; the hologram
// canvas publishes its live pose so the particles land exactly on it.
export const bustState = {
  morph: 0,
  driven: false,
  yaw: -0.35,
  pitch: 0,
  lift: 0,
};

// The journey scene: progress 0..1 across its pinned run (helix of cards,
// then the descent through the galaxies), whether it holds the screen, and
// the card under the pointer (-1 for none). Written by JourneySection and
// the stage respectively.
export const journeyState = {
  progress: 0,
  active: 0,
  hovered: -1,
};
