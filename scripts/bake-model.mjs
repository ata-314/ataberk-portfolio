// Offline hologram-model bake.
// Run with: node scripts/bake-model.mjs
//
// Samples the Ataberk Soylu scan (geometry only — the GLB carries no texture)
// into a half-float point set. Likeness lives in the face, so sampling is
// weighted toward the head and the front of the face, and every sample stores
// a two-scale cavity term (how far the surface dips inward around it). The
// shader darkens by cavity, which is what makes eye sockets, the nose line and
// the mouth read. The browser downloads only the result, never the 55 MB GLB.
//
// Layout (Uint16 half floats): positions [x, y, z, random] then normals
// [nx, ny, nz, cavity], each TEX_W × ROWS × 4.
import { readFile, writeFile } from "node:fs/promises";
import { DataUtils } from "three";

const SAMPLES = 120000;
// Dense, unweighted helper cloud used only to estimate cavity.
const AUX_SAMPLES = 320000;
const TEX_W = 2048;
const ROWS = Math.ceil(SAMPLES / TEX_W);
// Cavity radii in scan units (the head is ~0.9 units tall): fine detail
// (lips, nostrils, glasses rim) and feature scale (eye sockets, cheeks).
const RADII = [0.035, 0.085];
const source = new URL("../public/models/ataberk_soylu_model.glb", import.meta.url);
const output = new URL("../public/models/ataberk-bake.bin", import.meta.url);

let seed = 0x51f15e;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// --- Parse the GLB directly: one mesh, POSITION + indices, no textures.
const file = await readFile(source);
const jsonLength = file.readUInt32LE(12);
const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
const binStart = 20 + jsonLength + 8;
const view = (accessor) => {
  const bufferView = gltf.bufferViews[accessor.bufferView];
  const start = file.byteOffset + binStart + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  return file.buffer.slice(start, start + bufferView.byteLength);
};
const primitive = gltf.meshes[0].primitives[0];
const position = new Float32Array(view(gltf.accessors[primitive.attributes.POSITION]));
const index = new Uint32Array(view(gltf.accessors[primitive.indices]));
const vertexCount = position.length / 3;
const triangleCount = index.length / 3;
console.log(`model bake: ${vertexCount} vertices, ${triangleCount} triangles`);

// --- Area-weighted vertex normals and per-triangle areas.
const normal = new Float32Array(vertexCount * 3);
const area = new Float64Array(triangleCount);
for (let t = 0; t < triangleCount; t++) {
  const a = index[t * 3] * 3;
  const b = index[t * 3 + 1] * 3;
  const c = index[t * 3 + 2] * 3;
  const ux = position[b] - position[a];
  const uy = position[b + 1] - position[a + 1];
  const uz = position[b + 2] - position[a + 2];
  const vx = position[c] - position[a];
  const vy = position[c + 1] - position[a + 1];
  const vz = position[c + 2] - position[a + 2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  area[t] = Math.hypot(nx, ny, nz) * 0.5;
  for (const v of [a, b, c]) {
    normal[v] += nx;
    normal[v + 1] += ny;
    normal[v + 2] += nz;
  }
}
for (let v = 0; v < vertexCount; v++) {
  const l = Math.hypot(normal[v * 3], normal[v * 3 + 1], normal[v * 3 + 2]) || 1;
  normal[v * 3] /= l;
  normal[v * 3 + 1] /= l;
  normal[v * 3 + 2] /= l;
}

// --- Sampling pools. The display pool favours the head (y above the neck
// line ≈ 0) and front-facing face surface (+z is forward).
const cumulative = (weightOf) => {
  const sums = new Float64Array(triangleCount);
  let total = 0;
  for (let t = 0; t < triangleCount; t++) {
    total += weightOf(t);
    sums[t] = total;
  }
  return sums;
};
const centroid = (t, axis) =>
  (position[index[t * 3] * 3 + axis] + position[index[t * 3 + 1] * 3 + axis] + position[index[t * 3 + 2] * 3 + axis]) / 3;
const faceNormalZ = (t) =>
  (normal[index[t * 3] * 3 + 2] + normal[index[t * 3 + 1] * 3 + 2] + normal[index[t * 3 + 2] * 3 + 2]) / 3;
const displayPool = cumulative((t) => {
  const y = centroid(t, 1);
  const head = smoothstep(-0.2, 0.05, y);
  const face = head * smoothstep(0.05, 0.55, faceNormalZ(t)) * smoothstep(0.05, 0.25, y);
  return area[t] * (1 + 3 * head) * (1 + 1.6 * face);
});
const uniformPool = cumulative((t) => area[t]);

const pick = (pool) => {
  const target = random() * pool[pool.length - 1];
  let low = 0;
  let high = pool.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (pool[middle] < target) low = middle + 1;
    else high = middle;
  }
  return low;
};
const samplePoint = (pool, out, outNormal, o) => {
  const t = pick(pool);
  let u = random();
  let v = random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  const w = [u, v, 1 - u - v];
  let nx = 0;
  let ny = 0;
  let nz = 0;
  out[o] = out[o + 1] = out[o + 2] = 0;
  for (let k = 0; k < 3; k++) {
    const i = index[t * 3 + k] * 3;
    out[o] += position[i] * w[k];
    out[o + 1] += position[i + 1] * w[k];
    out[o + 2] += position[i + 2] * w[k];
    nx += normal[i] * w[k];
    ny += normal[i + 1] * w[k];
    nz += normal[i + 2] * w[k];
  }
  if (outNormal) {
    const l = Math.hypot(nx, ny, nz) || 1;
    outNormal[o] = nx / l;
    outNormal[o + 1] = ny / l;
    outNormal[o + 2] = nz / l;
  }
};

