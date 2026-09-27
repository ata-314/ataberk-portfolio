// Section opening: a large statement heading set on the left of the grid,
// with the supporting line resting beside it. No eyebrow labels — the
// heading carries the section on its own.
export function SectionIntro({
  title,
  lead,
}: {
  title: string;
  lead?: string;
}) {
  const words = title.split(" ");
  return (
    <div className="hero-copy grid gap-6 md:grid-cols-12 md:items-end">
      <h2
        data-reveal-words
        className="font-display leading-[0.95] font-semibold tracking-[-0.045em] text-balance md:col-span-8"
        style={{ fontSize: "clamp(2.6rem, 6vw, 6rem)" }}
      >
        {words.map((word, index) => (
          <span key={index} data-word className="mr-[0.24em] inline-block last:mr-0">
            {word}
          </span>
        ))}
      </h2>
      {lead && (
        <p data-reveal className="max-w-sm text-base leading-relaxed text-bone-dim md:col-span-4 md:justify-self-end md:pb-2">
          {lead}
        </p>
      )}
    </div>
  );
}
