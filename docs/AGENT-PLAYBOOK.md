# Engineering Standards & Agent Guide

Standards for keeping a React + three.js product site at production quality —
distilled from how the Janta Product Line codebase (Vite 5, React 18, TS,
@react-three/fiber + drei, Playwright) is built and maintained. Written **for
an AI agent**: these are rules to *enforce on every change*, not history.
Wherever a rule says MUST, treat a violation as a bug even if the app "works".

How to use: drop into `docs/` and reference from your `AGENTS.md` / `CLAUDE.md`:
"Follow docs/AGENT-PLAYBOOK.md. Run its Definition of Done before every push."

The core philosophy, in one line: **quality is enforced by scripts and gates,
not by memory or good intentions.** Every standard below names its enforcement.

---

## 1. Definition of Done (every change, no exceptions)

A change is not done until all four gates pass locally:

```
npx tsc -b                 # types — zero errors
npx vite build             # production build succeeds
npm run check:bundle       # size budget + dependency-graph guard
npm run test:visual        # screenshot regression vs committed baselines
```

- MUST run before every push; MUST NOT push a red gate to a shared branch.
- Visual changes additionally require **eyeballing actual screenshots** — a
  passing build proves nothing about pixels. Take before/after captures.
- Keep the gates *fast enough to be unskippable*. If a gate gets slow, fix the
  gate — don't skip it.

## 2. Budgets are code

- MUST have a bundle-budget script (here: 250 KB gzip entry, actual 57.5 KB)
  that walks the built entry graph and **fails** if exceeded — or if any
  heavyweight library (three.js) becomes reachable from the entry chunk.
- Budgets live in a script that CI and agents run — never in a README promise.
- All routes are `lazy()`; the 3D runtime loads only behind route-level
  dynamic imports. The landing page needs zero three.js to paint.
- Dev-only tooling (model viewers, bake pages) MUST be gated on a statically
  false `import.meta.env.DEV` so the bundler drops the chunk from prod.
- Keep a `docs/PERF_BASELINE.md`: model sizes before/after, entry-graph
  totals, and the *why* behind every tuning override. Update it when numbers
  move; a stale baseline doc is worse than none.

## 3. Asset standards

**Models (GLB/GLTF):**
- MUST pass through the offline compression pipeline (`gltf-transform` +
  meshopt/Draco) wired into `prebuild` — never hand-copy a model into
  `public/`. Target: an order-of-magnitude reduction (5.3 MB → 930 KB here).
