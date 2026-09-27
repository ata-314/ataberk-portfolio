"use client";

import { RawStage } from "./RawStage";

// One dependency-free WebGL canvas for the homepage. Keeping the stage on the
// platform API avoids evaluating Three.js and React Three Fiber during entry.
// The layer is sized to the large viewport so a phone's collapsing URL bar
// never resizes the canvas while scrolling.
export default function Stage({ onReady }: { onReady?: () => void }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[15] h-lvh">
      <RawStage onReady={onReady} />
    </div>
  );
}
