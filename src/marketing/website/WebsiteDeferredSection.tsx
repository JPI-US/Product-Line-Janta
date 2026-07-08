import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Placeholder height before the section mounts */
  minHeight?: string;
  rootMargin?: string;
  /** Skip mount-deferral (render immediately) but keep the scroll-in reveal */
  mountImmediately?: boolean;
};

/**
 * Mounts children well before they scroll into view (no pop-in / layout jump),
 * then plays a gentle fade + rise the moment the section actually reaches the
 * viewport. Motion is skipped entirely under prefers-reduced-motion (CSS).
 */
export function WebsiteDeferredSection({
  children,
  minHeight = "min(72vh, 640px)",
  rootMargin = "600px 0px",
  mountImmediately = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(mountImmediately);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mounted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setMounted(true);
        observer.disconnect();
      },
      { rootMargin, threshold: 0 },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  useEffect(() => {
    if (!mounted || revealed) return;
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [mounted, revealed]);

  const className =
    "web-deferred-section" +
    (mounted ? " web-deferred-section--mounted" : "") +
    (revealed ? " web-deferred-section--in" : "");

  return (
    <div
      ref={hostRef}
      className={className}
      style={mounted ? undefined : { minHeight }}
    >
      {mounted ? children : null}
    </div>
  );
}
