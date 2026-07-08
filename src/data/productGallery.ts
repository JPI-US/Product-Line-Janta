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

export function getGallerySlideLabel(index: number, caption: string): string {
  return `${String(index + 1).padStart(3, "0")} — ${caption}`;
}

/** Designer — horizontal scrub gallery beneath side panel finishes */
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
