# Project State — Tony Portfolio

**Last updated:** 2026-06-02
**Status:** All systems green (100/100 health, all endpoints live)

## Active Goal
Maintain and improve the personal portfolio site at https://me.tony.do with autonomous SEO/content improvements driven by GA4 + Search Console analytics.

## Recent Commits
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

## API Endpoint Inventory (12/12 Hobby limit)
1. `/api/data` — Portfolio data (also `?type=rss|comments|reactions` via consolidation)
2. `/api/login` — Admin HMAC auth
3. `/api/save` — Admin save to KV
4. `/api/cron-fetch-news` — Weekly content cron
5. `/api/sitemap` — XML sitemap
6. `/api/summary` — LLM-friendly JSON summary
7. `/api/subscribe` — Email signup
8. `/api/unsubscribe` — Email unsubscribe
9. `/api/subscribers` — Admin list subscribers
10. `/api/verify-deployment` — Health check for cron
11. `/api/analytics` — GA4 + Search Console (also `?report=summary`)

`api/_lib.js` is a shared module (not a function, just an import).

## URL Rewrites (vercel.json)
- `/rss.xml` → `/api/data?type=rss`
- `/api/rss` → `/api/data?type=rss`
- `/api/comments` → `/api/data?type=comments`
- `/api/reactions` → `/api/data?type=reactions`

## Active Components
- `HeroNewsletter` (above-the-fold email signup, GA4 conversion event)
- `BlogDetail` (Cusdis + NativeComments + Reactions + TOC sidebar)
- `NativeComments` (self-hosted with anti-spam: rate limit + honeypot + disposable email + patterns)
- `Reactions` (like/insightful/inspired with localStorage dedup)
- `TableOfContents` (sticky sidebar with scroll-spy)
- `/comments-moderate.html` (standalone admin moderation)

## Scheduled Tasks (Windows)
All under `\TonyBrandMaster\` task path:
- `TonyBrandMaster-Startup` (on logon)
- `TonyBrandMaster-Nightly` (daily 2 AM — analytics review)
- `TonyBrandMaster-WeeklyContent` (Sun 11 PM — content ideas)
- `TonyBrandMaster-MonthlySEO` (1st of month, 1 AM — SEO audit)

## Next Steps
- Visit `/comments-moderate.html` to verify the moderation UI works
- Verify Table of Contents on a real blog post
- Schedule Improvement Cycle #2 once analytics data accumulates
- Consider: og:image per article, view counter via GA4, trending articles section
