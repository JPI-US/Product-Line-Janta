import { useEffect, useRef, useState } from "react";

/** Intersection reveal helper for designer below-fold sections */
export function useSectionReveal(visibleClass: string) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setIsVisible(true);
      section.classList.add(visibleClass);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          section.classList.add(visibleClass);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    io.observe(section);
    return () => io.disconnect();
  }, [visibleClass]);

  return { sectionRef, isVisible };
}
