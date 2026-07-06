import { useEffect, useRef } from "react";
import {
  getChooserSkyPeriodForDate,
  type SkyPeriod,
} from "../data/hubChooserSky";
import { useHubPreview } from "../context/HubPreviewContext";
import { useHubLiveClock } from "../hooks/useHubSolarState";
import {
  getWebsiteHeroCanvasActive,
  subscribeWebsiteHeroCanvasActive,
} from "../marketing/website/websiteHeroCanvasGate";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function scrollNightLift(scrollBlend: number): number {
  return 1 - smoothstep(0, 0.55, scrollBlend);
}

function readMarketingHeroSkyBlend(): number {
  const page = document.querySelector<HTMLElement>(".web-page");
  if (!page) return 0;
  const raw = page.style.getPropertyValue("--web-sky-blend").trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

type Firefly = {
  x: number;
  y: number;
  phase: number;
  speed: number;
  size: number;
  warmth: number;
};

const FRAME_MS = 1000 / 12;
const LITE_FRAME_MS = 1000 / 8;
const MAX_DPR = 1;
const MAX_COUNT = 72;
const LITE_MAX_COUNT = 36;

function seeded(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function makeFireflies(count: number, aspect = 16 / 9): Firefly[] {
  const cols = Math.max(7, Math.round(Math.sqrt(count * aspect)));
  const rows = Math.max(5, Math.ceil(count / cols));
  const padX = 0.02;
  const padY = 0.05;
  const spanX = 1 - padX * 2;
  const spanY = 1 - padY * 2;
  const cellW = spanX / cols;
  const cellH = spanY / rows;

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (seeded(i * 3.17) - 0.5) * cellW * 0.82;
    const jitterY = (seeded(i * 7.91) - 0.5) * cellH * 0.82;

    return {
      x: padX + col * cellW + cellW * 0.5 + jitterX,
      y: padY + row * cellH + cellH * 0.5 + jitterY,
      phase: seeded(i * 1.31) * Math.PI * 2,
      speed: 0.55 + seeded(i * 2.73) * 0.9,
      size: 0.85 + seeded(i * 5.11) * 0.9,
      warmth: seeded(i * 9.43),
    };
  });
}

