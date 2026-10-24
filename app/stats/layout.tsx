import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./stats.css";

// The site's display face, for headings and figures.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "latin-ext"] });

// Private visitor stats: its own root layout, kept out of the site's look and of search.
export const metadata: Metadata = {
  title: "Ziyaretçiler",
  robots: { index: false, follow: false },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={archivo.variable}>
      <body className="min-h-svh font-sans antialiased">{children}</body>
    </html>
  );
}
