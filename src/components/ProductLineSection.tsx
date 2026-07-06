import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { towers } from "../data/towers";
import type { TowerProduct } from "../data/towers";

const springTab = { type: "spring" as const, stiffness: 420, damping: 34 };
const contentEase = [0.22, 1, 0.36, 1] as const;

function useTabIndicator(activeIndex: number) {
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    const nav = navRef.current;
    const tab = tabRefs.current[activeIndex];
    if (!nav || !tab) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - navRect.left,
      width: tabRect.width,
    });
  }, [activeIndex]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return { navRef, tabRefs, indicator };
}

function TowerPanel({ product }: { product: TowerProduct }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      key={product.id}
      className="tower-panel"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: contentEase }}
    >
      <div className="tower-panel__media">
        <motion.div
          className="tower-panel__media-inner"
          whileHover={reduceMotion ? undefined : { scale: 1.03 }}
          transition={{ duration: 0.55, ease: contentEase }}
        >
          <img
            src={product.imageUrl}
            alt=""
            className={
              product.comingSoon
                ? "tower-panel__img tower-panel__img--blur"
                : "tower-panel__img"
            }
            style={
              product.imageObjectPosition
                ? { objectPosition: product.imageObjectPosition }
                : undefined
            }
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </div>

      <div className="tower-panel__body">
        <motion.h3
          className="tower-panel__title"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3, ease: contentEase }}
        >
          {product.title}
        </motion.h3>

        <motion.p
          className="tower-panel__desc"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: contentEase }}
        >
          {product.description}
        </motion.p>

        <ul className="tower-panel__bullets" aria-label="Highlights">
          {product.bullets.map((item, i) => (
            <motion.li
              key={item}
              initial={reduceMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.12 + i * 0.06,
                duration: 0.28,
                ease: contentEase,
              }}
            >
              <span className="tower-panel__dot" aria-hidden />
              {item}
            </motion.li>
          ))}
        </ul>

        <AnimatePresence mode="wait">
          {product.comingSoon ? (
            <motion.div
              key="soon"
              className="tower-panel__soon"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: contentEase }}
            >
              <motion.span
                className="tower-panel__soon-text"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: [1, 0.72, 1],
                        letterSpacing: ["0.18em", "0.22em", "0.18em"],
                      }
                }
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Coming soon
              </motion.span>
              <p className="tower-panel__soon-sub">
                Specs and quoting will unlock once certification wraps. Join the
                waitlist from your account dashboard.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              className="tower-panel__stats"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: contentEase }}
            >
              <p className="tower-panel__yield-band-label">Typical yield band</p>
              <div className="tower-panel__yield-band" role="group">
                {[
                  { k: "Daily", v: `${product.output!.dailyKwh}` },
                  { k: "Monthly", v: `${product.output!.monthlyKwh}` },
                  { k: "Annual", v: `${product.output!.annualKwh}` },
                ].map((row, i) => (
                  <motion.div
                    key={row.k}
                    className="tower-panel__yield-band-cell"
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduceMotion ? 0 : 0.08 + i * 0.05,
                      duration: 0.28,
                      ease: contentEase,
                    }}
                  >
                    <span className="tower-panel__yield-band-k">{row.k}</span>
                    <span className="tower-panel__yield-band-v">
                      <span className="tower-panel__yield-band-value-line">
                        {row.v}
                        <span className="tower-panel__yield-band-unit">
                          {"\u00A0"}
                          kWh
                        </span>
                      </span>
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                type="button"
                className="tower-panel__cta"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                SEE YOUR SAVINGS
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

export function ProductLineSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const { navRef, tabRefs, indicator } = useTabIndicator(activeIndex);
  const active = useMemo(() => towers[activeIndex], [activeIndex]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(towers.length - 1, i + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(towers.length - 1);
    }
  }, []);

  return (
    <section className="product-line" aria-labelledby="product-line-heading">
      <p className="product-line__eyebrow">Solar towers</p>
      <h2 id="product-line-heading" className="product-line__heading">
        Product line
      </h2>

      <nav
        ref={navRef}
        className="product-line__tabs"
        role="tablist"
        aria-label="Tower models"
        onKeyDown={onKeyDown}
      >
        <motion.span
          className="product-line__tab-indicator"
          aria-hidden
          animate={{
            left: indicator.left,
            width: indicator.width,
          }}
          transition={reduceMotion ? { duration: 0 } : springTab}
        />
        {towers.map((t, i) => {
          const selected = i === activeIndex;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              className={
                selected
                  ? "product-line__tab product-line__tab--active"
                  : "product-line__tab"
              }
              onClick={() => setActiveIndex(i)}
            >
              {t.tabLabel}
            </button>
          );
        })}
      </nav>

      <div
        className="product-line__card"
        role="tabpanel"
        id={`panel-${active.id}`}
        aria-labelledby={`tab-${active.id}`}
      >
        <AnimatePresence mode="wait">
          <TowerPanel key={active.id} product={active} />
        </AnimatePresence>
      </div>
    </section>
  );
}
