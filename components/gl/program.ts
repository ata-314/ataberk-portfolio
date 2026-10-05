// Shader programs are compiled without blocking the main thread. Asking for
// COMPILE_STATUS / LINK_STATUS straight after compileShader / linkProgram
// waits for the driver, so building the stage's ~15 programs one by one froze
// the page for seconds on Windows, where ANGLE translates every shader to
// HLSL and runs the D3D compiler. Here every compile and link is issued first;
// with KHR_parallel_shader_compile the driver builds them on its own threads
// while we poll COMPLETION_STATUS between tasks, and only then read status.

const COMPLETION_STATUS_KHR = 0x91b1;
const parallel = new WeakMap<WebGL2RenderingContext, boolean>();
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 4));

export async function buildProgram(gl: WebGL2RenderingContext, vs: string, fs: string, name = "WebGL") {
  if (!parallel.has(gl)) parallel.set(gl, !!gl.getExtension("KHR_parallel_shader_compile"));
  const program = gl.createProgram();
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  if (!program || !vertex || !fragment) throw new Error(`${name} program allocation failed`);
  gl.shaderSource(vertex, vs);
  gl.shaderSource(fragment, fs);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (parallel.get(gl)) {
    while (!gl.isContextLost() && !gl.getProgramParameter(program, COMPLETION_STATUS_KHR)) await nextTask();
  }
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  const log = linked ? "" : [vertex, fragment].map((s) => gl.getShaderInfoLog(s)).join("\n").trim() || gl.getProgramInfoLog(program) || "";
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!linked) {
    gl.deleteProgram(program);
    throw new Error(`${name} link failed: ${log}`);
  }
  return program;
}

// The same, plus a cached uniform lookup, the shape most layers use.
export async function buildProgramU(gl: WebGL2RenderingContext, vs: string, fs: string, name?: string) {
  const p = await buildProgram(gl, vs, fs, name);
  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (n: string) => {
    if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n));
    return cache.get(n) ?? null;
  };
  return { p, u };
}
