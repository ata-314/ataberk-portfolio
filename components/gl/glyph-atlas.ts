"use client";

import * as THREE from "three";

// Runtime glyph atlas: 16 safe micro-code characters on a 4×4 grid.
// Far away they read as particles; near, as characters. No DOM elements,
// no real source code, nothing readable as sentences.
export const GLYPHS = ["0", "1", "<", ">", "{", "}", "/", "+", "*", "=", ":", ";", ".", "-", "|", "_"] as const;
export const ATLAS_GRID = 4;

export function createGlyphAtlas(): THREE.CanvasTexture {
  const cell = 64;
  const size = cell * ATLAS_GRID;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.font = `${cell * 0.72}px "JetBrains Mono", "Menlo", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < GLYPHS.length; i++) {
    const x = (i % ATLAS_GRID) * cell + cell / 2;
    const y = Math.floor(i / ATLAS_GRID) * cell + cell / 2;
    ctx.fillText(GLYPHS[i], x, y);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
