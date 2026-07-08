import { useEffect, useState } from "react";
import { supportsWebGL } from "../../lib/webglSupport";
import { isReactBitEnabled, type WebsiteReactBitKey } from "./websiteReactBitsConfig";

/** True once we've confirmed the browser can create a WebGL context. */
export function useWebGLSupported(): boolean {
  const [supported, setSupported] = useState(() => supportsWebGL());

  useEffect(() => {
    setSupported(supportsWebGL());
  }, []);

  return supported;
}

/** Respects prefers-reduced-motion — React Bits effects should bail when true. */
export function useWebsiteReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function useReactBitActive(key: WebsiteReactBitKey): boolean {
  const reduced = useWebsiteReducedMotion();
  const webglSupported = useWebGLSupported();
  return isReactBitEnabled(key) && !reduced && webglSupported;
}
