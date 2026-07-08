/**
 * Responsive <picture> element that serves AVIF → WebP → original (PNG/JPG),
 * matching the siblings produced by `scripts/compress-images.mjs`.
 *
 * Usage:
 *   <Picture src="/marketing/roi-hero.png" alt="ROI hero" width={1600} height={900} />
 *   <Picture src="/marketing/ev-charging.jpg" alt="EV charging" priority />
 *
 * By default images lazy-load. Pass `priority` on above-the-fold LCP images
 * (adds fetchpriority="high" and eager loading).
 */
import { type ImgHTMLAttributes, forwardRef } from "react";

type PictureProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
  src: string;
  alt: string;
  priority?: boolean;
  /** Skip the AVIF/WebP sources — use when the sibling files aren't generated. */
  raw?: boolean;
};

function swapExt(src: string, ext: "avif" | "webp"): string {
  return src.replace(/\.(png|jpe?g)$/i, `.${ext}`);
}

export const Picture = forwardRef<HTMLImageElement, PictureProps>(function Picture(
  { src, alt, priority = false, raw = false, className, style, ...imgProps },
  ref,
) {
  const loading = priority ? "eager" : imgProps.loading ?? "lazy";
  const decoding = imgProps.decoding ?? "async";
  const fetchPriority = priority ? "high" : imgProps.fetchPriority;

  const img = (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      // React 18 needs the camelCase form; DOM attribute is still fetchpriority.
      fetchPriority={fetchPriority as ImgHTMLAttributes<HTMLImageElement>["fetchPriority"]}
      className={className}
      style={style}
      {...imgProps}
    />
  );

  if (raw || !/\.(png|jpe?g)$/i.test(src)) return img;

  return (
    <picture>
      <source type="image/avif" srcSet={swapExt(src, "avif")} />
      <source type="image/webp" srcSet={swapExt(src, "webp")} />
      {img}
    </picture>
  );
});
