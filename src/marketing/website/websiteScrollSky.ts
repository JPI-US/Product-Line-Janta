import type { ChooserSkyStops } from "../../data/hubChooserSky";
import type { LivingSkyFrame } from "../../data/hubLivingSky";
import { WEBSITE_SKY_DAY, WEBSITE_SKY_NIGHT } from "./websiteDayCycle";

function lerpChannel(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function lerpHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const [ar, ag, ab] = parse(hexA);
  const [br, bg, bb] = parse(hexB);
  return `#${(
    (1 << 24) +
    (lerpChannel(ar, br, t) << 16) +
    (lerpChannel(ag, bg, t) << 8) +
    lerpChannel(ab, bb, t)
  )
    .toString(16)
    .slice(1)}`;
}

function lerpStops(a: ChooserSkyStops, b: ChooserSkyStops, t: number): ChooserSkyStops {
  return {
    zenith: lerpHex(a.zenith, b.zenith, t),
    mid: lerpHex(a.mid, b.mid, t),
    horizon: lerpHex(a.horizon, b.horizon, t),
  };
}

const WEBSITE_HERO_SKY_NIGHT: ChooserSkyStops = {
  zenith: WEBSITE_SKY_NIGHT.zenith,
  mid: WEBSITE_SKY_NIGHT.mid,
  horizon: WEBSITE_SKY_NIGHT.horizon,
};

/** Single smooth night → day gradient along scroll (blend is pre-eased upstream) */
export function getWebsiteHeroSkyStops(cycleBlend: number): ChooserSkyStops {
  const t = Math.max(0, Math.min(1, cycleBlend));
  return lerpStops(WEBSITE_HERO_SKY_NIGHT, WEBSITE_SKY_DAY, t);
}

/** @deprecated Use getWebsiteHeroSkyStops */
export function getWebsiteNightDaySkyStops(blend: number): ChooserSkyStops {
  return getWebsiteHeroSkyStops(blend);
}

/** @deprecated Sun disc is projected from panel-facing angles in HubSkyBackground */
export function getWebsiteHeroSunDisc(
  orbitBlend: number,
  dayBlend: number
): Pick<LivingSkyFrame, "sunX" | "sunY" | "sunGlow" | "sunCore"> {
  const t = Math.max(0, Math.min(1, dayBlend));
  const x = 8 + orbitBlend * 84;
  return {
    sunX: `${x.toFixed(2)}%`,
    sunY: "28%",
    sunGlow: (0.2 + t * 0.62).toFixed(3),
    sunCore: `rgba(255, 248, 235, ${(0.42 + t * 0.53).toFixed(3)})`,
  };
}

export function getWebsiteScrollSunDisc(blend: number) {
  return getWebsiteHeroSunDisc(blend, blend);
}
