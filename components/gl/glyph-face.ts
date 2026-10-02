// ModdTeam's live face: a face made of code glyphs, redrawn every frame on a
// 2D canvas that the work card (and its particle interior) uses as its
// screen. Its shape is a small luminance map taken from ModdTeam's own
// realtime-voice screen (/work/moddteam-face.png); everything else is alive:
// glyphs keep changing, the head sways and breathes, the eyes blink, the
// mouth moves with a speech-like rhythm, a scan line passes, and code rain
// falls behind it.

const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789<>=+*/:";
const W = 1024, H = 635;

type Mask = { w: number; h: number; data: Float32Array };

function loadMask(url: string): Promise<Mask> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const g = c.getContext("2d");
      if (!g) return reject(new Error("2d context"));
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, c.width, c.height).data;
      const w = c.width, h = c.height;
      const raw = new Float32Array(w * h);
      for (let i = 0; i < raw.length; i++) raw[i] = px[i * 4] / 255;
      // Unsharp mask: the broad light minus a wide blur brings the features
      // (sockets, nose, lips) forward out of the even glyph density.
      const blur = new Float32Array(w * h), R = 5;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let sum = 0, n = 0;
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          sum += raw[yy * w + xx]; n++;
        }
        blur[y * w + x] = sum / n;
      }
      const data = new Float32Array(w * h);
      for (let i = 0; i < data.length; i++) {
        const v = raw[i] + (raw[i] - blur[i]) * 1.6;
        const t = Math.max(0, Math.min(1, (v - 0.14) / 0.62));
        data[i] = Math.pow(t * t * (3 - 2 * t), 1.15);
      }
      resolve({ w, h, data });
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Bilinear read of the mask at normalised (u, v); 0 outside.
function sample(m: Mask, u: number, v: number) {
  if (u < 0 || v < 0 || u > 1 || v > 1) return 0;
  const x = u * (m.w - 1), y = v * (m.h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, m.w - 1), y1 = Math.min(y0 + 1, m.h - 1);
  const fx = x - x0, fy = y - y0;
  const a = m.data[y0 * m.w + x0], b = m.data[y0 * m.w + x1], c = m.data[y1 * m.w + x0], d = m.data[y1 * m.w + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

const smooth = (x: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createGlyphFace(maskUrl: string, small: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  let mask: Mask | null = null;
  const ready = loadMask(maskUrl).then((m) => { mask = m; }).catch(() => {});

  // Face grid: glyph cells over the face's box, centred on the card.
  const cell = small ? 13 : 11;
  const faceH = H * 0.96, faceW = faceH * (88 / 118);
  const pitch = cell * 0.86;
  const cols = Math.floor(faceW / pitch), rows = Math.floor(faceH / cell);
  const glyph = new Uint8Array(cols * rows).map(() => Math.floor(Math.random() * GLYPHS.length));
  // Rain behind: one head per column, each at its own speed.
  const rainCols = Math.floor(W / 15);
  const heads = Array.from({ length: rainCols }, () => ({ y: Math.random() * H, v: 60 + Math.random() * 160, len: 6 + Math.floor(Math.random() * 16), seed: Math.random() * 1000 }));
  let blinkAt = 2.5, last = 0;

  const draw = (t: number) => {
    const dt = Math.min(0.1, Math.max(0, t - last));
    last = t;
    ctx.fillStyle = "#050806";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Code rain.
    ctx.font = `12px ui-monospace, Menlo, monospace`;
    heads.forEach((r, i) => {
      r.y += r.v * dt;
      if (r.y - r.len * 14 > H) { r.y = -Math.random() * 200; r.v = 60 + Math.random() * 160; }
      for (let k = 0; k < r.len; k++) {
        const y = r.y - k * 14;
        if (y < -10 || y > H + 10) continue;
        const a = (1 - k / r.len) * (k === 0 ? 0.55 : 0.22);
        ctx.fillStyle = k === 0 ? `rgba(220,255,180,${a})` : `rgba(130,200,60,${a})`;
        ctx.fillText(GLYPHS[(Math.floor(r.seed + y * 0.07 + t * 3) + k) % GLYPHS.length], i * 15 + 8, y);
      }
    });

    if (!mask) return;
    // Life: sway, breath, blink, speech.
    const sway = Math.sin(t * 0.45) * 0.012 + Math.sin(t * 0.21) * 0.008;
    const nod = Math.sin(t * 0.33) * 0.008;
    const breath = 1 + Math.sin(t * 0.9) * 0.01;
    if (t > blinkAt + 0.18) blinkAt = t + 2.2 + Math.random() * 3.5;
    const blink = t > blinkAt ? 1 - Math.abs((t - blinkAt) / 0.09 - 1) : 0;
    const speak = Math.max(0, Math.sin(t * 7.3) * 0.5 + Math.sin(t * 11.1 + 1) * 0.35 + Math.sin(t * 2.3) * 0.4) * smooth(Math.sin(t * 0.7), -0.3, 0.2);
    const scan = (t * 0.22) % 1.3 - 0.15;

    const x0 = (W - cols * pitch) / 2, y0 = (H - rows * cell) / 2;
    ctx.font = `600 ${cell}px ui-monospace, Menlo, monospace`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let u = (c + 0.5) / cols, v = (r + 0.5) / rows;
        // Pose: sample the mask through a small sway/nod/breath transform.
        u = (u - 0.5) / breath + 0.5 - sway;
        v = (v - 0.45) / breath + 0.45 - nod;
        // Eyes close: the lids pull the brightness down over each eye.
        const eye = Math.min(Math.hypot((u - 0.32) / 0.09, (v - 0.37) / 0.04), Math.hypot((u - 0.61) / 0.09, (v - 0.37) / 0.04));
        // Mouth opens: the lips part (a dark gap) and the lip glyphs lift.
        const mouthD = Math.hypot((u - 0.47) / 0.12, (v - 0.72) / 0.028);
        let b = sample(mask, u, v + (v > 0.72 ? -speak * 0.012 : speak * 0.006));
        b *= 1 - blink * 0.9 * smooth(1.4 - eye, 0, 0.6);
        if (mouthD < 1) b *= 1 - speak * 0.85 * (1 - mouthD);
        else if (mouthD < 1.8) b += speak * 0.25 * (1.8 - mouthD) * sample(mask, u, v);
        b += Math.exp(-((v - scan) ** 2) * 900) * 0.35 * b;
        if (b < 0.05) continue;
        const i = r * cols + c;
        if (Math.random() < 0.02 + b * 0.05) glyph[i] = Math.floor(Math.random() * GLYPHS.length);
        const L = Math.min(1, b * 1.15);
        ctx.fillStyle = L > 0.9 ? `rgba(244,255,226,${L})` : `rgba(${Math.round(110 + L * 110)},${Math.round(170 + L * 85)},${Math.round(40 + L * 60)},${0.25 + L * 0.75})`;
        ctx.fillText(GLYPHS[glyph[i]], x0 + (c + 0.5) * pitch, y0 + (r + 0.5) * cell);
      }
    }
  };

  return { canvas, ready, draw };
}
