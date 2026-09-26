// A still pigment relief for reduced-motion and unavailable WebGL.
// Pure CSS keeps the scene available before JavaScript or GPU initialization.
export function StaticField() {
  return (
    <div aria-hidden className="hero-static-field absolute inset-0 overflow-hidden">
      <div
        className="absolute -inset-[20%] rotate-[-18deg] opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 85% 32% at 45% 25%, transparent 36%, #173947 49%, #779a9e 55%, #e2dfd0 57%, #377682 60%, #0b1b29 65%, transparent 76%), radial-gradient(ellipse 90% 36% at 65% 84%, transparent 30%, #214c60 46%, #a8bfbd 54%, #317383 58%, #0a1725 68%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(225,241,239,.7) 0 .6px, transparent 1px)",
          backgroundSize: "5px 5px",
          maskImage: "linear-gradient(180deg, black, transparent 90%)",
        }}
      />
    </div>
  );
}
