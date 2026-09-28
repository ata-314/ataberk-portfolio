// Post-processing for the stage: the whole world renders into an HDR
// target (half-float colour + depth), then one composite pass lays the
// film look over it — a multi-level bloom (bright pass, dual-filter
// down/up chain), soft chromatic aberration toward the edges, filmic tone
// mapping, a cool teal-black grade, vignette and fine animated grain.

const fullscreen = `#version 300 es
precision highp float;
out vec2 uv;
void main() {
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  uv=p;
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;

// Bright pass into the first bloom level: soft knee so highlights bloom and
// mid-tones barely do.
const brightFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D source;
uniform float threshold;
out vec4 color;
void main() {
  vec3 c=texture(source,uv).rgb;
  float l=max(c.r,max(c.g,c.b));
  float knee=threshold*.6;
  float soft=clamp(l-threshold+knee,0.0,2.0*knee);
  soft=soft*soft/(4.0*knee+1e-4);
  float w=max(soft,l-threshold)/max(l,1e-4);
  color=vec4(c*w,1.0);
}`;

// Dual-filter (Kawase) downsample and upsample.
const downFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D source;
uniform vec2 texel;
out vec4 color;
void main() {
  vec3 c=texture(source,uv).rgb*4.0;
  c+=texture(source,uv+vec2(-texel.x,-texel.y)).rgb;
  c+=texture(source,uv+vec2(texel.x,-texel.y)).rgb;
  c+=texture(source,uv+vec2(-texel.x,texel.y)).rgb;
  c+=texture(source,uv+vec2(texel.x,texel.y)).rgb;
  color=vec4(c/8.0,1.0);
}`;
const upFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D source;
uniform vec2 texel;
out vec4 color;
void main() {
  vec3 c=vec3(0);
  c+=texture(source,uv+vec2(-texel.x*2.0,0.0)).rgb;
  c+=texture(source,uv+vec2(-texel.x,texel.y)).rgb*2.0;
  c+=texture(source,uv+vec2(0.0,texel.y*2.0)).rgb;
  c+=texture(source,uv+vec2(texel.x,texel.y)).rgb*2.0;
  c+=texture(source,uv+vec2(texel.x*2.0,0.0)).rgb;
  c+=texture(source,uv+vec2(texel.x,-texel.y)).rgb*2.0;
  c+=texture(source,uv+vec2(0.0,-texel.y*2.0)).rgb;
  c+=texture(source,uv+vec2(-texel.x,-texel.y)).rgb*2.0;
  color=vec4(c/12.0,1.0);
}`;

const compositeFragment = `#version 300 es
precision highp float;
in vec2 uv;
uniform sampler2D scene;
uniform sampler2D bloom;
uniform float bloomStrength;
uniform float aberration;
uniform float grain;
uniform float time;
uniform vec2 resolution;
uniform vec3 grade;
out vec4 color;
float hash(vec2 p) {p=fract(p*vec2(443.897,441.423));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}
vec3 aces(vec3 x) {return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
void main() {
  vec2 centred=uv-.5;
  float edge=dot(centred,centred);
  // Lens: colour channels part slightly toward the frame edges.
  vec2 shift=centred*edge*aberration;
  vec3 c;
  c.r=texture(scene,uv-shift).r;
  c.g=texture(scene,uv).g;
  c.b=texture(scene,uv+shift).b;
  c+=texture(bloom,uv).rgb*bloomStrength;
  c=aces(c*1.08);
  // Grade: shadows lean toward the chapter's tint, highlights stay clean.
  float luma=dot(c,vec3(.2126,.7152,.0722));
  c=mix(c,c+grade*.06,1.0-smoothstep(0.0,.45,luma));
  c=mix(vec3(luma),c,1.08);
  c*=1.0-smoothstep(.18,.62,edge*1.3)*.55;
  c+=(hash(uv*resolution+fract(time*61.0)*113.0)-.5)*grain;
  color=vec4(max(c,0.0),1.0);
}`;

type Target = { fbo: WebGLFramebuffer | null; tex: WebGLTexture | null; w: number; h: number };

