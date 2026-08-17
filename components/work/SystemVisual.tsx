import type { WorkItem } from "@/content/work";

// Code-based system visualization — deterministic per project, explicitly
// experimental. Stands in until real media lands; never pretends to be a
// screenshot or client footage.
const GLYPH_ROW = "01<>{}/+*=:;.-|_";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function SystemVisual({
  item,
  label,
  className = "",
}: {
  item: WorkItem;
  label: string;
  className?: string;
}) {
  const rnd = seeded(item.slug.length * 97 + item.title.length * 13);
  const nodes = Array.from({ length: item.visual === "agents" ? 9 : 6 }, () => ({
    x: 8 + rnd() * 84,
    y: 12 + rnd() * 76,
    r: 1.2 + rnd() * 2.4,
  }));
  const lines: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    const j = Math.floor(rnd() * nodes.length);
    if (j !== i) lines.push([i, j]);
  }
  const flows = Array.from({ length: 4 }, (_, i) => {
    const y = 15 + i * 22 + rnd() * 8;
    return `M 0 ${y} C 30 ${y - 12 + rnd() * 24}, 65 ${y + 12 - rnd() * 24}, 100 ${y}`;
  });

  return (
    <figure
      className={`glass group relative overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        aria-hidden
      >
        {item.visual !== "agents" &&
          flows.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#3a3a42" strokeWidth={0.35} opacity={0.9} />
          ))}
        {lines.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#3a3a42"
            strokeWidth={0.25}
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={i === 0 ? "#c8ff3e" : "#f3efe7"}
            opacity={i === 0 ? 0.9 : 0.5}
          />
        ))}
        {Array.from({ length: 5 }, (_, r) => (
          <text
            key={r}
            x={4 + rnd() * 10}
            y={94 - r * 5}
            fontSize={2.6}
            fontFamily="monospace"
            fill="#f3efe7"
            opacity={0.14}
          >
            {GLYPH_ROW.slice(Math.floor(rnd() * 6)).repeat(3).slice(0, 34)}
          </text>
        ))}
      </svg>
      <figcaption className="absolute right-3 bottom-2 font-mono text-[9px] tracking-widest text-bone-dim/50 uppercase">
        {label}
      </figcaption>
    </figure>
  );
}
