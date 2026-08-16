import Link from "next/link";

// Root 404 — locale-agnostic (TR first, EN inline), same matter, same voice.
export default function NotFound() {
  return (
    <html lang="tr">
      <body className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0b] px-6 text-center font-sans text-[#f3efe7]">
        <p className="font-mono text-xs tracking-[0.4em] text-[#b9b5ac]">01&lt;&gt;{"{}"}/+*</p>
        <h1 className="mt-6 text-7xl font-semibold tracking-tight">404</h1>
        <p className="mt-4 max-w-md text-[#b9b5ac]">
          Bu sayfa sistemde yok — belki henüz üretilmedi.
          <br />
          This page doesn&apos;t exist in the system — perhaps it hasn&apos;t been generated yet.
        </p>
        <Link
          href="/tr"
          className="mt-8 border border-[#c8ff3e] px-6 py-3 font-mono text-xs tracking-widest text-[#c8ff3e] uppercase"
        >
          Ana sayfa / Home
        </Link>
      </body>
    </html>
  );
}
