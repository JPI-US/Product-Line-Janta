import { useEffect, useState } from "react";

/**
 * True on phone-sized screens. Used to swap heavy WebGL (three.js) scenes for
 * static, three-free versions on mobile — the initial state reads synchronously
 * so the live 3D module is never imported on phones in the first place.
 */
export function useIsMobile(query = "(max-width: 820px)"): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return isMobile;
}
