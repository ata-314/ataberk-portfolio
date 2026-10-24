import type { Locale } from "@/lib/i18n";

// The film strip between the hero and the X: the vertical AI brand films side
// by side on a band, three shots per film (public/strip/<slug>-<n>.mp4, 4.5 s
// muted loops cut from the delivered piece, poster <slug>-<n>.jpg). The scroll
// turns the band film by film; at its end it breaks into the grains of the X.
// Only work the owner has cleared for the portfolio goes here (the same films
// as the reel).

// `shots`: where each shot was cut from the full film (s), so the player can
// carry on from the very frame the clicked shot is showing.
export type StripFilm = { slug: string; title: string; shots: number[] };

export const stripFilms: StripFilm[] = [
  { slug: "piyes-levent", title: "Piyes Levent", shots: [5.5, 13, 34] },
  { slug: "elega-gunesli", title: "Elega Güneşli", shots: [2, 8, 13] },
  { slug: "eska-edition", title: "Eska Édition", shots: [0.2, 13, 24] },
  { slug: "en-bostanci", title: "eN Bostancı", shots: [0.2, 11, 21] },
];

export const STRIP_SHOTS = 3;

export const stripCopy: Record<Locale, {
  label: string; kind: string; next: string; prev: string; nextFilm: string;
  play: string; close: string; soundOn: string; soundOff: string; pause: string;
}> = {
  tr: {
    label: "AI tanıtım filmleri", kind: "AI tanıtım filmi", next: "Sonraki", prev: "Önceki film", nextFilm: "Sonraki film",
    play: "Filmi izle", close: "Kapat", soundOn: "Sesi aç", soundOff: "Sesi kapat", pause: "Durdur ya da oynat",
  },
  en: {
    label: "AI brand films", kind: "AI brand film", next: "Next", prev: "Previous film", nextFilm: "Next film",
    play: "Watch the film", close: "Close", soundOn: "Sound on", soundOff: "Sound off", pause: "Pause or play",
  },
};

// The full film a click on the strip opens (public/strip/films/<slug>.mp4,
// 720×1280 with sound, cut from the delivered piece).
export const stripFilmSrc = (slug: string) => `/strip/films/${slug}.mp4`;

// Scroll given to each film (svh), and the lead-in before the first one.
export const STRIP_STEP_SVH = 85;
export const STRIP_LEAD_SVH = 40;

// Progress along the strip's pinned runway (0..1) to a position in films:
// after the lead-in each film holds for the first part of its share of the
// scroll and eases on to the next; the last one holds to the end. Shared by
// the stage (the drum's turn) and the section (the titles).
export function stripPosition(progress: number) {
  const n = stripFilms.length;
  const lead = STRIP_LEAD_SVH / (STRIP_LEAD_SVH + n * STRIP_STEP_SVH);
  if (progress <= lead) return 0;
  const x = Math.min(1, (progress - lead) / (1 - lead)) * n;
  const k = Math.min(Math.floor(x), n - 1);
  if (k === n - 1) return k;
  const t = Math.max(0, Math.min(1, (x - k - 0.55) / 0.45));
  return k + t * t * (3 - 2 * t);
}

// The scroll offset (px from the section's top) at which film i is held.
export function stripStop(i: number, viewportH: number) {
  return ((STRIP_LEAD_SVH + (i + 0.25) * STRIP_STEP_SVH) / 100) * viewportH;
}
