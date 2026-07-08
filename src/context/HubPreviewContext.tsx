import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SkyPeriod } from "../data/hubChooserSky";
import type { HubWeatherKind } from "../data/hubWeather";

export type HubPreviewState = {
  /** null = live weather API */
  weather: HubWeatherKind | null;
  /** null = sky period from time of day */
  sky: SkyPeriod | null;
  /** null = live clock */
  timeHour: number | null;
  timeMinute: number | null;
};

export const HUB_PREVIEW_DEFAULT: HubPreviewState = {
  weather: null,
  sky: null,
  timeHour: null,
  timeMinute: null,
};

type HubPreviewContextValue = HubPreviewState & {
  setWeather: (weather: HubWeatherKind | null) => void;
  setSky: (sky: SkyPeriod | null) => void;
  setTime: (hour: number | null, minute: number | null) => void;
  reset: () => void;
  previewDate: Date | null;
  isActive: boolean;
};

const HubPreviewContext = createContext<HubPreviewContextValue | null>(null);

export function HubPreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HubPreviewState>(HUB_PREVIEW_DEFAULT);

  const setWeather = useCallback((weather: HubWeatherKind | null) => {
    setState((s) => ({ ...s, weather }));
  }, []);

  const setSky = useCallback((sky: SkyPeriod | null) => {
    setState((s) => ({ ...s, sky }));
  }, []);

  const setTime = useCallback((hour: number | null, minute: number | null) => {
    setState((s) => ({ ...s, timeHour: hour, timeMinute: minute }));
  }, []);

  const reset = useCallback(() => setState(HUB_PREVIEW_DEFAULT), []);

  const previewDate = useMemo(() => {
    if (state.timeHour == null) return null;
    const d = new Date();
    d.setHours(state.timeHour, state.timeMinute ?? 0, 0, 0);
    return d;
  }, [state.timeHour, state.timeMinute]);

  const isActive = useMemo(
    () =>
      state.weather != null ||
      state.sky != null ||
      state.timeHour != null,
    [state.weather, state.sky, state.timeHour]
  );

  const value = useMemo<HubPreviewContextValue>(
    () => ({
      ...state,
      setWeather,
      setSky,
      setTime,
      reset,
      previewDate,
      isActive,
    }),
    [state, setWeather, setSky, setTime, reset, previewDate, isActive]
  );

  return (
    <HubPreviewContext.Provider value={value}>
      {children}
    </HubPreviewContext.Provider>
  );
}

export function useHubPreview(): HubPreviewContextValue {
  const ctx = useContext(HubPreviewContext);
  if (!ctx) {
    throw new Error("useHubPreview must be used within HubPreviewProvider");
  }
  return ctx;
}

const OPTIONAL_HUB_PREVIEW: HubPreviewContextValue = {
  ...HUB_PREVIEW_DEFAULT,
  setWeather: () => {},
  setSky: () => {},
  setTime: () => {},
  reset: () => {},
  previewDate: null,
  isActive: false,
};

/** Safe outside HubPreviewProvider — returns inert defaults */
export function useOptionalHubPreview(): HubPreviewContextValue {
  return useContext(HubPreviewContext) ?? OPTIONAL_HUB_PREVIEW;
}
