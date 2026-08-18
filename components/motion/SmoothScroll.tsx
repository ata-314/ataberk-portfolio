"use client";

import type { ReactNode } from "react";

// Native scrolling is intentional. Lenis smoothing plus ScrollTrigger scrub
// plus the WebGL stage's interpolation created three layers of input latency,
// which felt like jank even when frame timing stayed within budget.
export function SmoothScroll({ children }: { children: ReactNode }) {
  return children;
}
