// Screens shown on each case study, shared by both locales: chapters of the
// live site on desktop and on a phone (captured by scripts/shoot-cases.mjs),
// or an app's own screens. Only what the product really shows; a chapter
// that repeats the hero capture is left out.
export type Gallery = { desktop: string[]; phone: string[] };

const site = (slug: string, desktop: number[], phone: number[]): Gallery => ({
  desktop: desktop.map((n) => `/work/${slug}/d${n}.jpg`),
  phone: phone.map((n) => `/work/${slug}/m${n}.jpg`),
});

export const galleries: Record<string, Gallery> = {
  "ala-cekmekoy": site("ala-cekmekoy", [1, 2, 3, 4], [1, 2, 3]),
  "ucay-360": site("ucay-360", [2, 3, 4], [1, 3]),
  "dbh-group": site("dbh-group", [2, 3, 4], [1, 2, 3]),
  "the-lock": site("the-lock", [2, 3, 4], [1, 2, 3]),
  "fidan-property": site("fidan-property", [1, 2, 3], [1, 2, 3]),
  patika: {
    desktop: [],
    phone: ["01-odak", "02-dostlarim-yuva", "03-gorevler", "04-ozet", "05-ayarlar"].map((f) => `/work/patika/${f}.jpg`),
  },
};
