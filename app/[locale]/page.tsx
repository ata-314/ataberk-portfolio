import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { home } from "@/content/home";
import { Hero3D } from "@/components/three/Hero3D";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = home[locale];
  const other = locale === "tr" ? "en" : "tr";

  return (
    <main>
      {/* Hero — "Creative Mind": generative organism, scroll organizes it into structure */}
      <section className="relative flex min-h-svh flex-col justify-center overflow-hidden px-6 md:px-16">
        <Hero3D />
        <nav className="pointer-events-none absolute top-0 right-0 left-0 z-10 flex items-center justify-between px-6 py-5 md:px-16">
          <span className="font-mono text-xs tracking-widest text-bone-dim uppercase">
            AS
          </span>
          <Link
            href={`/${other}`}
            className="pointer-events-auto font-mono text-xs tracking-widest text-bone-dim uppercase transition-colors hover:text-lime"
          >
            {other.toUpperCase()}
          </Link>
        </nav>
        <div className="pointer-events-none relative z-10">
          <h1 className="font-display max-w-4xl text-5xl font-semibold tracking-tight text-balance md:text-7xl">
            {t.name}
          </h1>
          {/* lang="en": the title is English branding — TR uppercasing would render "TECHNOLOGİST" */}
          <p lang="en" className="mt-4 font-mono text-sm tracking-widest text-lime uppercase">
            {t.title}
          </p>
          <p className="mt-6 max-w-xl text-lg text-bone-dim">{t.tagline}</p>
        </div>
      </section>

      {/* Section shells — content lands per build order; no placeholder fakery */}
      {(
        [
          ["work", t.sections.work],
          ["capabilities", t.sections.capabilities],
          ["about", t.sections.about],
          ["contact", t.sections.contact],
        ] as const
      ).map(([id, label]) => (
        <section
          key={id}
          id={id}
          className="border-t border-graphite px-6 py-24 md:px-16"
        >
          <h2 className="font-mono text-xs tracking-widest text-bone-dim uppercase">
            {label}
          </h2>
        </section>
      ))}
    </main>
  );
}
