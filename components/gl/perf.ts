// Device headroom for the WebGL stage and the glass materials.
//
// "high": Apple silicon and discrete GPUs. "mid": integrated GPUs (Intel,
// AMD APUs, phone GPUs). "low": software rendering. Windows gets its own
// flag: Chrome there runs WebGL through ANGLE on Direct3D, where large live
// backdrop blurs over an animated canvas and supersampled fill cost far more
// than on a Mac with the same class of GPU.

export type GpuTier = "low" | "mid" | "high";

export const isWindows = () => typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);

export function gpuTier(gl: WebGL2RenderingContext): GpuTier {
  let renderer = "";
  try {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
  } catch {}
  if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer)) return "low";
  if (/Arc\(TM\) A\d|Arc A\d/i.test(renderer)) return "high";
  if (/Intel|UHD|Iris|HD Graphics|Radeon\(TM\) Graphics|Radeon Graphics|Radeon Vega \d+ Graphics|Vega \d+ Graphics|Mali|Adreno|PowerVR/i.test(renderer)) return "mid";
  return "high";
}

// Flat painted panes instead of live backdrop blur (see globals.css and
// services.css). Set early for Windows by the layout's inline script, and
// here for integrated GPUs or once the stage measures sustained slow frames.
export function markLite() {
  document.documentElement.dataset.perf = "lite";
}
