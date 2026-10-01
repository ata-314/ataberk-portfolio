// The particle sea: a dense sheet of lit grains wrapped into a wall that
// curves round the scene, its relief flowing along the scroll. The pointer
// (projected onto the wall) parts and drags the grains through a small GPU
// simulation. Shared by the selected-work backdrop and the services section,
// each with its own instance, palette and arrival.
import { dataFragment, dataVertex, fullscreenVertex, seaSimFragment } from "./work-shaders";

type Vec3 = [number, number, number];

export type SeaFrame = {
  view: Float32Array;
  projection: Float32Array;
  camera: Vec3;
  time: number;
  delta: number;
  width: number; // drawing buffer px
  height: number;
  travel: number; // integrated flow distance along the sheet
  cursor: [number, number]; // NDC
  cursorOn: number; // 0..1, the pointer may stir the grains
  reveal: number; // 0 absent → 1 whole; the emergence/sinking animation
  amount: number; // overall opacity
};

export const SEA_PALETTE = { work: 0, services: 1 } as const;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const make = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "sea shader");
    return s;
  };
  const p = gl.createProgram()!;
  const v = make(gl.VERTEX_SHADER, vs);
  const f = make(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "sea link");
  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
    return cache.get(name) ?? null;
  };
  return { p, u };
}

const damp = (c: number, t: number, k: number, d: number) => c + (t - c) * (1 - Math.exp(-k * d));

export function createSeaLayer(gl: WebGL2RenderingContext, mobile: boolean, palette: number) {
  const data = compile(gl, dataVertex, dataFragment);
  const seaSim = gl.getExtension("EXT_color_buffer_float") ? compile(gl, fullscreenVertex, seaSimFragment) : null;
  const emptyVao = gl.createVertexArray();
  // Dense like the hero's sea: grains a couple of pixels apart.
  const cols = mobile ? 300 : 560;
  const rows = mobile ? 170 : 300;
  const WIDTH = 30, SPAN = 17, RADIUS = 10.5;
  // Simulation targets: one texel per grain, ping-ponged.
  const targets = seaSim
    ? [0, 1].map(() => {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cols, rows, 0, gl.RGBA, gl.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const fbo = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        return { tex, fbo };
      })
    : [];
  let read = 0;
  let reset = true;
  // The pointer on the sheet: a damped follower (so the force glides with
  // the hand, never jumps) and its velocity.
  const cursor = new Float32Array(4);
  let cursorOn = 0;
  let primed = false;

  // Where the cursor ray meets the wall's cylinder, in sheet units.
  const cursorOnSea = (f: SeaFrame): [number, number] | null => {
    const v = f.view;
    const t = Math.tan(Math.PI / 8), aspect = f.width / Math.max(f.height, 1);
    const dv = [f.cursor[0] * t * aspect, f.cursor[1] * t, -1];
    const d = [
      v[0] * dv[0] + v[1] * dv[1] + v[2] * dv[2],
      v[4] * dv[0] + v[5] * dv[1] + v[6] * dv[2],
      v[8] * dv[0] + v[9] * dv[1] + v[10] * dv[2],
    ];
    const o = [f.camera[0], f.camera[1], f.camera[2] + 1.5];
    const a = d[0] * d[0] + d[2] * d[2];
    const b = 2 * (o[0] * d[0] + o[2] * d[2]);
    const c = o[0] * o[0] + o[2] * o[2] - RADIUS * RADIUS;
    const disc = b * b - 4 * a * c;
    if (disc < 0 || a < 1e-6) return null;
    const hit = (-b + Math.sqrt(disc)) / (2 * a);
    const x = o[0] + d[0] * hit, y = f.camera[1] + d[1] * hit, z = o[2] + d[2] * hit;
    return [Math.atan2(x, -z) * 10, y];
  };

  const step = (f: SeaFrame, target: WebGLFramebuffer | null) => {
    if (!seaSim) return;
    const hit = cursorOnSea(f);
    const on = hit && f.cursorOn > 0.5 ? 1 : 0;
    const dt = Math.min(Math.max(f.delta, 1 / 240), 1 / 30);
    if (hit) {
      if (!primed) {
        cursor[0] = hit[0];
        cursor[1] = hit[1];
        primed = true;
      }
      const px = cursor[0], py = cursor[1];
      cursor[0] = damp(cursor[0], hit[0], 9, f.delta);
      cursor[1] = damp(cursor[1], hit[1], 9, f.delta);
      cursor[2] = damp(cursor[2], Math.max(-40, Math.min(40, (cursor[0] - px) / dt)), 8, f.delta);
      cursor[3] = damp(cursor[3], Math.max(-40, Math.min(40, (cursor[1] - py) / dt)), 8, f.delta);
    }
    cursorOn = damp(cursorOn, on, 5, f.delta);
    gl.disable(gl.BLEND);
    gl.useProgram(seaSim.p);
    gl.bindVertexArray(emptyVao);
    gl.viewport(0, 0, cols, rows);
    gl.uniform2f(seaSim.u("uGrid"), cols, rows);
    gl.uniform1f(seaSim.u("uWidth"), WIDTH);
    gl.uniform1f(seaSim.u("uSpan"), SPAN);
    gl.uniform1f(seaSim.u("uTime"), f.time);
    gl.uniform4fv(seaSim.u("uCursor"), cursor);
    gl.uniform1f(seaSim.u("uCursorOn"), cursorOn);
    gl.uniform1i(seaSim.u("uState"), 13);
    for (let k = 0; k < 2; k++) {
      const write = 1 - read;
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[write].fbo);
      gl.activeTexture(gl.TEXTURE13);
      gl.bindTexture(gl.TEXTURE_2D, targets[read].tex);
      gl.uniform1f(seaSim.u("uDt"), dt / 2);
      gl.uniform1f(seaSim.u("uReset"), reset ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      read = write;
      reset = false;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, f.width, f.height);
    gl.enable(gl.BLEND);
  };

  return {
    render(f: SeaFrame, target: WebGLFramebuffer | null) {
      if (f.reveal <= 0.001) {
        // Gone: the next arrival starts from a calm sheet.
        reset = true;
        primed = false;
        return;
      }
      step(f, target);
      gl.useProgram(data.p);
      gl.bindVertexArray(emptyVao);
      gl.activeTexture(gl.TEXTURE13);
      gl.bindTexture(gl.TEXTURE_2D, seaSim ? targets[read].tex : null);
      gl.uniform1i(data.u("uState"), 13);
      gl.uniform1f(data.u("uSimOn"), seaSim ? 1 : 0);
      gl.uniformMatrix4fv(data.u("uView"), false, f.view);
      gl.uniformMatrix4fv(data.u("uProj"), false, f.projection);
      gl.uniform2f(data.u("uGrid"), cols, rows);
      gl.uniform1f(data.u("uTime"), f.time);
      gl.uniform1f(data.u("uTravel"), f.travel);
      gl.uniform1f(data.u("uPalette"), palette);
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.uniform1f(data.u("uAmount"), f.amount);
      gl.uniform1f(data.u("uDpr"), f.height / 900);
      gl.uniform1f(data.u("uReveal"), f.reveal);
      gl.uniform1f(data.u("uAspect"), f.width / Math.max(f.height, 1));
      gl.drawArrays(gl.POINTS, 0, cols * rows);
    },
    dispose() {
      gl.deleteProgram(data.p);
      if (seaSim) gl.deleteProgram(seaSim.p);
      targets.forEach((t) => {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      });
      gl.deleteVertexArray(emptyVao);
    },
  };
}
