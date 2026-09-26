// Still material study for reduced-motion and unavailable WebGL.
export function StaticField() {
  return (
    <div aria-hidden className="hero-static-field absolute inset-0 overflow-hidden border-[2.8vmin] border-[#e3e6dc] bg-[#b9c2ac]">
      <div className="absolute inset-0" style={{
        backgroundImage: "radial-gradient(ellipse at 60% 40%, #bde634 0%, #608124 30%, transparent 65%), radial-gradient(ellipse at 30% 70%, #b1d72d 0%, #254718 40%, transparent 65%), linear-gradient(0deg,#080c05,transparent 85%)",
        boxShadow: "inset 0 0 32px #26321d88",
      }} />
      <div className="absolute inset-0 opacity-60" style={{
        backgroundImage: "radial-gradient(circle, #d5f57b 0 .7px, transparent 1.2px), radial-gradient(circle, #314b19 0 .7px, transparent 1.2px)",
        backgroundSize: "4px 4px, 5px 5px",
        backgroundPosition: "0 0, 2px 3px",
        maskImage: "radial-gradient(ellipse at center, black, transparent 78%)",
      }} />
    </div>
  );
}
