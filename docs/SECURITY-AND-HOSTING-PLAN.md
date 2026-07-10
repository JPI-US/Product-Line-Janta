# Security review & WordPress hosting — Plan

> **Status: PLAN ONLY.** This document scopes the work and records preliminary
> findings from an initial recon pass. No fixes or migration steps have been
> executed yet. Nothing here changes app behavior.

---

## Part A — Security & vulnerability report

### A1. What the full report will cover (scope)

| Area | Method | Why |
|---|---|---|
| Dependency CVEs | `npm audit`, GitHub Dependabot, review of transitive deps | Known vulnerable packages |
| Secrets / credentials | Scan git history + working tree for keys/tokens/`.env` | Leaked credentials are the #1 breach cause |
| Public client env vars | Audit every `VITE_*` var (they ship in the JS bundle) | Anything `VITE_`-prefixed is world-readable |
| Client-side injection | Search for `dangerouslySetInnerHTML`, `eval`, `innerHTML`, unsanitized inputs | XSS surface |
| Outbound calls / third parties | NREL PVWatts, Calendly, `mailto:`, any CDNs | SSRF/abuse/data-leak surface |
| Response headers / CSP | Check hosting config for CSP, HSTS, X-Frame-Options, X-Content-Type | Hardening (set at hosting layer) |
| Build hygiene | Source maps, exposed manifests, verbose errors | Info disclosure |
| (If WP is involved) WP hardening | Core/plugin/theme updates, admin lockdown, WAF | WordPress is a large, actively-attacked surface |

### A2. Preliminary findings (from first recon — to be confirmed in the full report)

**Dependencies**
- GitHub Dependabot: **11 alerts (7 high, 4 moderate)** on the default branch.
- `npm audit`: **7 vulnerabilities (6 high, 1 moderate)** — **all in _dev_ dependencies**
  (`npm audit --omit=dev` = **0**). i.e. build-time tooling, **not shipped to users**.
  → Lower urgency (no runtime exposure) but still worth patching to keep CI clean.
- **Next step:** triage each Dependabot alert; `npm audit fix` where safe; note any that
  need a major-version bump (evaluate breakage).

**Secrets**
- ✅ No secrets committed: only `.env.example`, no `.env`, no `.pem`/keys/zips in git.
- ⚠️ `VITE_NREL_API_KEY`, `VITE_NREL_API_BASE`, `VITE_CALENDLY_URL` are **public** (baked
  into the client bundle by design). If a real NREL key is set for production it is
  **scrapeable**. NREL keys are free + rate-limited (low blast radius), but a scraper
  could exhaust the quota. Falls back to `DEMO_KEY`.
  → **Options:** (a) accept it (low risk); (b) proxy PVWatts through a tiny serverless
  function so the key stays server-side.
- ⚠️ Historical note: the earlier `janta-source.zip` (Lovable export) contained a **live
  Lovable git token** — it is **gitignored / not committed**, but confirm it never
  entered git history and rotate that token in Lovable to be safe.

**Client-side**
- ✅ No `dangerouslySetInnerHTML`, `eval`, or `innerHTML` — **very low XSS surface**.
- Contact form is `mailto:`-only (no server, no stored data) — minimal attack surface.
- **Next step:** confirm all external `target="_blank"` links use `rel="noopener"`; add a
  Content-Security-Policy at the hosting layer (biggest single hardening win).

**Build**
- ✅ Source maps off in production (Vite default).

### A3. Deliverable
A short report (`docs/SECURITY-REPORT.md`) with: severity-ranked findings, the fix/mitigation
for each, and a "hardening checklist" (CSP + security headers, dependency patches, key handling).

---

## Part B — Hosting this repo "on WordPress"

### B1. The core reality
This repo is a **React 18 + Vite single-page app** with heavy 3D (react-three-fiber, ~9.6 MB of
`.glb` models, ~25 MB `dist/`). WordPress is **PHP + MySQL**. You **cannot run a React SPA
inside PHP** — the SPA is served as static files (HTML/JS/CSS/assets). So "on WordPress"
resolves to one of the integration patterns below, and the **first decision is what you
actually want**:

