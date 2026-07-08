import { lazy, Suspense, useEffect, useRef } from "react";
import { getChooserSkyPeriodForDate } from "../data/hubChooserSky";
import type { SkyPeriod } from "../data/hubChooserSky";
import {
  applyLivingSkyFrame,
  getLivingSkyFrame,
  type LivingSkyPreview,
} from "../data/hubLivingSky";
import { weatherKindForVisualEffect } from "../data/hubWeather";
import { applyWeatherToLivingSky } from "../data/hubWeatherSky";
import { applySolarSunToLivingSky } from "../lib/hubSolarSky";
import { getViewportAspect } from "../lib/hubSolarAlignment";
import { sampleHubSun, type HubSolarCoords } from "../lib/hubSolarSample";
import { useHubPreview } from "../context/HubPreviewContext";
import type { HubTowerLayout } from "./three/hubTowerConfig";
import type { HubWeatherResult } from "../lib/hubWeatherFetch";
import { getWebsiteHeroSkyStops } from "../marketing/website/websiteScrollSky";
import { getWebsiteHeroSkyPeriod } from "../marketing/website/websiteHeroScroll";
import { publishWebsiteHeroSkyColors } from "../marketing/website/websiteHeroSkyColors";
import { getWebsiteScrollSolarState } from "../marketing/website/websiteScrollSolar";
import { getWebsiteScrollOffset } from "../marketing/website/websiteScrollOffset";
import {
  getWebsiteHeroCanvasActive,
  subscribeWebsiteHeroCanvasActive,
} from "../marketing/website/websiteHeroCanvasGate";
import { markWebsiteHeroSkyPainted } from "../marketing/website/websiteHeroSkyBoot";
import { subscribeWebsiteHeroScroll } from "../marketing/website/websiteHeroScrollBus";
import { websiteTowerOrbit } from "../marketing/website/websiteTowerOrbit";

/** Night-only gold fireflies — mounted just for the marketing hero */
const HubFirefliesCanvas = lazy(() =>
  import("./HubFirefliesCanvas").then((m) => ({
    default: m.HubFirefliesCanvas,
  })),
);

const CLOCK_SYNC_MS = 60_000;
/** Hub product pages — ambient motion only */
const SKY_FRAME_MS = 1000 / 12;
/** Marketing hero — only while tower/sun still settling */
const SKY_TRACKING_FRAME_MS = 1000 / 8;
const HUB_CANVAS_INVALIDATE = "hub-tower-invalidate";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Fade night-only layers as the sun climbs — tied to sky blend */
function scrollNightLift(scrollBlend: number): number {
  return 1 - smoothstep(0, 0.55, scrollBlend);
}

type HubSkyBackgroundProps = {
  weather: HubWeatherResult;
  coords: HubSolarCoords | null;
  previewDate: Date | null;
  /** Marketing /website hero — scroll solar resolved imperatively (no React re-renders) */
  marketingHero?: boolean;
  /** Scroll-choreographed sky (marketing hero) — weather still live */
  scrollSolar?: {
    azimuthDeg: number;
    altitudeDeg: number;
    skyAltitudeDeg?: number;
    simulatedAt?: Date;
    scrollBlend?: number;
    orbitBlend?: number;
    skyBlend?: number;
    tracking?: boolean;
  } | null;
  /** Camera frame for projecting the sun disc — defaults to product hub */
  towerLayout?: HubTowerLayout;
};