export function createPost(gl: WebGL2RenderingContext) {
  if (!gl.getExtension("EXT_color_buffer_float")) return null;
  const compile = (fragment: string) => {
    const program = gl.createProgram();
    if (!program) throw new Error("Post program allocation failed");
    for (const [type, source] of [[gl.VERTEX_SHADER, fullscreen], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Post shader allocation failed");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Post shader failed");
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Post link failed");
    return program;
  };
  const bright = compile(brightFragment);
  const down = compile(downFragment);
  const up = compile(upFragment);
  const composite = compile(compositeFragment);
  const loc = (p: WebGLProgram, names: string[]) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)]));
  const bu = loc(bright, ["source", "threshold"]);
  const du = loc(down, ["source", "texel"]);
  const uu = loc(up, ["source", "texel"]);
  const cu = loc(composite, ["scene", "bloom", "bloomStrength", "aberration", "grain", "time", "resolution", "grade"]);
  const vao = gl.createVertexArray();

  const makeTarget = (w: number, h: number, depth: boolean): Target & { depth: WebGLRenderbuffer | null } => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let rb: WebGLRenderbuffer | null = null;
    if (depth) {
      rb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, w, h, depth: rb };
  };
  const release = (t: Target & { depth?: WebGLRenderbuffer | null }) => {
    gl.deleteFramebuffer(t.fbo);
    gl.deleteTexture(t.tex);
    if (t.depth) gl.deleteRenderbuffer(t.depth);
  };

  let scene: (Target & { depth: WebGLRenderbuffer | null }) | null = null;
  let levels: (Target & { depth: WebGLRenderbuffer | null })[] = [];
  const LEVELS = 6;

  const pass = (program: WebGLProgram, target: Target | null, w: number, h: number) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return {
    // Sizes the targets and returns the framebuffer the world renders into.
    begin(w: number, h: number) {
      if (!scene || scene.w !== w || scene.h !== h) {
        if (scene) release(scene);
        levels.forEach(release);
        scene = makeTarget(w, h, true);
        levels = [];
        let lw = w, lh = h;
        for (let i = 0; i < LEVELS; i++) {
          lw = Math.max(1, lw >> 1);
          lh = Math.max(1, lh >> 1);
          levels.push(makeTarget(lw, lh, false));
        }
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
      gl.viewport(0, 0, w, h);
      return scene.fbo;
    },
    finish(time: number, look: { bloom: number; threshold: number; aberration: number; grain: number; grade: [number, number, number] }) {
      if (!scene) return;
      gl.bindVertexArray(vao);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.activeTexture(gl.TEXTURE10);
      // Bright pass → level 0, then down the chain and back up additively.
      gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      gl.useProgram(bright);
      gl.uniform1i(bu.source, 10);
      gl.uniform1f(bu.threshold, look.threshold);
      pass(bright, levels[0], levels[0].w, levels[0].h);
      gl.useProgram(down);
      gl.uniform1i(du.source, 10);
      for (let i = 1; i < LEVELS; i++) {
        gl.bindTexture(gl.TEXTURE_2D, levels[i - 1].tex);
        gl.useProgram(down);
        gl.uniform2f(du.texel, 1 / levels[i - 1].w, 1 / levels[i - 1].h);
        pass(down, levels[i], levels[i].w, levels[i].h);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(up);
      gl.uniform1i(uu.source, 10);
      for (let i = LEVELS - 1; i > 0; i--) {
        gl.bindTexture(gl.TEXTURE_2D, levels[i].tex);
        gl.useProgram(up);
        gl.uniform2f(uu.texel, 0.5 / levels[i].w, 0.5 / levels[i].h);
        pass(up, levels[i - 1], levels[i - 1].w, levels[i - 1].h);
      }
      gl.disable(gl.BLEND);
      gl.useProgram(composite);
      gl.activeTexture(gl.TEXTURE10);
      gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      gl.activeTexture(gl.TEXTURE11);
      gl.bindTexture(gl.TEXTURE_2D, levels[0].tex);
      gl.uniform1i(cu.scene, 10);
      gl.uniform1i(cu.bloom, 11);
      gl.uniform1f(cu.bloomStrength, look.bloom);
      gl.uniform1f(cu.aberration, look.aberration);
      gl.uniform1f(cu.grain, look.grain);
      gl.uniform1f(cu.time, time);
      gl.uniform2f(cu.resolution, scene.w, scene.h);
      gl.uniform3f(cu.grade, look.grade[0], look.grade[1], look.grade[2]);
      pass(composite, null, scene.w, scene.h);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    },
    dispose() {
      if (scene) release(scene);
      levels.forEach(release);
      [bright, down, up, composite].forEach((p) => gl.deleteProgram(p));
      gl.deleteVertexArray(vao);
    },
  };
}
