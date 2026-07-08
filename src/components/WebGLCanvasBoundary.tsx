import { Component, type ReactNode } from "react";

/**
 * Isolates WebGL context-creation failures so the surrounding page still
 * renders. On failure it shows an optional fallback instead of crashing the
 * route. Pair with a `supportsWebGL()` gate to avoid mounting the canvas at all
 * in browsers without WebGL.
 */
export class WebGLCanvasBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; label?: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.warn(`[${this.props.label ?? "webgl"}] canvas disabled:`, err);
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
