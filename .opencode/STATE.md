# Project State — Tony Portfolio

**Last updated:** 2026-06-02
**Status:** All systems green (100/100 health, all endpoints live)

## Active Goal
Maintain and improve the personal portfolio site at https://me.tony.do with autonomous SEO/content improvements driven by GA4 + Search Console analytics.

## Recent Commits
- `fbb91ff` feat: 30 improvements + admin URL security + GitHub backup system
- `c0690c0` fix: increase comment box height + mobile responsive form
- `9d6661c` docs: add STATE.md for cross-session continuity
- `ee50689` refactor: consolidate RSS/comments/reactions into data.js via _lib.js (Hobby plan 12-function limit)
- `de660d3` feat: SEO, engagement, and tracking improvements (Option E: Cusdis + native comments + RSS + TOC + reactions + JSON-LD + email signup)
- `30b1921` feat: HTTP API trigger for OpenCode scheduled tasks
- `f366ea6` feat: auto-start infrastructure (Windows Task Scheduler + Startup folder)
- `5f057d2` content: Improvement Cycle #1 (BlogSpotlight repositioned, Vietnam teams article)

## Critical Constraints
- **Vercel Hobby plan: max 12 serverless functions per deployment** — must consolidate before adding any new endpoint
- Cusdis app ID: `f352cc20-7e9d-41e2-91d6-c2f968712e56` (hosted, not self-hosted, not Giscus)
- `OPENCODE_SERVER_PASSWORD` in user env (32-char random, gitignored at `.opencode/.opencode-server-password`)
- OpenCode HTTP API: `http://127.0.0.1:4096` with Basic Auth (`opencode:$OPENCODE_SERVER_PASSWORD`)
- Agent name: `tony-brand-master` at `C:\Users\OS\.config\opencode\agents\personal-brand-pm.md`

## Admin URLs (SECURED 2026-06-02)
- **`/tony-cms-portal`** — main admin dashboard (was `/admin`)
- **`/moderation-panel`** — comment moderation (was `/comments-moderate`)
- `/admin` → 404, `/comments-moderate` → 404 (verified)
- File renamed: `admin.html` → `tony-cms-portal.html`, `public/comments-moderate.html` → `public/moderation-panel.html`
- Vite input key: `tonyCmsPortal: 'tony-cms-portal.html'`

## GitHub Backup System (DORMANT until token added)
- `api/_lib.js`: `handleBackup()`, `handleBackupList()` use GitHub Contents API
- Writes to `data-backups` branch: `backups/daily/YYYY-MM-DD.json` + `backups/weekly/YYYY-WW.json`
- Auto-prunes: 30 daily + 30 weekly versions max
- Redacts PII (emails) in payload
- Sub-routes on `api/cron-fetch-news.js`: `?action=backup-daily|backup-weekly|backup-list`
- **Vercel crons:**
  - `0 1 * * *` → daily backup
  - `30 0 * * 0` → weekly backup
  - `0 0 * * 0` → news fetch (existing)
- **Required env var (user action):** `GITHUB_BACKUP_TOKEN` (classic PAT, `repo` scope)
  - Optional: `GITHUB_REPO_OWNER=harrypotter30022003`, `GITHUB_REPO_NAME=tony-profile-bigpickle`, `GITHUB_REPO_BASE_BRANCH=main`
- Gracefully skips with `{skipped: true, reason: "..."}` if token not set
- Default repo target: `harrypotter30022003/tony-profile-bigpickle`

## API Endpoint Inventory (11/12 Hobby limit)
1. `/api/data` — Portfolio data (also `?type=rss|comments|reactions` via consolidation)
2. `/api/login` — Admin HMAC auth
3. `/api/save` — Admin save to KV
4. `/api/cron-fetch-news` — Weekly content cron + backup actions
5. `/api/sitemap` — XML sitemap
6. `/api/summary` — LLM-friendly JSON summary
7. `/api/subscribe` — Email signup
8. `/api/unsubscribe` — Email unsubscribe
9. `/api/subscribers` — Admin list subscribers
10. `/api/verify-deployment` — Health check for cron
11. `/api/analytics` — GA4 + Search Console (also `?report=summary`)

