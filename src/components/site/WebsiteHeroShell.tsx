import { Hero, ProofBand } from "./sections";

/** Full-viewport hero with animated sky, tower, and partner logo ribbon */
export function WebsiteHeroShell() {
  return (
    <div className="hero-shell">
      <div aria-hidden className="hero-sky" />
      <div
        aria-hidden
        className="hero-sky-highlight"
      />
      <div className="hero-main">
        <Hero />
      </div>
      <ProofBand />
    </div>
  );
}
