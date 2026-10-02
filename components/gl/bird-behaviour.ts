// Bird behaviour: a small state machine that keeps the flight from ever
// repeating. Actions (glide, dart, stoop, snap turn, climb, flutter, arc,
// receding deep into space, sweeping up close to the screen, banked turns
// through the depth, loops and barrel rolls)
// alternate with stretches of plain cruising; each next action is drawn by
// weight, never one of the last two, with its own random duration,
// amplitude and side. Layered value noise adds a continuous, non-periodic
// wander on top. Outputs are offsets and wing/attitude targets that the
// stage eases toward, so every change reads as a reflex, not a keyframe.

type Kind =
  | "cruise" | "glide" | "dart" | "stoop" | "turn" | "climb" | "flutter" | "arc"
  | "recede" | "approach" | "bankTurn" | "loop" | "barrel";

type Action = { kind: Kind; start: number; length: number; side: number; amount: number; phase: number };

// Bake frames: 14.2 holds the wings level, 9.5 folds them down.
export const LEVEL_FRAME = 14.2 / 16;
export const FOLD_FRAME = 9.5 / 16;

// Attitude: bank/pitch are eased targets; yaw is a heading measured from the
// bird's current facing side (0 = toward the camera, π = away) blended in by
// yawMix; spinPitch/spinRoll are whole turns applied directly (they start and
// end on a full revolution, so they must not be eased).
export type BirdMotion = {
  x: number; y: number; z: number;
  bank: number; pitch: number;
  yaw: number; yawMix: number;
  spinPitch: number; spinRoll: number;
  beat: number; hold: number; holdFrame: number;
  turn: boolean; snappy: boolean;
};

const ACTIONS: { kind: Kind; weight: number; length: [number, number] }[] = [
  { kind: "glide", weight: 3, length: [3.2, 5.5] },
  { kind: "dart", weight: 2, length: [0.8, 1.3] },
  { kind: "stoop", weight: 2, length: [1.1, 1.7] },
  { kind: "turn", weight: 1.5, length: [1.2, 1.7] },
  { kind: "climb", weight: 1.5, length: [1.2, 1.9] },
  { kind: "flutter", weight: 1.2, length: [1.4, 2.4] },
  { kind: "arc", weight: 1.3, length: [2.8, 4.2] },
  { kind: "recede", weight: 1.8, length: [4.5, 7] },
  { kind: "approach", weight: 1.6, length: [3.2, 5] },
  { kind: "bankTurn", weight: 2, length: [3.2, 4.8] },
  { kind: "loop", weight: 1.3, length: [2.2, 3.2] },
  { kind: "barrel", weight: 1.2, length: [1.4, 2] },
];

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Smooth 1D value noise in [-1, 1].
function noise1(t: number) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1;
}