`api/_lib.js` is a shared module (not a function, just an import). **One function slot free.**

## URL Rewrites (vercel.json)
- `/sitemap.xml` → `/api/sitemap`
- `/rss.xml` → `/api/data?type=rss`
- `/api/rss` → `/api/data?type=rss`
- `/api/comments` → `/api/data?type=comments`
- `/api/reactions` → `/api/data?type=reactions`
- `/tony-cms-portal` → `/tony-cms-portal` (cleanUrls)
- `/moderation-panel` → `/moderation-panel` (cleanUrls)

## Security Headers (vercel.json, applied to all routes)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Cache-Control: JS/CSS `public, max-age=31536000, immutable`; API `no-store, no-cache, must-revalidate, proxy-revalidate`

## Performance (verified)
- Main bundle: 234.16 kB (gzip 73.5 kB) — was 341 kB
- GSAP split into 42 KB ScrollTrigger + 69 KB gsap chunks, loaded lazily via `loadGsap()`
- requestIdleCallback for hero animations
- IntersectionObserver for about-section stats
- SW cache version: `v1.0.1` (network-first HTML, cache-first static, never cache API)
- OG image: 113 KB PNG auto-generated from `public/og-image.svg` via `scripts/build-og-image.cjs` (sharp)

## A11y / UX Components (NEW 2026-06-02)
- `ErrorBoundary` (catches React errors, GA4 exception event, reload/home buttons, dev-mode error details)
- `LoadingSkeleton` (shimmer animation, home + blog variants)
- `NotFound` (404 page with hash path display + home/blog fallback)
- `<a class="skip-to-content">` link in `index.html`
- Theme FOUC fix via inline script reading `localStorage.getItem('tony-theme')` before paint
- Print stylesheet (`@media print`) in `App.css` for CV/resume
- `:focus-visible` + `.sr-only` styles
- Search input in `BlogFeed` filters by title/summary/content/tags with no-results state

## SEO Enhancements (NEW 2026-06-02)
- Person JSON-LD: `@id`, `alternateName`, `image`, `knowsAbout`, `alumniOf`, `hasOccupation`, `worksFor`
- WebSite schema with `SearchAction` (potentialAction)
- Dynamic `CreativeWork` schema for each project
- Dynamic `WorkExperience` schema for each job
- Canonical link in `index.html`
- preconnect: `images.unsplash.com`, `googletagmanager.com`, `cusdis.com`
- Preload Inter font (woff2)
- `og:type=profile`, `og:image:width/height`, `profile:first_name`, `twitter:creator`

## Active Components
- `HeroNewsletter` (above-the-fold email signup, GA4 conversion event)
- `BlogDetail` (Cusdis + NativeComments + Reactions + TOC sidebar)
- `NativeComments` (self-hosted with anti-spam: rate limit + honeypot + disposable email + patterns; minHeight 520px, rows=6)
- `Reactions` (like/insightful/inspired with localStorage dedup)
- `TableOfContents` (sticky sidebar with scroll-spy)

## Scheduled Tasks (Windows)
All under `\TonyBrandMaster\` task path:
- `TonyBrandMaster-Startup` (on logon)
- `TonyBrandMaster-Nightly` (daily 2 AM — analytics review)
- `TonyBrandMaster-WeeklyContent` (Sun 11 PM — content ideas)
- `TonyBrandMaster-MonthlySEO` (1st of month, 1 AM — SEO audit)

## Next Steps
- **User action:** Create GitHub PAT (classic, `repo` scope) at https://github.com/settings/tokens/new?scopes=repo → add as `GITHUB_BACKUP_TOKEN` Vercel env var
- Verify daily + weekly backup fires correctly after token added
- Rewrite 5 default blog articles to look less AI-generated
- Lighthouse audit after Phase 7 changes
- Add view counter via GA4 events
- Trending articles section (most-read via GA4)
- Improvement Cycle #2 once analytics data accumulates
- Consider: og:image per article, RSS per-category, custom admin sub-routes
