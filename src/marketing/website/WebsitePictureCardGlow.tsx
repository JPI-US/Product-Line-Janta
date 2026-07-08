import { lazy, Suspense, type ReactNode } from "react";
import { WEBSITE_REACT_BITS } from "./websiteReactBitsConfig";
import { useReactBitActive } from "./useWebsiteReducedMotion";

const BorderGlow = lazy(() => import("./react-bits/BorderGlow/BorderGlow"));

type Props = {
  children: ReactNode;
  /** Extra class on the glow shell (e.g. layout-specific sizing) */
  className?: string;
  /** Override config border radius for this card */
  borderRadius?: number;
};

/** [Border Glow](https://reactbits.dev/components/border-glow) wrapper for image cards — toggle via `pictureCardBorderGlow` */
export function WebsitePictureCardGlow({ children, className = "", borderRadius }: Props) {
  const active = useReactBitActive("pictureCardBorderGlow");
  const cfg = WEBSITE_REACT_BITS.pictureCardBorderGlow;

  if (!active) {
    return <div className={`web-picture-card ${className}`.trim()}>{children}</div>;
  }

  return (
    <Suspense fallback={<div className={`web-picture-card ${className}`.trim()}>{children}</div>}>
      <BorderGlow
        className={`web-rb-border-glow ${className}`.trim()}
        colors={[...cfg.colors]}
        glowColor={cfg.glowColor}
        backgroundColor={cfg.backgroundColor}
        borderRadius={borderRadius ?? cfg.borderRadius}
        edgeSensitivity={cfg.edgeSensitivity}
      >
        {children}
      </BorderGlow>
    </Suspense>
  );
}
