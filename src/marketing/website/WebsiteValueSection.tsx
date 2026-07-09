import { useEffect, useState } from "react";
import { VALUE_COPY } from "./websiteData";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

const CYCLE_MS = 3400;
const TRANSITION_MS = 480;

function CyclingTitleWord({ words }: { words: readonly string[] }) {
  const reducedMotion = useWebsiteReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (reducedMotion || words.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => {
        setPrevIndex(current);
        return (current + 1) % words.length;
      });
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion, words.length]);

  useEffect(() => {
    if (prevIndex === null) return;
    const id = window.setTimeout(() => setPrevIndex(null), TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [prevIndex, activeIndex]);

  const activeWord = words[activeIndex] ?? words[0];
  const prevWord = prevIndex !== null ? words[prevIndex] : null;

  return (
    <span
      className="web-value__title-accent web-value__title-accent--cycle"
      aria-live="polite"
    >
      <span className="web-value__title-cycle-track">
        {prevWord && ready ? (
          <span className="web-value__title-word is-exit" aria-hidden>
            {prevWord}
          </span>
        ) : null}
        <span
          key={activeIndex}
          className={`web-value__title-word is-active${ready && prevWord ? " is-entering" : ""}`}
        >
          {activeWord}
        </span>
      </span>
    </span>
  );
}

/** Bringing You Value — split copy + cycling image, stats band below */
export function WebsiteValueSection() {
  const reducedMotion = useWebsiteReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const items = VALUE_COPY.items;

  const goToIndex = (index: number) => {
    setActiveIndex(index);
    setCycleKey((key) => key + 1);
  };

  useEffect(() => {
    if (reducedMotion || items.length <= 1) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion, items.length, cycleKey]);

  return (
    <section
      id="web-value"
      className="web-panel web-panel--value"
      aria-labelledby="web-value-title"
    >
      <div className="web-panel__content web-value">
        <div className="web-value__stage">
          <div className="web-value__main">
            <div className="web-value__copy">
              <h2 id="web-value-title" className="web-value__title">
                {VALUE_COPY.title}
                <br />
                <CyclingTitleWord words={VALUE_COPY.titleEmphasisWords} />
              </h2>
              <p className="web-value__lead">{VALUE_COPY.body}</p>
            </div>

            <figure className="web-value__media">
              <div className="web-value__img-shell">
                {items.map((item, index) => (
                  <img
                    key={item.id}
                    className={`web-value__img${index === activeIndex ? " is-active" : ""}`}
                    src={item.image}
                    alt={item.imageAlt}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    style={{
                      objectPosition: item.imagePosition,
                      ...("imageScale" in item && item.imageScale != null
                        ? {
                            transform: `scale(${item.imageScale})`,
                            transformOrigin: item.imagePosition,
                          }
                        : {}),
                    }}
                  />
                ))}
              </div>

              <div className="web-value__dots" role="tablist" aria-label="Product gallery">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      index === activeIndex
                        ? "web-value__dot web-value__dot--active"
                        : "web-value__dot"
                    }
                    role="tab"
                    aria-selected={index === activeIndex}
                    aria-label={`${item.title}, slide ${index + 1} of ${items.length}`}
                    onClick={() => goToIndex(index)}
                  />
                ))}
              </div>
            </figure>
          </div>

          <aside className="web-value__stats-rail" aria-label="Key metrics">
            <ul className="web-value__stats-list">
              {VALUE_COPY.stats.map((stat) => (
                <li key={stat.id}>
                  <div className="web-value__stat">
                    <span
                      className={`web-value__stat-value${
                        "compact" in stat && stat.compact
                          ? " web-value__stat-value--compact"
                          : ""
                      }`}
                    >
                      {stat.metric}
                      {"metricUnit" in stat && stat.metricUnit ? (
                        <span className="web-value__stat-unit">{stat.metricUnit}</span>
                      ) : null}
                    </span>
                    <span className="web-value__stat-label">{stat.title}</span>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
