// Screens shown on each case study, shared by both locales: chapters of the
// live site on desktop and on a phone (captured by scripts/shoot-cases.mjs),
// or an app's own screens. Only what the product really shows; a chapter
// that repeats the hero capture is left out.
// `facts` are figures the product itself states (TR, EN labels); a project
// without stated figures has none.
export type Fact = { value: string; tr: string; en: string };
export type Gallery = { desktop: string[]; phone: string[]; facts?: Fact[] };

const site = (slug: string, desktop: number[], phone: number[], facts?: Fact[]): Gallery => ({
  desktop: desktop.map((n) => `/work/${slug}/d${n}.jpg`),
  phone: phone.map((n) => `/work/${slug}/m${n}.jpg`),
  facts,
});

export const galleries: Record<string, Gallery> = {
  "ala-cekmekoy": site("ala-cekmekoy", [1, 2, 3, 4], [1, 2, 3], [
    { value: "14.300 m²", tr: "Arazi", en: "Land" },
    { value: "9", tr: "Blok", en: "Blocks" },
    { value: "72", tr: "Konut", en: "Homes" },
  ]),
  "ucay-360": site("ucay-360", [2, 3, 4], [1, 3], [
    { value: "360°", tr: "Hizmet modeli", en: "Service model" },
    { value: "3", tr: "Çözüm alanı", en: "Solution areas" },
  ]),
  "dbh-group": site("dbh-group", [2, 3, 4], [1, 2, 3], [
    { value: "1995", tr: "Kuruluş", en: "Founded" },
    { value: "6", tr: "Faaliyet alanı", en: "Fields" },
  ]),
  "the-lock": site("the-lock", [2, 3, 4], [1, 2, 3], [
    { value: "4", tr: "Blok", en: "Blocks" },
    { value: "286", tr: "Konut", en: "Homes" },
    { value: "100", tr: "Ticari alan", en: "Commercial units" },
  ]),
  "fidan-property": site("fidan-property", [1, 2, 3], [1, 2, 3]),
  patika: {
    desktop: [],
    phone: ["01-odak", "02-dostlarim-yuva", "03-gorevler", "04-ozet", "05-ayarlar"].map((f) => `/work/patika/${f}.jpg`),
  },
};
