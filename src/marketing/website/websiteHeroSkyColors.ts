export type WebsiteHeroSkyColors = {
  zenith: string;
  mid: string;
  horizon: string;
};

const FALLBACK: WebsiteHeroSkyColors = {
  zenith: "#2e6eb5",
  mid: "#5a9fd4",
  horizon: "#9fd0ef",
};

let published: WebsiteHeroSkyColors = { ...FALLBACK };

export function publishWebsiteHeroSkyColors(colors: WebsiteHeroSkyColors) {
  if (
    colors.zenith === published.zenith &&
    colors.mid === published.mid &&
    colors.horizon === published.horizon
  ) {
    return;
  }
  published = colors;
}

export function getWebsiteHeroSkyColors(): WebsiteHeroSkyColors {
  return published;
}
