// One download per baked point cloud, shared by every canvas that reads it
// (the stage's bird → bust morph and the About hologram both read the bust).
const bakes = new Map<string, Promise<ArrayBuffer>>();

export function fetchBake(url: string) {
  let bake = bakes.get(url);
  if (!bake) {
    bake = fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${url}: ${r.status}`))));
    bake.catch(() => bakes.delete(url));
    bakes.set(url, bake);
  }
  return bake;
}