> **KEY QUESTION:** Do you want to (1) *replace* the current WordPress jantaus.com with this
> app, or (2) *keep WordPress* and add this app as a section/page, or (3) *embed* this app
> inside a WP page?

### B2. Options

| # | Pattern | How | Best when | Cost / gotchas |
|---|---|---|---|---|
| **1** | **Subdomain (recommended)** | Build → host `dist/` as static files at `app.jantaus.com` (separate docroot) | Keep WP for marketing, run this app standalone | Cleanest. No base-path or `.htaccess` conflict. Needs DNS + static hosting for the subdomain. |
| **2** | **Subdirectory** `jantaus.com/app/` | Host `dist/` under a folder; set Vite `base` + router `basename` to `/app/` | Want it under the main domain | Must set `base`/`basename` (currently `/`); the app's `.htaccess` must live in the subfolder and not fight WP's root rewrite. |
| **3** | **Embed in a WP page** (plugin/template) | A WP page template enqueues the built JS/CSS and renders `<div id="root">` | Must appear inside the WP theme/nav | Fragile: Vite hashes filenames each build → must read `manifest.json` to enqueue; WP theme CSS can bleed in; SPA routing vs WP routing conflicts; 3D perf inside WP. |
| **4** | **iframe** a hosted build into a WP page | Host per #1, embed `<iframe>` | Quick isolation | Poor for a full-viewport 3D hero (sizing/scroll/SEO). Not recommended here. |
| **5** | **Replace WP** | Point jantaus.com root at `dist/` (existing root `.htaccess` already supports this) | This app *is* the new site | Then it isn't "on WordPress" anymore — it's a static site. Lose WP CMS/blog. |

**Recommendation:** **Option 1 (subdomain)** unless there's a hard requirement for the app to
live inside the WP theme — then Option 2. Both keep WordPress intact and avoid the routing
conflict below.

### B3. The `.htaccess` conflict (important)
- This app ships `public/.htaccess` with `RewriteBase /` → routes *everything* to `index.html`
  (so deep links like `/quiz`, `/roots` survive refresh).
- WordPress ships its **own** root `.htaccess` → routes everything to `index.php`.
- **These cannot both own the domain root.** Subdomain (separate docroot) or subdirectory
  (scoped `.htaccess` in the subfolder) resolves this.

### B4. Concrete steps once the pattern is chosen

**For subdomain / subdirectory (Options 1–2):**
1. **Confirm the hosting environment.** Managed WP hosts (WP Engine, Kinsta, GoDaddy Managed
   WP, etc.) often restrict arbitrary static hosting — a subdomain may need an add-on or
   separate static host (Netlify/Cloudflare Pages/S3). *Need to know where jantaus.com is hosted.*
2. **Set base path** (subdirectory only): `vite.config.ts` `base: '/app/'` **and**
   `<BrowserRouter basename="/app">`.
3. **Env vars:** set `VITE_NREL_API_KEY` / `VITE_CALENDLY_URL` in the build environment
   (or a proxy — see A2).
4. **Build & deploy:** `npm run build` → upload `dist/` (incl. `.htaccess`) to the target docroot.
5. **Verify SPA routing:** hard-refresh every route (`/`, `/quiz`, `/roots`, `/products/*`,
   `/contact`) → no 404s (the deployment §13 checklist in `docs/AGENT-PLAYBOOK.md` covers this).
6. **Assets/perf:** 25 MB build + 9.6 MB GLBs → enable gzip/brotli + long-cache headers on the
   host, and confirm the models load over the WP host's CDN/bandwidth. Consider a CDN.
7. **Security headers/CSP** at the host (ties into Part A).

