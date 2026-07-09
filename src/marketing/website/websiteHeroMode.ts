/**
 * Home hero presentation mode.
 *
 * TO UNDO THIS FEATURE: set `WEBSITE_HERO_STATIC_DAY` back to `false`.
 * That restores the original scroll-driven night → day hero (moving sun,
 * fireflies, stars, aurora) and hides the floating tower chips. Nothing
 * else needs to change — every branch below keys off this single flag.
 */
export const WEBSITE_HERO_STATIC_DAY = true;

/**
 * Frozen daytime blend used while `WEBSITE_HERO_STATIC_DAY` is on.
 * 1 = full day (bright blue sky, tower fully lit). Lower values (e.g. 0.5)
 * would freeze on a warmer dawn instead.
 */
export const WEBSITE_HERO_STATIC_BLEND = 1;
