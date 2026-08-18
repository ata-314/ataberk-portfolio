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

const vertices = new Uint32Array(SAMPLES * 3);
const barycentrics = new Float32Array(SAMPLES * 2);
for (let sample = 0; sample < SAMPLES; sample++) {
  const target = random() * areaSum;
  let low = 0;
  let high = triangleCount - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (cumulativeAreas[middle] < target) low = middle + 1;
    else high = middle;
  }
  vertices[sample * 3] = index.getX(low * 3);
  vertices[sample * 3 + 1] = index.getX(low * 3 + 1);
  vertices[sample * 3 + 2] = index.getX(low * 3 + 2);
  let u = random();
  let v = random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  barycentrics[sample * 2] = u;
  barycentrics[sample * 2 + 1] = v;
}

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