**Extra steps only if embedding in a WP page (Option 3):**
- Build with `--manifest`, write a small WP plugin/template that reads `manifest.json` and
  `wp_enqueue_script/style` the hashed bundles into a page with `<div id="root">`.
- Scope styles so the WP theme and the app don't bleed into each other.
- Decide routing: single WP page + client routing (may need hash routing) or WP rewrites.

### B5. Open questions to resolve before executing
1. **Replace WP, add alongside, or embed?** (drives everything above)
2. **Where is jantaus.com hosted?** (managed WP host vs generic Apache vs cPanel) — determines
   whether static hosting / subdomains are even allowed.
3. **Subdomain (`app.jantaus.com`) or subdirectory (`jantaus.com/app`)?**
4. **Real NREL key in prod?** (drives the proxy-vs-accept decision in A2)

---

## Suggested sequence (when you say go)
1. Triage + patch dependency alerts; produce `docs/SECURITY-REPORT.md`.
2. Decide the hosting pattern (answer B5).
3. Wire `base`/`basename` + env + headers for the chosen pattern.
4. Deploy to a staging URL; run the route + reduced-motion + perf checks.
5. Cut over.

---

## Part C — Chosen path: cutover walkthrough (Cloudflare Pages + headless WordPress.com)

### Target architecture
```
                 jantaus.com  (+ www)
                        │  DNS (Cloudflare)
        ┌───────────────┴────────────────┐
        ▼                                 ▼
  Cloudflare Pages                 cms.jantaus.com
  (this Vite SPA, static)          WordPress.com Business (headless)
  = the public site                = FluentCRM + Fluent Forms (leads/email)
        │                            + optional blog at blog.jantaus.com
        └── contact form ──▶ Pages Function ──▶ FluentCRM REST API
                            (holds API key server-side)
```
Frontend is free static hosting; WordPress stays only as the invisible lead/CRM
engine. Keep the WordPress.com Business plan **only** if you want FluentCRM/Fluent
Forms; otherwise drop it and the `mailto:` form is enough.

### Phase 0 — Prep (in this repo)  ✅ DONE (branch `deployment`, 2026-07-09)
- ✅ `public/_redirects` — SPA fallback (`/* /index.html 200`) + `/3d`→`/products/designer`,
  and a commented placeholder for the old-WP-URL 301 map (fill from Search Console before cutover).
- ✅ `public/_headers` — enforcing zero-risk headers (nosniff, X-Frame-Options, Referrer-Policy,
  Permissions-Policy, HSTS) + **CSP in Report-Only** (allows NREL, Open-Meteo, weather.gov,
  geojs, Calendly, Google/cdn fonts, Unsplash/Squarespace imgs, `wasm-unsafe-eval` + blob
  workers for the Draco/meshopt GLB decoders). Flip to enforcing once the preview report is clean.
  Also long-cache headers for `/assets/*` and `/models/*`.
- ✅ `public/robots.txt` (disallows `/utility-prerender-bake`) + `public/sitemap.xml` (7 routes).
- No `base` change needed — deploying at domain root.
- ⚠️ TODO before enforcing CSP: sanity-check `developer.nlr.gov` vs `developer.nrel.gov` in
  `src/` (looks like a typo); and fill the real 301 map in `_redirects`.

### Phase 1 — Cloudflare Pages (the frontend)
1. Create a free Cloudflare account.
2. **Workers & Pages → Create → Pages → Connect to Git** → authorize GitHub → pick
   `JPI-US/Product-Line-Janta`, branch `deployment` (or `main`).
