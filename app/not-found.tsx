import Link from "next/link";

// Root 404 — locale-agnostic (TR first, EN inline), same matter, same voice.
export default function NotFound() {
  return (
    <html lang="tr">
      <body className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0b] px-6 text-center font-sans text-[#f3efe7]">
        <h1 className="text-8xl font-semibold tracking-tighter">404</h1>
        <p className="mt-4 max-w-md text-[#b9b5ac]">
          Bu sayfa sistemde yok — belki henüz üretilmedi.
          <br />
          This page doesn&apos;t exist in the system — perhaps it hasn&apos;t been generated yet.
        </p>
        <Link
          href="/tr"
          className="mt-10 text-sm underline underline-offset-4"
        >
          Ana sayfa / Home
        </Link>
      </body>
    </html>
  );
}
