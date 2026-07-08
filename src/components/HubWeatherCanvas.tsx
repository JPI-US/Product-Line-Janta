import { useEffect, useRef } from "react";

type EffectKind = "rain" | "snow";

type HubWeatherCanvasProps = {
  kind: EffectKind;
  intensity: number;
};

type RainStreak = {
  x: number;
  y: number;
  len: number;
  speed: number;
  opacity: number;
  drift: number;
};

type SnowFlake = {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  drift: number;
  near: boolean;
};

const RAIN_FRAME_MS = 1000 / 20;
const SNOW_FRAME_MS = 1000 / 24;
/** Internal buffer scale — displayed full size; keeps the same look with fewer pixels. */
const RAIN_BUFFER_SCALE = 0.68;
const SNOW_MAX_DPR = 1;

function clampCount(n: number, max: number): number {
  return Math.min(max, Math.max(12, Math.round(n)));
}

function areaScale(width: number, height: number): number {
  return Math.min(1.35, Math.sqrt((width * height) / (1280 * 720)));
}

function makeRainStreaks(count: number, height: number): RainStreak[] {
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random() * height,
    len: 14 + Math.random() * 18,
    speed: 0.58 + Math.random() * 0.3,
    opacity: 0.18 + Math.random() * 0.22,
    drift: (Math.random() - 0.5) * 0.12,
  }));
}

function makeSnowflakes(count: number, height: number, near: boolean): SnowFlake[] {
  const scale = near ? 1.55 : 0.8;
  return Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random() * height,
    r: (1.4 + Math.random() * 2.4) * scale,
    speed: (0.032 + Math.random() * 0.03) * (near ? 1.1 : 0.95),
    opacity: near ? 0.65 + Math.random() * 0.3 : 0.4 + Math.random() * 0.3,
    drift: (Math.random() - 0.5) * (near ? 0.028 : 0.018),
    near,
  }));
}

export function HubWeatherCanvas({ kind, intensity }: HubWeatherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const power = Math.max(0.45, intensity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const isSnow = kind === "snow";
    const frameMs = isSnow ? SNOW_FRAME_MS : RAIN_FRAME_MS;
    let rainDrops: RainStreak[] = [];
    let snowBack: SnowFlake[] = [];
    let snowFront: SnowFlake[] = [];
    let width = 0;
    let height = 0;
    let timer = 0;
    let last = 0;
    let visible = document.visibilityState !== "hidden";
    let rainBuffer: HTMLCanvasElement | null = null;
    let rainBufferCtx: CanvasRenderingContext2D | null = null;
    let rainBufW = 0;
    let rainBufH = 0;

    const rebuild = () => {
      if (height < 1) return;
      const scale = areaScale(width, height);
      const p = 0.9 + power * 0.2;

      if (isSnow) {
        snowBack = makeSnowflakes(clampCount(32 * scale * p, 48), height, false);
        snowFront = makeSnowflakes(clampCount(16 * scale * p, 22), height, true);
      } else {
        rainDrops = makeRainStreaks(clampCount(32 * scale * p, 40), height);
      }
    };

    const ensureRainBuffer = () => {
      rainBufW = Math.max(1, Math.floor(width * RAIN_BUFFER_SCALE));
      rainBufH = Math.max(1, Math.floor(height * RAIN_BUFFER_SCALE));
      if (!rainBuffer) {
        rainBuffer = document.createElement("canvas");
        rainBufferCtx = rainBuffer.getContext("2d", { alpha: true });
      }
      if (!rainBufferCtx) return;
      if (rainBuffer.width !== rainBufW || rainBuffer.height !== rainBufH) {
        rainBuffer.width = rainBufW;
        rainBuffer.height = rainBufH;
      }
    };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 1 || h < 1) return;

      width = w;
      height = h;
      const dpr = isSnow
        ? Math.min(window.devicePixelRatio || 1, SNOW_MAX_DPR)
        : 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };

    const drawRainBuffer = (drops: RainStreak[], alphaMul: number) => {
      if (!rainBufferCtx) return;
      const bctx = rainBufferCtx;
      bctx.clearRect(0, 0, rainBufW, rainBufH);
      bctx.lineCap = "round";
      bctx.lineWidth = 1.1;
      bctx.strokeStyle = "#e8f2ff";
      bctx.globalAlpha = Math.min(1, alphaMul * 1.32);
      bctx.beginPath();
      for (const drop of drops) {
        const px = drop.x * rainBufW;
        const py = (drop.y / height) * rainBufH;
        const len = (drop.len / height) * rainBufH;
        const drift = drop.drift * 4 * RAIN_BUFFER_SCALE;
        bctx.moveTo(px, py);
        bctx.lineTo(px + drift, py + len);
      }
      bctx.stroke();
      bctx.globalAlpha = 1;
    };

    const compositeRain = () => {
      if (!rainBuffer) return;
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.globalAlpha = 0.68;
      ctx.drawImage(rainBuffer, 0, 0, width, height);
      ctx.globalAlpha = 1;
    };

    const tickRain = (dt: number) => {
      for (const drop of rainDrops) {
        drop.y += drop.speed * dt;
        drop.x += drop.drift * dt * 0.018;
        if (drop.y > height + drop.len) {
          drop.y = -drop.len;
          drop.x = Math.random();
        }
      }
    };

    const tickSnow = (dt: number) => {
      for (const flake of snowBack) {
        flake.y += flake.speed * dt;
        flake.x += flake.drift * dt * 0.02;
        if (flake.y > height + flake.r * 2) {
          flake.y = -flake.r;
          flake.x = Math.random();
        }
      }
      for (const flake of snowFront) {
        flake.y += flake.speed * dt;
        flake.x += flake.drift * dt * 0.024;
        if (flake.y > height + flake.r * 3) {
          flake.y = -flake.r * 2;
          flake.x = Math.random();
        }
      }
    };

    const paint = () => {
      if (width < 1 || height < 1) return;

      const alphaBase = isSnow ? 0.88 + power * 0.12 : 0.42 + power * 0.18;

      if (isSnow) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#ffffff";
        for (const flake of snowBack) {
          ctx.globalAlpha = Math.min(1, flake.opacity * alphaBase);
          ctx.beginPath();
          ctx.arc(flake.x * width, flake.y, flake.r, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const flake of snowFront) {
          const px = flake.x * width;
          const py = flake.y;
          const a = Math.min(1, flake.opacity * alphaBase);
          ctx.globalAlpha = a * 0.4;
          ctx.beginPath();
          ctx.arc(px, py, flake.r * 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(px, py, flake.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        ensureRainBuffer();
        drawRainBuffer(rainDrops, alphaBase);
        compositeRain();
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
      const delay = visible ? frameMs : 400;
      timer = window.setTimeout(tick, delay);
    };

    const tick = () => {
      timer = 0;
      if (!visible) {
        scheduleTick();
        return;
      }

      const now = performance.now();
      if (last === 0) {
        last = now;
        paint();
        scheduleTick();
        return;
      }

      const elapsed = now - last;
      const dt = Math.min(48, elapsed);
      last = now;

      if (!reducedMotion) {
        if (isSnow) tickSnow(dt);
        else tickRain(dt);
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

    if (!reducedMotion) {
      scheduleTick();
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      rainBuffer = null;
      rainBufferCtx = null;
    };
  }, [kind, power]);

  return (
    <canvas
      ref={canvasRef}
      className={`hub__sky-weather-canvas hub__sky-weather-canvas--${kind}`}
      aria-hidden
    />
  );
}
