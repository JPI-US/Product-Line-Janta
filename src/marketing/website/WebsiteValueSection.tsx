import { useEffect, useState } from "react";
import { VALUE_COPY } from "./websiteData";
import { useWebsiteReducedMotion } from "./useWebsiteReducedMotion";

const CYCLE_MS = 3400;
const TRANSITION_MS = 480;

function CyclingTitleWord({
  words,
  activeIndex,
}: {
  words: readonly string[];
  activeIndex: number;
}) {
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [displayedIndex, setDisplayedIndex] = useState(activeIndex);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (activeIndex === displayedIndex) return;
    setPrevIndex(displayedIndex);
    setDisplayedIndex(activeIndex);
  }, [activeIndex, displayedIndex]);

  useEffect(() => {
    if (prevIndex === null) return;
    const id = window.setTimeout(() => setPrevIndex(null), TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [prevIndex, displayedIndex]);

  const activeWord = words[displayedIndex] ?? words[0];
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
          key={displayedIndex}
          className={`web-value__title-word is-active${ready && prevWord ? " is-entering" : ""}`}
        >
          {activeWord}
        </span>
      </span>
    </span>
  );
}

/** Bringing You Value — split copy + cycling image, kept in lockstep */
export function WebsiteValueSection() {
  const reducedMotion = useWebsiteReducedMotion();
  const [beat, setBeat] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const items = VALUE_COPY.items;
  const words = VALUE_COPY.titleEmphasisWords;
  const wordIndex = beat % words.length;
  const imageIndex = beat % items.length;

  const advance = () => {
    setBeat((current) => current + 1);
    setCycleKey((key) => key + 1);
  };

  const goToImage = (index: number) => {
    // Keep title/image phase lock: jump to the next beat that shows this image.
    setBeat((current) => {
      const currentImage = current % items.length;
      const steps = (index - currentImage + items.length) % items.length;
      return steps === 0 ? current : current + steps;
    });
    setCycleKey((key) => key + 1);
  };

  useEffect(() => {
    if (reducedMotion || items.length <= 1) return;

    const id = window.setInterval(() => {
      setBeat((current) => current + 1);
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
                <CyclingTitleWord words={words} activeIndex={wordIndex} />
              </h2>
              <p className="web-value__lead">{VALUE_COPY.body}</p>
            </div>

            <figure className="web-value__media">
              <button
                type="button"
                className="web-value__img-shell"
                aria-label={`Next image (${(imageIndex + 1) % items.length + 1} of ${items.length})`}
                onClick={advance}
              >
                {items.map((item, index) => (
                  <img
                    key={item.id}
                    className={`web-value__img${index === imageIndex ? " is-active" : ""}`}
                    src={item.image}
                    alt={item.imageAlt}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
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
              </button>

              <div className="web-value__dots" role="tablist" aria-label="Product gallery">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      index === imageIndex
                        ? "web-value__dot web-value__dot--active"
                        : "web-value__dot"
                    }
                    role="tab"
                    aria-selected={index === imageIndex}
                    aria-label={`${item.title}, slide ${index + 1} of ${items.length}`}
                    onClick={() => goToImage(index)}
                  />
                ))}
              </div>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
