import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  YIELD_500KW_DALLAS,
  formatAnnualKwh,
  formatLandAcres,
} from "../../data/yieldComparison500kw";
import { CountUp } from "../../components/CountUp";
import { YIELD_COMPARE_COPY } from "./websiteData";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

const { janta, fixed } = YIELD_500KW_DALLAS;

type CompareLaneProps = {
  variant: "janta" | "traditional";
  image: string;
  imageAlt: string;
  imagePosition: string;
  annualLabel: string;
  annualKwh: number;
  landLabel: string;
  landValue: string;
};

function CompareLane({
  variant,
  image,
  imageAlt,
  imagePosition,
  annualLabel,
  annualKwh,
  landLabel,
  landValue,
}: CompareLaneProps) {
  const annualDisplay = `${formatAnnualKwh(annualKwh)} kWh`;
  const summary = `${annualLabel} · ${annualDisplay} · ${landLabel} · ${landValue}`;

  return (
    <article className={`web-yield-compare__lane web-yield-compare__lane--${variant}`}>
      <figure className="web-yield-compare__photo">
        <img
          className="web-yield-compare__photo-img"
          src={image}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: imagePosition }}
        />
        <figcaption className="web-yield-compare__caption" aria-label={summary}>
          <span className="web-yield-compare__summary-line">
            <span className="web-yield-compare__summary-label">{annualLabel}</span>
            <span className="web-yield-compare__summary-sep" aria-hidden>
              {" "}
              ·{" "}
            </span>
            <span className="web-yield-compare__summary-value">
              <CountUp value={annualDisplay} />
            </span>
          </span>
          <span className="web-yield-compare__summary-line">
            <span className="web-yield-compare__summary-label">{landLabel}</span>
            <span className="web-yield-compare__summary-sep" aria-hidden>
              {" "}
              ·{" "}
            </span>
            <span className="web-yield-compare__summary-value">{landValue}</span>
          </span>
        </figcaption>
      </figure>
    </article>
  );
}

/** Home-page Janta vs traditional solar — photo split on the shared sky gradient. */
export function WebsiteYieldComparisonSection() {
  const copy = YIELD_COMPARE_COPY;
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useWebsiteReducedMotion();
  const jantaLand = formatLandAcres(janta.landAcres);
  const fixedLand = formatLandAcres(fixed.landAcres);

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
        <header className="web-yield-compare__header">
          <h2 id="web-yield-compare-title" className="web-yield-compare__title">
            {copy.title}
          </h2>
          <p className="web-yield-compare__description">{copy.description}</p>
        </header>

        <div
          className="web-yield-compare__split"
          role="group"
          aria-label={`${copy.description} comparison`}
        >
          <CompareLane
            variant="traditional"
            image={copy.fixed.image}
            imageAlt={copy.fixed.imageAlt}
            imagePosition={copy.fixed.imagePosition}
            annualLabel={copy.metrics.annual}
            annualKwh={fixed.annualKwh}
            landLabel={copy.metrics.land}
            landValue={`${fixedLand.value} ${fixedLand.unit}`}
          />

          <div className="web-yield-compare__split-rule" aria-hidden>
            <span>vs</span>
          </div>

          <CompareLane
            variant="janta"
            image={copy.janta.image}
            imageAlt={copy.janta.imageAlt}
            imagePosition={copy.janta.imagePosition}
            annualLabel={copy.metrics.annual}
            annualKwh={janta.annualKwh}
            landLabel={copy.metrics.land}
            landValue={`${jantaLand.value} ${jantaLand.unit}`}
          />
        </div>
      </div>
    </section>
  );
}
