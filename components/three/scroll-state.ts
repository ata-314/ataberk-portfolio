// Shared scroll progress refs — written by ScrollTriggers, read inside
// render loops. Plain mutable refs on purpose: never React state (R3F pitfall).
export const scrollState = {
  hero: { current: 0 }, // 0..1 across the hero's sticky runway
  page: { current: 0 }, // 0..1 across the whole document
};
