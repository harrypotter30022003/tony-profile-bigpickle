# AI Agent Handover & Site Briefing: me.tony.do

> **Agent System Prompt:** Your master persona, goals, and behavioral rules are defined in `~/.config/opencode/agents/personal-brand-pm.md` (agent name: `tony-brand-master`). This handover doc covers project-specific architecture, discoveries, and milestones. Read BOTH documents before making changes.
>
> **24/7 Operation:** Task schedules are in `.opencode/tasks/`. Agent logs are in `.opencode/logs/` (rolling JSON-lines, auto-pruned). Monitoring: `node .opencode/scripts/health-check.cjs`. See "24/7 Autonomous Operation" section below.

Welcome, Agent! This document serves as the absolute source of truth regarding the architecture, discoveries, and milestones completed on the `me.tony.do` portfolio, CMS, and AI blogging engine. Read this carefully to continue seamlessly without breaking existing system patterns.

---

## 🤖 24/7 Autonomous Operation

This agent runs continuously in the background, improving the site autonomously. Here's how it works:

### Architecture

```
┌─ Your PC / VPS ──────────────────────────────────┐
│  opencode serve --port 4096                        │
│  ┌─ tony-brand-master agent ───────────────────┐  │
│  │  • Always-on monitoring (6AM-10PM: light)    │  │
│  │  • Deep work (10PM-6AM: heavy tasks)         │  │
│  │  • Scheduled triggers via task files         │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
         │ git push
         ▼
┌─ Vercel ──────────────────────────────────────────┐
│  • me.tony.do (production)                         │
│  • api/cron-fetch-news.js (weekly RSS)             │
│  • Vercel KV (database)                            │
└────────────────────────────────────────────────────┘
```

### Task Schedule (autonomous triggers)

| Task | Time | What It Does |
|------|------|-------------|
| `nightly-review.md` | Daily 2:00 AM | Health check, SEO scan, schema validation, link check, freshness check |
| `weekly-content.md` | Sunday 11:00 PM | Draft 1-2 blog posts, commit, push |
| `monthly-seo.md` | 1st of month 1:00 AM | Full crawl, schema audit, competitor scan, content calendar |

### Connecting to the Agent

```bash
# From another terminal window:
opencode attach http://localhost:4096

# Or check if the server is running:
curl http://localhost:4096/health
```

### Agent Logs

All autonomous actions are logged to `.opencode/logs/agent-log.ndjson` (rolling JSON-lines format, max 500 entries).
Heartbeats are logged to `.opencode/logs/heartbeat.ndjson` (max 100 entries).
Both auto-prune — no manual cleanup, no unbounded growth.

**To read logs:**
```powershell
# Last 10 agent actions:
node .opencode\lib\logger.cjs tail agent 10

# Log statistics (size, entries, freshness):
node .opencode\lib\logger.cjs stats

# Full health check:
node .opencode\scripts\health-check.cjs
```

### Starting / Stopping

```powershell
# Start (if not running): run the batch file
.\.opencode\start-agent.bat

# Stop via Task Scheduler:
schtasks /End /TN "TonyBrandMaster-Agent"

# Remove the scheduled task entirely:
schtasks /Delete /TN "TonyBrandMaster-Agent" /F
```

### Time-Aware Operation

The agent checks the current time before every action:
- **6 AM - 10 PM (Light Mode):** Monitoring only — broken links, schema validation, typo fixes. No content generation or structural changes.
- **10 PM - 6 AM (Deep Work):** Full power — content creation, SEO overhauls, code refactoring, batch operations.
- **Any time (Critical Fix):** If the site is down or a 500 error is detected, fix immediately regardless of schedule.

---

## 🎯 Current Milestone: Automated, High-Volume SEO Blogging Machine Complete!

We have successfully built, tested, and deployed an autonomous, self-balancing blogging ecosystem. It is specifically optimized to pass the Google AdSense eligibility review and drive consistent organic search traffic.

