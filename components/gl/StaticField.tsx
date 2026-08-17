// Reduced-motion, no-WebGL and pre-activation state: a designed still of the
// same glyph-matter idea. Pure CSS, server-rendered and content-neutral.
export function StaticField() {
  return (
    <div aria-hidden className="hero-static-field absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 45% at 62% 45%, #1e1e23 0%, #131316 55%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(243,239,231,.7) 0 1px, transparent 1.6px), linear-gradient(90deg, transparent 48%, rgba(200,255,62,.3) 50%, transparent 52%)",
          backgroundSize: "23px 23px, 113px 37px",
          maskImage: "radial-gradient(ellipse 50% 42% at 62% 45%, black 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 50% 42% at 62% 45%, black 0%, transparent 78%)",
        }}
      />
    </div>
  );
}
