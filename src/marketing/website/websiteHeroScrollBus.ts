export type WebsiteHeroScrollSink = (
  offset: number,
  root: HTMLElement
) => void;

const sinks = new Set<WebsiteHeroScrollSink>();

/** Coalesced hero scroll fan-out — one RAF per scroll tick for sky, WebGL, solar, gate */
export function subscribeWebsiteHeroScroll(sink: WebsiteHeroScrollSink) {
  sinks.add(sink);
  return () => sinks.delete(sink);
}

export function emitWebsiteHeroScroll(offset: number, root: HTMLElement) {
  for (const sink of sinks) {
    sink(offset, root);
  }
}