- Per-model `TUNING_OVERRIDES` with a comment explaining each one (e.g. "no
  simplify on the hero — strict welds collapse a thin facet into a visible
  light chip"). Global settings that look fine on one model will break another.
- MUST emit LOD tiers (`-lod1`, `-lod2` at 50–270 KB); preload the smallest
  from `index.html`; progressive-swap stand-in → full at runtime; keep a
  ready → web → raw fallback chain.
- MUST strip node/material names at compress time and ship a *marketing mesh*
  (silhouette real; fasteners/internals removed; fine detail baked to
  normal/AO textures). CAD exports carry part numbers — half a BOM. Verify
  with `strings model.glb`. Everything in `public/` is downloadable.
- Scene prep (bbox fit, mesh merge, `matrixAutoUpdate=false`) is cached under
  a versioned key (`...-v3`); bump the key whenever prep logic changes.

**Images:**
- Every raster goes through the sibling pipeline (`sharp` → `.avif` + `.webp`
  + fallback) and is rendered via a `<Picture>` component. Photos are
  JPG/AVIF; PNG is only for UI/alpha. A 1 MB lossless PNG of a photo is a bug.
- GOTCHA (paid for twice): replacing a source image WITHOUT regenerating its
  siblings shows users the *old* art — `<picture>` prefers avif/webp. And
  mtime-idempotent scripts can skip regeneration after checkout. When art
  looks stale: delete siblings, re-run the pipeline.
- GOTCHA: never trust the file extension — a WebP mislabeled `.png` is served
  `image/png` and renders blank. Diagnose binary assets with `file`.

## 4. Runtime performance standards (GPU budget is a pie)

- Decide per device class what the budget buys, and encode it:
  `matchMedia("(pointer: coarse)")` → mobile gets DPR `[1, 1.35]` + baked
  contact shadow; desktop gets DPR `[1, 1.75]` + real shadow maps
  (`SHADOWS_ENABLED = !coarsePointer`). Never spend both on mobile.
- Every canvas is `frameloop="demand"` with explicit invalidation. An idle
  canvas MUST cost ~zero.
- Static meshes: merged offline, matrices frozen. Environment maps at 128–256.
- Magic numbers in scene configs MUST carry a "why" comment ("rim #c6d9f5 —
  separates dark structure metal from sky"). Uncommented tuning is untunable.
- Shadow rules: length is sun geometry, not shadow settings —
  `length ≈ height × horizDist / (sunHeight − focusHeight)`; tune the sun.
  Shadow-catcher planes MUST sit at the model's *footprint* — group origins
  often include a `baseLift` (mid-height) offset; a catcher at group origin
  renders a detached, floating shadow.

## 5. Code standards

- **Data out of components.** Copy, specs, image lists, scene tuning live in
  typed data modules (`websiteData.ts`, `sceneConfig.ts`, `ROOTS_COPY`);
  components are presentational. Rewriting a page means editing prose in one
  file, not JSX archaeology.
- **One source of truth per concern** — camera poses, scroll page counts, and
  light values in a single scene config; cross-canvas state (drag, rotation,
  idle clocks) in tiny shared modules with explicit APIs, not prop-drilled.
- **Self-contained CSS namespaces per page/feature** (`rts-*`, `tower-3d__*`,
  `web-*`): a new page gets its own prefixed stylesheet; never graft a second
  styling system (Tailwind-from-a-prototype etc.) into the repo. When porting
  a design from another stack, reimplement in the host conventions.
- Accessibility is not optional: aria labels on interactive 3D surfaces,
  roles on lists/figures, `aria-live` where content changes, and
  `prefers-reduced-motion` respected by *every* animation (pendulum, fades,
  eased scrolls) — the visual test suite depends on it.
- Route conventions: lazy route + error boundary with a readable fallback +
  document meta + scroll-to-top. Every new page, all four.
- One package manager, one lockfile. Dual lockfiles drift silently.
- Scripts must be idempotent and wired into `prebuild` — the build maintains
  the assets, not a human's memory.

## 6. Visual regression standards

- Maintain N canonical screenshots (front/side/back × products) built from
  `dist/` and compared with ~2% drift tolerance (software-raster noise), with
  `prefers-reduced-motion` emulated to freeze animation.
- **Baseline discipline:** on failure, FIRST read the diffs — uniform
  edge-only drift across all views = a legitimate small shift; one broken
  view = a bug. Only after eyeballing renders may you `--update-snapshots`,
  and refreshed baselines are committed *with* the change that caused them.
- Lighthouse on CI boxes rasterizes WebGL on CPU (SwiftShader) — its TBT/TTI
  are meaningless there. CI's real signals: the bundle guard and the network
  waterfall (LOD stand-in visible before the full GLB). Run Lighthouse on
  real hardware for shippable scores.

## 7. Git & collaboration standards

- **Merges between feature branches:** simulate first (`git merge-tree
  --write-tree A B`) to enumerate true conflicts. Agree an **ownership rule**
  per domain before resolving ("branch A owns page structure + scroll
  choreography; branch B owns rendering + optimization") and resolve every
  conflict by that rule; where both sides added features, resolve by
  **feature-union**, never by picking a side wholesale.
- After resolving, grep the merged tree for references to files either side
  deleted — git merges those "cleanly" and the build breaks later.
- Merge on a scratch branch → run all gates → only then fast-forward the real
  branches. MUST NOT land an ungated merge on a shared branch.
- **External code intake** (bundles/patches from collaborators): verify
  before applying — `git bundle verify`; confirm the base commit equals your
  tip (`merge-base`); diff-scan added lines for network calls, `eval`,
  env reads, and dependency/build/CI file changes. Then apply, gate, push.
- NEVER rewrite pushed history (amend/rebase/squash only unpushed work) —
  platform syncs and collaborators break silently.
- Commit messages carry the *why* and the numbers ("elevation 12 → 45: shadow
  reads as compact noon pool"). Screenshots attached for visual changes.

## 8. Security standards

- `public/` is world-readable: classify every asset as marketing material or
  engineering data before it lands there.
- Received archives (project exports, zips) are untrusted until inspected:
  list contents, read embedded `.git/config`s — platform exports can embed
  **live tokens** in remote URLs. `*.zip` stays in `.gitignore`, always.
- `VITE_*` env vars are public at build time. Pattern: optional key with a
  rate-limited public fallback; custom API base URLs validated with fallback
  to the official host + console warning. Ship a documented `.env.example`.
- Mesh/asset secrecy is friction, not protection — real protection is
  patents/registration; the pipeline just avoids handing over a head start.

## 9. UX & motion conventions (the feel)

- Scroll-driven choreography with a single config as source of truth; the
  page *tells a story* — intro, reveal, split view, content flow.
- **Rotate the model, not the camera** for drag interactions: lighting, ground
  shadow, and choreography all stay valid at any yaw.
- Idle life: slow pendulum sway (~96 s, clamped range) when unattended; drag
  interrupts; release resumes *from the release pose toward the opposite
  rail* — motion never snaps.
- Interaction is clamped by default (composition preserved) with a deliberate
  escape hatch (inspect/360 mode; ESC or scroll exits). Detail payoff is
  information (hotspot spec cards), not geometry (zoom) — close-ups are
  curated 2D renders that can't be measured.
- Progressive boot: poster + progress → canvas fade-in. First paint never
  waits for WebGL.

## 10. Checklists

**New 3D model**
- [ ] Through compress pipeline; per-model overrides documented
- [ ] LOD tiers emitted + smallest preloaded; progressive swap + fallbacks
- [ ] Node names stripped; `strings` check for part numbers
- [ ] Versioned prep-cache key; frozen matrices; triangle count logged in dev

**New page/section**
- [ ] Lazy route + error boundary + document meta + scroll-to-top
- [ ] Copy/data in a typed data module; CSS in its own namespace
- [ ] Images through sibling pipeline + `<Picture>`; reduced-motion variants
- [ ] Bundle guard green

**Touching lighting/shadows**
- [ ] Length via sun height, not shadow-map knobs
- [ ] Catcher at footprint (mind group-origin `baseLift`)
- [ ] Mobile/desktop budget split re-checked; screenshots at each iteration

**Before every push**
- [ ] All four gates green (§1)
- [ ] Diffs eyeballed for accidental asset churn (mtime re-encodes)
- [ ] Visual changes: screenshots captured; baselines refreshed only after
      reading the diffs
- [ ] Commit message says why, with numbers

---

## 11. For non-engineers editing marketing content (Cursor)

If you're changing **words, photos, or colors** — not building features — stay
inside this section. An agent (Cursor) should treat these as hard rules and
refuse edits that violate them. The mantra: **content lives in data files;
the machinery does not.**

### Safe to change (the "green zone")

- **Text / copy** — edit the typed **data modules**, never the components:
  `src/marketing/website/websiteData.ts`, `websiteRootsData.ts` (ROOTS_COPY),
  `websiteCareersData.ts`, `src/data/*.ts`. Change the strings; leave the
  structure and quotes/commas intact.
- **Photos** — replace the file in `public/marketing/**`, then you MUST
  regenerate its optimized versions (see the #1 gotcha below).
- **Colors** — only by editing existing **design tokens** (`--warm-*`,
  `--web-*`). See `.cursor/rules/design-system.mdc` / `docs/DESIGN_STYLE_GUIDE.md`.
  Never paste a raw hex code into a component or new style.

### Never touch (the "red zone") — ask an engineer

- `src/components/three/**` and `src/three/**` — the 3D engine.
- `scripts/**` — the build/asset pipeline.
- `*.glb` model files, `public/models/**` — can't be hand-edited; they're also
  sensitive IP.
- `sceneConfig.ts` and any file full of numbers/coordinates — one changed
  value silently breaks the 3D scene.
- `vite.config.ts`, `tsconfig*.json`, `package.json`, `bun.lock` /
  `package-lock.json`, `check-bundle.mjs` — the build itself.

### The gotchas that *will* bite you

1. **Swapped a photo but the site still shows the old one?** You replaced the
   `.png`/`.jpg` but not its optimized `.avif`/`.webp` twins — the browser
   prefers those. Fix: run `npm run compress:images` (or tell the agent
   "regenerate the image siblings"). Just dropping a file in is never enough.
2. **Image shows up blank?** The file's real format may not match its name
   (a WebP saved as `.png`). Ask the agent to check with `file` and re-save it
   in the right format.
3. **A photo is huge / slow?** Export photos as JPG, not lossless PNG.

### How to know you didn't break it (you don't need to be an engineer)

- Preview locally: `npm run dev`, open the page, look at it.
- Before anything ships, the four gates in §1 must pass. You don't have to run
  them by hand — **tell the agent: "run the checks (tsc, build, bundle,
  visual tests) and tell me if anything failed."** If a gate is red, STOP and
  hand it to an engineer; do not push.
- Work on a branch, never edit `main` directly. Let an engineer merge.

### Telling the Cursor agent to stay in bounds (paste this)

> I'm editing marketing content only (copy / images / color tokens). Do NOT
> modify anything under `src/components/three`, `src/three`, or `scripts`, and
> do NOT touch `*.config.*`, `package.json`, lockfiles, `*.glb`, or
> `sceneConfig.ts`. Keep changes scoped to data files, page CSS, and
> `public/marketing` assets. After changes, run `tsc -b` and `vite build` and
> tell me if either fails. If a real fix needs a red-zone file, stop and tell
> me instead of editing it.

- Review the agent's proposed file list before accepting. A copy tweak that
  edits engine or pipeline files is a red flag — reject and re-scope it.
- Keep each change small and about one thing; commit messages say what changed
  and why.

---

## 12. Working method — plan first, ship in review-gated phases

The habit that kept this codebase coherent through large changes. Real,
worked examples live in **`docs/plans/`** — read one before a big task.

- **Diagnose before fixing.** Open non-trivial work with a short "how does
  this work today / why is it broken" pass (root cause, current data flow),
  not a patch. Every plan here starts with a diagnosis.
- **Foundation before polish.** Sequence so correctness/perf blockers land
  first — no point polishing a slow or broken page. (The 3D roadmap fixed a
  6 MB model *before* touching post-FX.)
- **Phase the work; stop for review between phases.** Each phase names its
  scope, an **exit criterion**, a **verification** step, and **risk notes**.
  Ship one phase, get a look, continue — don't land ten entangled changes at
  once.
- **Declare scope boundaries.** State "out of scope / explicitly not doing"
  and why. Anything that would alter the visual design is flagged **ask
  first**, never done silently — this is how the designer keeps control.
- **Deliver highest value first** when phases are independent.
- **Verify the real metric, not the reported one.** A tool once claimed "98%
  smaller" but had measured only the GLB JSON shell, not its 6 MB external
  buffer — real download unchanged. Measure the thing the user actually pays
  for.

## 13. Deployment readiness (before "it's live")

Hard-won checklist for shipping a Vite SPA to real hosting:

- **SPA rewrites.** Deep links (`/roots`, `/products/designer`) 404 on most
  hosts without a rewrite-all-to-`index.html` rule (`public/.htaccess` for
  Apache/WordPress-style hosting; host-appropriate equivalent otherwise).
- **No preview-only URLs in prod.** Platform dev-proxy asset URLs (e.g.
  Lovable's `/__l5e/...`) work only in the editor and 404 in production. Grep
  them out; point asset chains at local files.
- **Graceful asset fallbacks.** Missing video → show its poster; missing model
  tier → next in the fallback chain. A production page degrades, never blanks.
- **`.env.example`** documenting every `VITE_*` the build reads. `VITE_*`
  values are public at build time — never a real secret.
- **Findable & shareable:** favicon linked, per-route `<title>`/meta,
  OpenGraph/Twitter cards, catch-all route → home (no blank page on a typo'd
  URL).
- **Asset diet.** Raw CAD/source files out of `public/` (they ship to every
  visitor otherwise — tens of MB); delete zero-reference assets (verify no
  imports first); keep sources in a non-deployed folder for the pipeline.
- **Loading feel:** `loading="lazy"` + explicit dimensions/`aspect-ratio` on
  below-fold images (no layout shift), font `preconnect`, and a route
  `Suspense` fallback that paints the page background (no white flash).
- **Final pass:** `vite preview`, click **every** route, confirm zero 404s
  (models, video, images, fonts), check reduced-motion, check a share preview.

## 14. UX "feel" toolbox (technique, not prescription)

The design is the designer's. These are *mechanisms* for making any design
feel smooth — use what fits; all MUST respect `prefers-reduced-motion`.

- **Eased wheel scroll:** RAF-ease the `wheel` delta into the scroll root so
  choreographed sections don't feel steppy; leave touch native; reduced-motion
  stays direct.
- **Kill pop-in:** mount deferred/below-fold sections *early* (IntersectionObserver
  `rootMargin ~600px`) so content is present before it's reached; gentle
  opacity 0→1 + ~12px rise on mount.
- **Fade, don't snap:** any pause/resume (canvas gate, marquee freeze) gets a
  short opacity transition, never an instant `opacity:0`.
- **Click-vs-drag guard:** pointer-up within ~250 ms and < ~6 px = a click
  (e.g. click the hero to advance the story); longer = a drag. One guard, one
  code path, filtered by event target.
- **Seam blends without layout risk:** soften hard section color seams with
  absolutely-positioned `::before`/`::after` gradient overlays
  (`pointer-events:none`) — no DOM/height change, so virtual-scroll measurement
  is untouched; keep overlays below interactive copy.
- **Discoverability:** `cursor: grab/grabbing` on draggable 3D;
  `:focus-visible` outlines on nav/CTAs; `rel="noopener noreferrer"` on
  external `target="_blank"` links.

## 15. More checklists

**Shipping to production**
- [ ] SPA rewrite rule; no preview-only/CDN URLs; graceful fallbacks
- [ ] favicon + per-route meta + OG cards + catch-all redirect
- [ ] asset diet done (CAD out of `public/`, zero-reference assets removed)
- [ ] `vite preview` → every route clicked, zero 404s, reduced-motion OK

**Porting a design/feature from another stack**
- [ ] Reimplement in host conventions; namespace it (own module + CSS prefix)
- [ ] Scope its stylesheet to its own routes (no clash with the host's system)
- [ ] Explicit SKIP list (what NOT to bring) + compatibility notes (lib versions)
- [ ] Local assets; colors reference one token source (no duplicate hex)

**Any non-trivial task (working method)**
- [ ] Diagnosed root cause / current flow before writing code
- [ ] Phased with exit criteria; foundation/perf before polish
- [ ] "Out of scope" stated; look-altering changes flagged "ask first"
- [ ] Real metric measured (not a tool's reported number)