export function HubSkyBackground({
  weather,
  coords,
  previewDate,
  marketingHero = false,
  scrollSolar = null,
  towerLayout,
}: HubSkyBackgroundProps) {
  const preview = useHubPreview();
  const previewRef = useRef(preview);
  previewRef.current = preview;

  const skyRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef(weather);
  weatherRef.current = weather;
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const previewDateRef = useRef(previewDate);
  previewDateRef.current = previewDate;
  const scrollSolarRef = useRef(scrollSolar);
  scrollSolarRef.current = scrollSolar;
  const marketingHeroRef = useRef(marketingHero);
  marketingHeroRef.current = marketingHero;
  const towerLayoutRef = useRef(towerLayout);
  towerLayoutRef.current = towerLayout;

  useEffect(() => {
    const sky = skyRef.current;
    if (!sky) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let rafId = 0;
    let clockTimer = 0;
    let lastPaintMs = 0;
    let lastPaintKey = "";
    let hubPageShell: HTMLElement | null = null;
    let heroProductLineShell: HTMLElement | null = null;
    let bootSkyPainted = false;

    const resolvePeriod = (): SkyPeriod => {
      const p = previewRef.current;
      if (p.sky) return p.sky;
      const at = p.previewDate ?? new Date();
      return getChooserSkyPeriodForDate(at);
    };

    const livingPreview = (): LivingSkyPreview => {
      const p = previewRef.current;
      return {
        at: p.previewDate ?? undefined,
        period: p.sky ?? undefined,
      };
    };

    let period: SkyPeriod = resolvePeriod();

    const syncPeriod = () => {
      const next = resolvePeriod();
      if (next !== period) {
        period = next;
        sky.dataset.skyPeriod = next;
      }
    };

    const paint = (nowMs: number) => {
      if (document.visibilityState === "hidden") return;

      const { kind, cloudCover: cover, intensity: power } = weatherRef.current;
      const scrollChoreography =
        marketingHeroRef.current || scrollSolarRef.current != null;
      const skipWeatherFx = scrollChoreography;
      const weatherKind = skipWeatherFx ? "clear" : kind;
      const weatherCover = skipWeatherFx ? 0 : cover;
      const weatherPower = skipWeatherFx ? 0 : power;
      const scrollDrive = marketingHeroRef.current
        ? getWebsiteScrollSolarState(
            getWebsiteScrollOffset(),
            coordsRef.current,
            previewDateRef.current
          )
        : scrollSolarRef.current;
      const scrollBlend = scrollDrive?.scrollBlend ?? 0;
      const skyBlend =
        scrollDrive?.skyBlend ?? scrollDrive?.orbitBlend ?? scrollBlend;
      const at =
        scrollChoreography && scrollDrive?.simulatedAt
          ? scrollDrive.simulatedAt
          : previewDateRef.current ?? new Date();

      if (scrollChoreography) {
        period = getWebsiteHeroSkyPeriod(skyBlend);
        sky.dataset.skyPeriod = period;
      } else {
        syncPeriod();
      }

      const livingAt: LivingSkyPreview = scrollChoreography
        ? { at, period }
        : livingPreview();
      const base = getLivingSkyFrame(at, nowMs, livingAt);
      const effect = skipWeatherFx
        ? null
        : weatherKindForVisualEffect(weatherKind);
      let frame = effect
        ? applyWeatherToLivingSky(base, weatherKind, weatherCover, weatherPower)
        : base;

      if (scrollChoreography) {
        const stops = getWebsiteHeroSkyStops(skyBlend);
        const nightLift = scrollNightLift(skyBlend);
        const actualAlt = scrollDrive!.altitudeDeg;
        const displayAlt = scrollDrive!.skyAltitudeDeg ?? actualAlt;
        const nightSun = actualAlt < 0;
        const sunUp = smoothstep(-4, 8, actualAlt);
        const projAlt = nightSun ? actualAlt : displayAlt;
        const solarFrame = applySolarSunToLivingSky(
          frame,
          scrollDrive!.azimuthDeg,
          projAlt,
          period,
          weatherKind,
          weatherPower,
          getViewportAspect(),
          towerLayoutRef.current
        );
        const weatherMul = effect
          ? { clear: 1, cloudy: 0.5, fog: 0.22, drizzle: 0.16, rain: 0.1, storm: 0.06, snow: 0.38 }[
              effect
            ] * (1 - weatherPower * 0.32)
          : 1;
        const sunGlowBoost = 0.85 + skyBlend * 0.75;
        const minDayGlow = 0.28 + skyBlend * 0.22;
        const rawGlow = parseFloat(solarFrame.sunGlow) * weatherMul * sunGlowBoost;
        const sunGlow = nightSun
          ? "0"
          : String(Math.min(1, Math.max(minDayGlow * sunUp, rawGlow * sunUp)));

        frame = {
          ...frame,
          zenith: stops.zenith,
          mid: stops.mid,
          horizon: stops.horizon,
          sunX: nightSun ? "50%" : solarFrame.sunX,
          sunY: nightSun ? "-24%" : solarFrame.sunY,
          sunGlow,
          sunCore:
            nightSun
              ? "transparent"
              : solarFrame.sunCore === "transparent"
                ? `rgba(255, 236, 200, ${(0.55 + skyBlend * 0.42).toFixed(3)})`
                : solarFrame.sunCore,
          starOpacity: String(lerp(0, 0.52, nightLift)),
          hazeOpacity: String(lerp(0.2, 0.22, nightLift)),
          vignette: String(lerp(0.1, 0.38, nightLift)),
          flowX: "0%",
          flowY: "0%",
          flowRotate: "0deg",
          flowScale: "1",
          cloudAX: "0%",
          cloudAY: "0%",
          cloudBX: "0%",
          cloudBY: "0%",
          auroraRotate: "0deg",
          auroraShift: "0%",
        };
      } else {
        const sampled = sampleHubSun(coordsRef.current, at, at);
        const az = sampled.azimuthDeg;
        const alt = sampled.altitudeDeg;

        if (az != null && alt != null) {
          frame = applySolarSunToLivingSky(
            frame,
            az,
            alt,
            period,
            kind,
            power,
            getViewportAspect(),
            towerLayoutRef.current
          );
        }
      }

      const paintKey = [
        frame.zenith,
        frame.mid,
        frame.horizon,
        frame.sunX,
        frame.sunY,
        frame.sunGlow,
        frame.sunCore,
        frame.flowX,
        frame.flowY,
        frame.starOpacity,
        frame.hazeOpacity,
        frame.vignette,
        period,
      ].join("|");
      if (paintKey === lastPaintKey) return;
      lastPaintKey = paintKey;

      applyLivingSkyFrame(sky, frame);

      if (scrollChoreography) {
        publishWebsiteHeroSkyColors({
          zenith: frame.zenith,
          mid: frame.mid,
          horizon: frame.horizon,
        });
      }

      if (typeof document !== "undefined") {
        if (!hubPageShell) {
          hubPageShell = document.querySelector(".web-page--hub-hero");
          heroProductLineShell = document.querySelector(".web-hero-product-line");
        }
        const syncHubStops = (el: HTMLElement | null) => {
          if (!el) return;
          el.style.setProperty("--hub-zenith", frame.zenith);
          el.style.setProperty("--hub-mid", frame.mid);
          el.style.setProperty("--hub-horizon", frame.horizon);
        };
        syncHubStops(hubPageShell);
        syncHubStops(heroProductLineShell);
        if (heroProductLineShell) {
          heroProductLineShell.style.setProperty("--hub-sun-x", frame.sunX);
          heroProductLineShell.style.setProperty("--hub-sun-y", frame.sunY);
          heroProductLineShell.style.setProperty("--hub-sun-glow", frame.sunGlow);
          heroProductLineShell.style.setProperty("--hub-sun-core", frame.sunCore);
        }
        if (!scrollChoreography) {
          const root = document.documentElement;
          root.style.setProperty("--hub-zenith", frame.zenith);
          root.style.setProperty("--hub-mid", frame.mid);
          root.style.setProperty("--hub-horizon", frame.horizon);
          if (document.body.classList.contains("website-active")) {
            document.body.style.background = frame.zenith;
          }
        }
      }

      if (effect && sky) {
        sky.style.setProperty("--hub-tower-fog", frame.horizon);
      }

      if (!bootSkyPainted) {
        bootSkyPainted = true;
        markWebsiteHeroSkyPainted();
      }
    };

    syncPeriod();
    sky.dataset.skyPeriod = period;
    paint(performance.now());

    if (reducedMotion) {
      clockTimer = window.setInterval(() => {
        if (!marketingHeroRef.current && !scrollSolarRef.current) syncPeriod();
        paint(performance.now());
      }, CLOCK_SYNC_MS);
    } else if (marketingHeroRef.current || scrollSolarRef.current != null) {
      let trackRaf = 0;
      let paintRaf = 0;
      let trackingLoop = false;
      let paintTicking = false;

      const runPaint = (now: number) => {
        lastPaintMs = now;
        paint(now);
        ensureTrackingLoop();
      };

      const schedulePaint = () => {
        if (!getWebsiteHeroCanvasActive()) return;
        if (paintTicking) return;
        paintTicking = true;
        paintRaf = requestAnimationFrame((now) => {
          paintTicking = false;
          runPaint(now);
        });
      };

      const resolveScrollDrive = () =>
        marketingHeroRef.current
          ? getWebsiteScrollSolarState(
              getWebsiteScrollOffset(),
              coordsRef.current,
              previewDateRef.current
            )
          : scrollSolarRef.current;

      const ensureTrackingLoop = () => {
        if (!getWebsiteHeroCanvasActive()) {
          trackingLoop = false;
          if (trackRaf) cancelAnimationFrame(trackRaf);
          trackRaf = 0;
          return;
        }
        const drive = resolveScrollDrive();
        if (!drive) {
          trackingLoop = false;
          if (trackRaf) cancelAnimationFrame(trackRaf);
          trackRaf = 0;
          return;
        }
        if (!drive.tracking && !websiteTowerOrbit.dragging) {
          trackingLoop = false;
          return;
        }
        if (trackingLoop) return;
        trackingLoop = true;

        const trackStep = (now: number) => {
          if (!getWebsiteHeroCanvasActive()) {
            trackingLoop = false;
            trackRaf = 0;
            return;
          }
          const state = resolveScrollDrive();
          if (!state) {
            trackingLoop = false;
            trackRaf = 0;
            return;
          }
          const stillSettling = state.tracking || websiteTowerOrbit.dragging;
          if (lastPaintMs !== 0 && now - lastPaintMs < SKY_TRACKING_FRAME_MS) {
            trackRaf = requestAnimationFrame(trackStep);
            return;
          }
          lastPaintMs = now;
          paint(now);
          if (!stillSettling) {
            trackingLoop = false;
            trackRaf = 0;
            return;
          }
          trackRaf = requestAnimationFrame(trackStep);
        };
        trackRaf = requestAnimationFrame(trackStep);
      };

      const onScroll = () => schedulePaint();
      const onInvalidate = () => schedulePaint();
      const onGate = () => {
        if (getWebsiteHeroCanvasActive()) {
          schedulePaint();
        } else {
          trackingLoop = false;
          if (trackRaf) cancelAnimationFrame(trackRaf);
          trackRaf = 0;
        }
      };

      const unsubscribeScroll = subscribeWebsiteHeroScroll(onScroll);
      const unsubscribeGate = subscribeWebsiteHeroCanvasActive(onGate);
      window.addEventListener(HUB_CANVAS_INVALIDATE, onInvalidate);

      return () => {
        unsubscribeScroll();
        unsubscribeGate();
        window.removeEventListener(HUB_CANVAS_INVALIDATE, onInvalidate);
        trackingLoop = false;
        if (trackRaf) cancelAnimationFrame(trackRaf);
        if (paintRaf) cancelAnimationFrame(paintRaf);
      };
    } else {
      let running = false;

      const loop = (now: number) => {
        if (!getWebsiteHeroCanvasActive()) {
          running = false;
          return;
        }

        if (lastPaintMs !== 0 && now - lastPaintMs < SKY_FRAME_MS) {
          rafId = requestAnimationFrame(loop);
          return;
        }
        lastPaintMs = now;
        syncPeriod();
        paint(now);
        rafId = requestAnimationFrame(loop);
      };

      const startLoop = () => {
        if (running || !getWebsiteHeroCanvasActive()) return;
        running = true;
        rafId = requestAnimationFrame(loop);
      };

      const stopLoop = () => {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
      };

      const onGate = () => {
        if (getWebsiteHeroCanvasActive()) {
          lastPaintMs = 0;
          paint(performance.now());
          startLoop();
        } else {
          stopLoop();
        }
      };

      onGate();
      const unsubscribeGate = subscribeWebsiteHeroCanvasActive(onGate);

      clockTimer = window.setInterval(() => {
        syncPeriod();
      }, CLOCK_SYNC_MS);

      return () => {
        unsubscribeGate();
        stopLoop();
        window.clearInterval(clockTimer);
      };
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(clockTimer);
    };
  }, []);

  return (
    <>
      <div ref={skyRef} className="hub__sky hub__sky--driven" aria-hidden>
        <div className="hub__sky-flow" aria-hidden />
        <div className="hub__sky-aurora" aria-hidden />
        <div className="hub__sky-stars" aria-hidden />
        {marketingHero ? (
          <Suspense fallback={null}>
            <HubFirefliesCanvas lite skyPeriod="night" opacity={1} />
          </Suspense>
        ) : null}
        <div className="hub__sky-clouds hub__sky-clouds--a" aria-hidden />
        <div className="hub__sky-clouds hub__sky-clouds--b" aria-hidden />
        <div className="hub__sky-haze" aria-hidden />
        <div className="hub__sky-vignette" aria-hidden />
      </div>
      <div className="web-hero-sun-layer" aria-hidden>
        <div className="hub__sky-sun" aria-hidden>
          <div className="hub__sky-sun-disc" aria-hidden />
        </div>
      </div>
    </>
  );
}
