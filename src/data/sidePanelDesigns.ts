export type SidePanelTheme = {
  /** Dominant hues from the panel artwork */
  primaryA: string;
  primaryB: string;
  /** Lightened mixes used for card-frame gradients */
  tintA: string;
  tintB: string;
  accent: string;
  spine: string;
};

export type SidePanelDesign = {
  id: string;
  title: string;
  description: string;
  svgUrl: string;
  pngUrl: string;
  theme: SidePanelTheme;
  /** Uniform scale tweak when a file's viewBox leaves extra padding. */
  deckScale?: number;
};

/** Mix hex color toward white (amount 0 = original, 1 = white). */
function lighten(hex: string, amount: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

function themeFromPrimaries(
  primaryA: string,
  primaryB: string,
  options?: { lightMix?: number; spineMix?: number }
): SidePanelTheme {
  const lightMix = options?.lightMix ?? 0.84;
  const spineMix = options?.spineMix ?? 0.58;
  return {
    primaryA,
    primaryB,
    tintA: lighten(primaryA, lightMix),
    tintB: lighten(primaryB, lightMix),
    accent: primaryA,
    spine: lighten(primaryB, spineMix),
  };
}

export const sidePanelDesigns: SidePanelDesign[] = [
  {
    id: "panel-1",
    title: "Janta Power space",
    description:
      "Open field with brand-forward artwork and logo placement and messaging that reads clearly from the street.",
    svgUrl: "/towers/panels/side-panel-1.svg",
    pngUrl: "/towers/panels/side-panel-1.png",
    // Navy field + orange/gold rocket flame (top path colors in artwork)
    theme: themeFromPrimaries("#234668", "#eb9748"),
  },
  {
    id: "panel-2",
    title: "Camo halftone",
    description:
      "Layered halftone camo that holds up at distance while staying detailed up close on the tower face.",
    svgUrl: "/towers/panels/side-panel-2.svg",
    pngUrl: "/towers/panels/side-panel-2.png",
    // Light blue sky background + olive-brown halftone camo
    theme: themeFromPrimaries("#c1d3e8", "#6a5d45"),
  },
  {
    id: "panel-3",
    title: "Honeycomb swirl",
    description:
      "Organic honeycomb texture with a soft swirl for natural energy without overpowering the structure.",
    svgUrl: "/towers/panels/side-panel-3.svg",
    pngUrl: "/towers/panels/side-panel-3.png",
    // Golden yellow curves + black halftone on white
    theme: themeFromPrimaries("#fec004", "#14100d", { lightMix: 0.86, spineMix: 0.52 }),
  },
  {
    id: "panel-6",
    title: "Geometric mosaic",
    description:
      "Bold tessellated shapes for high contrast and a crisp, architectural look on vertical panels.",
    svgUrl: "/towers/panels/side-panel-6.svg",
    pngUrl: "/towers/panels/side-panel-6.png",
    // Olive green botanical shapes + warm cream base
    theme: themeFromPrimaries("#898a51", "#fafbea", { lightMix: 0.86 }),
  },
  {
    id: "panel-7",
    title: "Gamer hex stripe",
    description:
      "Angular hex stripes with a contemporary edge, built for sites that want a sharper, tech-forward feel.",
    svgUrl: "/towers/panels/side-panel-7.svg",
    pngUrl: "/towers/panels/side-panel-7.svg",
    // Coral pink stripes + orange accent (hex stripe palette)
    theme: themeFromPrimaries("#f79a9a", "#f84f03"),
  },
];