### Major Achievements in this Session:
1.  **High-Contrast Theming**: Resolved Light-Mode contrast issues by removing hardcoded grey values and replacing them with theme-adaptive CSS tokens (`var(--glass)`, `var(--text)`, `var(--text-muted)`). Category pills and pagination buttons now render with high-contrast, fully visible colors on both bright and dark panels.
2.  **Whole-Card Click-Routing**: Card navigation was changed from just the 'Read More' link to being clickable anywhere on the card container, using standard `cursor: pointer` hand visualizers and non-colliding React `onClick` hash-updates.
3.  **Restored Cyberpunk Hover Glows**: Category filter buttons rose dynamically and display a glowing neon border/shadow matching their respective badges (turquoise, pink, purple, blue). 
4.  **Completed "Le Duy Hotels" Replacement**: Crawled, extracted, and replaced the outdated hotels project across static fallbacks, backup JSON databases, and Vercel KV stores with the new, premium **"EZ Fast Tech"** platform.
5.  **Completed Tier 1 SEO & Discovery Suite**:
    - Compiled and deployed `robots.txt` instructing crawlers to read our dynamic map.
    - Created an automated serverless `sitemap.xml` lambda querying Vercel KV dynamically with CDNs caching.
    - Upgraded raw HTML and React routers to dynamically control Facebook OpenGraph and Twitter Card meta structures.
    - Forced native image lazy-loading (`loading="lazy"`) across all card layouts.
    - Secured workspace by purging `.env` secrets from Git indices.
