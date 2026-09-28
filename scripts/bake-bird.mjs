// Offline bird texture bake.
// Run with: node scripts/bake-bird.mjs
//
// The browser only downloads the finished half-float texture. Keeping GLTF
// parsing, skinning and surface sampling out of runtime prevents the hero
// transition from competing with scroll and rendering on the main thread.
import { readFile, writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const SAMPLES = 9000;
const FRAMES = 16;
const TEX_W = 2048;
const ROWS_PER_FRAME = Math.ceil(SAMPLES / TEX_W);
const TEX_H = FRAMES * ROWS_PER_FRAME;
const source = new URL("../public/models/robot_bird_eagle.glb", import.meta.url);
const output = new URL("../public/models/bird-bake.bin", import.meta.url);

let seed = 0x51f15e;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const file = await readFile(source);
const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const gltf = await new GLTFLoader().parseAsync(arrayBuffer, "");
const scene = gltf.scene;

let mesh = null;
scene.traverse((object) => {
  if (!mesh && object.isSkinnedMesh) mesh = object;
});
if (!mesh) throw new Error("bird glb: no skinned mesh found");

const geometry = mesh.geometry;
const position = geometry.attributes.position;
const normal = geometry.attributes.normal;
const index = geometry.index;
if (!position || !normal || !index) throw new Error("bird glb: incomplete geometry");

const triangleCount = index.count / 3;
const cumulativeAreas = new Float32Array(triangleCount);
const a = new THREE.Vector3();
const b = new THREE.Vector3();
const c = new THREE.Vector3();
let areaSum = 0;
for (let triangle = 0; triangle < triangleCount; triangle++) {
  a.fromBufferAttribute(position, index.getX(triangle * 3));
  b.fromBufferAttribute(position, index.getX(triangle * 3 + 1));
  c.fromBufferAttribute(position, index.getX(triangle * 3 + 2));
  areaSum += b.sub(a).cross(c.sub(a)).length() * 0.5;
  cumulativeAreas[triangle] = areaSum;
}

// Blue-noise surface sampling: many area-weighted candidates, then greedy
// dart throwing with the largest spacing that still yields SAMPLES points.
// Evenly spaced samples let the runtime grains cover the skin uniformly,
// like packed foam, instead of clumping where random samples bunch up.
const CANDIDATES = SAMPLES * 8;
const candVertices = new Uint32Array(CANDIDATES * 3);
const candBary = new Float32Array(CANDIDATES * 2);
const candPoints = new Float32Array(CANDIDATES * 3);
const restVertex = new THREE.Vector3();
for (let sample = 0; sample < CANDIDATES; sample++) {
  const target = random() * areaSum;
  let low = 0;
  let high = triangleCount - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (cumulativeAreas[middle] < target) low = middle + 1;
    else high = middle;
  }
  let u = random();
  let v = random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const weights = [u, v, 1 - u - v];
  let x = 0, y = 0, z = 0;
  for (let corner = 0; corner < 3; corner++) {
    const vertex = index.getX(low * 3 + corner);
    candVertices[sample * 3 + corner] = vertex;
    restVertex.fromBufferAttribute(position, vertex);
    x += restVertex.x * weights[corner];
    y += restVertex.y * weights[corner];
    z += restVertex.z * weights[corner];
  }
  candBary[sample * 2] = u;
  candBary[sample * 2 + 1] = v;
  candPoints.set([x, y, z], sample * 3);
}
const dart = (radius) => {
  const grid = new Map();
  const cellKey = (x, y, z) => `${Math.floor(x / radius)},${Math.floor(y / radius)},${Math.floor(z / radius)}`;
  const accepted = [];
  for (let c = 0; c < CANDIDATES && accepted.length < SAMPLES; c++) {
    const x = candPoints[c * 3], y = candPoints[c * 3 + 1], z = candPoints[c * 3 + 2];
    const cx = Math.floor(x / radius), cy = Math.floor(y / radius), cz = Math.floor(z / radius);
    let clear = true;
    for (let dx = -1; dx <= 1 && clear; dx++) for (let dy = -1; dy <= 1 && clear; dy++) for (let dz = -1; dz <= 1 && clear; dz++) {
      for (const j of grid.get(`${cx + dx},${cy + dy},${cz + dz}`) ?? []) {
        if (Math.hypot(candPoints[j * 3] - x, candPoints[j * 3 + 1] - y, candPoints[j * 3 + 2] - z) < radius) { clear = false; break; }
      }
    }
    if (!clear) continue;
    accepted.push(c);
    const key = cellKey(x, y, z);
    const bucket = grid.get(key);
    if (bucket) bucket.push(c);
    else grid.set(key, [c]);
  }
  return accepted;
};
const restBounds = new THREE.Box3();
for (let c = 0; c < CANDIDATES; c++) restBounds.expandByPoint(restVertex.set(candPoints[c * 3], candPoints[c * 3 + 1], candPoints[c * 3 + 2]));
let lowR = 0, highR = restBounds.getSize(new THREE.Vector3()).length() / 20;
for (let step = 0; step < 18; step++) {
  const middle = (lowR + highR) / 2;
  if (dart(middle).length >= SAMPLES) lowR = middle;
  else highR = middle;
}
const chosen = dart(lowR);
if (chosen.length < SAMPLES) throw new Error("bird bake: blue-noise sampling fell short");
const vertices = new Uint32Array(SAMPLES * 3);
const barycentrics = new Float32Array(SAMPLES * 2);
chosen.forEach((c, sample) => {
  vertices.set(candVertices.subarray(c * 3, c * 3 + 3), sample * 3);
  barycentrics.set(candBary.subarray(c * 2, c * 2 + 2), sample * 2);
});

