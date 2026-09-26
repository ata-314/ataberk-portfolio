// A still pigment relief for reduced-motion and unavailable WebGL.
// Pure CSS keeps the scene available before JavaScript or GPU initialization.
export function StaticField() {
  return (
    <div aria-hidden className="hero-static-field absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 35% 26% at 53% 30%, #e5dcc1 15%, #84a8a1 47%, #1b4e50 61%, transparent 70%), radial-gradient(ellipse 43% 28% at 62% 47%, #cf7150 20%, #864431 53%, transparent 72%), radial-gradient(ellipse 36% 32% at 35% 48%, #85a39b 20%, #234448 54%, transparent 72%), linear-gradient(180deg, #c9bda2, #84725b 38%, #0a0a0b 92%)",
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
