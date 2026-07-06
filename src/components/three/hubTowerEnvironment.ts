import * as THREE from "three";
import type { SkyPeriod } from "../../data/hubChooserSky";
import type { HubWeatherKind } from "../../data/hubWeather";
import { weatherKindForVisualEffect } from "../../data/hubWeather";
import { getWebsiteHeroSkyColors } from "../../marketing/website/websiteHeroSkyColors";

export type HubTowerEnvironment = {
  period: SkyPeriod;
  /** 0 = night, 1 = day — smooth scroll blend; overrides discrete period for materials */
  dayBlend?: number;
  weatherKind: HubWeatherKind;
  sunDirection: THREE.Vector3;
  zenith: string;
  mid: string;
  horizon: string;
  weatherIntensity: number;
};

type MaterialPair = {
  panel: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
};

type MaterialTargets = {
  panelColor: THREE.Color;
  panelEmissive: THREE.Color;
  panelEmissiveIntensity: number;
  panelMetalness: number;
  panelRoughness: number;
  panelEnvIntensity: number;
  frameColor: THREE.Color;
  frameEnvIntensity: number;
};

/** Slow blend — sky/weather can change without harsh flashes on the tower. */
const MATERIAL_LERP = 0.038;

const scratch = {
  panelColor: new THREE.Color(),
  panelEmissive: new THREE.Color(),
  frameColor: new THREE.Color(),
  skyTint: new THREE.Color(),
  midTint: new THREE.Color(),
  sunStreak: new THREE.Color(),
};

/** Deep blue-black PV glass — period shifts stay in the same family. */
const periodPanelBase: Record<SkyPeriod, THREE.Color> = {
  night: new THREE.Color("#061018"),
  dawn: new THREE.Color("#081420"),
  day: new THREE.Color("#0a1828"),
  golden: new THREE.Color("#0c1a26"),
  dusk: new THREE.Color("#091622"),
};

const periodPanelEmissive: Record<SkyPeriod, THREE.Color> = {
  night: new THREE.Color("#142840"),
  dawn: new THREE.Color("#284868"),
  day: new THREE.Color("#1e4068"),
  golden: new THREE.Color("#345878"),
  dusk: new THREE.Color("#2a4868"),
};

const periodFrameBase: Record<SkyPeriod, THREE.Color> = {
  night: new THREE.Color("#222830"),
  dawn: new THREE.Color("#2e3642"),
  day: new THREE.Color("#323a46"),
  golden: new THREE.Color("#363c44"),
  dusk: new THREE.Color("#303842"),
};

const emissiveStrength: Record<SkyPeriod, number> = {
  night: 0.04,
  dawn: 0.08,
  day: 0.1,
  golden: 0.12,
  dusk: 0.09,
};

export function readHubTowerEnvironment(
  period: SkyPeriod,
  weatherKind: HubWeatherKind,
  sunDirection: THREE.Vector3,
  weatherIntensity: number,
  dayBlend?: number,
  skyStops?: { zenith: string; mid: string; horizon: string }
): HubTowerEnvironment {
  const colors = skyStops ?? getWebsiteHeroSkyColors();
  return {
    period,
    dayBlend,
    weatherKind,
    sunDirection: sunDirection.clone(),
    zenith: colors.zenith,
    mid: colors.mid,
    horizon: colors.horizon,
    weatherIntensity,
  };
}

/** @deprecated Prefer readHubTowerEnvironment with explicit sky stops */
export function readHubTowerEnvironmentFromDom(
  period: SkyPeriod,
  weatherKind: HubWeatherKind,
  sunDirection: THREE.Vector3,
  weatherIntensity: number,
  dayBlend?: number
): HubTowerEnvironment {
  return readHubTowerEnvironment(
    period,
    weatherKind,
    sunDirection,
    weatherIntensity,
    dayBlend
  );
}

