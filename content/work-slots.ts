// Selected-work helix slots, in the order of content/work's items: one per
// card. Each slot is a colour world (deep · mid · glow) that tints the glass
// and the opened card's interior, plus what the card shows:
// `video` is a muted loop of the project's own film, cut to the card's shape
// (public/work/<slug>.mp4); the card face shows it under a fine lit grain and
// the opened card's particle interior is made of its pixels.
// `screen` is a capture of the project's live product (see
// scripts/shoot-live.mjs), shown the same way as a still.
// `face` swaps the screen for a living glyph face drawn every frame
// (components/gl/glyph-face.ts), shaped by the given luminance map.
export type WorkSlot = { colors: [string, string, string]; screen?: string; face?: string; video?: string };

export const workSlots: WorkSlot[] = [
  { colors: ["#12300a", "#a3e635", "#c8ff3e"], face: "/work/moddteam-face.png" },
  { colors: ["#2a1405", "#ff9a3c", "#ffd58a"], video: "/work/piyes-levent.mp4" },
  { colors: ["#06240f", "#2fd06b", "#b8ff9a"], video: "/work/ucay-360.mp4" },
  { colors: ["#2b2208", "#e0b84a", "#fff0b8"], video: "/work/elega-gunesli.mp4" },
  { colors: ["#0b1a2e", "#e8a33c", "#9ad7ff"], video: "/work/dbh-group.mp4" },
  { colors: ["#2a1c12", "#c08a5a", "#f3e2c8"], video: "/work/en-bostanci.mp4" },
];

export function slotRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
