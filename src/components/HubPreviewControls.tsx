import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { getSkyPeriodLabel, type SkyPeriod } from "../data/hubChooserSky";
import {
  weatherKindLabel,
  type HubWeatherKind,
} from "../data/hubWeather";
import { useHubPreview } from "../context/HubPreviewContext";

const WEATHER_OPTIONS: (HubWeatherKind | "live")[] = [
  "live",
  "rain",
  "snow",
];

const SKY_OPTIONS: (SkyPeriod | "auto")[] = [
  "auto",
  "night",
  "dawn",
  "day",
  "golden",
  "dusk",
];

const PANEL_MARGIN = 8;
const DRAG_THRESHOLD = 5;

/** left + bottom offset from viewport (bottom edge stays fixed as content grows) */
type PanelPos = { left: number; bottom: number };

function timeInputValue(hour: number | null, minute: number | null): string {
  if (hour == null) return "12:00";
  const h = String(hour).padStart(2, "0");
  const m = String(minute ?? 0).padStart(2, "0");
  return `${h}:${m}`;
}

/** Temporary panel — remove after sky/weather review */
export function HubPreviewControls() {
  const {
    weather,
    sky,
    timeHour,
    timeMinute,
    isActive,
    setWeather,
    setSky,
    setTime,
    reset,
  } = useHubPreview();

  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState<PanelPos>({
    left: PANEL_MARGIN,
    bottom: PANEL_MARGIN,
  });
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originLeft: 0,
    originBottom: 0,
    moved: false,
  });

  const timeOverridden = timeHour != null;

  const clampPosition = useCallback((left: number, bottom: number): PanelPos => {
    const el = panelRef.current;
    const w = el?.offsetWidth ?? 160;
    const h = el?.offsetHeight ?? 36;
    const maxLeft = Math.max(
      PANEL_MARGIN,
      window.innerWidth - w - PANEL_MARGIN
    );
    const maxBottom = Math.max(
      PANEL_MARGIN,
      window.innerHeight - h - PANEL_MARGIN
    );
    return {
      left: Math.min(maxLeft, Math.max(PANEL_MARGIN, left)),
      bottom: Math.min(maxBottom, Math.max(PANEL_MARGIN, bottom)),
    };
  }, []);

  /** Only reclamp if the panel would leave the viewport — never shift bottom on content change */
  useLayoutEffect(() => {
    setPos((prev) => {
      const next = clampPosition(prev.left, prev.bottom);
      if (next.left === prev.left && next.bottom === prev.bottom) return prev;
      return next;
    });
  }, [expanded, isActive, timeOverridden, clampPosition]);

  useLayoutEffect(() => {
    const onResize = () => {
      setPos((prev) => clampPosition(prev.left, prev.bottom));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPosition]);

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: pos.left,
      originBottom: pos.bottom,
      moved: false,
    };
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    d.moved = true;
    setPos(
      clampPosition(d.originLeft + dx, d.originBottom - dy)
    );
  };

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (!d.moved) {
      setExpanded((open) => !open);
    }

    dragRef.current.pointerId = -1;
    dragRef.current.moved = false;
  };

  return (
    <aside
      ref={panelRef}
      className={`hub__preview-panel${expanded ? " hub__preview-panel--expanded" : " hub__preview-panel--collapsed"}`}
      style={{ left: pos.left, bottom: pos.bottom, top: "auto" }}
      aria-label="Sky and weather preview"
    >
      <button
        type="button"
        className="hub__preview-handle"
        aria-expanded={expanded}
        aria-controls="hub-preview-body"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="hub__preview-handle-label">Preview</span>
        {isActive ? (
          <span className="hub__preview-handle-dot" aria-hidden />
        ) : null}
        <span className="hub__preview-handle-hint" aria-hidden>
          {expanded ? "▾" : "▸"}
        </span>
      </button>

      {expanded ? (
        <div id="hub-preview-body" className="hub__preview-body">
          <label className="hub__preview-field">
            <span>Weather</span>
            <select
              value={weather ?? "live"}
              onChange={(e) => {
                const v = e.target.value;
                setWeather(v === "live" ? null : (v as HubWeatherKind));
              }}
            >
              {WEATHER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "live" ? "Live" : weatherKindLabel(opt)}
                </option>
              ))}
            </select>
          </label>

          <label className="hub__preview-field">
            <span>Sky</span>
            <select
              value={sky ?? "auto"}
              onChange={(e) => {
                const v = e.target.value;
                setSky(v === "auto" ? null : (v as SkyPeriod));
              }}
            >
              {SKY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "auto" ? "Auto (from time)" : getSkyPeriodLabel(opt)}
                </option>
              ))}
            </select>
          </label>

          <label className="hub__preview-field hub__preview-field--row">
            <input
              type="checkbox"
              checked={timeOverridden}
              onChange={(e) => {
                if (!e.target.checked) {
                  setTime(null, null);
                  return;
                }
                const d = new Date();
                setTime(d.getHours(), d.getMinutes());
              }}
            />
            <span>Override time</span>
          </label>

          {timeOverridden ? (
            <label className="hub__preview-field">
              <span>Time</span>
              <input
                type="time"
                value={timeInputValue(timeHour, timeMinute)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  if (Number.isFinite(h)) {
                    setTime(h, Number.isFinite(m) ? m : 0);
                  }
                }}
              />
            </label>
          ) : null}

          {isActive ? (
            <button
              type="button"
              className="hub__preview-reset"
              onClick={reset}
            >
              Reset to live
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
