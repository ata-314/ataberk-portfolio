import type { Locale } from "@/lib/i18n";

// The showreel in the voyage tunnel: real client work playing on screens set
// into the corridor walls. Each film is an 8 s muted loop cut from the
// delivered piece (public/reel/<slug>.mp4, poster <slug>.jpg); the flight
// slows at every screen and its title is shown beneath. Only work the owner
// has cleared for the portfolio goes here.

export type ReelItem = {
  slug: string;
  title: string;
  kind: "film" | "web";
  // Width / height of the clip.
  aspect: number;
};

export const reelItems: ReelItem[] = [
  { slug: "piyes-levent", title: "Piyes Levent", kind: "film", aspect: 9 / 16 },
  { slug: "dbh-group", title: "DBH Group", kind: "web", aspect: 16 / 9 },
  { slug: "elega-gunesli", title: "Elega Güneşli", kind: "film", aspect: 9 / 16 },
  { slug: "ucay-360", title: "Üçay 360", kind: "web", aspect: 16 / 9 },
  { slug: "eska-edition", title: "Eska Édition", kind: "film", aspect: 9 / 16 },
  { slug: "ala-cekmekoy", title: "ALA Çekmeköy Nefes", kind: "web", aspect: 16 / 9 },
  { slug: "en-bostanci", title: "eN Bostancı", kind: "film", aspect: 9 / 16 },
];

export const reelKinds: Record<Locale, Record<ReelItem["kind"], string>> = {
  tr: { film: "AI tanıtım filmi", web: "Web deneyimi" },
  en: { film: "AI brand film", web: "Web experience" },
};

// Scroll given to each film inside the voyage section (svh), and where in
// the section's original runway the reel is inserted (fraction of it): just
// after the flight has passed the portal and the tunnel has assembled.
export const REEL_STEP_SVH = 70;
export const REEL_AT = 0.58;