const smooth = (x: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// On phones the picture is narrow and close: actions that bring the bird
// at the glass or turn it over (approach, loop, barrel roll) read as a
// shapeless blob there, so they are left out and the depth drift is calmer.
const COMPACT_SKIP: Kind[] = ["approach", "loop", "barrel"];

export function createBirdBehaviour(random: () => number = Math.random, compact = false) {
  const actions = compact ? ACTIONS.filter((a) => !COMPACT_SKIP.includes(a.kind)) : ACTIONS;
  const seed = random() * 1000;
  const recent: Kind[] = [];
  let action: Action = { kind: "cruise", start: 0, length: 4, side: 1, amount: 1, phase: 0 };
  const between = (range: [number, number]) => range[0] + random() * (range[1] - range[0]);

  const next = (time: number) => {
    if (action.kind !== "cruise") {
      action = { kind: "cruise", start: time, length: 1.4 + random() * 3.2, side: 1, amount: 1, phase: 0 };
      return;
    }
    const pool = actions.filter((a) => !recent.includes(a.kind));
    let pick = random() * pool.reduce((sum, a) => sum + a.weight, 0);
    const chosen = pool.find((a) => (pick -= a.weight) <= 0) ?? pool[0];
    recent.push(chosen.kind);
    if (recent.length > 2) recent.shift();
    action = {
      kind: chosen.kind,
      start: time,
      length: between(chosen.length),
      side: random() < 0.5 ? -1 : 1,
      amount: 0.75 + random() * 0.55,
      phase: random() * Math.PI * 2,
    };
  };

  return {
    step(time: number, travel: number): BirdMotion {
      if (time - action.start >= action.length) next(time);
      const m = (time - action.start) / action.length;
      const { side, amount } = action;
      const attack = 1 - Math.pow(1 - Math.min(1, m / 0.25), 3);
      const release = 1 - smooth(m, 0.35, 1);
      const pulse = Math.sin(Math.min(1, m) * Math.PI);
      const motion: BirdMotion = {
        x: 0, y: 0, z: 0, bank: 0, pitch: 0, yaw: 0, yawMix: 0, spinPitch: 0, spinRoll: 0,
        beat: 1, hold: 0, holdFrame: LEVEL_FRAME, turn: false, snappy: false,
      };
      switch (action.kind) {
        case "glide": {
          const on = smooth(m, 0, 0.12) * (1 - smooth(m, 0.82, 1));
          motion.hold = on;
          motion.y = -1.0 * amount * smooth(m, 0.05, 0.95);
          motion.x = travel * 0.75 * amount * smooth(m, 0.05, 0.95);
          motion.pitch = 0.22 * on;
          break;
        }
        case "dart":
          motion.x = side * 1.15 * amount * attack * release;
          motion.z = 0.35 * attack * release;
          motion.bank = side * 0.42 * attack * release;
          motion.beat = 1.9;
          motion.snappy = true;
          break;
        case "stoop":
          motion.y = -1.3 * amount * attack * release;
          motion.x = travel * 0.5 * attack * release;
          motion.hold = attack * (1 - smooth(m, 0.55, 0.8));
          motion.holdFrame = FOLD_FRAME;
          motion.pitch = 0.35 * attack * release;
          motion.snappy = true;
          break;
        case "turn":
          motion.turn = m < 0.7;
          motion.x = -travel * 0.9 * amount * pulse;
          motion.y = 0.3 * pulse;
          motion.bank = side * 0.48 * pulse;
          motion.beat = 1.4;
          motion.snappy = true;
          break;
        case "climb":
          motion.y = 1.05 * amount * attack * release;
          motion.bank = -side * 0.15 * pulse;
          motion.beat = 2.5;
          break;
        case "flutter":
          motion.beat = 2.8 + Math.sin(m * 9) * 0.4;
          motion.y = Math.sin(m * Math.PI * 3) * 0.12 * pulse;
          motion.x = Math.sin(m * Math.PI * 2 + action.phase) * 0.15 * pulse;
          break;
        case "arc": {
          // A full loop in the picture plane, entered and left smoothly.
          const a = m * Math.PI * 2 * side + action.phase;
          const r = 0.7 * amount * pulse;
          motion.x = (Math.cos(a) - Math.cos(action.phase)) * r;
          motion.y = (Math.sin(a) - Math.sin(action.phase)) * r * 0.7;
          motion.bank = Math.cos(a) * 0.35 * pulse * side;
          motion.beat = 1.25;
          break;
        }
        case "recede": {
          // Out into the depth of space until it is a distant speck, then back.
          const out = smooth(m, 0, 0.4) * (1 - smooth(m, 0.68, 1));
          motion.z = -(4 + amount * 2.8) * out;
          motion.y = 0.7 * out;
          motion.x = side * 0.8 * out;
          motion.yaw = 2.5;
          motion.yawMix = out;
          motion.beat = 1.15;
          break;
        }
        case "approach": {
          // Sweeps up to the glass, fills the view for a moment, pulls away.
          const near = smooth(m, 0, 0.45) * (1 - smooth(m, 0.6, 1));
          motion.z = (2.1 + amount * 0.8) * near;
          motion.y = -0.25 * near;
          motion.x = side * 0.45 * near;
          motion.bank = side * 0.15 * near;
          motion.yaw = 0.35;
          motion.yawMix = near;
          motion.beat = 1.3;
          break;
        }
        case "bankTurn": {
          // A level circle through the depth: out, behind, round and back,
          // heading along the path and rolled into the turn.
          const on = smooth(m, 0, 0.15) * (1 - smooth(m, 0.85, 1));
          const a = smooth(m, 0, 1) * Math.PI * 2;
          const r = (0.8 + amount * 0.5) * on;
          motion.x = Math.sin(a) * r * 1.2 * side;
          motion.z = (Math.cos(a) - 1) * r * 1.6;
          motion.yaw = Math.PI / 2 + a;
          motion.yawMix = on * 0.85;
          motion.bank = side * 0.6 * on;
          motion.beat = 1.2;
          break;
        }
        case "loop": {
          // A vertical loop in the bird's own plane, nose over the top.
          const a = smooth(m, 0, 1) * Math.PI * 2;
          const r = 0.75 * amount;
          motion.y = Math.sin(a) * r;
          motion.z = (1 - Math.cos(a)) * r * 0.8;
          motion.spinPitch = -a;
          motion.beat = 1.6;
          break;
        }
        case "barrel": {
          // A full roll about the body while it carries on forward.
          motion.spinRoll = side * smooth(m, 0.1, 0.9) * Math.PI * 2;
          motion.x = travel * 1.1 * pulse;
          motion.y = 0.25 * pulse;
          motion.beat = 1.5;
          motion.snappy = true;
          break;
        }
        default:
          break;
      }
      // Continuous, non-periodic wander: two octaves of value noise per axis.
      const w = (o: number) => noise1(time * 0.21 + seed + o) * 0.7 + noise1(time * 0.53 + seed + o * 1.7) * 0.3;
      motion.x += w(0) * 0.32;
      motion.y += w(40) * 0.24;
      // Depth drifts slowly too, so the bird is never at one distance.
      motion.z += (w(80) * 0.2 + noise1(time * 0.07 + seed + 300) * 0.7) * (compact ? 0.35 : 1);
      motion.bank += w(120) * 0.08;
      motion.beat *= 1 + w(160) * 0.12;
      return motion;
    },
  };
}
