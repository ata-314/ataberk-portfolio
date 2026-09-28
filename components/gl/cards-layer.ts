// Curved glass cards wrapped round the bird (see helix.ts). Each card is a
// grid mesh bent onto the cylinder and tilted along the helix pitch, drawn
// into the stage's HDR scene with depth testing against the bird's grains,
// so cards behind the bird are hidden by it and cards in front cover it.
// Faces carry a canvas-drawn artwork; backs show dark glass.

import { HELIX, TILT, cardPlacement } from "./helix";

export type JourneyCard = {
  kind: string; // HUD label, e.g. "Service" / "Work"
  title: string;
  meta: string;
  mark: string;
  a: string; // palette
  b: string;
};

const SEG_U = 28;
const SEG_V = 6;

const vertex = `#version 300 es
precision highp float;
uniform mat4 view;
uniform mat4 projection;
uniform float angle;
uniform float centreY;
uniform float radius;
uniform float arc;
uniform float height;
uniform float slope;
uniform float lift; // extra outward push while the card is in front
out vec2 vUv;
out vec3 vNormal;
out vec3 vWorld;
void main() {
  int cols=${SEG_U + 1};
  int col=gl_VertexID%cols;
  int row=gl_VertexID/cols;
  vec2 uv=vec2(float(col)/${SEG_U}.0,float(row)/${SEG_V}.0);
  float d=(uv.x-.5)*arc;
  float a=angle+d;
  float r=radius+lift;
  vec3 p=vec3(sin(a)*r,centreY+(uv.y-.5)*height+d*slope*${TILT.toFixed(3)},cos(a)*r);
  vUv=uv;
  vNormal=vec3(sin(a),0.0,cos(a));
  vWorld=p;
  gl_Position=projection*view*vec4(p,1.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D art;
uniform vec3 eye;
uniform float presence;
uniform float focus;
uniform float time;
uniform vec2 aspect; // card width/height for the corner radius
in vec2 vUv;
in vec3 vNormal;
in vec3 vWorld;
out vec4 color;
void main() {
  // Rounded rectangle.
  vec2 q=abs(vUv-.5)*aspect;
  vec2 half_=aspect*.5-vec2(.07);
  float corner=length(max(q-half_,0.0))-.07;
  if(corner>0.0) discard;
  float edge=smoothstep(-.035,0.0,corner);
  vec3 view=normalize(eye-vWorld);
  float facing=dot(view,vNormal);
  float fres=pow(1.0-abs(facing),3.0);
  vec3 c;
  float alpha;
  if(gl_FrontFacing) {
    vec3 tex=texture(art,vec2(vUv.x,1.0-vUv.y)).rgb;
    // A slow sheen sweeping across the glass.
    float sweep=smoothstep(.2,0.0,abs(fract(vUv.x*.6-vUv.y*.3-time*.07)-.5));
    c=tex*mix(.55,1.1,focus)+vec3(.8,.95,1.0)*(fres*.5+edge*.6+sweep*.06);
    // Glass: the bird still reads through the card in front of it.
    alpha=mix(.72,.9,focus);
  } else {
    c=vec3(.03,.06,.07)+vec3(.5,.8,.85)*(fres*.35+edge*.4);
    alpha=.55;
  }
  color=vec4(c,alpha*presence);
}`;

