/** Subtle scroll cue — appears once the tower enters its idle pendulum */
export function ProductScrollHint() {
  return (
    <div className="tower-3d__scroll-hint" aria-hidden>
      <span className="tower-3d__scroll-hint__label">Scroll</span>
      <span className="tower-3d__scroll-hint__arrow">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <path
            d="M8 3v8M4.5 8.5 8 12l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
