/** DSR + LFM product pages share the centered-hero scroll choreography */
export function isProductHeroPageFromDom(): boolean {
  if (typeof document === "undefined") return false;
  const page = document.querySelector(".tower-3d-page");
  return (
    page?.classList.contains("tower-3d-page--designer") === true ||
    page?.classList.contains("tower-3d-page--utility") === true
  );
}

export function isProductHeroLayout(
  productId?: "designer" | "utility" | boolean
): boolean {
  if (typeof productId === "boolean") return productId;
  if (productId === "designer" || productId === "utility") return true;
  return isProductHeroPageFromDom();
}