function drawArtwork(card: JourneyCard, font: string, mono: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const { width: w, height: h } = canvas;
  ctx.fillStyle = "#050a0d";
  ctx.fillRect(0, 0, w, h);
  // Living light: two colour masses and a soft band, then fine scanlines.
  const blob = (x: number, y: number, r: number, col: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  ctx.globalCompositeOperation = "lighter";
  blob(w * 0.28, h * 0.38, w * 0.55, card.a + "cc");
  blob(w * 0.75, h * 0.68, w * 0.55, card.b + "cc");
  blob(w * 0.55, h * 0.1, w * 0.3, "#ffffff22");
  ctx.globalCompositeOperation = "source-over";
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
  // Copy: glyph mark, big title, meta.
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 24;
  ctx.font = `500 26px ${mono}`;
  ctx.globalAlpha = 0.8;
  ctx.fillText(card.mark, w / 2, h * 0.28);
  ctx.globalAlpha = 1;
  const words = card.title.toUpperCase().split(" ");
  let size = 92;
  ctx.font = `500 ${size}px ${font}`;
  // Wrap into at most three lines that fit the card.
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > w * 0.82 && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  lines.push(line);
  while (lines.length * size * 1.02 > h * 0.46 || Math.max(...lines.map((l) => ctx.measureText(l).width)) > w * 0.86) {
    size -= 4;
    ctx.font = `500 ${size}px ${font}`;
  }
  const top = h * 0.52 - ((lines.length - 1) * size * 1.02) / 2;
  lines.forEach((l, i) => ctx.fillText(l, w / 2, top + i * size * 1.02));
  ctx.font = `500 22px ${mono}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(`${card.kind} · ${card.meta}`.toUpperCase(), w / 2, h * 0.82);
  return canvas;
}

export function createCardsLayer(gl: WebGL2RenderingContext) {
  const compile = () => {
    const program = gl.createProgram();
    if (!program) throw new Error("Cards program allocation failed");
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Cards shader allocation failed");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Cards shader failed");
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Cards link failed");
    return program;
  };
  const program = compile();
  const u = Object.fromEntries(
    ["view", "projection", "angle", "centreY", "radius", "arc", "height", "slope", "lift", "art", "eye", "presence", "focus", "time", "aspect"].map((n) => [n, gl.getUniformLocation(program, n)]),
  );
  // Triangle indices for the (SEG_U+1)×(SEG_V+1) grid.
  const indices: number[] = [];
  for (let r = 0; r < SEG_V; r++) {
    for (let c = 0; c < SEG_U; c++) {
      const i = r * (SEG_U + 1) + c;
      indices.push(i, i + 1, i + SEG_U + 1, i + 1, i + SEG_U + 2, i + SEG_U + 1);
    }
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  let textures: (WebGLTexture | null)[] = [];
  const lifts: number[] = [];

  return {
    count: () => textures.length,
    setCards(cards: JourneyCard[], font: string, mono: string) {
      textures.forEach((t) => gl.deleteTexture(t));
      textures = cards.map((card) => {
        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE13);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawArtwork(card, font, mono));
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return tex;
      });
      lifts.length = 0;
    },
    render(view: Float32Array, projection: Float32Array, eye: [number, number, number], offset: number, presence: number, hovered: number, time: number, delta: number) {
      if (presence < 0.01 || !textures.length) return;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.uniformMatrix4fv(u.view, false, view);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform3f(u.eye, eye[0], eye[1], eye[2]);
      gl.uniform1f(u.radius, HELIX.radius);
      gl.uniform1f(u.arc, HELIX.arc);
      gl.uniform1f(u.height, HELIX.height);
      gl.uniform1f(u.slope, -HELIX.yStep / HELIX.angleStep);
      gl.uniform1f(u.time, time);
      gl.uniform2f(u.aspect, (HELIX.arc * HELIX.radius) / HELIX.height, 1);
      gl.activeTexture(gl.TEXTURE13);
      gl.uniform1i(u.art, 13);
      // Back to front, so glass blends correctly.
      const order = textures.map((_, i) => i).sort((a, b) => {
        const pa = cardPlacement(a, offset), pb = cardPlacement(b, offset);
        return Math.cos(pa.angle) - Math.cos(pb.angle);
      });
      for (const i of order) {
        const p = cardPlacement(i, offset);
        const reach = Math.max(0, 1 - Math.abs(p.rel) / 3.2);
        if (reach <= 0) continue;
        const target = i === hovered ? 0.18 : 0;
        lifts[i] = (lifts[i] ?? 0) + (target - (lifts[i] ?? 0)) * (1 - Math.exp(-10 * delta));
        const focus = Math.max(0, Math.cos(p.angle)) * Math.max(0, 1 - Math.abs(p.rel));
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.uniform1f(u.angle, p.angle);
        gl.uniform1f(u.centreY, p.y);
        gl.uniform1f(u.lift, lifts[i]);
        gl.uniform1f(u.presence, presence * Math.min(1, reach * 1.6));
        gl.uniform1f(u.focus, Math.min(1, focus + (i === hovered ? 0.3 : 0)));
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      }
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);
      gl.bindVertexArray(null);
    },
    dispose() {
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(ibo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
