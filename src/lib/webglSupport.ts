/**
 * One-time WebGL capability probe.
 *
 * External browsers with hardware acceleration disabled (or no GL driver)
 * cannot create a WebGL context at all. Rather than mounting a 3D canvas and
 * letting it throw, we probe once up front and let callers degrade gracefully.
 */

let cached: boolean | null = null;

function probeWebGL(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const attrs: WebGLContextAttributes = {
      failIfMajorPerformanceCaveat: false,
      powerPreference: "default",
    };

    const gl =
      (canvas.getContext("webgl2", attrs) as WebGL2RenderingContext | null) ??
      (canvas.getContext("webgl", attrs) as WebGLRenderingContext | null);

    if (!gl) return false;

    // Release the probe context so we don't hold a GPU slot.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Returns true if the browser can create a WebGL context (memoized). */
export function supportsWebGL(): boolean {
  if (cached === null) {
    cached = probeWebGL();
  }
  return cached;
}
