import { Hero, ProofBand } from "./sections";

/** Full-viewport hero with animated sky, tower, and partner logo ribbon */
export function WebsiteHeroShell() {
  return (
    <div className="hero-shell">
      <div aria-hidden className="hero-sky" />
      <div
        aria-hidden
        className="hero-sky-highlight"
        style={{
          background:
            "radial-gradient(90% 60% at 12% 4%, rgba(255,255,255,0.16), transparent 55%)",
        }}
      />
      <div className="hero-main">
        <Hero />
      </div>
      <ProofBand />
    </div>
  );
}
