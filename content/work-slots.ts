// Selected-work helix slots. For now each slot is only a colour world
// (deep · mid · glow) — projects are filled in later. The stage paints the
// glass cards and the particle interior from these three stops.
export type WorkSlot = { colors: [string, string, string] };

export const workSlots: WorkSlot[] = [
  { colors: ["#0b3a4a", "#35d0c8", "#b98cff"] },
  { colors: ["#3a0b2e", "#ff4fa3", "#ffb36b"] },
  { colors: ["#12300a", "#c8ff3e", "#3ee6c4"] },
  { colors: ["#0d1240", "#4b6bff", "#ff7ad9"] },
  { colors: ["#3d1405", "#ff7a2f", "#ffe08a"] },
  { colors: ["#062b2a", "#2fe0a0", "#8ae6ff"] },
  { colors: ["#1f0a3d", "#8a4bff", "#5ad1ff"] },
  { colors: ["#3a0f12", "#ff5a5f", "#ffd36e"] },
  { colors: ["#0a2238", "#7cc8ff", "#e8f7ff"] },
  { colors: ["#0b2b1c", "#34c77b", "#c77dff"] },
];

export function slotRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
