/**
 * Runtime feature flags.
 *
 * SHOW_GLOBE — the interactive "Janta in the world" 3D globe (desktop) + its
 * static mobile version. Deferred launch (~Oct 2026): the code stays wired in
 * WebsiteContent behind this flag; flip to `true` to ship it. Keeping it here
 * (rather than commenting out or archiving files) means one edit re-enables it
 * and nothing gets orphaned during repo cleanup.
 */
export const SHOW_GLOBE = false;
