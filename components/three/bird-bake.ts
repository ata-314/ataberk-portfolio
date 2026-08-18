"use client";

import * as THREE from "three";

// The animated surface is baked offline by scripts/bake-bird.mjs. Runtime now
// performs one fetch and two texture uploads — no GLTF parsing, triangle
// sampling, skeletal animation or multi-frame skinning on the main thread.
export type BirdBake = {
  texture: THREE.DataTexture;
  normals: THREE.DataTexture;
  count: number;
  frames: number;
  rowsPerFrame: number;
  texWidth: number;
  texHeight: number;
};

export const BIRD_SAMPLES = 9000;
export const BIRD_FRAMES = 16;
const TEX_W = 2048;
const ROWS_PER_FRAME = Math.ceil(BIRD_SAMPLES / TEX_W);
const TEX_H = BIRD_FRAMES * ROWS_PER_FRAME;
const POSITION_ELEMENTS = TEX_W * TEX_H * 4;
const NORMAL_ELEMENTS = TEX_W * ROWS_PER_FRAME * 4;
const EXPECTED_BYTES = (POSITION_ELEMENTS + NORMAL_ELEMENTS) * Uint16Array.BYTES_PER_ELEMENT;

export async function loadBirdBake(url: string): Promise<BirdBake> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`bird bake: ${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== EXPECTED_BYTES) {
    throw new Error(`bird bake: expected ${EXPECTED_BYTES} bytes, received ${buffer.byteLength}`);
  }

  const positionData = new Uint16Array(buffer, 0, POSITION_ELEMENTS);
  const normalData = new Uint16Array(
    buffer,
    POSITION_ELEMENTS * Uint16Array.BYTES_PER_ELEMENT,
    NORMAL_ELEMENTS,
  );
  const texture = new THREE.DataTexture(
    positionData,
    TEX_W,
    TEX_H,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  const normals = new THREE.DataTexture(
    normalData,
    TEX_W,
    ROWS_PER_FRAME,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  normals.magFilter = THREE.NearestFilter;
  normals.minFilter = THREE.NearestFilter;
  normals.needsUpdate = true;

  return {
    texture,
    normals,
    count: BIRD_SAMPLES,
    frames: BIRD_FRAMES,
    rowsPerFrame: ROWS_PER_FRAME,
    texWidth: TEX_W,
    texHeight: TEX_H,
  };
}
