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
  titles: [] as string[], // card names, in the visitor's language
  pick: null as null | ((clientX: number, clientY: number) => number),
};

// Film strip player. The section's DOM owns the open film (set by a click on
// the band) and the player frame's box; the stage flies the film's grains
// into that box and publishes a screen-space picker for the band.
export const stripState = {
  open: -1, // film being played, -1 when none
  panel: -1, // the shot (band panel) it was opened from
  hover: -1, // film under the cursor
  rect: [0, 0, 0, 0] as [number, number, number, number], // player frame, client px (l, t, r, b)
  pick: null as null | ((clientX: number, clientY: number) => number), // the shot under a point
  clipTime: null as null | ((panel: number) => number), // where a shot's loop is (s)
};
