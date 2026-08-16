import type { Locale } from "@/lib/i18n";

// Copy is drafted per locale, never machine-translated word for word.
// Section bodies land with their build steps; placeholders stay honest (no fake content).
export const home: Record<
  Locale,
  {
    name: string;
    title: string;
    tagline: string;
    sections: { work: string; capabilities: string; about: string; contact: string };
  }
> = {
  tr: {
    name: "Ataberk Soylu",
    title: "Creative Technologist & Multi Designer",
    tagline:
      "Yapay zekâ, motion, 3D ve web arasında akıllı dijital deneyimler tasarlıyorum.",
    sections: {
      work: "Seçili İşler",
      capabilities: "Yetenek Sistemleri",
      about: "Yaklaşım",
      contact: "İletişim",
    },
  },
  en: {
    name: "Ataberk Soylu",
    title: "Creative Technologist & Multi Designer",
    tagline:
      "Designing intelligent digital experiences across AI, motion, 3D and the web.",
    sections: {
      work: "Selected Work",
      capabilities: "Capability Systems",
      about: "Approach",
      contact: "Contact",
    },
  },
};
