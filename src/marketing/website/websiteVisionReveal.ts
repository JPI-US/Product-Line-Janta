function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

let cachedNavHeight = 0;

function getNavHeight(): number {
  if (cachedNavHeight > 0) return cachedNavHeight;
  cachedNavHeight =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--app-nav-h")
    ) || 0;
  return cachedNavHeight;
}

export function resetVisionNavHeightCache() {
  cachedNavHeight = 0;
}

/**
 * 0→1 while the vision statement scrolls into readable view.
 * Measures the headline element — not the full-bleed copy layer (`inset: 0`) —
 * so words stay hidden until the text itself is on screen.
 */
export function measureVisionReveal(section: HTMLElement): number {
  const statement = section.querySelector<HTMLElement>(".web-vision-statement");
  if (!statement) return 0;

  const rect = statement.getBoundingClientRect();
  const navH = getNavHeight();
  const viewBottom = window.innerHeight;
  const viewH = viewBottom - navH;

  // Statement fully above or below the viewport — no reveal yet
  if (rect.bottom <= navH + 8 || rect.top >= viewBottom - 8) {
    return 0;
  }

  // Start only once the headline has risen into the upper viewport
  const revealStartTop = navH + viewH * 0.58;
  const revealEndTop = navH + viewH * 0.2;

  if (rect.top >= revealStartTop) return 0;

  const span = revealStartTop - revealEndTop;
  if (span <= 0) return 1;

  const raw = (revealStartTop - rect.top) / span;
  return clamp01(raw);
}

/** Sequential words — staggered starts, longer eased fade per word */
export function getVisionWordOpacity(
  reveal: number,
  wordIndex: number,
  wordCount: number
): number {
  if (reveal <= 0) return 0;

  const n = Math.max(wordCount, 1);
  const stagger = 1 / (n + 1.4);
  const fade = stagger * 2.5;
  const start = wordIndex * stagger;

  return smoothstep((reveal - start) / fade);
}
