/**
 * React Bits effect toggles — flip any `enabled` to false to remove that effect.
 * All components live in `./react-bits/` and are only imported when enabled here.
 */

export const WEBSITE_REACT_BITS = {
  /** Full-screen liquid marquee menu on mobile */
  flowingMenu: {
    enabled: false,
  },

  /** Typewriter effect on hero subtitle — GSAP is costly on real browsers */
  heroTextType: {
    enabled: false,
    typingSpeed: 22,
    showCursor: false,
    loop: false,
  },

  /** Iridescent shader behind the benefits stats band */
  benefitsIridescence: {
    enabled: false,
    color: [0.39, 0.64, 0.85] as [number, number, number],
    speed: 0.35,
    amplitude: 0.05,
    opacity: 0.22,
  },

  /** Flowing aurora behind the footer */
  footerAurora: {
    enabled: false,
    colorStops: ["#3a84dc", "#64A2D8", "#ffbf14"],
    amplitude: 0.55,
    blend: 0.4,
    opacity: 0.35,
  },

  /** Static scrim only — animated veil was a second WebGL context on scroll */
  roiDarkVeil: {
    enabled: false,
    hueShift: 195,
    speed: 0.25,
    noiseIntensity: 0.015,
    opacity: 0.55,
    resolutionScale: 0.55,
  },

  /** Cursor-reactive glow borders — mix-blend-mode is costly on Safari/Chrome */
  pictureCardBorderGlow: {
    enabled: false,
    colors: ["#64A2D8", "#ffbf14", "#5b8fc4"],
    glowColor: "42 80 72",
    backgroundColor: "transparent",
    borderRadius: 20,
    edgeSensitivity: 35,
  },

  /** CSS gradient sweep on applications title — lighter than framer-motion GradientText */
  applicationsGradientText: {
    enabled: false,
    colors: ["#5b8fc4", "#ffbf14", "#5b8fc4"],
    animationSpeed: 12,
    direction: "horizontal" as const,
  },

} as const;

export type WebsiteReactBitKey = keyof typeof WEBSITE_REACT_BITS;

export function isReactBitEnabled(key: WebsiteReactBitKey): boolean {
  return WEBSITE_REACT_BITS[key].enabled;
}
