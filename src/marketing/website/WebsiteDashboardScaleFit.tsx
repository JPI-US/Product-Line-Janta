import { useEffect, useRef, useState, type ReactNode } from "react";

/** Tablet frame aspect (matches `.web-software-showcase__screen-viewport`). */
export const TABLET_ASPECT = 481 / 1024;

export const DASHBOARD_DESIGN_W = 1440;
export const DASHBOARD_DESIGN_H = Math.round(DASHBOARD_DESIGN_W * TABLET_ASPECT);

type Props = {
  children: ReactNode;
};

/**
 * Fits the full dashboard (sidebar + main) inside the tablet frame without cropping.
 */
export function WebsiteDashboardScaleFit({ children }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      setScale(Math.min(w / DASHBOARD_DESIGN_W, h / DASHBOARD_DESIGN_H));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scaledW = DASHBOARD_DESIGN_W * scale;
  const scaledH = DASHBOARD_DESIGN_H * scale;

  return (
    <div ref={hostRef} className="web-software-showcase__dashboard-fit">
      <div
        className="web-software-showcase__dashboard-scale"
        style={{ width: scaledW, height: scaledH }}
      >
        <div
          className="web-software-showcase__dashboard-stage"
          style={{
            width: DASHBOARD_DESIGN_W,
            height: DASHBOARD_DESIGN_H,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
