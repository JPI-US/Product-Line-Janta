import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { USE_UTILITY_PRERENDER } from "./towerCanvasMode";
import {
  resolveTowerScrollVisibility,
  type TowerActiveView,
} from "./towerScrollVisibility";
import { subscribeTowerScrollOffset, towerScrollOffset } from "./towerScrollOffset";
import { subscribeTowerScenePrep, isTowerScenePrepared, TOWER_PREP_KEYS } from "./towerScenePrep";

export type TowerCanvasVisibility = {
  renderDesigner3d: boolean;
  renderUtility3d: boolean;
  /** True after utility GL should stay mounted — frameloop sleeps when off-screen */
  mountUtilityCanvas: boolean;
};

const TowerCanvasVisibilityContext = createContext<TowerCanvasVisibility>({
  renderDesigner3d: true,
  renderUtility3d: false,
  mountUtilityCanvas: false,
});

export function useTowerCanvasVisibility() {
  return useContext(TowerCanvasVisibilityContext);
}

const defaultVisibility: TowerCanvasVisibility = {
  renderDesigner3d: true,
  renderUtility3d: false,
  mountUtilityCanvas: false,
};

export function TowerCanvasVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const activeRef = useRef<TowerActiveView>("designer");
  const utilityGlPinnedRef = useRef(false);
  const [visibility, setVisibility] = useState<TowerCanvasVisibility>(defaultVisibility);

  useEffect(() => {
    if (USE_UTILITY_PRERENDER) return;

    const apply = (offset: number) => {
      if (isTowerScenePrepared(TOWER_PREP_KEYS.utility)) {
        utilityGlPinnedRef.current = true;
      }

      const next = resolveTowerScrollVisibility(
        offset,
        activeRef.current,
        utilityGlPinnedRef.current,
        isTowerScenePrepared(TOWER_PREP_KEYS.utility)
      );
      activeRef.current = next.activeView;
      if (next.pinUtilityGl) {
        utilityGlPinnedRef.current = true;
      }

      setVisibility((prev) => {
        const mountUtilityCanvas = utilityGlPinnedRef.current;
        if (
          prev.renderDesigner3d === next.renderDesigner3d &&
          prev.renderUtility3d === next.renderUtility3d &&
          prev.mountUtilityCanvas === mountUtilityCanvas
        ) {
          return prev;
        }
        return {
          renderDesigner3d: next.renderDesigner3d,
          renderUtility3d: next.renderUtility3d,
          mountUtilityCanvas,
        };
      });
    };

    apply(towerScrollOffset);
    const unsubScroll = subscribeTowerScrollOffset(() =>
      apply(towerScrollOffset)
    );
    const unsubPrep = subscribeTowerScenePrep(() => apply(towerScrollOffset));

    return () => {
      unsubScroll();
      unsubPrep();
    };
  }, []);

  const value = useMemo(() => visibility, [visibility]);

  return (
    <TowerCanvasVisibilityContext.Provider value={value}>
      {children}
    </TowerCanvasVisibilityContext.Provider>
  );
}