3. Build settings:
   - Framework preset: **None** (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: set `NODE_VERSION=20` (or via `.nvmrc`)
4. **Environment variables** (Settings → Env vars): `VITE_NREL_API_KEY`, `VITE_CALENDLY_URL`,
   `VITE_NREL_API_BASE` (as needed). These bake into the build.
5. Deploy → you get a `https://<project>.pages.dev` preview URL. **Test everything here**
   before touching DNS: every route on refresh, mobile, reduced-motion, 3D perf.
6. SPA routing is handled by `public/_redirects` (`/* /index.html 200`); headers by
   `public/_headers`. Cloudflare serves these automatically.

### Phase 2 — WordPress.com (make it headless, keep forms + CRM)
> Only if keeping FluentCRM/Fluent Forms. If not, skip this phase and drop the plan.

1. **Free up the domain:** WordPress.com currently serves `jantaus.com`. In WordPress.com →
   **Settings → Site address / Domains**, change the site's primary address to
   **`cms.jantaus.com`** (add it as a domain and set primary), so WP keeps running but the
   apex `jantaus.com` is free to point at Cloudflare.
2. WP is now **admin/API only** — no public theme needed. `wp-admin` (FluentCRM, Fluent
   Forms) stays reachable at `cms.jantaus.com/wp-admin`.
3. **Form → CRM bridge (the important bit):**
   - Rebuild the contact form's fields inside **Fluent Forms** (name, email, company, message)
     and/or set up the **FluentCRM REST API** (Settings → REST API → create an API key).
   - Add a **Cloudflare Pages Function** (`functions/api/contact.ts`) that receives the app's
     form POST and forwards it to `https://cms.jantaus.com/wp-json/...` (FluentCRM subscriber
     create / Fluent Forms entry). **The API key lives as a Pages secret — never in the
     browser bundle.**
   - Change `WebsiteContactForm` to `fetch('/api/contact', …)` instead of `mailto:`.
   - *(Simpler alt if you don't want a Function: a form service like Formspree/Basin that
     forwards to FluentCRM via webhook. More third parties, less control.)*
4. **Blog (optional):** if you keep WP posts, serve them at **`blog.jantaus.com`** (points to
   WordPress.com) and link from the SPA; otherwise export + 301 them (Phase 3).
5. **CORS:** ensure the WP REST endpoint accepts requests from the Pages Function origin
   (server-to-server, so usually fine; browser-direct would need CORS + is discouraged).

### Phase 3 — DNS cutover (Cloudflare as DNS)
1. Move `jantaus.com` nameservers to **Cloudflare** (add the site in Cloudflare, it imports
   records, then update NS at your registrar). This gives you DNS + CDN + SSL in one place.
2. Records:
   - `jantaus.com` + `www` → **Cloudflare Pages** (Pages → Custom domains → add
     `jantaus.com` and `www`; Cloudflare wires the CNAME/records).
   - `cms.jantaus.com` → **WordPress.com** (per their custom-domain instructions).
   - `blog.jantaus.com` → WordPress.com (if used).
3. **Redirect map** in `public/_redirects` — old WP URLs → new routes, 301, e.g.:
   ```
   /career/            /careers   301
   /category/articles  /roots     301
   /*                  /index.html 200   # SPA fallback (keep last)
   ```
   Pull the real old-URL list from Google Search Console / the WP sitemap so nothing indexed 404s.
4. SSL: Cloudflare issues certs automatically for the apex + subdomains.

### Phase 4 — SEO & verification
- `robots.txt` + `sitemap.xml` live and referenced.
- Consider **prerendering** key routes (crawlers/social otherwise only get real HTML for `/`).
- Re-add analytics/marketing pixels the WP site had.
- Re-run the deployment §13 checklist in `docs/AGENT-PLAYBOOK.md` (every route 404-free, etc.).
- Submit the new sitemap in Google Search Console; watch for 404s post-cutover.

### Phase 5 — Go live
1. Lower DNS TTL a day before (faster rollback).
2. Flip apex/www to Cloudflare Pages.
3. Smoke-test: routes, form → confirm a test lead lands in FluentCRM, social preview, mobile, perf.
4. Keep WordPress.com **paused-but-alive** for a couple weeks as fallback; cancel/downgrade once stable.

### Rollback
DNS-level: revert apex/www to WordPress.com. Because WP still exists at `cms.`, flipping the
apex back restores the old site quickly (hence the low TTL + keeping WP alive briefly).