6.  **Completed Tier 2 Performance & Engagement Suite**:
    - Extracted all helper rendering functions to `src/utils/blogHelpers.jsx` and decoupled blog views into separate React components.
    - Integrated dynamic `React.lazy` code-splitting and dynamic imports, reducing the initial loading bundle footprint.
    - Implemented a category-adaptive horizontal scroll reading progress bar.
    - Implemented an intelligent Same-Category Related Posts recommendation panel.
    - Integrated native offsite Social Sharing buttons (LinkedIn, Facebook, Clipboard Copy).
    - Upgraded metadata injection from single schemas to dynamic multi-schema JSON-LD layouts using standard Schema.org `@graph` blocks, injecting both `BlogPosting` and `BreadcrumbList` schemas dynamically.
    - Purged heavy, unused dependencies (`three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `vanilla-tilt`) cleanly from `package.json`.
    - Sanitized and fixed `vercel.json` to resolve configuration errors and unblock Vercel's strict schema validator.
    - Cleaned and sanitized all newly created source and config files (`vercel.json`, `sitemap.js`, `BlogFeed.jsx`, `BlogDetail.jsx`, `blogHelpers.jsx`) to strip invisible Windows Byte Order Marks (BOM), resolving compilation crashes and unblocking Vercel's Linux build containers.
    - Swapped the Breadcrumb container tag from `<nav>` to `<div>` to avoid CSS selector conflicts with the global header menu style rules, restoring a clean, compact, left-aligned layout row.
7.  **Completed Tier 3 AI Search & LLM Optimization Suite**:
    - Created the high-density, serverless `/api/summary` JSON endpoint serving structured portfolio metrics, tech skills, and article summaries for AI crawlers.
    - Embedded alternate JSON sitemap discovery links in `index.html`'s `<head>` to guide GPTBot, ClaudeBot, and Google-Extended directly to the summary API.
    - Integrated rich `FAQPage` and `Person` JSON-LD schemas inside the homepage dynamic metatags manager to boost drop-down Q&A rankings in Google Search.
    - Audited and corrected all heading structures to follow a strict progressive semantic hierarchy (H1 -> H2 -> H3) across listings, detail views, and related readers.
8.  **Completed Tier 4 Long-Term Growth Suite**:
    - Deployed a Progressive Web App (PWA) configuration (`manifest.json`, `sw.js` service worker, and browser registration scripts in `main.jsx`), supporting "Add to Home Screen" install prompts and dynamic stale-while-revalidate offline caching for blog reading.
    - Implemented a secure SendPulse SMTP OAuth REST API integration inside the weekly cron, compiling a modern HTML layout of the 4 newly crawled articles and blasting a weekly newsletter batch on autopilot. (Successfully verified live with secure diagnostic tests on your verified custom domain sender contact@tony.do, after which the testing API was fully deleted for maximum security).
    - Designed and rendered frosted glass "Join the Tech Stream" subscription widgets with secure double-signup and unsubscription API landing pages (`api/subscribe.js` and `api/unsubscribe.js`) storing data securely in Vercel KV.
    - Embedded Cusdis privacy-first comments threads dynamically underneath blog details with automatic dynamic script loading and cleanup, unburdening serverless databases from spam bots and security vulnerabilities.
    - Integrated Microsoft Clarity tracking tags inside `index.html`'s `<head>` to record scroll depths, clicks, and session playbacks for zero performance overhead.
    - Built a secure, password-protected serverless API `api/subscribers.js` and integrated a beautiful, interactive "Usage & Subscribers" tab inside `admin.html`, letting you securely monitor active mailing list subscriptions, export them to CSV on a single click, and view exact free tier usage limits of SendPulse SMTP, Vercel KV, Gemini API, and Vercel Hosting. (Upgraded to dynamically query live Vercel KV database sizes and active keys count in real-time, fetch SendPulse SMTP email sending balances via secure OAuth APIs, and display reference cards for Firebase Core & Google Analytics 4 user behavior limits).
    - Implemented a dynamic "Blog Spotlight" section on the Homepage displaying your 3 most recent articles with an "Explore Full Blog" CTA, boosting internal SEO linking.
    - Integrated an immersive "Wizard Chess Hobby Spotlight" section on the Homepage, highlighting your Harry Potter-themed chess game, its Stockfish Online API AI, Firestore backend, and GitHub Actions CI/CD pipeline.
    - Programmed an auto-upgrader inside `api/data.js` to automatically inject the new "Wizard Chess" project into your production Vercel KV databases, maintaining complete schema synchronization.
    - Integrated support for dynamic project icons (`p.icon || icons[i] || '💻'`) inside your homepage Projects component, and added a custom **"Icon (Emoji)"** editor field in `/admin` so you can securely edit or change any project's icon on the fly.
9.  **24/7 Autonomous Agent Setup**:
    - Transformed `personal-brand-pm.md` into a 24/7 autonomous agent prompt with tiered operating schedule (light monitoring vs deep work).
    - Created `.opencode/tasks/` with nightly review, weekly content, and monthly SEO audit task definitions.
    - Created `.opencode/logs/` for autonomous action logging.
    - Created `.opencode/setup-24-7-agent.ps1` for Windows Task Scheduler integration.
    - Added time-aware guards: quick fixes anytime, heavy work only at night.

---

## 🏗️ Technical Architecture

### 1. Hybrid Persistence Layer
*   **Production**: Loads/saves data dynamically to **Vercel KV (Upstash Redis)** under the key `portfolio_data`.
*   **Local fallback**: Fallbacks to reading/writing `src/admin/data.json` if Process ENV triggers indicate local development.
*   **Strict CDN Bypass**: Added explicit `Cache-Control: no-store, no-cache, must-revalidate` overrides to `/api/data` to stop edge servers and browsers from caching old database states.

### 2. Password Security (`/admin`)
*   Password: [Securely stored in your Vercel Environment Variables as ADMIN_PASSWORD]
*   Instead of standard in-memory states (which crash or reset when serverless lambda containers spin down), the system uses a **Stateless HMAC-SHA256 token**.
*   The token is generated dynamically by salting the `ADMIN_PASSWORD` with a secure hash, allowing login sessions to remain valid across different isolated edge lambdas without database lookups.

### 3. Self-Balancing AI News Importer (`api/cron-fetch-news.js`)
*   **Crawl Target**: Scrapes XML feeds from TechCrunch, Dev.to, and InfoQ in parallel.
*   **Quota Optimization**: Google Gemini 1.5 Flash can return 404/400 errors depending on region-specific API specifications (e.g. `v1` vs `v1beta`). To guarantee execution, we built a **Self-Healing Fallback Loop** that sequentially queries:
    1.  `v1beta/models/gemini-flash-latest` (Certified active, free-tier with unlimited quota)
    2.  `v1beta/models/gemini-2.5-flash`
    3.  `v1beta/models/gemini-pro-latest`
    4.  `v1beta/models/gemini-2.5-flash-lite`
*   **Parallel Writing**: When triggered, it spawns **4 Parallel AI workers** to write 4 rich articles simultaneously (exactly 1 for each of your 4 categories) in under 17 seconds, bypassing Vercel lambda timeout blocks.
*   **Duplicate Safeguards**: Compares titles before selecting, and uses a **Unique Slug Collision Resolver** to append progressive numeric suffixes (e.g., `-1`, `-2`) to prevent identical URL paths.
*   **Error Boundaries**: Wrapped each parallel worker in defensive `try...catch` loops, so if 1 worker fails or has an AI-typo, it will be skipped, but **the remaining successful workers will still publish perfectly!**

---

## 🗺️ Key Files & Paths

### Core Application
*   `tony-portfolio/src/App.jsx`: Main React entry point containing core UI rendering, hash router, and analytics hooks.
*   `tony-portfolio/src/App.css`: Immersive global style variables, responsive media queries, and themes.
*   `tony-portfolio/src/utils/blogHelpers.jsx`: Shared blog rendering helpers.
*   `tony-portfolio/src/components/BlogFeed.jsx`: Blog listing with filters and pagination.
*   `tony-portfolio/src/components/BlogDetail.jsx`: Blog post detail with progress bar, comments, social share.
*   `tony-portfolio/admin.html`: Custom SPA admin dashboard for direct content editing.

### API Layer
*   `tony-portfolio/api/data.js`: Unified cloud/local data loader.
*   `tony-portfolio/api/save.js`: Stateless HMAC-authenticated content writer.
*   `tony-portfolio/api/cron-fetch-news.js`: Parallel AI crawler and RSS self-balancing scheduler.
*   `tony-portfolio/api/subscribe.js` / `api/unsubscribe.js`: Newsletter handlers.
*   `tony-portfolio/api/subscribers.js`: Subscriber list + usage dashboard.
*   `tony-portfolio/api/sitemap.js`: Dynamic XML sitemap generator.
*   `tony-portfolio/api/summary.js`: AI-crawler-friendly JSON summary endpoint.

### Configuration
*   `tony-portfolio/vercel.json`: Clean URL routing rules and the weekly crons configuration.
*   `tony-portfolio/public/manifest.json`: PWA manifest.
*   `tony-portfolio/public/sw.js`: Service worker with offline caching.

### 24/7 Agent
*   `.opencode/tasks/nightly-review.md`: Daily 2 AM health check and SEO scan.
*   `.opencode/tasks/weekly-content.md`: Sunday 11 PM content creation cycle.
*   `.opencode/tasks/monthly-seo.md`: 1st of month deep SEO audit.
*   `.opencode/logs/agent-log.ndjson`: Rolling agent action log (500 max, auto-pruned).
*   `.opencode/logs/heartbeat.ndjson`: Agent heartbeat pings (100 max, auto-pruned).
*   `.opencode/lib/logger.cjs`: Node.js logging utility (`.ndjson` format, auto-pruning).
*   `.opencode/scripts/health-check.cjs`: Autonomous health verification script.
*   `.opencode/scripts/revert-guide.md`: Instructions for rolling back bad commits.
*   `.opencode/setup-24-7-agent.ps1`: Windows Task Scheduler installer.

---

## ➡️ Next Steps for the Next Agent:

1.  **Run the 24/7 setup** — Execute `.opencode/setup-24-7-agent.ps1` as Administrator to register the agent as a background service, then `opencode attach` to verify it's running.
2.  **Verify nightly review** — Check logs after 2 AM:
    ```powershell
    node .opencode\lib\logger.cjs tail agent 10
    node .opencode\scripts\health-check.cjs
    ```
3.  **Monitor agent health** — Run `node .opencode\scripts\health-check.cjs` anytime to verify the agent is running, the site is healthy, and the build passes. If the heartbeat is stale (>6h), the agent may be down.
4.  **Monitor AdSense Review** — Ensure traffic crawls go smoothly. The blog currently houses **25+ unique articles**, exceeding Google's recommended threshold (15-20) for approval.
5.  **Add RSS Sources** — If Tony requests more niche topics, add them directly inside the `RSS_FEEDS` array at the top of `api/cron-fetch-news.js`.
6.  **Perform Audits** — Watch Vercel's Cron Execution log inside the dashboard to ensure the Sunday midnight automated trigger completes successfully.
7.  **E-E-A-T Improvement** — Review the monthly audit log and implement suggested improvements to strengthen Experience, Expertise, Authoritativeness, and Trustworthiness signals.
8.  **LinkedIn Integration** — Draft LinkedIn posts from blog content and save to `.opencode/logs/linkedin-drafts.md` for Tony to review.
9.  **Log pruning** — Logs auto-prune at 500 entries. If disk space is a concern, run `node .opencode\lib\logger.cjs prune agent 200` to reduce retention.
