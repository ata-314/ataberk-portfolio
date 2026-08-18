"use client";

import { RawStage } from "./RawStage";

// One dependency-free WebGL canvas for the homepage. Keeping the stage on the
// platform API avoids evaluating Three.js and React Three Fiber during entry.
export default function Stage({ onReady }: { onReady?: () => void }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[15]">
      <RawStage onReady={onReady} />
    </div>
  );
}