function computeMaterialTargetsForPeriod(
  period: SkyPeriod,
  env: HubTowerEnvironment
): MaterialTargets {
  const panelColor = scratch.panelColor.copy(periodPanelBase[period]);
  const panelEmissive = scratch.panelEmissive.copy(periodPanelEmissive[period]);
  const frameColor = scratch.frameColor.copy(periodFrameBase[period]);

  const skyTint = scratch.skyTint.set(env.horizon);
  const midTint = scratch.midTint.set(env.mid);
  panelColor.lerp(skyTint, period === "night" ? 0.03 : 0.055);
  frameColor.lerp(midTint, 0.07);

  let emissiveIntensity = emissiveStrength[period];
  let metalness = 0.62;
  let roughness = period === "day" ? 0.14 : 0.18;
  let panelEnvIntensity =
    period === "golden" || period === "dusk"
      ? 1.85
      : period === "day"
        ? 1.65
        : period === "night"
          ? 0.75
          : 1.45;
  const frameEnvIntensity = 0.42;

  if (period === "night") {
    panelEmissive.lerp(new THREE.Color("#203858"), 0.18);
  }

  const sun = env.sunDirection;
  const sunFacing = Math.max(0, sun.x * 0.55 + sun.z * 0.55 + sun.y * 0.2);
  scratch.sunStreak
    .copy(skyTint)
    .lerp(midTint, 0.35)
    .lerp(new THREE.Color("#fff4e0"), sunFacing * 0.55);
  panelEmissive.lerp(scratch.sunStreak, 0.22 + sunFacing * 0.2);
  emissiveIntensity += sunFacing * 0.08;
  panelEnvIntensity += sunFacing * 0.35;

  const effect = weatherKindForVisualEffect(env.weatherKind);
  const w = env.weatherIntensity * 0.45;

  if (effect === "rain" && w > 0) {
    panelColor.lerp(new THREE.Color("#0a1420"), 0.14 * w);
    roughness = THREE.MathUtils.lerp(roughness, 0.1, w);
    metalness = THREE.MathUtils.lerp(metalness, 0.72, w);
    panelEnvIntensity = THREE.MathUtils.lerp(panelEnvIntensity, 2.1, w);
    emissiveIntensity = THREE.MathUtils.lerp(emissiveIntensity, 0.06, w);
  } else if (effect === "snow" && w > 0) {
    panelColor.lerp(new THREE.Color("#1a2434"), 0.16 * w);
    panelEmissive.lerp(new THREE.Color("#a8bcd8"), 0.12 * w);
    emissiveIntensity = THREE.MathUtils.lerp(emissiveIntensity, 0.14, w);
    roughness = THREE.MathUtils.lerp(roughness, 0.22, w);
    panelEnvIntensity = THREE.MathUtils.lerp(panelEnvIntensity, 1.5, w);
  }

  return {
    panelColor: panelColor.clone(),
    panelEmissive: panelEmissive.clone(),
    panelEmissiveIntensity: emissiveIntensity,
    panelMetalness: metalness,
    panelRoughness: roughness,
    panelEnvIntensity,
    frameColor: frameColor.clone(),
    frameEnvIntensity,
  };
}

function lerpMaterialTargets(
  a: MaterialTargets,
  b: MaterialTargets,
  t: number
): MaterialTargets {
  const k = THREE.MathUtils.clamp(t, 0, 1);
  return {
    panelColor: a.panelColor.clone().lerp(b.panelColor, k),
    panelEmissive: a.panelEmissive.clone().lerp(b.panelEmissive, k),
    panelEmissiveIntensity: THREE.MathUtils.lerp(
      a.panelEmissiveIntensity,
      b.panelEmissiveIntensity,
      k
    ),
    panelMetalness: THREE.MathUtils.lerp(a.panelMetalness, b.panelMetalness, k),
    panelRoughness: THREE.MathUtils.lerp(a.panelRoughness, b.panelRoughness, k),
    panelEnvIntensity: THREE.MathUtils.lerp(
      a.panelEnvIntensity,
      b.panelEnvIntensity,
      k
    ),
    frameColor: a.frameColor.clone().lerp(b.frameColor, k),
    frameEnvIntensity: THREE.MathUtils.lerp(
      a.frameEnvIntensity,
      b.frameEnvIntensity,
      k
    ),
  };
}

function computeMaterialTargets(env: HubTowerEnvironment): MaterialTargets {
  const blend = env.dayBlend;
  if (blend != null && blend > 0 && blend < 1) {
    return lerpMaterialTargets(
      computeMaterialTargetsForPeriod("night", env),
      computeMaterialTargetsForPeriod("day", env),
      blend
    );
  }
  if (blend != null && blend >= 1) {
    return computeMaterialTargetsForPeriod("day", env);
  }
  if (blend != null && blend <= 0) {
    return computeMaterialTargetsForPeriod("night", env);
  }
  return computeMaterialTargetsForPeriod(env.period, env);
}

export function applyHubTowerEnvMap(
  pair: MaterialPair,
  envMap: THREE.Texture | null
): void {
  pair.panel.envMap = envMap;
  pair.frame.envMap = envMap;
}

export function createHubTowerMaterials(): MaterialPair {
  const panel = new THREE.MeshStandardMaterial({
    color: "#0a1828",
    metalness: 0.62,
    roughness: 0.14,
    envMapIntensity: 1.65,
    emissive: "#1e4068",
    emissiveIntensity: 0.1,
  });

  const frame = new THREE.MeshStandardMaterial({
    color: "#323a46",
    metalness: 0.36,
    roughness: 0.62,
    envMapIntensity: 0.42,
  });

  return { panel, frame };
}

export function updateHubTowerMaterials(
  pair: MaterialPair,
  env: HubTowerEnvironment,
  materialLerp = MATERIAL_LERP
): void {
  const t = computeMaterialTargets(env);
  const k = materialLerp;
  const { panel, frame } = pair;

  panel.color.lerp(t.panelColor, k);
  panel.emissive.lerp(t.panelEmissive, k);
  panel.emissiveIntensity = THREE.MathUtils.lerp(
    panel.emissiveIntensity,
    t.panelEmissiveIntensity,
    k
  );
  panel.metalness = THREE.MathUtils.lerp(panel.metalness, t.panelMetalness, k);
  panel.roughness = THREE.MathUtils.lerp(panel.roughness, t.panelRoughness, k);
  panel.envMapIntensity = THREE.MathUtils.lerp(
    panel.envMapIntensity,
    t.panelEnvIntensity,
    k
  );
  frame.color.lerp(t.frameColor, k);
  frame.envMapIntensity = THREE.MathUtils.lerp(
    frame.envMapIntensity,
    t.frameEnvIntensity,
    k
  );
}
