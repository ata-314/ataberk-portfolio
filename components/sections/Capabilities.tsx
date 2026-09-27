import type { SiteContent } from "@/content/site";
import { SectionIntro } from "./SectionIntro";

// Four disciplines as glass tiles: the name, what it brings to the others,
// then the craft it covers as a plain running line. No counters, no bars.
export function Capabilities({ t }: { t: SiteContent["capabilities"] }) {
  return (
    <section
      id="capabilities"
      className="relative z-20 px-5 md:px-10"
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <div className="mx-auto max-w-[88rem]">
        <SectionIntro title={t.heading} lead={t.lead} />

        <div className="mt-16 grid gap-3 sm:grid-cols-2 md:mt-24 md:gap-4 lg:grid-cols-4">
          {t.systems.map((sys) => (
            <div key={sys.key} data-reveal className="glass-tile p-7 md:p-8">
              <h3 lang="en" className="font-display text-2xl font-semibold tracking-[-0.03em] md:text-[1.75rem]">
                {sys.name}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-bone">{sys.bridge}</p>
              <p lang="en" className="mt-5 text-sm leading-relaxed text-bone-dim">
                {sys.items.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
