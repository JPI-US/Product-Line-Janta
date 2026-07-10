/**
 * Floating stat chips that overlay the hero tower (adapted from the standalone
 * Hero concept). Purely decorative — pointer-events are disabled so they never
 * block orbiting/dragging the 3D tower. Rendered only in static-day hero mode.
 */

type HeroChip = {
  id: string;
  className: string;
  label: string;
  value: string;
  hint: string;
};

const HERO_CHIPS: HeroChip[] = [
  {
    id: "capacity",
    className: "web-hero-chip--tl",
    label: "Capacity factor",
    value: "38%",
    hint: "vs. 22% flat-panel",
  },
  {
    id: "footprint",
    className: "web-hero-chip--br",
    label: "Footprint",
    value: "0.3 acre",
    hint: "per 1 MWdc",
  },
];

export function WebsiteHeroChips() {
  return (
    <div className="web-hero-chips" aria-hidden>
      {HERO_CHIPS.map((chip) => (
        <div key={chip.id} className={`web-hero-chip ${chip.className}`}>
          <span className="web-hero-chip__value">{chip.value}</span>
          <span className="web-hero-chip__label">{chip.label}</span>
          <span className="web-hero-chip__hint">{chip.hint}</span>
        </div>
      ))}
    </div>
  );
}
