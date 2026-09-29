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

// Selected-work helix. The stage owns the 3D layout and publishes the
// focused card plus a screen-space picker; the section's DOM owns the open
// card (set by clicks, keys or the slot list) and reads the rest.
export const workState = {
  focus: 0, // card nearest the front of the helix
  progress: 0, // 0..1 along the pinned runway
  hover: -1, // card under the cursor (stage-picked)
  open: -1, // card the visitor is inside, -1 when browsing
  pick: null as null | ((clientX: number, clientY: number) => number),
};
