import {
  lazy,
  Suspense,
  Component,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppLoadingScreen } from "./components/AppLoadingScreen";
import { AppNav } from "./components/AppNav";
const WebsitePage = lazy(() => import("./marketing/website/WebsitePage"));
const WebsiteCareersPage = lazy(
  () => import("./marketing/website/WebsiteCareersPage"),
);
const WebsiteContactPage = lazy(
  () => import("./marketing/website/WebsiteContactPage"),
);
const WebsiteQuizPage = lazy(
  () => import("./marketing/website/WebsiteQuizPage"),
);
const WebsiteRootsPage = lazy(
  () => import("./marketing/website/WebsiteRootsPage"),
);
const DesignerTowerPage = lazy(() => import("./pages/DesignerTowerPage"));
const UtilityTowerPage = lazy(() => import("./pages/UtilityTowerPage"));
const UtilityPrerenderBakePage = lazy(
  () => import("./pages/UtilityPrerenderBakePage")
);

const MARKETING_PATHS = new Set([
  "/website",
  "/roots",
  "/careers",
  "/contact",
  "/quiz",
  "/products/designer",
  "/products/utility",
]);

function RouteSuspenseFallback() {
  const { pathname } = useLocation();
  if (pathname === "/website" || pathname === "/") {
    return <div className="web-route-fallback" aria-hidden />;
  }
  return <AppLoadingScreen />;
}

function RouteErrorFallback({ error }: { error: Error }) {
  return (
    <div className="web-route-fallback" role="alert">
      <p style={{ padding: "2rem", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        Something went wrong loading this page. Try a hard refresh (Ctrl+Shift+R).
      </p>
      <pre
        style={{
          padding: "0 2rem 2rem",
          color: "rgba(255,255,255,0.72)",
          fontSize: "0.85rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {error.message}
      </pre>
    </div>
  );
}

class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[route-error]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <RouteErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

/** Reset scroll to the top on every route change (SPA nav keeps scroll otherwise) */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const scroller = document.scrollingElement;
    if (scroller) scroller.scrollTop = 0;
  }, [pathname]);
  return null;
}

function AppRoutes() {
  const { pathname } = useLocation();
  const showDevNav =
    !MARKETING_PATHS.has(pathname) && pathname !== "/utility-prerender-bake";

  return (
    <>
      <ScrollToTop />
      {showDevNav ? <AppNav /> : null}
      <RouteErrorBoundary>
        <Suspense fallback={<RouteSuspenseFallback />}>
          <Routes>
            <Route path="/website" element={<WebsitePage />} />
            <Route path="/roots" element={<WebsiteRootsPage />} />
            <Route path="/careers" element={<WebsiteCareersPage />} />
            <Route path="/contact" element={<WebsiteContactPage />} />
            <Route path="/quiz" element={<WebsiteQuizPage />} />
            <Route path="/" element={<Navigate to="/website" replace />} />
            <Route path="/products/designer" element={<DesignerTowerPage />} />
            <Route path="/products/utility" element={<UtilityTowerPage />} />
            <Route path="/3d" element={<Navigate to="/products/designer" replace />} />
            <Route
              path="/utility-prerender-bake"
              element={<UtilityPrerenderBakePage />}
            />
            <Route path="*" element={<Navigate to="/website" replace />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
