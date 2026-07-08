# Janta Power — Design Style Guide

The single reference for how the Janta Power site should look and feel. Read this
before making any visual, color, motion, or layout change so the experience stays
cohesive. The north star: **one warm, premium, daylight-driven material** — sun
(gold) and sky (blue) over warm paper, never a cold or "stitched-together" feel.

## Source of truth for tokens

Do **not** hardcode brand hex values in components or new CSS. Use the CSS custom
properties below. If a value is missing, add a token — don't inline a color.

- Global tokens: [`src/index.css`](../src/index.css) `:root` (the `--warm-*` block)
- Marketing site tokens: [`src/marketing/website/website.css`](../src/marketing/website/website.css) (the `.web-page` block, `--web-*`)
- Product/3D page tokens: [`src/styles/tower-3d.css`](../src/styles/tower-3d.css) and [`src/styles/minimal-ui.css`](../src/styles/minimal-ui.css)
- TS mirror (rarely needed): [`src/marketing/website/websiteData.ts`](../src/marketing/website/websiteData.ts) `BRAND`

## Color system

### Neutrals — one warm scale (never cool gray)

| Token | Value | Use |
|-------|-------|-----|
| `--warm-page` | `#faf8f5` | Page base, section backgrounds, footer |
| `--warm-surface` | `#ffffff` | Cards, bright gradient stops |
| `--warm-cloud` | `#f8f9fb` | Sky bands / soft-sky panels (barely-warm white) |
| `--warm-night` | `#0a1018` | ROI photo backdrop + its footer seam |

Retired: `#f5f5f7`, `#f7faff`, `#f9f8f4` (cool grays/blue-whites). Do not
reintroduce them.

### Gold — one ramp, for action/emphasis only

| Token | Value | Use |
|-------|-------|-----|
| `--warm-cta` | `#ffbf14` | CTAs, key emphasis fills, focus rings |
| `--warm-cta-hover` | `#d9a612` | Hover/pressed, gradient second stop |
| `--warm-cta-wash` | `rgba(255,191,20,0.12)` | Soft gold highlight/tint |

Gold is for buttons, highlights, and the sun. **Never** use gold for body text on
light backgrounds (contrast fails). Retired: `#e1b378`, `#c99552`, `#e8b060`,
`#c8892a`, `#bd8a48` (old tan ramp).

### Blues — exactly two, plus tints

| Token | Value | Use |
|-------|-------|-----|
| `--web-brand-blue` | `#3a84dc` | Brand slab (software showcase), brand blue |
| `--web-vision-sky` | `#4e91d3` | Atmosphere / sky, matched to photography |
| `--accent-blue` | `#6ba0e3` | Lighter brand tint (accents, links, gradient starts) |
| `--accent-blue-muted` | `#7fa3cf` | Muted tint (outlines, secondary accents) |

Meaning: **blue = brand + sky, gold = sun + action.** Retired: `#5b8fc4`,
`#7aa8d4`, `#6b7fa8`, `#64A2D8`. The night sky backdrop `#243341`
([`websiteDayCycle.ts`](../src/marketing/website/websiteDayCycle.ts)) is intentional and separate.

### Inks — one slate family, three steps

| Token | Value | Use |
|-------|-------|-----|
| `--warm-ink-display` | `#1a2332` | Display headings, footer headings |
| `--warm-ink` | `#333c4e` | Body copy |
| `--warm-ink-soft` | `#5a6478` | Muted/secondary copy, eyebrows |

Retired: the temperature-neutral gray `#6e6e73`. Text should always come from this
slate family so type never goes cool while surfaces are warm.

## Typography

- Display / titles: `--web-font-display` (Aktiv Grotesk), weight 600–700, tight
  letter-spacing (`-0.03em`).
- Body: `--web-font-body` / `--font` (DM Sans).
- Keep the existing type scale (`clamp()` sizes). Don't introduce new font families.

## Motion & interaction

The site is a **scroll-choreographed daytime story**: night to day as you scroll the
hero, sun and tower orbit, then content flows up. Preserve these behaviors:

- **Hero scroll progress bar** (`.web-scroll-progress`): a thin **white** hairline
  under the nav that fills across the hero story (intro + page lift) and fades out
  once the hero clears. Driven by `--web-intro-blend` + `--web-page-scroll`; add no
  new scroll listeners.
- **Product tower click (DSR/LFM only)**: a tap on the tower eases the page down to
  the fully-open split info state (`SCENE.scroll.introEnd`), duration scaled by
  distance. Once info is open, taps do nothing and drag rotates the tower. The
  homepage hero tower keeps its one-beat advance. See
  [`TowerDragSurface.tsx`](../src/components/three/TowerDragSurface.tsx).
- **Night fireflies**: warm yellow-gold specks (`HubFirefliesCanvas`, `lite`) drift
  over the night hero sky and dissolve as the sun rises (tied to `--web-sky-blend`).
  Absent by day, static under reduced motion, and gated to the hero.
- Always honor `prefers-reduced-motion`: animations become static/instant, never
  removed abruptly.

## Section seams (no dead white gaps)

Section transitions use short, eased gradient overlays (`::before`/`::after`,
`pointer-events: none`, ~`clamp(36px,6vh,84px)`) so sections blend without a wide
empty band. When adjusting a seam: keep it short, ease the ramp (stops at
`0% / 45% / 100%`), color it from a **token** matching the neighboring background,
and keep copy legible (seam sits above imagery, below text). Sections may still read
as two — just connected, not separated.

## Accessibility

- Maintain text contrast (prefer darker ink over lighter). Never gold text on white.
- Keyboard focus uses the shared gold `:focus-visible` ring — keep it visible.
- Respect `prefers-reduced-motion` for every animation.

## Do / Don't

- Do: reference tokens; add a token when a needed value is missing.
- Do: keep the warm daylight feel and the blue/gold split.
- Don't: hardcode hex, add a third gold or a fifth blue, or use cool grays.
- Don't: change the scroll choreography, redesign marketing sections, or add heavy
  new dependencies for visual polish (reuse existing components like
  `HubFirefliesCanvas`, `HubSkyBackground`).
