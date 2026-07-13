import { useEffect, useRef, useState } from "react";
import {
  YIELD_500KW_DALLAS,
  formatAnnualKwh,
  formatLandAcres,
} from "../../data/yieldComparison500kw";
import { CountUp } from "../../components/CountUp";
import { YIELD_COMPARE_COPY } from "./websiteData";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";
import { WebsiteYieldScaleStory } from "./WebsiteYieldScaleStory";
import { useIsMobile } from "../../lib/useIsMobile";

const { janta, fixed } = YIELD_500KW_DALLAS;

type CompareHalfProps = {
  variant: "janta" | "traditional";
  image: string;
  imageAlt: string;
  imagePosition: string;
  /** Default zoom. Desktop hover eases this back to 1 to reveal more towers. */
  imageScale: number;
  name: string;
  spec: string;
  annualLabel: string;
  annualKwh: number;
  landLabel: string;
  landValue: string;
};

/** One side of the combined 1:1 comparison panel — photo + dark info plate. */
function CompareHalf({
  variant,
  image,
  imageAlt,
  imagePosition,
  imageScale,
  name,
  spec,
  annualLabel,
  annualKwh,
  landLabel,
  landValue,
}: CompareHalfProps) {
  const annualDisplay = `${formatAnnualKwh(annualKwh)} kWh`;

  return (
    <div className={`web-yield-compare__half web-yield-compare__half--${variant}`}>
      <img
        className="web-yield-compare__photo-img"
        src={image}
        alt={imageAlt}
        loading="lazy"
        decoding="async"
        style={
          {
            objectPosition: imagePosition,
            "--web-yield-zoom": String(imageScale),
          } as React.CSSProperties
        }
      />
      <div className="web-yield-compare__scrim" aria-hidden />

      <div className="web-yield-compare__plate">
        <p className="web-yield-compare__plate-name">{name}</p>
        <p className="web-yield-compare__plate-spec">{spec}</p>
        <dl className="web-yield-compare__plate-stats">
          <div className="web-yield-compare__plate-row">
            <dt>{annualLabel}</dt>
            <dd>
              <CountUp value={annualDisplay} />
            </dd>
          </div>
          <div className="web-yield-compare__plate-row">
            <dt>{landLabel}</dt>
            <dd>{landValue}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** Home-page Janta vs traditional solar — scale story + combined 1:1 photo panel. */
export function WebsiteYieldComparisonSection() {
  const copy = YIELD_COMPARE_COPY;
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useWebsiteReducedMotion();
  const jantaLand = formatLandAcres(janta.landAcres);
  const fixedLand = formatLandAcres(fixed.landAcres);
  // Phones show the scale tool only — the photo panel is desktop-only.
  const isMobile = useIsMobile();

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={`web-panel web-yield-compare${visible ? " is-visible" : ""}`}
      aria-labelledby="web-yield-compare-title"
    >
      <div className="web-panel__content web-yield-compare__inner">
        <WebsiteYieldScaleStory visible={visible} />

        {!isMobile ? (
          <figure
            className="web-yield-compare__combined"
            role="group"
            aria-label={`${copy.plates.spec} — traditional solar versus Janta towers`}
          >
            <CompareHalf
              variant="traditional"
              image={copy.fixed.image}
              imageAlt={copy.fixed.imageAlt}
              imagePosition={copy.fixed.imagePosition}
              imageScale={copy.fixed.imageScale}
              name={copy.plates.traditionalName}
              spec={copy.plates.spec}
              annualLabel={copy.metrics.annual}
              annualKwh={fixed.annualKwh}
              landLabel={copy.metrics.land}
              landValue={`${fixedLand.value} ${fixedLand.unit}`}
            />

            <CompareHalf
              variant="janta"
              image={copy.janta.image}
              imageAlt={copy.janta.imageAlt}
              imagePosition={copy.janta.imagePosition}
              imageScale={copy.janta.imageScale}
              name={copy.plates.jantaName}
              spec={copy.plates.spec}
              annualLabel={copy.metrics.annual}
              annualKwh={janta.annualKwh}
              landLabel={copy.metrics.land}
              landValue={`${jantaLand.value} ${jantaLand.unit}`}
            />

            <div className="web-yield-compare__seam" aria-hidden>
              <span>vs</span>
            </div>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
