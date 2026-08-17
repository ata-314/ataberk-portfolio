// Apple-style centered section opening: small mono eyebrow, a large
// statement heading, an optional supporting line. One pattern, sitewide.
export function SectionIntro({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div data-reveal className="hero-copy mx-auto max-w-4xl text-center">
      <p className="nav-glass inline-flex rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.3em] text-lime/90 uppercase">
        {eyebrow}
      </p>
      <h2
        className="font-display mt-7 leading-[1.02] font-semibold tracking-[-0.04em] text-balance"
        style={{ fontSize: "var(--text-h2)" }}
      >
        {title}
      </h2>
      {lead && <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-bone-dim text-balance md:text-lg">{lead}</p>}
    </div>
  );
}
