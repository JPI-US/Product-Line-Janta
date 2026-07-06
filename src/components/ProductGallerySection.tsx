import { productGalleryPhoto } from "../data/productGallery";

/** Shared gallery — one photo box */
export function ProductGallerySection() {
  return (
    <section className="tower-3d__gallery-section" aria-label="Gallery">
      <figure className="tower-3d__gallery-photo">
        <img
          src={productGalleryPhoto.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          style={
            productGalleryPhoto.imageObjectPosition
              ? { objectPosition: productGalleryPhoto.imageObjectPosition }
              : undefined
          }
        />
      </figure>
    </section>
  );
}
