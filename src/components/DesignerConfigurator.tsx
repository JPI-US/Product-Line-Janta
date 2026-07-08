import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { sidePanelDesigns } from "../data/sidePanelDesigns";
import { setTowerConfig } from "./three/towerConfigState";

const HEIGHT_MIN = 0.9;
const HEIGHT_MAX = 1.15;

/**
 * Stage 12 configurator — finish tint + tower height wired to the live DSR
 * hero. State is shareable via `?finish=panel-2&height=1.05`.
 */
export function DesignerConfigurator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [finish, setFinish] = useState<string | null>(
    () => searchParams.get("finish"),
  );
  const [height, setHeight] = useState(() => {
    const h = Number(searchParams.get("height"));
    return Number.isFinite(h) && h >= HEIGHT_MIN && h <= HEIGHT_MAX ? h : 1;
  });
  const urlTimer = useRef<number | null>(null);

  useEffect(() => {
    const design = sidePanelDesigns.find((d) => d.id === finish);
    setTowerConfig({
      finishColor: design ? design.theme.primaryA : null,
      height,
    });

    // Debounced URL sync — slider drags shouldn't spam history
    if (urlTimer.current) window.clearTimeout(urlTimer.current);
    urlTimer.current = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (finish) next.set("finish", finish);
          else next.delete("finish");
          if (height !== 1) next.set("height", height.toFixed(2));
          else next.delete("height");
          return next;
        },
        { replace: true },
      );
    }, 300);
    return () => {
      if (urlTimer.current) window.clearTimeout(urlTimer.current);
    };
  }, [finish, height, setSearchParams]);

  // Reset the shared 3D state when leaving the page
  useEffect(() => () => setTowerConfig({ finishColor: null, height: 1 }), []);

  return (
    <section className="tower-3d__configurator" aria-label="Customize tower">
      <p className="tower-3d__dcard__eyebrow">Customize</p>
      <div
        className="tower-3d__configurator-swatches"
        role="radiogroup"
        aria-label="Panel finish"
      >
        <button
          type="button"
          role="radio"
          aria-checked={finish === null}
          aria-label="Stock PV glass"
          className={
            finish === null
              ? "tower-3d__swatch tower-3d__swatch--active"
              : "tower-3d__swatch"
          }
          style={{ background: "#15181d" }}
          onClick={() => setFinish(null)}
        />
        {sidePanelDesigns.map((d) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={finish === d.id}
            aria-label={d.title}
            title={d.title}
            className={
              finish === d.id
                ? "tower-3d__swatch tower-3d__swatch--active"
                : "tower-3d__swatch"
            }
            style={{
              background: `linear-gradient(135deg, ${d.theme.primaryA}, ${d.theme.primaryB})`,
            }}
            onClick={() => setFinish(d.id)}
          />
        ))}
      </div>
      <label className="tower-3d__configurator-height">
        <span>Height</span>
        <input
          type="range"
          min={HEIGHT_MIN}
          max={HEIGHT_MAX}
          step={0.01}
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          aria-label="Tower height"
        />
      </label>
    </section>
  );
}
