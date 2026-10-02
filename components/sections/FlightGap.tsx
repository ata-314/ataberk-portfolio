// Open sky between sections: no copy, no surface, just room for the bird
// to fly in plain view. Later acts get wider gaps.
export function FlightGap({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div
      aria-hidden
      className={size === "lg" ? "h-[45svh] md:h-[70svh]" : "h-[25svh] md:h-[35svh]"}
    />
  );
}
