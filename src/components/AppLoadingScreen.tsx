import "../styles/app-loading.css";

function SunIcon() {
  return (
    <svg
      className="app-load__glyph"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <circle cx="10" cy="10" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.25v2M10 15.75v2M2.25 10h2M15.75 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="app-load__glyph"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M13.2 4.8a6.25 6.25 0 1 0 6.45 9.35A7.75 7.75 0 1 1 13.2 4.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AppLoadingScreen() {
  return (
    <div className="app-load" role="status" aria-live="polite" aria-label="Loading">
      <div className="app-load__stage" aria-hidden>
        <div className="app-load__ring" />
        <div className="app-load__track app-load__track--sun">
          <div className="app-load__icon app-load__icon--sun">
            <SunIcon />
          </div>
        </div>
        <div className="app-load__track app-load__track--moon">
          <div className="app-load__icon app-load__icon--moon">
            <MoonIcon />
          </div>
        </div>
      </div>
      <p className="app-load__text">Loading…</p>
    </div>
  );
}
