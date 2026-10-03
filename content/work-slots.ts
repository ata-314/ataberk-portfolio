// Selected-work helix slots, in the order of content/work's items: one per
// card. Each slot is a colour world (deep · mid · glow) that tints the glass
// and the opened card's interior, plus what the card shows:
// `video` is a muted loop of the project's own film, cut to the card's shape
// (public/work/<slug>.mp4); the card face shows it under a fine lit grain and
// the opened card's particle interior is made of its pixels.
// `screen` is a capture of the project's live product or app (see
// scripts/shoot-live.mjs), shown the same way as a still.
// `face` swaps the screen for a living glyph face drawn every frame
// (components/gl/glyph-face.ts), shaped by the given luminance map.
export type WorkSlot = { colors: [string, string, string]; screen?: string; face?: string; video?: string };

export const workSlots: WorkSlot[] = [
  { colors: ["#12300a", "#a3e635", "#c8ff3e"], face: "/work/moddteam-face.png" },
  { colors: ["#0f2414", "#6fbf73", "#e8dcc0"], screen: "/work/ala-cekmekoy.jpg" },
  { colors: ["#06240f", "#2fd06b", "#b8ff9a"], screen: "/work/ucay-360.jpg" },
  { colors: ["#0b1a2e", "#d4e600", "#9ad7ff"], screen: "/work/dbh-group.jpg" },
  { colors: ["#2e1408", "#ff8a3c", "#ffd9a0"], screen: "/work/the-lock.jpg" },
  { colors: ["#1a1408", "#c9a24a", "#f3e2b8"], screen: "/work/fidan-property.jpg" },
  { colors: ["#1a1209", "#f0a640", "#ffe0a8"], screen: "/work/patika.jpg" },
];

export function slotRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
