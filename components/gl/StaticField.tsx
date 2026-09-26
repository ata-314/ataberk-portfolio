// Static point-cloud counterpart for reduced-motion and unavailable WebGL.
export function StaticField() {
  return (
    <div aria-hidden className="hero-static-field absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-70" style={{
        backgroundImage: "radial-gradient(circle, #50dcff 0 .8px, transparent 1.3px), radial-gradient(circle, #875aff 0 .7px, transparent 1.2px)",
        backgroundSize: "5px 5px, 7px 7px",
        backgroundPosition: "0 0, 2px 3px",
        maskImage: "radial-gradient(ellipse 36% 26% at 53% 30%, black 15%, transparent 72%), radial-gradient(ellipse 43% 28% at 62% 47%, black 20%, transparent 72%), radial-gradient(ellipse 36% 32% at 35% 48%, black 20%, transparent 72%)",
      }} />
    </div>
  );
}
