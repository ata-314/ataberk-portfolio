// Inside the X's code: a Matrix-style space of falling code. Columns of
// glyphs hang all around the flight path at every depth, each raining down
// at its own speed with a white-hot head and a green trail that fades and
// keeps mutating. The field streams toward the camera with scroll, so the
// flight moves through it. Additive glyph sprites drawn into the stage's
// HDR scene. Also exports the glyph atlas the X uses.

const GLYPHS = "01234567890ABCDEFXZ<>{}[]/=+*:;アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン";

// 8×8 atlas of white glyphs on transparent, for point sprites.
export function makeGlyphAtlas(gl: WebGL2RenderingContext) {
  const cell = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = cell * 8;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const mono = getComputedStyle(document.body).getPropertyValue("--font-jetbrains").trim() || "monospace";
  for (let i = 0; i < 64; i++) {
    const ch = GLYPHS[i % GLYPHS.length];
    ctx.font = `700 ${cell * 0.78}px ${ch.charCodeAt(0) > 255 ? "sans-serif" : `${mono}, monospace`}`;
    ctx.fillText(ch, (i % 8) * cell + cell / 2, Math.floor(i / 8) * cell + cell / 2 + 2);
  }
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE14);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

// Shared GLSL: sample glyph g (0..63) from the atlas at a point coord.
export const glyphSample = /* glsl */ `float glyphAlpha(sampler2D atlas, float g, vec2 pc) {
  vec2 cell=vec2(mod(g,8.0),floor(g/8.0));
  return texture(atlas,(cell+pc)/8.0).a;
}`;

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec4 column; // x, z, speed, phase
layout(location=1) in float slot;   // position in the column trail
uniform mat4 view;
uniform mat4 projection;
uniform float time;
uniform float travel;
uniform float length_;
uniform float height;
uniform float presence;
uniform float pixel;
out vec3 vColor;
out float vAlpha;
out float vGlyph;
float hash(float n) {return fract(sin(n*12.9898)*43758.5453);}
void main() {
  float spacing=.3;
  float head=mod(time*column.z+column.w*height,height+8.0)-4.0;
  vec3 p=vec3(column.x,height*.5-head+slot*spacing,column.y);
  p.z=mod(p.z+travel,length_)-length_+4.0;
  vec4 v=view*vec4(p,1.0);
  gl_Position=projection*v;
  float depth=-v.z;
  float trail=exp(-slot*.075);
  float isHead=step(slot,.5);
  vColor=mix(vec3(.25,1.0,.45),vec3(.8,1.0,.85),isHead)*(isHead*1.3+trail*2.2);
  float fog=exp(-max(depth-5.0,0.0)*.035);
  vAlpha=presence*trail*fog*smoothstep(.4,1.6,depth);
  // Glyphs mutate, heads fastest.
  float rate=mix(2.0,14.0,isHead);
  vGlyph=floor(hash(column.w*97.0+slot*13.0+floor(time*rate+column.w*7.0))*64.0);
  gl_PointSize=min(pixel*72.0/max(depth,.5),72.0);
  if(depth<.3||vAlpha<.003) gl_Position=vec4(2.0,2.0,2.0,1.0);
}`;

const fragment = `#version 300 es
precision highp float;
uniform sampler2D atlas;
in vec3 vColor;
in float vAlpha;
in float vGlyph;
out vec4 color;
${glyphSample}
void main() {
  float a=glyphAlpha(atlas,vGlyph,gl_PointCoord)*vAlpha;
  if(a<.004) discard;
  color=vec4(vColor*a,0.0);
}`;

export function createMatrixLayer(gl: WebGL2RenderingContext, atlas: WebGLTexture | null, mobile: boolean) {
  const program = gl.createProgram();
  if (!program) throw new Error("Matrix program allocation failed");
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Matrix shader allocation failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Matrix shader failed");
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Matrix link failed");
  const u = Object.fromEntries(["view", "projection", "time", "travel", "length_", "height", "presence", "pixel", "atlas"].map((n) => [n, gl.getUniformLocation(program, n)]));

  // Columns scattered through a box round the path, clear of its centre.
  const columns = mobile ? 600 : 1400;
  const SLOTS = 32;
  const L = 34, H = 14;
  const colData = new Float32Array(columns * 4);
  for (let i = 0; i < columns; i++) {
    let x = 0, z = 0;
    do { x = (Math.random() - 0.5) * 13; } while (Math.abs(x) < 0.8);
    z = -Math.random() * L;
    colData.set([x, z, 2.5 + Math.random() * 6, Math.random()], i * 4);
  }
  const slots = new Float32Array(SLOTS);
  for (let i = 0; i < SLOTS; i++) slots[i] = i;
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const colBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colData, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(0, 1);
  const slotBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, slotBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, slots, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  return {
    render(view: Float32Array, projection: Float32Array, time: number, travel: number, presence: number, pixel: number) {
      if (presence < 0.005) return;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
      gl.activeTexture(gl.TEXTURE14);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(u.atlas, 14);
      gl.uniformMatrix4fv(u.view, false, view);
      gl.uniformMatrix4fv(u.projection, false, projection);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.travel, travel);
      gl.uniform1f(u.length_, L);
      gl.uniform1f(u.height, H);
      gl.uniform1f(u.presence, presence);
      gl.uniform1f(u.pixel, pixel);
      gl.drawArraysInstanced(gl.POINTS, 0, SLOTS, columns);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(colBuffer);
      gl.deleteBuffer(slotBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
