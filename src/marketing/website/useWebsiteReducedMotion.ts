import { useEffect, useState } from "react";
import { isReactBitEnabled, type WebsiteReactBitKey } from "./websiteReactBitsConfig";

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
  return isReactBitEnabled(key) && !reduced;
}
