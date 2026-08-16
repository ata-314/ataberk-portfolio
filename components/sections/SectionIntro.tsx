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
    <div data-reveal className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-[11px] tracking-[0.35em] text-lime/80 uppercase">
        {eyebrow}
      </p>
      <h2
        className="font-display mt-5 leading-[1.05] font-semibold tracking-tight text-balance"
        style={{ fontSize: "var(--text-h2)" }}
      >
        {title}
      </h2>
      {lead && <p className="mt-5 text-lg text-bone-dim">{lead}</p>}
    </div>
  );
}
