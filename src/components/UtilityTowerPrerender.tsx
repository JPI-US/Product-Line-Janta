import { useCallback, useEffect, useRef, useState } from "react";
import { PAGE_BG } from "./three/sceneConfig";
import {
  UTILITY_PRERENDER,
  getUtilityPrerenderFrameUrl,
  type UtilityPrerenderManifest,
} from "./three/utilityPrerenderConfig";
import { getUtilityPrerenderFrameIndex } from "./three/utilityPrerenderYaw";
import {
  getResolvedPrerenderImage,
  loadPrerenderFrame,
} from "./three/utilityPrerenderPreload";
import {
  setUtilityPrerenderDisplayedIndex,
  subscribeUtilityPrerenderPaint,
} from "./three/utilityPrerenderBridge";
import {
  ensureSharedIdleStarted,
  resetSharedIdle,
} from "./three/towerSharedRotation";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Baked utility tower — DOM only at scroll time (no WebGL).
 * Frame index follows shared yaw (idle pendulum + drag).
 */
export function UtilityTowerPrerender() {
  const [manifest, setManifest] = useState<UtilityPrerenderManifest | null>(
    null
  );
  const [missing, setMissing] = useState(false);
  const [initialReady, setInitialReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const displayedRef = useRef(-1);
  const visibleRef = useRef(false);
  const manifestRef = useRef<UtilityPrerenderManifest | null>(null);

  useEffect(() => {
    manifestRef.current = manifest;
  }, [manifest]);

  const paintFrame = useCallback(
    (index: number, data: UtilityPrerenderManifest) => {
      const img = imgRef.current;
      if (!img || index === displayedRef.current) return;

      const url = getUtilityPrerenderFrameUrl(index, data);
      const cached = getResolvedPrerenderImage(url);
      displayedRef.current = index;
      setUtilityPrerenderDisplayedIndex(index);

      if (cached) {
        img.src = cached.src;
        img.classList.remove("tower-3d__utility-prerender-img--loading");
        return;
      }

      void loadPrerenderFrame(url).then((loaded) => {
        if (displayedRef.current === index && imgRef.current === img) {
          img.src = loaded.src;
          img.classList.remove("tower-3d__utility-prerender-img--loading");
        }
      });
    },
    []
  );

  const paintFromYaw = useCallback(() => {
    const data = manifestRef.current;
    if (!data) return;
    const next = getUtilityPrerenderFrameIndex(data.frameCount);
    paintFrame(next, data);
  }, [paintFrame]);

  useEffect(() => {
    let cancelled = false;

    void fetch(UTILITY_PRERENDER.manifestUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        return res.json() as Promise<UtilityPrerenderManifest>;
      })
      .then(async (data) => {
        if (cancelled) return;
        setManifest(data);
        const url = getUtilityPrerenderFrameUrl(0, data);
        await loadPrerenderFrame(url);
        if (!cancelled) {
          setInitialReady(true);
          paintFrame(0, data);
        }
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      });

    return () => {
      cancelled = true;
    };
  }, [paintFrame]);

  useEffect(() => {
    if (!initialReady) return;

    const section = imgRef.current?.closest(".tower-3d__utility-section");
    if (!section) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible =
          entry.isIntersecting && entry.intersectionRatio >= 0.12;
        visibleRef.current = visible;
        if (visible && !reducedMotion()) {
          ensureSharedIdleStarted(reducedMotion());
          paintFromYaw();
        } else {
          resetSharedIdle();
        }
      },
      { threshold: [0, 0.12, 0.35] }
    );
    io.observe(section);
    return () => {
      io.disconnect();
      resetSharedIdle();
    };
  }, [initialReady, paintFromYaw]);

  useEffect(() => {
    if (!manifest) return;

    let raf = 0;
    const loop = () => {
      if (visibleRef.current) paintFromYaw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [manifest, paintFromYaw]);

  useEffect(() => {
    return subscribeUtilityPrerenderPaint(paintFromYaw);
  }, [paintFromYaw]);

  if (missing) {
    return (
      <div className="tower-3d__utility-prerender tower-3d__utility-prerender--missing">
        <p className="tower-3d__utility-prerender-hint">
          Utility prerender frames are not built yet.
        </p>
        <p className="tower-3d__utility-prerender-cmd">
          Run <code>npm run bake:utility-prerender</code>
        </p>
      </div>
    );
  }

  const firstSrc = manifest
    ? getUtilityPrerenderFrameUrl(0, manifest)
    : null;

  return (
    <div
      className="tower-3d__utility-prerender"
      style={{ background: PAGE_BG }}
    >
      {firstSrc ? (
        <img
          ref={imgRef}
          className={
            initialReady
              ? "tower-3d__utility-prerender-img"
              : "tower-3d__utility-prerender-img tower-3d__utility-prerender-img--loading"
          }
          src={firstSrc}
          alt=""
          draggable={false}
          decoding="async"
          fetchPriority="high"
          width={manifest?.width}
          height={manifest?.height}
          onError={() => setMissing(true)}
        />
      ) : null}
    </div>
  );
}
