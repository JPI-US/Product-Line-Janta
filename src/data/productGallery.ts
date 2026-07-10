export type ProductGallerySlide = {
  id: string;
  imageUrl: string;
  imageObjectPosition?: string;
  alt: string;
  /** Short title for the on-card label (e.g. "Custom side panels") */
  caption: string;
};

/** Single gallery hero image (utility page) */
export const productGalleryPhoto = {
  imageUrl:
    "https://images.unsplash.com/photo-1497435334941-8c899eebdce4?auto=format&fit=crop&w=1600&q=80",
  imageObjectPosition: "center 55%",
};

/** Designer — horizontal scrub gallery beneath product bands */
export const designerGallerySlides: ProductGallerySlide[] = [
  {
    id: "custom-panel-field",
    imageUrl: "/towers/gallery/designer-tower-custom-panel.png",
    imageObjectPosition: "center 32%",
    alt: "DSR tower with custom space-themed side panel on site next to a brick building",
    caption: "Custom side panels",
  },
  {
    id: "office-campus",
    imageUrl: "/towers/gallery/designer-tower-office-park.png",
    imageObjectPosition: "center 38%",
    alt: "DSR solar tower with hexagonal side panel on a green office campus lawn",
    caption: "Commercial campus",
  },
];

/** LFM — field deployment gallery */
export const utilityGallerySlides: ProductGallerySlide[] = [
  {
    id: "lfm-field",
    imageUrl: "/marketing/lfm-tower.png",
    imageObjectPosition: "center 58%",
    alt: "LFM solar tower arrays deployed outdoors at a Dallas event",
    caption: "Field deployment",
  },
  {
    id: "utility-scale",
    imageUrl: "/marketing/value-aerial-solar.png",
    imageObjectPosition: "48% center",
    alt: "Aerial view of Janta solar arrays in a green field",
    caption: "Utility-scale sites",
  },
];

export function getProductGallerySlides(productId: "designer" | "utility") {
  return productId === "designer" ? designerGallerySlides : utilityGallerySlides;
}
