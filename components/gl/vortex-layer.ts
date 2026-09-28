// The voyage vortex: the headline's letters, sampled into particles at
// exactly the pixels they occupy on screen, lift off the page and wind into
// a spinning disc round the bird — inner orbits faster than outer, the disc
// tilted into an ellipse — then spiral into its centre, the mouth of the
// tunnel, as the suction takes hold. Screen-space points, additive, drawn
// into the stage's HDR scene so the bloom catches them.

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec3 start; // NDC position of the letter pixel, ink brightness
layout(location=1) in vec4 seed;
uniform vec2 centre;
uniform float aspect;
uniform float form;
uniform float suction;
uniform float ringR;
uniform float time;
uniform float pixel;
uniform float presence;
out vec3 vColor;
out float vAlpha;
void main() {
  vec2 asp=vec2(aspect,1.0);
  vec2 rel=(start.xy-centre)*asp;
  float r0=length(rel);
  float a0=atan(rel.y,rel.x);
  // Letters leave in reading order, each grain a little on its own.
  float stagger=seed.x*.3+clamp((start.x+1.0)*.5,0.0,1.0)*.3;
  float v=smoothstep(stagger,stagger+.4,form);
  float ease=v*v*(3.0-2.0*v);
  float ring=ringR*(.28+seed.y*.95);
  // Suction takes the inner orbits first.
  float s=smoothstep(seed.y*.35,seed.y*.35+.65,suction);
  float rad=mix(r0,ring,ease)*(1.0-s);
  float spin=time*.55/(.18+rad)*ease;
  float ang=a0+ease*(2.5+seed.z*3.0)+spin+s*s*9.0;
  vec2 p=vec2(cos(ang),sin(ang)*mix(1.0,.4,ease))*rad;
  // A little turbulence while airborne.
  p+=vec2(sin(time*1.3+seed.w*40.0),cos(time*1.1+seed.x*37.0))*.012*ease*(1.0-s);
  gl_Position=vec4(centre+p/asp,0.0,1.0);
  vec3 bone=vec3(.96,.94,.9);
  vec3 teal=vec3(.35,1.0,.88);
  // Starts at the ink's own brightness (the quieter second line), then
  // brightens as it joins the vortex.
  vColor=mix(bone*start.z,mix(teal,vec3(1.0),seed.w*.5),ease*.75+s*.25)*(1.0+s*1.5);
  vAlpha=presence*(1.0-smoothstep(.7,1.0,s));
  gl_PointSize=pixel*mix(1.6,1.1+seed.w*2.2,ease)*(1.0-s*.5);
}`;

const fragment = `#version 300 es
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 color;
void main() {
  float d=length(gl_PointCoord-.5);
  float a=smoothstep(.5,.1,d)*vAlpha;
  if(a<.004) discard;
  color=vec4(vColor*a,0.0);
}`;

export function createVortexLayer(gl: WebGL2RenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("Vortex program allocation failed");
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Vortex shader allocation failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Vortex shader failed");
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Vortex link failed");
  const u = Object.fromEntries(["centre", "aspect", "form", "suction", "ringR", "time", "pixel", "presence"].map((n) => [n, gl.getUniformLocation(program, n)]));
  const vao = gl.createVertexArray();
  const startBuffer = gl.createBuffer();
  const seedBuffer = gl.createBuffer();
  let count = 0;

  return {
    // Rasterises the headline words ([data-voyage-word]) where they sit on
    // screen and keeps one particle per sampled ink pixel.
    sample(stageW: number, stageH: number, limit: number) {
      const words = Array.from(document.querySelectorAll<HTMLElement>("[data-voyage-word]"));
      if (!words.length) return false;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(stageW));
      canvas.height = Math.max(1, Math.round(stageH));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "alphabetic";
      for (const word of words) {
        const style = getComputedStyle(word);
        const rect = word.getBoundingClientRect();
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        // Keep the word's own tone: the quieter row samples dimmer ink.
        const tone = style.color.match(/[\d.]+/g);
        ctx.globalAlpha = tone && tone.length > 3 ? Math.max(0.2, Number(tone[3])) : 1;
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
        const m = ctx.measureText(word.textContent ?? "");
        const ascent = m.fontBoundingBoxAscent, descent = m.fontBoundingBoxDescent;
        const baseline = rect.top + (rect.height - (ascent + descent)) / 2 + ascent;
        ctx.fillText(word.textContent ?? "", rect.left, baseline);
      }
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 40) ink++;
      const step = Math.max(1, Math.ceil(Math.sqrt(ink / limit)));
      const starts: number[] = [];
      const seeds: number[] = [];
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const a = data[(y * canvas.width + x) * 4 + 3];
          if (a <= 40) continue;
          starts.push((x / canvas.width) * 2 - 1, 1 - (y / canvas.height) * 2, a / 255);
          seeds.push(Math.random(), Math.random(), Math.random(), Math.random());
        }
      }
      count = starts.length / 3;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, startBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(starts), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(seeds), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      return count > 0;
    },
    render(w: number, h: number, time: number, centre: [number, number], form: number, suction: number, presence: number, pixel: number) {
      if (!count || presence < 0.005) return;
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
      gl.uniform2f(u.centre, centre[0], centre[1]);
      gl.uniform1f(u.aspect, w / Math.max(h, 1));
      gl.uniform1f(u.form, form);
      gl.uniform1f(u.suction, suction);
      gl.uniform1f(u.ringR, 0.62);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.pixel, pixel);
      gl.uniform1f(u.presence, presence);
      gl.drawArrays(gl.POINTS, 0, count);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(startBuffer);
      gl.deleteBuffer(seedBuffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
    },
  };
}
