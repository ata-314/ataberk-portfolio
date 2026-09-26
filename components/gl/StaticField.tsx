// Reduced-motion / unavailable-WebGL counterpart: unframed matter on black.
export function StaticField() {
  return (
    <div aria-hidden className="hero-static-field absolute inset-0 overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-70" style={{
        backgroundImage: "radial-gradient(circle, #c8ff3e 0 .8px, transparent 1.3px), radial-gradient(circle, #45dce6 0 .6px, transparent 1.2px)",
        backgroundSize: "4px 4px, 7px 7px",
        backgroundPosition: "0 0, 2px 3px",
        maskImage: "radial-gradient(ellipse at 60% 35%, black 10%, transparent 70%), radial-gradient(ellipse at 30% 65%, black, transparent 65%)",
      }} />
    </div>
  );
}