const positions = new Float32Array(TEX_W * ROWS * 4);
const normals = new Float32Array(TEX_W * ROWS * 4);
for (let s = 0; s < SAMPLES; s++) {
  samplePoint(displayPool, positions, normals, s * 4);
  positions[s * 4 + 3] = random();
}
const aux = new Float32Array(AUX_SAMPLES * 3);
for (let s = 0; s < AUX_SAMPLES; s++) samplePoint(uniformPool, aux, null, s * 3);

// --- Cavity: centroid of the surface within radius r, measured along the
// normal. Flat → 0, dips (sockets, creases) → positive, bumps → negative.
const cell = RADII[RADII.length - 1];
const grid = new Map();
const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
for (let s = 0; s < AUX_SAMPLES; s++) {
  const k = key(aux[s * 3], aux[s * 3 + 1], aux[s * 3 + 2]);
  let bucket = grid.get(k);
  if (!bucket) grid.set(k, (bucket = []));
  bucket.push(s);
}
const cavity = new Float32Array(SAMPLES);
for (let s = 0; s < SAMPLES; s++) {
  const px = positions[s * 4];
  const py = positions[s * 4 + 1];
  const pz = positions[s * 4 + 2];
  const cx = Math.floor(px / cell);
  const cy = Math.floor(py / cell);
  const cz = Math.floor(pz / cell);
  const sums = RADII.map(() => [0, 0, 0, 0]);
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++)
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
        if (!bucket) continue;
        for (const a of bucket) {
          const ox = aux[a * 3] - px;
          const oy = aux[a * 3 + 1] - py;
          const oz = aux[a * 3 + 2] - pz;
          const d2 = ox * ox + oy * oy + oz * oz;
          RADII.forEach((r, i) => {
            if (d2 > r * r) return;
            sums[i][0] += ox;
            sums[i][1] += oy;
            sums[i][2] += oz;
            sums[i][3]++;
          });
        }
      }
  let value = 0;
  RADII.forEach((r, i) => {
    const [sx, sy, sz, n] = sums[i];
    if (!n) return;
    const along = (sx * normals[s * 4] + sy * normals[s * 4 + 1] + sz * normals[s * 4 + 2]) / n;
    value += (along / r) * 0.5;
  });
  cavity[s] = value;
  if (s % 20000 === 0) console.log(`model bake: cavity ${s}/${SAMPLES}`);
}
// Normalize to roughly [-1, 1] by the 97th percentile magnitude.
const sorted = Float32Array.from(cavity, Math.abs).sort();
const spread = sorted[Math.floor(SAMPLES * 0.97)] || 1;
for (let s = 0; s < SAMPLES; s++) normals[s * 4 + 3] = Math.max(-1, Math.min(1, cavity[s] / spread));

// --- Center the scan and scale its largest axis to 3.4 world units.
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (let s = 0; s < SAMPLES; s++)
  for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], positions[s * 4 + k]);
    max[k] = Math.max(max[k], positions[s * 4 + k]);
  }
const scale = 3.4 / Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
for (let s = 0; s < SAMPLES; s++)
  for (let k = 0; k < 3; k++) positions[s * 4 + k] = (positions[s * 4 + k] - (min[k] + max[k]) / 2) * scale;

const toHalf = (values) => Uint16Array.from(values, (v) => DataUtils.toHalfFloat(v));
const packed = [toHalf(positions), toHalf(normals)];
await writeFile(output, Buffer.concat(packed.map((p) => Buffer.from(p.buffer))));
console.log(
  `model bake: ${SAMPLES} samples (${ROWS} rows), scale ${scale.toFixed(3)} → ${
    (packed[0].byteLength + packed[1].byteLength) / 1024
  } KiB`,
);
