"use client";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Bakes the eagle's skinned "flying" clip into a float position texture:
// row = animation frame, column = sampled surface point. The particle shader
// reads two rows and mixes — GPU skinning without GPGPU.

export type BirdBake = {
  texture: THREE.DataTexture;
  normals: THREE.DataTexture; // rest-pose surface normals (world-rotated)
  count: number; // sampled points
  frames: number; // animation frames
  rowsPerFrame: number; // texture rows used by one frame
  texWidth: number;
  texHeight: number;
  duration: number; // clip seconds
};

export const BIRD_SAMPLES = 12000;
export const BIRD_FRAMES = 20;
// Max-texture-size safe packing (4096 is the floor on old mobile GPUs).
const TEX_W = 2048;
const ROWS_PER_FRAME = Math.ceil(BIRD_SAMPLES / TEX_W); // 6
const TEX_H = BIRD_FRAMES * ROWS_PER_FRAME; // 120
const WORK_CHUNK = 1500;

// The bake is intentionally cooperative. Yielding between small CPU chunks
// lets input, scroll and rendering run while the model is sampled instead of
// producing one multi-second main-thread task.
function yieldToBrowser() {
  const taskScheduler = (globalThis as typeof globalThis & {
    scheduler?: { yield?: () => Promise<void> };
  }).scheduler;
  if (taskScheduler?.yield) return taskScheduler.yield();
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export async function bakeBird(url: string): Promise<BirdBake> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const scene = gltf.scene;

  let skinned: THREE.SkinnedMesh | null = null;
  scene.traverse((o) => {
    if (!skinned && (o as THREE.SkinnedMesh).isSkinnedMesh)
      skinned = o as THREE.SkinnedMesh;
  });
  if (!skinned) throw new Error("bird glb: no skinned mesh found");
  const mesh: THREE.SkinnedMesh = skinned;

  const geo = mesh.geometry;
  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const index = geo.index!;

  // Area-weighted triangle sampling (rest pose) — stable, seeded once.
  const triCount = index.count / 3;
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const cumAreas = new Float32Array(triCount);
  let areaSum = 0;
  for (let t = 0; t < triCount; t++) {
    va.fromBufferAttribute(posAttr, index.getX(t * 3));
    vb.fromBufferAttribute(posAttr, index.getX(t * 3 + 1));
    vc.fromBufferAttribute(posAttr, index.getX(t * 3 + 2));
    vb.sub(va);
    vc.sub(va);
    areaSum += vb.cross(vc).length() * 0.5;
    cumAreas[t] = areaSum;
    if ((t + 1) % (WORK_CHUNK * 2) === 0) await yieldToBrowser();
  }
  const samples = new Uint32Array(BIRD_SAMPLES * 3); // vertex indices
  const barys = new Float32Array(BIRD_SAMPLES * 2); // barycentric a,b
  for (let i = 0; i < BIRD_SAMPLES; i++) {
    const r = Math.random() * areaSum;
    // binary search cumulative areas
    let lo = 0,
      hi = triCount - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumAreas[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    samples[i * 3] = index.getX(lo * 3);
    samples[i * 3 + 1] = index.getX(lo * 3 + 1);
    samples[i * 3 + 2] = index.getX(lo * 3 + 2);
    let a = Math.random();
    let b = Math.random();
    if (a + b > 1) {
      a = 1 - a;
      b = 1 - b;
    }
    barys[i * 2] = a;
    barys[i * 2 + 1] = b;
    if ((i + 1) % WORK_CHUNK === 0) await yieldToBrowser();
  }

  // Drive the clip and capture skinned positions per frame.
  const mixer = new THREE.AnimationMixer(scene);
  const clip = gltf.animations[0];
  mixer.clipAction(clip).play();

  const data = new Float32Array(TEX_W * TEX_H * 4);
  const sv = new THREE.Vector3();
  const p = new THREE.Vector3();

  for (let f = 0; f < BIRD_FRAMES; f++) {
    mixer.setTime((f / BIRD_FRAMES) * clip.duration);
    scene.updateMatrixWorld(true);

    for (let i = 0; i < BIRD_SAMPLES; i++) {
      p.set(0, 0, 0);
      const a = barys[i * 2];
      const b = barys[i * 2 + 1];
      const w = [a, b, 1 - a - b];
      for (let k = 0; k < 3; k++) {
        const vi = samples[i * 3 + k];
        sv.fromBufferAttribute(posAttr, vi);
        mesh.applyBoneTransform(vi, sv);
        p.addScaledVector(sv, w[k]);
      }
      p.applyMatrix4(mesh.matrixWorld); // bake node transforms in
      // Packed layout: frame f starts at row f*ROWS_PER_FRAME
      const row = f * ROWS_PER_FRAME + Math.floor(i / TEX_W);
      const col = i % TEX_W;
      const o = (row * TEX_W + col) * 4;
      data[o] = p.x;
      data[o + 1] = p.y;
      data[o + 2] = p.z;
      data[o + 3] = Math.random(); // per-point seed
      if ((i + 1) % WORK_CHUNK === 0) await yieldToBrowser();
    }
  }

  // Normalize: center at origin, wingspan → ~3.4 world units.
  // Offsets must follow the packed layout (each frame block has pad cells).
  const offsetOf = (f: number, i: number) => {
    const row = f * ROWS_PER_FRAME + Math.floor(i / TEX_W);
    return (row * TEX_W + (i % TEX_W)) * 4;
  };
  const box = new THREE.Box3();
  for (let i = 0; i < BIRD_SAMPLES; i++) {
    const o = offsetOf(0, i);
    box.expandByPoint(p.set(data[o], data[o + 1], data[o + 2]));
  }
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const scale = 3.4 / Math.max(size.x, size.y, size.z);
  for (let f = 0; f < BIRD_FRAMES; f++) {
    for (let i = 0; i < BIRD_SAMPLES; i++) {
      const o = offsetOf(f, i);
      data[o] = (data[o] - center.x) * scale;
      data[o + 1] = (data[o + 1] - center.y) * scale;
      data[o + 2] = (data[o + 2] - center.z) * scale;
    }
    await yieldToBrowser();
  }

  const texture = new THREE.DataTexture(
    data,
    TEX_W,
    TEX_H,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.needsUpdate = true;

  // Surface normals (rest pose, barycentric, world rotation only) — drive
  // mouse displacement direction and subtle shading. One frame is enough:
  // interaction needs direction, not exact flap-time normals.
  const nrmAttr = geo.attributes.normal as THREE.BufferAttribute;
  const nrmData = new Float32Array(TEX_W * ROWS_PER_FRAME * 4);
  const rotOnly = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
  for (let i = 0; i < BIRD_SAMPLES; i++) {
    p.set(0, 0, 0);
    const a = barys[i * 2];
    const b = barys[i * 2 + 1];
    const w = [a, b, 1 - a - b];
    for (let k = 0; k < 3; k++) {
      sv.fromBufferAttribute(nrmAttr, samples[i * 3 + k]);
      p.addScaledVector(sv, w[k]);
    }
    p.applyMatrix3(rotOnly).normalize();
    const o = ((Math.floor(i / TEX_W)) * TEX_W + (i % TEX_W)) * 4;
    nrmData[o] = p.x;
    nrmData[o + 1] = p.y;
    nrmData[o + 2] = p.z;
    nrmData[o + 3] = 0;
    if ((i + 1) % WORK_CHUNK === 0) await yieldToBrowser();
  }
  const normals = new THREE.DataTexture(
    nrmData,
    TEX_W,
    ROWS_PER_FRAME,
    THREE.RGBAFormat,
    THREE.FloatType,
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
    duration: clip.duration,
  };
}
