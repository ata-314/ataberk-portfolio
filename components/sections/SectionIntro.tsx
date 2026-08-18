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
  const words = title.split(" ");
  return (
    <div className="hero-copy mx-auto max-w-4xl text-center">
      {/* Eyebrows are English brand labels; lang pins uppercase to ASCII so a
          Turkish page doesn't render INTELLİGENCE with a dotted capital. */}
      <p data-reveal lang="en" className="font-mono text-[10px] tracking-[0.34em] text-lime/85 uppercase">
        {eyebrow}
      </p>
      <h2
        data-reveal-words
        className="font-display mt-7 leading-[1.02] font-semibold tracking-[-0.04em] text-balance"
        style={{ fontSize: "var(--text-h2)" }}
      >
        {words.map((word, index) => (
          <span key={index} data-word className="inline-block">
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </h2>
      {lead && (
        <p data-reveal className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-bone-dim text-balance md:text-lg">
          {lead}
        </p>
      )}
    </div>
  );
}
