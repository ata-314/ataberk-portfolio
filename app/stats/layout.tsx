import type { Metadata } from "next";
import "./stats.css";

// Private visitor stats: its own root layout, kept out of the site's look and of search.
export const metadata: Metadata = {
  title: "Ziyaretçiler",
  robots: { index: false, follow: false },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-svh font-sans antialiased">{children}</body>
    </html>
  );
}
