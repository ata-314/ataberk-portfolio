"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { World } from "./World";
import type { HelixCard } from "./CardHelix";
import { exp, measureStations } from "./state";

// The page's single 3D world, fixed behind the HTML. Station progress is
// measured from the page on every animation frame and read by the scene.
export default function Experience({ cards, title, subtitle, onOpen }: { cards: HelixCard[]; title: string; subtitle: string; onOpen: (i: number) => void }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    // Client-only capability check on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobile(matchMedia("(pointer: coarse)").matches || innerWidth < 768);
    let raf = 0;
    const tick = () => { measureStations(); raf = requestAnimationFrame(tick); };
    tick();
    const onMove = (e: PointerEvent) => {
      exp.pointer[0] = (e.clientX / innerWidth) * 2 - 1;
      exp.pointer[1] = -((e.clientY / innerHeight) * 2 - 1);
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener("pointermove", onMove); };
  }, []);
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, mobile ? 1.5 : 2]}
        gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
        camera={{ fov: 42, near: 0.1, far: 120, position: [0, 0.4, 6.4] }}
        onCreated={({ gl }) => gl.setClearColor("#020507")}
      >
        <Suspense fallback={null}>
          <World cards={cards} title={title} subtitle={subtitle} onOpen={onOpen} mobile={mobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
