import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Placeholder height before the section mounts */
  minHeight?: string;
  rootMargin?: string;
};

/** Mount children only when near the viewport — keeps below-fold JS/CSS work idle */
export function WebsiteDeferredSection({
  children,
  minHeight = "min(72vh, 640px)",
  rootMargin = "280px 0px",
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

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

  return (
    <div
      ref={hostRef}
      className="web-deferred-section"
      style={mounted ? undefined : { minHeight }}
    >
      {mounted ? children : null}
    </div>
  );
}
