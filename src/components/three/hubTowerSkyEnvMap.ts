import * as THREE from "three";
import type { HubTowerEnvironment } from "./hubTowerEnvironment";

const EQ_W = 128;
const EQ_H = 64;
const UPDATE_INTERVAL_MS = 900;

export type HubTowerSkyEnvMapOptions = {
  width?: number;
  height?: number;
  updateIntervalMs?: number;
};

const scratchDir = new THREE.Vector3();
const scratchColor = new THREE.Color();
const scratchTop = new THREE.Color();
const scratchMid = new THREE.Color();
const scratchHorizon = new THREE.Color();
const scratchSun = new THREE.Color();
const scratchBand = new THREE.Color();

function dirFromEquirectUV(u: number, v: number, target: THREE.Vector3): void {
  const phi = v * Math.PI;
  const theta = u * Math.PI * 2 - Math.PI;
  const sinPhi = Math.sin(phi);
  target.set(sinPhi * Math.sin(theta), Math.cos(phi), sinPhi * Math.cos(theta));
}

/** Stylized sky sample — soft bands + broad sun shelf (not photoreal). */
function sampleSky(
  dir: THREE.Vector3,
  zenith: THREE.Color,
  mid: THREE.Color,
  horizon: THREE.Color,
  sunDir: THREE.Vector3,
  sunColor: THREE.Color,
  sunStrength: number,
  target: THREE.Color
): void {
  const t = THREE.MathUtils.smoothstep(dir.y, -0.15, 0.92);
  if (t < 0.45) {
    target.copy(horizon).lerp(mid, t / 0.45);
  } else {
    target.copy(mid).lerp(zenith, (t - 0.45) / 0.55);
  }

  const bandWave =
    Math.sin(dir.y * 9 + dir.x * 5) * 0.5 +
    Math.sin(dir.x * 7 - dir.y * 4) * 0.35;
  scratchBand.copy(mid).lerp(horizon, 0.35 + bandWave * 0.12);
  target.lerp(scratchBand, 0.14);

  const sunDot = dir.dot(sunDir);
  const shelf = Math.exp(-Math.pow((sunDot - 0.55) / 0.22, 2));
  if (shelf > 0.02) {
    target.lerp(sunColor, shelf * sunStrength * 0.55);
  }
  if (sunDot > 0.9) {
    const bloom = Math.pow((sunDot - 0.9) / 0.1, 1.6);
    target.lerp(sunColor, bloom * (sunStrength * 0.65 + 0.2));
  }
}

function sunTintForPeriod(env: HubTowerEnvironment, target: THREE.Color): number {
  if (env.dayBlend != null) {
    const t = THREE.MathUtils.clamp(env.dayBlend, 0, 1);
    target.set("#90a8d8").lerp(scratchSun.set("#f8f4ec"), t);
    return THREE.MathUtils.lerp(0.32, 0.72, t);
  }

  const { period } = env;
  switch (period) {
    case "golden":
      target.set("#ffe0a8");
      return 0.92;
    case "dusk":
      target.set("#ff9870");
      return 0.85;
    case "dawn":
      target.set("#ffd0c0");
      return 0.8;
    case "night":
      target.set("#90a8d8");
      return 0.32;
    default:
      target.set("#f8f4ec");
      return 0.72;
  }
}

/** Procedural stylized IBL from hub sky CSS. */
export class HubTowerSkyEnvMap {
  private pmrem: THREE.PMREMGenerator;
  private eqTexture: THREE.CanvasTexture;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private lastUpdate = 0;
  private lastEnvKey = "";
  private updateIntervalMs: number;

  constructor(renderer: THREE.WebGLRenderer, options: HubTowerSkyEnvMapOptions = {}) {
    const width = options.width ?? EQ_W;
    const height = options.height ?? EQ_H;
    this.updateIntervalMs = options.updateIntervalMs ?? UPDATE_INTERVAL_MS;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("hub env map canvas unavailable");
    this.ctx = ctx;
    this.imageData = ctx.createImageData(width, height);
    this.eqTexture = new THREE.CanvasTexture(this.canvas);
    this.eqTexture.colorSpace = THREE.SRGBColorSpace;
    this.eqTexture.mapping = THREE.EquirectangularReflectionMapping;
    this.eqTexture.minFilter = THREE.LinearFilter;
    this.eqTexture.magFilter = THREE.LinearFilter;
  }

  update(
    scene: THREE.Scene,
    env: HubTowerEnvironment,
    sunDir: THREE.Vector3
  ): THREE.Texture | null {
    const envKey = [
      env.zenith,
      env.mid,
      env.horizon,
      env.dayBlend?.toFixed(3) ?? env.period,
      sunDir.x.toFixed(2),
      sunDir.y.toFixed(2),
      sunDir.z.toFixed(2),
    ].join("|");
    const now = performance.now();
    if (
      this.envRT &&
      envKey === this.lastEnvKey &&
      now - this.lastUpdate < this.updateIntervalMs
    ) {
      return this.envRT.texture;
    }
    this.lastEnvKey = envKey;
    this.lastUpdate = now;

    scratchTop.set(env.zenith);
    scratchMid.set(env.mid);
    scratchHorizon.set(env.horizon);
    const sunStrength = sunTintForPeriod(env, scratchSun);
    const sunDirN = scratchDir.copy(sunDir).normalize();

    const data = this.imageData.data;
    const eqW = this.canvas.width;
    const eqH = this.canvas.height;
    let i = 0;
    for (let y = 0; y < eqH; y += 1) {
      const v = 1 - (y + 0.5) / eqH;
      for (let x = 0; x < eqW; x += 1) {
        const u = (x + 0.5) / eqW;
        dirFromEquirectUV(u, v, scratchDir);
        sampleSky(
          scratchDir,
          scratchTop,
          scratchMid,
          scratchHorizon,
          sunDirN,
          scratchSun,
          sunStrength,
          scratchColor
        );
        data[i] = Math.round(scratchColor.r * 255);
        data[i + 1] = Math.round(scratchColor.g * 255);
        data[i + 2] = Math.round(scratchColor.b * 255);
        data[i + 3] = 255;
        i += 4;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    this.eqTexture.needsUpdate = true;

    this.envRT?.dispose();
    this.envRT = this.pmrem.fromEquirectangular(this.eqTexture);
    scene.environment = this.envRT.texture;

    return this.envRT.texture;
  }

  dispose(): void {
    this.envRT?.dispose();
    this.envRT = null;
    this.eqTexture.dispose();
    this.pmrem.dispose();
  }
}