const positions = new Float32Array(TEX_W * TEX_H * 4);
const mixer = new THREE.AnimationMixer(scene);
const clip = gltf.animations[0];
if (!clip) throw new Error("bird glb: no animation clip found");
mixer.clipAction(clip).play();

const skinnedVertex = new THREE.Vector3();
const point = new THREE.Vector3();
const offsetOf = (frame, sample) => {
  const row = frame * ROWS_PER_FRAME + Math.floor(sample / TEX_W);
  return (row * TEX_W + (sample % TEX_W)) * 4;
};

for (let frame = 0; frame < FRAMES; frame++) {
  mixer.setTime((frame / FRAMES) * clip.duration);
  scene.updateMatrixWorld(true);
  for (let sample = 0; sample < SAMPLES; sample++) {
    point.set(0, 0, 0);
    const u = barycentrics[sample * 2];
    const v = barycentrics[sample * 2 + 1];
    const weights = [u, v, 1 - u - v];
    for (let corner = 0; corner < 3; corner++) {
      const vertex = vertices[sample * 3 + corner];
      skinnedVertex.fromBufferAttribute(position, vertex);
      mesh.applyBoneTransform(vertex, skinnedVertex);
      point.addScaledVector(skinnedVertex, weights[corner]);
    }
    point.applyMatrix4(mesh.matrixWorld);
    const offset = offsetOf(frame, sample);
    positions[offset] = point.x;
    positions[offset + 1] = point.y;
    positions[offset + 2] = point.z;
    positions[offset + 3] = random();
  }
}

const bounds = new THREE.Box3();
for (let sample = 0; sample < SAMPLES; sample++) {
  const offset = offsetOf(0, sample);
  bounds.expandByPoint(point.set(positions[offset], positions[offset + 1], positions[offset + 2]));
}
const center = bounds.getCenter(new THREE.Vector3());
const size = bounds.getSize(new THREE.Vector3());
const scale = 3.4 / Math.max(size.x, size.y, size.z);
for (let frame = 0; frame < FRAMES; frame++) {
  for (let sample = 0; sample < SAMPLES; sample++) {
    const offset = offsetOf(frame, sample);
    positions[offset] = (positions[offset] - center.x) * scale;
    positions[offset + 1] = (positions[offset + 1] - center.y) * scale;
    positions[offset + 2] = (positions[offset + 2] - center.z) * scale;
  }
}

const normals = new Float32Array(TEX_W * ROWS_PER_FRAME * 4);
const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
for (let sample = 0; sample < SAMPLES; sample++) {
  point.set(0, 0, 0);
  const u = barycentrics[sample * 2];
  const v = barycentrics[sample * 2 + 1];
  const weights = [u, v, 1 - u - v];
  for (let corner = 0; corner < 3; corner++) {
    skinnedVertex.fromBufferAttribute(normal, vertices[sample * 3 + corner]);
    point.addScaledVector(skinnedVertex, weights[corner]);
  }
  point.applyMatrix3(normalMatrix).normalize();
  const offset = (Math.floor(sample / TEX_W) * TEX_W + (sample % TEX_W)) * 4;
  normals[offset] = point.x;
  normals[offset + 1] = point.y;
  normals[offset + 2] = point.z;
}

const toHalf = (sourceArray) => {
  const result = new Uint16Array(sourceArray.length);
  for (let i = 0; i < sourceArray.length; i++) {
    result[i] = THREE.DataUtils.toHalfFloat(sourceArray[i]);
  }
  return result;
};
const packedPositions = toHalf(positions);
const packedNormals = toHalf(normals);
await writeFile(
  output,
  Buffer.concat([
    Buffer.from(packedPositions.buffer),
    Buffer.from(packedNormals.buffer),
  ]),
);

console.log(
  `bird bake: ${SAMPLES} samples × ${FRAMES} frames → ${(packedPositions.byteLength + packedNormals.byteLength) / 1024} KiB`,
);
