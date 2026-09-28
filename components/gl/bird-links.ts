// Surface neighbourhood for the baked bird samples. Each sample stores its
// three nearest neighbours (rest pose), so the shader can fill the surface
// with grains on the small triangles between samples and draw the plexus
// cage along the same edges. Built once at load from the bake itself.

function halfToFloat(h: number) {
  const sign = h & 0x8000 ? -1 : 1;
  const exponent = (h >> 10) & 0x1f;
  const fraction = h & 0x3ff;
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

// positions: the first frame of the bake (RGBA half floats, sample-major).
// Returns RGBA32F texels: three neighbour indices (self when none is close).
export function buildBirdLinks(positions: Uint16Array, samples: number, width: number) {
  const points = new Float32Array(samples * 3);
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < samples; i++) {
    const x = halfToFloat(positions[i * 4]);
    const y = halfToFloat(positions[i * 4 + 1]);
    const z = halfToFloat(positions[i * 4 + 2]);
    points.set([x, y, z], i * 3);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  const cell = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 70;
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const cellOf = (v: number, min: number) => Math.floor((v - min) / cell);
  const grid = new Map<string, number[]>();
  for (let i = 0; i < samples; i++) {
    const k = key(cellOf(points[i * 3], minX), cellOf(points[i * 3 + 1], minY), cellOf(points[i * 3 + 2], minZ));
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
  }

  const near = new Int32Array(samples * 3).fill(-1);
  const dist = new Float32Array(samples * 3).fill(Infinity);
  for (let i = 0; i < samples; i++) {
    const px = points[i * 3], py = points[i * 3 + 1], pz = points[i * 3 + 2];
    const cx = cellOf(px, minX), cy = cellOf(py, minY), cz = cellOf(pz, minZ);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const bucket = grid.get(key(cx + dx, cy + dy, cz + dz));
      if (!bucket) continue;
      for (const j of bucket) {
        if (j === i) continue;
        const d = Math.hypot(points[j * 3] - px, points[j * 3 + 1] - py, points[j * 3 + 2] - pz);
        if (d < 1e-5 || d >= dist[i * 3 + 2]) continue;
        // Insert into the sorted top three.
        let slot = 2;
        while (slot > 0 && d < dist[i * 3 + slot - 1]) {
          dist[i * 3 + slot] = dist[i * 3 + slot - 1];
          near[i * 3 + slot] = near[i * 3 + slot - 1];
          slot--;
        }
        dist[i * 3 + slot] = d;
        near[i * 3 + slot] = j;
      }
    }
  }

  // Long edges would bridge separate parts (wing to body): drop them.
  const firsts = Array.from({ length: samples }, (_, i) => dist[i * 3]).filter(Number.isFinite).sort((a, b) => a - b);
  const limit = (firsts[Math.floor(firsts.length / 2)] ?? cell) * 3.2;
  const rows = Math.ceil(samples / width);
  const texels = new Float32Array(width * rows * 4);
  for (let i = 0; i < samples; i++) {
    for (let k = 0; k < 3; k++) {
      const j = near[i * 3 + k];
      texels[i * 4 + k] = j >= 0 && dist[i * 3 + k] < limit ? j : i;
    }
  }
  return { texels, rows };
}
