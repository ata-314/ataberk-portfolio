// Offline hologram-model texture bake.
// Run with: node scripts/bake-model.mjs
//
// Samples the Ataberk Soylu scan's surface into the same half-float texture
// layout the bird bake uses, but with a single static frame. The browser only
// ever downloads the ~160 KiB result, never the 55 MB GLB.
import { readFile, writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Node has no DOM image decoding; the bake only needs geometry, so feed the
// loader harmless stubs for the scan's embedded textures.
if (typeof globalThis.createImageBitmap !== "function") {
  globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });
}
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "data:,";
  URL.revokeObjectURL = () => {};
}

const SAMPLES = 9000;
const TEX_W = 2048;
const ROWS_PER_FRAME = Math.ceil(SAMPLES / TEX_W);
const source = new URL("../public/models/ataberk_soylu_model.glb", import.meta.url);
const output = new URL("../public/models/ataberk-bake.bin", import.meta.url);

let seed = 0x51f15e;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const file = await readFile(source);
const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const gltf = await new GLTFLoader().parseAsync(arrayBuffer, "");
const scene = gltf.scene;
scene.updateMatrixWorld(true);

// Collect every mesh surface into one area-weighted triangle pool.
const triangles = [];
let areaSum = 0;
const a = new THREE.Vector3();
const b = new THREE.Vector3();
const c = new THREE.Vector3();
scene.traverse((object) => {
  if (!object.isMesh) return;
  const geometry = object.geometry;
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const position = geometry.attributes.position;
  const index = geometry.index;
  const triangleCount = index ? index.count / 3 : position.count / 3;
  const vertexAt = (t, corner) => (index ? index.getX(t * 3 + corner) : t * 3 + corner);
  for (let t = 0; t < triangleCount; t++) {
    a.fromBufferAttribute(position, vertexAt(t, 0)).applyMatrix4(object.matrixWorld);
    b.fromBufferAttribute(position, vertexAt(t, 1)).applyMatrix4(object.matrixWorld);
    c.fromBufferAttribute(position, vertexAt(t, 2)).applyMatrix4(object.matrixWorld);
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5;
    if (!(area > 0)) continue;
    areaSum += area;
    triangles.push({ object, i0: vertexAt(t, 0), i1: vertexAt(t, 1), i2: vertexAt(t, 2), cumulative: areaSum });
  }
});
if (!triangles.length) throw new Error("model glb: no mesh surface found");
console.log(`model bake: ${triangles.length} triangles pooled`);

const positions = new Float32Array(TEX_W * ROWS_PER_FRAME * 4);
const normals = new Float32Array(TEX_W * ROWS_PER_FRAME * 4);
const point = new THREE.Vector3();
const pointNormal = new THREE.Vector3();
const vertex = new THREE.Vector3();
const normalMatrix = new THREE.Matrix3();

for (let sample = 0; sample < SAMPLES; sample++) {
  const target = random() * areaSum;
  let low = 0;
  let high = triangles.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (triangles[middle].cumulative < target) low = middle + 1;
    else high = middle;
  }
  const triangle = triangles[low];
  const { object } = triangle;
  const geometry = object.geometry;
  let u = random();
  let v = random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const weights = [u, v, 1 - u - v];
  const corners = [triangle.i0, triangle.i1, triangle.i2];
  point.set(0, 0, 0);
  pointNormal.set(0, 0, 0);
  normalMatrix.getNormalMatrix(object.matrixWorld);
  for (let corner = 0; corner < 3; corner++) {
    vertex.fromBufferAttribute(geometry.attributes.position, corners[corner]);
    if (object.isSkinnedMesh) object.applyBoneTransform(corners[corner], vertex);
    else vertex.applyMatrix4(object.matrixWorld);
    point.addScaledVector(vertex, weights[corner]);
    vertex.fromBufferAttribute(geometry.attributes.normal, corners[corner]);
    pointNormal.addScaledVector(vertex, weights[corner]);
  }
  pointNormal.applyMatrix3(normalMatrix).normalize();
  const offset = (Math.floor(sample / TEX_W) * TEX_W + (sample % TEX_W)) * 4;
  positions[offset] = point.x;
  positions[offset + 1] = point.y;
  positions[offset + 2] = point.z;
  positions[offset + 3] = random();
  normals[offset] = pointNormal.x;
  normals[offset + 1] = pointNormal.y;
  normals[offset + 2] = pointNormal.z;
}

// Normalize: center the scan and scale its largest axis to 3.4 world units,
// matching the bird bake so the runtime pose math carries over.
const bounds = new THREE.Box3();
for (let sample = 0; sample < SAMPLES; sample++) {
  const offset = (Math.floor(sample / TEX_W) * TEX_W + (sample % TEX_W)) * 4;
  bounds.expandByPoint(point.set(positions[offset], positions[offset + 1], positions[offset + 2]));
}
const center = bounds.getCenter(new THREE.Vector3());
const size = bounds.getSize(new THREE.Vector3());
const scale = 3.4 / Math.max(size.x, size.y, size.z);
for (let sample = 0; sample < SAMPLES; sample++) {
  const offset = (Math.floor(sample / TEX_W) * TEX_W + (sample % TEX_W)) * 4;
  positions[offset] = (positions[offset] - center.x) * scale;
  positions[offset + 1] = (positions[offset + 1] - center.y) * scale;
  positions[offset + 2] = (positions[offset + 2] - center.z) * scale;
}
console.log(
  `model bake: size ${size.x.toFixed(2)}×${size.y.toFixed(2)}×${size.z.toFixed(2)}, scale ${scale.toFixed(3)}`,
);

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
  Buffer.concat([Buffer.from(packedPositions.buffer), Buffer.from(packedNormals.buffer)]),
);
console.log(
  `model bake: ${SAMPLES} samples × 1 frame → ${(packedPositions.byteLength + packedNormals.byteLength) / 1024} KiB`,
);
