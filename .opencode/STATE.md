# Project State — Tony Portfolio

**Last updated:** 2026-06-02
**Status:** All systems green (100/100 health, all endpoints live, 11/12 functions)

## Active Goal
Maintain and improve the personal portfolio site at https://me.tony.do with autonomous SEO/content improvements driven by GA4 + Search Console analytics.

## Recent Commits
- `5a73a1c` feat: per-article branded OG images (1200x630)
- `58720b2` content: rewrite 6 default blog articles (less AI-sounding)
- `762f5f7` feat: view counter + Lighthouse fixes + favicons
- `025f759` docs: update STATE.md with admin URL security + GitHub backup details
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
- **`/tony-cms-portal`** — main admin dashboard (was `/admin`; file renamed admin.html → tony-cms-portal.html)
- **`/moderation-panel`** — comment moderation (was `/comments-moderate`; file renamed)
- `/admin` → 404 ✓
- `/comments-moderate` → 404 ✓

## GitHub Backup System (DORMANT — needs GITHUB_BACKUP_TOKEN)
- `api/_lib.js`: `handleBackup()`, `handleBackupList()` use GitHub Contents API
- Writes to `data-backups` branch: `backups/daily/YYYY-MM-DD.json` + `backups/weekly/YYYY-WW.json`
- Auto-prunes: 30 daily + 30 weekly versions max
- Redacts PII (emails) in payload
- Sub-routes on `api/cron-fetch-news.js`: `?action=backup-daily|backup-weekly|backup-list`
- **Vercel crons:**
  - `0 0 * * 0` → news fetch
  - `30 0 * * 0` → weekly backup
  - `0 1 * * *` → daily backup
- **Required env var (user action):** `GITHUB_BACKUP_TOKEN` (classic PAT, `repo` scope)
  - Optional: `GITHUB_REPO_OWNER=harrypotter30022003`, `GITHUB_REPO_NAME=tony-profile-bigpickle`, `GITHUB_REPO_BASE_BRANCH=main`
- Default repo: `harrypotter30022003/tony-profile-bigpickle`
- Gracefully skips with `{skipped: true, reason: "..."}` if token not set

## API Endpoint Inventory (11/12 Hobby limit — 1 slot free)
1. `/api/data` — Portfolio data + `?type=rss|comments|reactions|views|view` via consolidation
2. `/api/login` — Admin HMAC auth
3. `/api/save` — Admin save to KV
4. `/api/cron-fetch-news` — Weekly news cron + `?action=backup-daily|backup-weekly|backup-list`
5. `/api/sitemap` — XML sitemap
6. `/api/summary` — LLM-friendly JSON summary
7. `/api/subscribe` — Email signup
8. `/api/unsubscribe` — Email unsubscribe
9. `/api/subscribers` — Admin list subscribers
10. `/api/verify-deployment` — Health check for cron
11. `/api/analytics` — GA4 + Search Console (`?report=ga4|sc|summary`)

`api/_lib.js` is a shared module (not a function, just an import). **One function slot free.**

## URL Rewrites (vercel.json)
- `/sitemap.xml` → `/api/sitemap`
- `/rss.xml` → `/api/data?type=rss`
- `/api/rss` → `/api/data?type=rss`
- `/api/comments` → `/api/data?type=comments`
- `/api/reactions` → `/api/data?type=reactions`
- `/api/views` → `/api/data?type=views`
- `/api/view` → `/api/data?type=view`
- `/tony-cms-portal` → `/tony-cms-portal` (cleanUrls)
- `/moderation-panel` → `/moderation-panel` (cleanUrls)
- `/og/blog/:slug` → `/og/blog/:slug` (cleanUrls)

## Security Headers (vercel.json, all routes)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Cache-Control: JS/CSS `public, max-age=31536000, immutable`; API `no-store, no-cache, must-revalidate, proxy-revalidate`

## View Counter (KV-backed, GA4-tracked)
- `handleViewsGet()` / `handleViewIncrement()` in `api/_lib.js`
- `useArticleView()` hook (BlogDetail): fires on mount, dedup'd per sessionId (30 min TTL)
- `useViewCounts()` hook (BlogFeed): fetches all counts for cards
- `formatViewCount()`: 1234 → "1.2k"
- `trackBlogViewGA4()`: fires `gtag('event', 'blog_view', { article_slug, article_title })`
- Display: 👁️ icon + count on article cards + detail header
- Gracefully degrades to 0 when KV disabled

