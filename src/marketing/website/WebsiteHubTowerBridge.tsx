import { HubTowerScene } from "../../components/three/HubTowerScene";
import { TowerGpuWarmup } from "../../components/three/TowerGpuWarmup";
import { useTowerScenePrepared } from "../../components/three/useTowerScenePrepared";
import { TOWER_PREP_KEYS } from "../../components/three/towerScenePrep";
import type { HubTowerScrollDriver } from "../../components/three/hubTowerConfig";
import { useHubPreview } from "../../context/HubPreviewContext";
import { useWebsiteHubHero } from "./WebsiteHubHeroContext";
import { WEBSITE_HERO_WEATHER } from "./websiteHeroWeather";
import { WEBSITE_HUB_TOWER } from "./websiteHubTowerConfig";
import {
  getWebsiteScrollSolarState,
  getWebsiteScrollSunDirection,
} from "./websiteScrollSolar";
import { websiteTowerOrbit } from "./websiteTowerOrbit";
import { getWebsiteHeroSkyPeriod } from "./websiteHeroScroll";
import { getWebsiteHeroSkyStops } from "./websiteScrollSky";
import { getWebsiteScrollOffset } from "./websiteScrollOffset";
import { useScroll } from "@react-three/drei";
import { useMemo, useRef } from "react";

function useWebsiteHubScrollDriver(): HubTowerScrollDriver {
  const scroll = useScroll();
  const { coords } = useWebsiteHubHero();
  const { previewDate } = useHubPreview();
  const coordsRef = useRef(coords);
  const previewRef = useRef(previewDate);
  coordsRef.current = coords;
  previewRef.current = previewDate;

  return useMemo(() => {
    let cachedOffset = -1;
    let cachedState = getWebsiteScrollSolarState(
      0,
      coordsRef.current,
      previewRef.current
    );

    const state = () => {
      const offset = getWebsiteScrollOffset(scroll);
      if (offset !== cachedOffset) {
        cachedOffset = offset;
        cachedState = getWebsiteScrollSolarState(
          offset,
          coordsRef.current,
          previewRef.current
        );
      }
      return cachedState;
    };

    return {
      getYaw: () => state().towerYaw,
      getSunDirection: (target) => {
        state();
        return getWebsiteScrollSunDirection(
          cachedOffset,
          coordsRef.current,
          previewRef.current,
          target
        );
      },
      isAnimating: () => state().tracking,
      getScrollBlend: () => state().scrollBlend,
      getSkyPeriod: () => getWebsiteHeroSkyPeriod(state().scrollBlend),
      getOrbitDragging: () => websiteTowerOrbit.dragging,
      getSkyStops: () => getWebsiteHeroSkyStops(state().skyBlend),
    };
  }, [scroll]);
}

/** DSR designer tower + hub materials — scroll choreographed night → day */
export function WebsiteHubTowerBridge() {
  const scrollDriver = useWebsiteHubScrollDriver();
  const { coords } = useWebsiteHubHero();
  const { previewDate, sky: previewSky } = useHubPreview();
  const towerReady = useTowerScenePrepared(TOWER_PREP_KEYS.designer);

  return (
    <>
      <TowerGpuWarmup ready={towerReady} />
      <HubTowerScene
      coords={coords}
      previewDate={previewDate}
      weather={WEBSITE_HERO_WEATHER}
      skyPeriod={previewSky}
      scrollDriver={scrollDriver}
      layout={WEBSITE_HUB_TOWER}
      modelVariant="designer"
      perfMode="marketing"
      groundShadow
      />
    </>
  );
}
