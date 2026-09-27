// Quiet scroll cue: a thin mouse outline whose wheel keeps rolling down on
// fine pointers, a softly bobbing chevron on touch. Loops continuously while
// visible; the hero timeline decides when it shows.
export function ScrollHint({ label }: { label: string }) {
  return (
    <span className="scroll-hint flex flex-col items-center gap-2.5 text-[12px] text-bone">
      <span aria-hidden className="scroll-hint-mouse">
        <span />
      </span>
      <svg aria-hidden viewBox="0 0 16 10" className="scroll-hint-chevron">
        <path d="M1 1.5 8 8.5 15 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{label}</span>
    </span>
  );
}
