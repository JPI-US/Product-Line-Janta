/** Immediate 0–1 position (matches drei ScrollControls scroll.current on scroll events) */
export function getImmediateScrollOffset(el: HTMLElement): number {
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 0) return 0;
  return el.scrollTop / max;
}