function fireflyColor(warmth: number, alpha: number): string {
  const r = Math.round(232 + warmth * 20);
  const g = Math.round(168 + warmth * 48);
  const b = Math.round(48 + warmth * 24);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveSkyPeriod(
  skyPeriod: SkyPeriod | null | undefined,
  previewSky: SkyPeriod | null,
  previewDate: Date | null,
  liveTime: Date
): SkyPeriod {
  if (skyPeriod) return skyPeriod;
  if (previewSky) return previewSky;
  return getChooserSkyPeriodForDate(previewDate ?? liveTime);
}

type HubFirefliesCanvasProps = {
  /** Scroll-choreographed sky period (marketing hero) */
  skyPeriod?: SkyPeriod | null;
  /** 0–1 fade for scroll intro (overrides binary night gate when set) */
  opacity?: number;
  /** Fewer particles + lower tick rate for marketing hero */
  lite?: boolean;
};

export function HubFirefliesCanvas({
  skyPeriod = null,
  opacity,
  lite = false,
}: HubFirefliesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { sky: previewSky, previewDate } = useHubPreview();
  const liveTime = useHubLiveClock();
  const period = resolveSkyPeriod(skyPeriod, previewSky, previewDate, liveTime);
  const isNight = period === "night";
  const showFireflies =
    lite || opacity != null ? true : isNight;
  const fadeRef = useRef(opacity ?? 1);
  fadeRef.current = opacity ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showFireflies) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const maxCount = lite ? LITE_MAX_COUNT : MAX_COUNT;
    const frameMs = lite ? LITE_FRAME_MS : FRAME_MS;
    const heroGated = lite;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let fireflies = makeFireflies(maxCount, 16 / 9);
    let width = 0;
    let height = 0;
    let timer = 0;
    let last = 0;
    let t = 0;
    let visible = document.visibilityState !== "hidden";

    const rebuild = () => {
      const scale = Math.min(1.25, Math.sqrt((width * height) / (1280 * 720)));
      const aspect = width / Math.max(height, 1);
      const base = lite ? 28 : 52;
      const cap = lite ? LITE_MAX_COUNT : MAX_COUNT;
      fireflies = makeFireflies(
        Math.min(cap, Math.max(lite ? 24 : 40, Math.round(base * scale))),
        aspect
      );
    };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 1 || h < 1) return;

      width = w;
      height = h;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };

    const opacityFadeRef = fadeRef;

    const paint = () => {
      if (width < 1 || height < 1) return;
      ctx.clearRect(0, 0, width, height);
      const layerFade = opacityFadeRef.current;

      for (const fly of fireflies) {
        const wanderX =
          Math.sin(t * fly.speed + fly.phase) * width * 0.022 +
          Math.cos(t * fly.speed * 0.7 + fly.phase * 1.4) * width * 0.014;
        const wanderY =
          Math.sin(t * fly.speed * 1.15 + fly.phase * 0.8) * height * 0.02 +
          Math.cos(t * fly.speed * 0.85 + fly.phase * 1.6) * height * 0.013;

        const px = fly.x * width + wanderX;
        const py = fly.y * height + wanderY;
        const flicker = (reducedMotion
          ? 0.72
          : 0.28 +
            0.72 *
              Math.pow(
                0.5 + 0.5 * Math.sin(t * (1.8 + fly.speed * 0.35) + fly.phase * 2.3),
                2.1
              )) * layerFade;

        const coreR = fly.size;

        if (lite) {
          ctx.fillStyle = fireflyColor(fly.warmth, Math.min(1, flicker * 0.82));
          ctx.beginPath();
          ctx.arc(px, py, coreR, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        const glowR = coreR * 3;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        glow.addColorStop(0, fireflyColor(fly.warmth, flicker * 0.55));
        glow.addColorStop(0.35, fireflyColor(fly.warmth, flicker * 0.18));
        glow.addColorStop(1, fireflyColor(fly.warmth, 0));

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = fireflyColor(fly.warmth, Math.min(1, flicker * 0.95));
        ctx.beginPath();
        ctx.arc(px, py, coreR, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const onVisibility = () => {
      visible = document.visibilityState !== "hidden";
      if (visible) {
        last = 0;
        paint();
        scheduleTick();
      } else if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
    };

    const scheduleTick = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(tick, visible ? frameMs : 500);
    };

    const tick = () => {
      timer = 0;
      if (heroGated && !getWebsiteHeroCanvasActive()) {
        return;
      }
      if (!visible) {
        scheduleTick();
        return;
      }

      if (lite) {
        const layerFade = scrollNightLift(readMarketingHeroSkyBlend());
        fadeRef.current = layerFade;
        if (layerFade <= 0.08) {
          if (width > 0 && height > 0) {
            ctx.clearRect(0, 0, width, height);
          }
          return;
        }
      }

      const now = performance.now();
      if (last === 0) {
        last = now;
        paint();
        scheduleTick();
        return;
      }

      const dt = Math.min(48, now - last);
      last = now;
      if (!reducedMotion) {
        t += dt * 0.001;
      }
      paint();
      scheduleTick();
    };

    resize();
    paint();

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        paint();
      }, 120);
    });
    ro.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);

    const startTicks = () => {
      if (!reducedMotion && (!heroGated || getWebsiteHeroCanvasActive())) {
        scheduleTick();
      }
    };

    const stopTicks = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
    };

    const onHeroGate = () => {
      if (heroGated && getWebsiteHeroCanvasActive()) {
        last = 0;
        paint();
        startTicks();
      } else if (heroGated) {
        stopTicks();
      }
    };

    startTicks();
    const unsubscribeHero =
      heroGated ? subscribeWebsiteHeroCanvasActive(onHeroGate) : () => {};

    return () => {
      unsubscribeHero();
      stopTicks();
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [showFireflies, skyPeriod, lite]);

  if (!showFireflies) return null;

  return <canvas ref={canvasRef} className="hub__sky-fireflies" aria-hidden />;
}
