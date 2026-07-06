import { useState } from "react";

type Props = {
  svgUrl: string;
  pngUrl: string;
  alt: string;
  displayScale?: number;
};

/**
 * Renders vector SVG via <img>. Every panel uses the same display height;
 * width follows each file's aspect ratio (wide exports are not squeezed).
 */
export function PanelDesignImage({
  svgUrl,
  pngUrl,
  alt,
  displayScale = 1,
}: Props) {
  const [src, setSrc] = useState(svgUrl);
  const needsScale = displayScale !== 1;

  return (
    <img
      className="tower-3d__panel-img"
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      style={
        needsScale
          ? {
              transform: `scale(${displayScale})`,
              transformOrigin: "center center",
            }
          : undefined
      }
      onError={() => {
        if (src !== pngUrl) setSrc(pngUrl);
      }}
    />
  );
}