## Performance (verified)
- Main bundle: 234.45 kB (gzip 73.67 kB) — was 341 kB before lazy-load
- GSAP split into 42 KB ScrollTrigger + 69 KB gsap chunks, loaded lazily via `loadGsap()`
- requestIdleCallback for hero animations
- IntersectionObserver for about-section stats
- SW cache version: `v1.0.1` (network-first HTML, cache-first static, never cache API)
- All favicon sizes (favicon.ico, 16x16, 32x32, apple-touch 180x180, android 192/512) auto-generated from favicon.svg
- Main OG image: `/og-image.png` (1200x630, 113KB, sharp-rendered)
- Per-article OG images: `/og/blog/<slug>.png` (1200x630, ~15KB each, 6 default articles; runtime fallback to `/og-image.png` for admin-added articles)
- Inter font preload URL v20 (fixed v18 404)
- AdSense + Clarity scripts deferred via `requestIdleCallback` + 2s setTimeout
- LCP image: `fetchPriority="high"`, `decoding="async"`, `width`/`height` set

## A11y / UX Components
- `ErrorBoundary` (catches React errors, GA4 exception event, reload/home buttons, dev-mode error details)
- `LoadingSkeleton` (shimmer animation, home + blog variants)
- `NotFound` (404 page with hash path display + home/blog fallback)
- `<a class="skip-to-content">` link in `index.html`
- Theme FOUC fix via inline script reading `localStorage.getItem('tony-theme')` before paint
- Print stylesheet (`@media print`) in `App.css` for CV/resume
- `:focus-visible` + `.sr-only` styles
- Search input in `BlogFeed` filters by title/summary/content/tags with no-results state

## SEO Enhancements
- Person JSON-LD: `@id`, `alternateName`, `image`, `knowsAbout`, `alumniOf`, `hasOccupation`, `worksFor`
- WebSite schema with `SearchAction` (potentialAction)
- Dynamic `CreativeWork` schema for each project
- Dynamic `WorkExperience` schema for each job
- Per-article BlogPosting JSON-LD (title, image, date, author, breadcrumb)
- Canonical link in `index.html`
- preconnect: `images.unsplash.com`, `googletagmanager.com`, `cusdis.com`
- Preload Inter font (woff2 v20)
- `og:type=profile`, `og:image:width/height`, `profile:first_name`, `twitter:creator`
- Per-article og:image (`/og/blog/<slug>.png`) with runtime fallback

## Blog Content (rewritten 2026-06-02)
- 6 default articles rewritten (5000-6000 chars each, was 1300-2500)
- Personal voice: real stories, opinions, anecdotes (no more template structure)
- Removed `### 👨‍💻 Developer Tip` and `### 💼 Business Growth Takeaway` repetition
- Each article has `version: 2` field → merge logic in data.js auto-updates KV on first request
- Article 1: "What I Got Wrong About Managing Vietnamese Engineers (And How I Fixed It)"
- Article 2: "I Use These 5 Free AI Tools Every Week. Here's What's Actually Worth Your Time."
- Article 3: "Stop Asking Me What Framework to Use. Start With This Question Instead."
- Article 4: "A Month of Running My Team With AI. Here's the Honest Review."
- Article 5: "Your Website Is Slow Because You Pushed a 6MB Image From Your iPhone. Here's the Fix."
- Article 6: "I Cut My AWS Bill in Half By Making My Site Boring. Here's How."
- News-fetch cron adds more articles weekly (currently 26+ from RSS + Gemini rewrites)

## Active Components
- `HeroNewsletter` (above-the-fold email signup, GA4 conversion event)
- `BlogDetail` (Cusdis + NativeComments + Reactions + TOC sidebar + view counter)
- `NativeComments` (self-hosted with anti-spam: rate limit + honeypot + disposable email + patterns; minHeight 520px, rows=6)
- `Reactions` (like/insightful/inspired with localStorage dedup)
- `TableOfContents` (sticky sidebar with scroll-spy)

## Scheduled Tasks (Windows)
All under `\TonyBrandMaster\` task path:
- `TonyBrandMaster-Startup` (on logon)
- `TonyBrandMaster-Nightly` (daily 2 AM — analytics review)
- `TonyBrandMaster-WeeklyContent` (Sun 11 PM — content ideas)
- `TonyBrandMaster-MonthlySEO` (1st of month, 1 AM — SEO audit)

## Lighthouse Scores (best of 3 runs, test env throttled)
- Performance: 60/100
- Best Practices: 77/100 (3rd-party cookies from analytics; unavoidable)
- Accessibility: 96/100
- SEO: 100/100

## Next Steps
- **User action:** Create GitHub PAT (classic, `repo` scope) at https://github.com/settings/tokens/new?scopes=repo → add as `GITHUB_BACKUP_TOKEN` Vercel env var
- Verify daily + weekly backup fires correctly after token added
- Add view counter sorting (most-viewed articles section)
- Add email unsubscribe link to actual email template
- Lighthouse audit on real (non-throttled) network for accurate perf score
- Consider: view counter badge on feed cards
