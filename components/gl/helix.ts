// The card helix around the bird: shared geometry for the renderer
// (cards-layer), the stage's pointer picking and the HUD panel that names
// the card in front. Cards sit on a vertical cylinder around the bird,
// each bent to the cylinder and tilted along the helix pitch; scrolling
// raises the whole helix (the camera appears to descend) and turns it, so
// each card passes the front exactly as it crosses the bird's height.

// Share of the journey's pinned run spent on the card helix; the rest is
// the descent through the galaxies.
export const HELIX_SHARE = 0.62;

// How far each card leans along the helix pitch (0 = level).
export const TILT = 0.3;

export const HELIX = {
  radius: 2.5,
  arc: 0.9, // card width in radians of the cylinder
  height: 1.34, // card height in world units
  angleStep: 1.15, // turn between neighbouring cards
  yStep: 1.2, // drop between neighbouring cards
  centreY: 0.1, // the bird's height on the axis
};

// Offset for a helix progress 0..1 across `count` cards: card i is at the
// front when offset === i.
export function helixOffset(progress: number, count: number) {
  return progress * (count - 1);
}

// Card i's centre angle (0 = facing the camera) and height for an offset.
export function cardPlacement(i: number, offset: number) {
  const rel = i - offset;
  return { angle: rel * HELIX.angleStep, y: HELIX.centreY - rel * HELIX.yStep, rel };
}

// Front card for an offset.
export function frontCard(offset: number, count: number) {
  return Math.max(0, Math.min(count - 1, Math.round(offset)));
}

// Pointer picking: which card a world-space ray hits first (front surface
// of the cylinder), or -1.
export function pickCard(origin: [number, number, number], dir: [number, number, number], offset: number, count: number) {
  const [ox, oy, oz] = origin;
  const [dx, dy, dz] = dir;
  const a = dx * dx + dz * dz;
  const b = 2 * (ox * dx + oz * dz);
  const c = ox * ox + oz * oz - HELIX.radius * HELIX.radius;
  const disc = b * b - 4 * a * c;
  if (disc < 0 || a < 1e-6) return -1;
  const t = (-b - Math.sqrt(disc)) / (2 * a);
  if (t <= 0) return -1;
  const x = ox + dx * t, y = oy + dy * t, z = oz + dz * t;
  const hitAngle = Math.atan2(x, z);
  for (let i = 0; i < count; i++) {
    const p = cardPlacement(i, offset);
    let d = hitAngle - p.angle;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) > HELIX.arc / 2) continue;
    // The card is tilted along the pitch: its centre height shifts with d.
    const slope = -HELIX.yStep / HELIX.angleStep;
    const cy = p.y + d * slope * TILT;
    if (Math.abs(y - cy) <= HELIX.height / 2) return i;
  }
  return -1;
}
