# Tony Do - Senior Project Manager & Tech Leader Portfolio

An elite, high-performance, and responsive portfolio website for **Do Minh Tuan (Tony Do)** — Senior PM & Tech Leader with 15+ years experience leading Vietnamese tech teams. Features an immersive glassmorphism cyberpunk theme, obscure-URL admin panel, AI-powered blog engine, GitHub-based daily backups, native comments, view counters, and full SEO/GEO optimization.

**Live site:** [me.tony.do](https://me.tony.do) · **Admin:** [/tony-cms-portal](https://me.tony.do/tony-cms-portal) (URL is intentionally obscure)

---

## 🌟 Key Features

### Visual & UX
- **Cyberpunk glassmorphism UI** — Lightweight GSAP scroll triggers, counting animations, floating orbs, "Hidden Wisdom" frosted-glass spotlight
- **Dual-mode theme switcher** — Smooth dark/light toggle with FOUC fix (theme applied before paint)
- **PWA-capable** — Manifest, service worker (offline-friendly), all icon sizes
- **Print stylesheet** — CV/resume layout clean when printed
- **A11y-first** — Skip-to-content link, focus-visible styles, error boundaries, loading skeletons, 404 page, semantic HTML

### Content & Engagement
- **AI blog engine** — Self-balancing importer pulls from TechCrunch/Dev.to/InfoQ RSS, fills least-populated category first
- **Gemini 1.5 AI writer** — Rewrites tech news into 600-word posts in Tony's authoritative voice
- **Native comments** (built on Vercel KV) with anti-spam: rate limit, honeypot, disposable email block, pattern matching
- **Cusdis cloud comments** as primary comment system (hosted, app ID `f352cc20-…`)
- **Reactions** (like/insightful/inspired) with localStorage dedup
- **Table of contents** with scroll-spy
- **View counter** — KV-backed, session-dedup, GA4-tracked
- **Search + category filter** on blog feed

### SEO / GEO
- **Full JSON-LD schema** — Person (with `@id`, `alternateName`, `knowsAbout`, `alumniOf`, `hasOccupation`, `worksFor`), WebSite (with `SearchAction`), per-article `BlogPosting` + `BreadcrumbList`, dynamic `CreativeWork` + `WorkExperience`
- **Per-article branded OG images** (1200x630) — Generated at build time, runtime fallback to main branded image
- **LLM-friendly summary endpoint** (`/api/summary`) + RSS feed
- **Canonical, preconnect, preload** for LCP optimization
- **E-E-A-T optimization** — Real author, real dates, real content

### AI Chat & Avatar
- **Floating AI assistant** — Click-to-chat floating widget (Intercom-style) on every page
- **3D avatar** — TalkingHead-based lip-syncing 3D avatar (generated from photo via DECA on local GPU)
- **Multi-layer anti-spam** — Honeypot + time check + KV rate limiting + math CAPTCHA (no Google reCAPTCHA)
- **Visitor registration** — Name + email required once per session; HMAC-signed session token
- **Multilingual** — Gemini 2.5 Flash auto-detects visitor language, responds in same language
- **Optional TTS** — Google Cloud TTS (free tier, 1M chars/mo) drives avatar lip-sync via viseme timestamps
- **Mute toggle** — Users can disable avatar voice and just read text

### Admin & Security
- **Obscure admin URL** — `/tony-cms-portal` (not `/admin`); old URL returns 404
- **Comment moderation** at `/moderation-panel` (not `/comments-moderate`); old URL returns 404
- **HMAC-SHA256 stateless auth** for admin actions (token = `HMAC-SHA256(password, "cms-session")`)
- **Security headers** — HSTS preload, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Serverless function budget** — 12/12 (Hobby plan limit) with shared `_lib.js` for RSS/comments/reactions/views/backups/TTS

### Data & Backup
- **Hybrid cloud persistence** — Vercel KV (Upstash Redis) with local `data.json` fallback
- **GitHub-based daily + weekly backups** — Auto-prunes 30 daily + 30 weekly versions
- **Versioned blog seeds** — Updating seed content auto-migrates KV on first request

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** React 19, Vite 8, GSAP (lazy-loaded), Vanilla CSS
- **Serverless APIs:** Node.js lambdas in `/api` (11 functions; shared helpers in `_lib.js`)
- **Database:** Vercel KV (Upstash Redis) & static JSON fallback
- **AI Chat:** Google Gemini 2.5 Flash (API key from AI Studio)
- **AI Avatar:** DECA (photo→3D, local GPU) + Qwen3-TTS (voice clone, local GPU) + Google Cloud TTS (runtime, free tier)
- **3D Rendering:** Three.js + TalkingHead (MIT, browser-based)
- **Backup:** GitHub Contents API (classic PAT, `repo` scope)
- **Analytics:** GA4 (`G-1417QXB4PX`) + Microsoft Clarity + Google AdSense
- **Comments:** Cusdis (hosted) + native (Vercel KV fallback)
- **Email:** SendPulse OAuth SMTP
- **Deployment:** CI/CD on Vercel connected to `main` branch

---

## ⚙️ Environment Variables

Set these in your **Vercel Project Dashboard → Settings → Environment Variables**.

### Core / Auth
| Variable | Description | Example |
|:---|:---|:---|
| `ADMIN_PASSWORD` | Password for `/tony-cms-portal` | strong random string |
| `CRON_SECRET` | Verification token for Vercel Crons | 32-char random |
| `SITE_URL` | Canonical site URL | `https://me.tony.do` |

### Vercel KV (auto-created)
| Variable | Description |
|:---|:---|
| `KV_REST_API_URL` | Vercel KV REST connection URL |
| `KV_REST_API_TOKEN` | Vercel KV REST connection token |

### Blog AI Engine
| Variable | Description | Source |
|:---|:---|:---|
| `GEMINI_API_KEY` | Google AI Studio key | https://aistudio.google.com/app/apikey |

### Newsletter (SendPulse)
| Variable | Description | Source |
|:---|:---|:---|
| `SENDPULSE_CLIENT_ID` | OAuth REST API client ID | SendPulse → Account → API |
| `SENDPULSE_CLIENT_SECRET` | OAuth REST API client secret | SendPulse → Account → API |
| `SENDPULSE_SMTP_FROM` | Verified custom SMTP sender | e.g. `contact@tony.do` |

### Comments (Cusdis)
| Variable | Description | Source |
|:---|:---|:---|
| `VITE_CUSDIS_APP_ID` | Cusdis project app ID | https://cusdis.com dashboard |

### Chat & Avatar TTS
| Variable | Description | Source |
|:---|:---|:---|
| `GCP_TTS_API_KEY` | Google Cloud Text-to-Speech API key | Google Cloud Console → APIs → Text-to-Speech |

### Analytics
| Variable | Description | Source |
|:---|:---|:---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret | Google Cloud Console |
| `GOOGLE_REFRESH_TOKEN` | Long-lived refresh token | OAuth 2.0 playground |
| `GA4_PROPERTY_ID` | GA4 property ID | `538590165` (default) |
| `SEARCH_CONSOLE_SITE_URL` | Search Console site URL | `sc-domain:me.tony.do` (default) |

### AdSense (optional)
| Variable | Description | Source |
|:---|:---|:---|
| `ADSENSE_CLIENT_ID` | AdSense publisher ID | Google AdSense |

### GitHub Backups (optional — daily + weekly snapshots)
| Variable | Description | Default |
|:---|:---|:---|
| `GITHUB_BACKUP_TOKEN` | Classic PAT, **scope: `repo`** | *(required — see below)* |
| `GITHUB_REPO_OWNER` | Backup target repo owner | `harrypotter30022003` |
| `GITHUB_REPO_NAME` | Backup target repo name | `tony-profile-bigpickle` |
| `GITHUB_REPO_BASE_BRANCH` | Base branch for data-backups | `main` |

**To enable backups:** Create a classic PAT at https://github.com/settings/tokens/new?scopes=repo → add as `GITHUB_BACKUP_TOKEN`. Without it, backup cron actions gracefully skip with `{skipped: true}`.

---

## 📅 Vercel Cron Schedule (`vercel.json`)

| Schedule | Path | Purpose |
|:---|:---|:---|
| `0 0 * * 0` (Sun midnight) | `/api/cron-fetch-news` | Fetch + AI-rewrite weekly tech news |
| `30 0 * * 0` (Sun 00:30) | `/api/cron-fetch-news?action=backup-weekly` | Weekly portfolio data backup |
| `0 1 * * *` (daily 1 AM) | `/api/cron-fetch-news?action=backup-daily` | Daily portfolio data backup |

**Manual trigger (for testing):**

```bash
# News fetch
curl -H "Authorization: Bearer $CRON_SECRET" https://me.tony.do/api/cron-fetch-news

# Daily backup (requires GITHUB_BACKUP_TOKEN)
curl -H "Authorization: Bearer $CRON_SECRET" "https://me.tony.do/api/cron-fetch-news?action=backup-daily"

# Weekly backup
curl -H "Authorization: Bearer $CRON_SECRET" "https://me.tony.do/api/cron-fetch-news?action=backup-weekly"

# List existing backups
curl "https://me.tony.do/api/cron-fetch-news?action=backup-list"
```

---

## 🚀 Local Development

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Configure environment:** Copy `.env.example` to `.env.local` and fill in values. (For Vercel KV, the local dev server can use the production values from your Vercel project.)

3. **Start the dev server** (strictly on **Port 5190**):
   ```bash
   npm run dev
   ```

4. **Build for production** (runs OG image + favicon generators before Vite build):
   ```bash
   npm run build
   ```
   Build output in `dist/`. The build also generates:
   - `dist/og-image.png` — main branded OG image
   - `dist/og/blog/<slug>.png` — per-article branded OG images
   - `dist/favicon.ico`, `favicon-*.png`, `apple-touch-icon.png`, `android-chrome-*.png` — all PWA icon sizes

5. **Lint:**
   ```bash
   npm run lint
   ```

6. **Deploy:**
   ```bash
   vercel deploy --prod
   ```

---

## 📁 Project Structure

```
tony-portfolio/
├── api/                          # Vercel serverless functions (11 total)
│   ├── _lib.js                   # Shared module (RSS, comments, reactions, views, backups, TTS)
│   ├── chat.js                   # AI chat with anti-spam + Gemini 2.5 Flash
│   ├── data.js                   # Main data + sub-routes (?type=)
│   ├── login.js                  # HMAC auth token generator
│   ├── save.js                   # Admin save to KV
│   ├── cron-fetch-news.js        # Weekly cron + backup actions
│   ├── sitemap.js                # XML sitemap
│   ├── summary.js                # LLM-friendly JSON summary
│   ├── analytics.js              # GA4 + Search Console
│   ├── subscribe.js              # Newsletter signup
│   ├── unsubscribe.js            # Newsletter unsubscribe
│   ├── subscribers.js            # Subscriber list (admin)
│   └── verify-deployment.js      # Health check
│
├── public/
│   ├── favicon.svg               # Source for all favicon variants
│   ├── favicon.ico, favicon-*.png, apple-touch-icon.png, android-chrome-*.png
│   ├── og-image.png              # Main branded OG image (1200x630)
│   ├── og/blog/<slug>.png        # Per-article branded OG images
│   ├── sw.js                     # Service worker (v1.0.1, network-first HTML)
│   ├── manifest.json             # PWA manifest
│   ├── robots.txt
│   └── moderation-panel.html     # Comment moderation UI
│
├── src/
│   ├── main.jsx                  # Entry, wraps App in ErrorBoundary
│   ├── App.jsx                   # Main app (1363 lines: routing, JSON-LD, theme, GSAP)
│   ├── App.css                   # Theme variables, responsive styles, print stylesheet
│   ├── components/
│   │   ├── ChatWidget.jsx       # Floating chat + avatar container (Intercom-style)
│   │   ├── ChatEntryForm.jsx    # Name/email/captcha entry
│   │   ├── ChatThread.jsx       # Message display + input + AvatarScene
│   │   ├── AvatarScene.jsx      # Three.js + TalkingHead 3D avatar renderer
│   │   ├── BlogFeed.jsx          # Blog listing with search + category filter
│   │   ├── BlogDetail.jsx        # Single article view (Cusdis + native comments + reactions + TOC)
│   │   ├── HeroNewsletter.jsx    # Above-the-fold email signup
│   │   ├── NativeComments.jsx    # Self-hosted comments (anti-spam)
│   │   ├── Reactions.jsx         # Like/insightful/inspired
│   │   ├── TableOfContents.jsx   # Sticky scroll-spy sidebar
│   │   ├── ErrorBoundary.jsx     # React error catcher
│   │   ├── LoadingSkeleton.jsx   # Shimmer loading state
│   │   └── NotFound.jsx          # 404 page
│   ├── hooks/
│   │   ├── useArticleView.js     # View counter + GA4 tracking
│   │   └── useChat.js           # Chat state machine (entry, messages, mute, anti-spam)
│   ├── utils/
│   │   └── blogHelpers.jsx       # Content rendering, reading time, TOC
│   └── admin/
│       └── setup.js              # Admin setup helper
│
├── scripts/                      # Build-time scripts
│   ├── build-og-image.cjs        # Main branded OG image
│   ├── build-favicons.cjs        # All favicon sizes
│   ├── build-og-blog-images.cjs  # Per-article OG images
│   └── bump-article-versions.cjs # Helper for content updates
│
├── tony-cms-portal.html          # Admin panel (was admin.html; renamed for security)
├── index.html                    # SPA shell
├── vercel.json                   # Routes, headers, crons
├── vite.config.js                # Build config
├── package.json
└── .opencode/                    # OpenCode agent infra
    ├── STATE.md                  # Cross-session state doc
    ├── tasks/                    # Scheduled task instructions
    ├── scripts/                  # Agent health + utilities
    ├── lib/                      # Logger + helpers
    └── logs/                     # Operational logs (gitignored)
```

---

## 🔌 API Endpoints (12 of 12 Hobby plan limit)

| Path | Methods | Purpose |
|:---|:---|:---|
| `/api/data` | GET | Portfolio data (default) |
| `/api/data?type=rss` | GET | RSS XML feed (rewrite target for `/rss.xml`, `/api/rss`) |
| `/api/data?type=comments` | GET/POST | Comments (GET = list, POST = submit, `?action=moderate` for admin) |
| `/api/data?type=reactions` | GET/POST | Reactions (GET = counts, POST = increment) |
| `/api/data?type=views` | GET | View counts (all slugs or one with `?slug=`) |
| `/api/data?type=view` | POST | Increment view (with sessionId dedup) |
| `/api/data?type=tts` | POST | Google Cloud TTS synthesis (returns base64 audio + viseme timestamps) |
| `/api/chat` | POST | AI chat (Gemini 2.5 Flash, anti-spam, session token) |
| `/api/login` | POST | Returns HMAC token for admin |
| `/api/save` | POST | Save portfolio data to KV (HMAC auth required) |
| `/api/cron-fetch-news` | GET | Weekly news + backup actions (`?action=backup-daily|weekly|list`) |
| `/api/sitemap` | GET | XML sitemap |
| `/api/summary` | GET | LLM-friendly JSON summary |
| `/api/analytics` | GET | GA4 + Search Console (`?report=ga4|sc|summary`) |
| `/api/subscribe` | POST | Email signup |
| `/api/unsubscribe` | POST | Email unsubscribe |
| `/api/subscribers` | GET | Subscriber list (HMAC auth required) |
| `/api/verify-deployment` | GET | Health check endpoint |

---

## 🛡️ Admin Access

- **URL:** `https://me.tony.do/tony-cms-portal` (NOT `/admin` — that returns 404)
- **Auth:** HMAC-SHA256 token derived from `ADMIN_PASSWORD`
- **Token flow:** Client sends password to `/api/login` → server returns token → client stores in sessionStorage → sends on each `/api/save` call
- **Comment moderation:** `/moderation-panel` (also obscure URL)
- **All admin actions are logged** via the OpenCode agent logger

---

## 🧠 OpenCode Agent (24/7 autonomous)

A background agent (`tony-brand-master` at `C:\Users\OS\.config\opencode\agents\personal-brand-pm.md`) runs scheduled cycles:

| Task | Schedule | Purpose |
|:---|:---|:---|
| Nightly Review | Daily 2 AM | Site health, broken links, schema validation, page speed |
| Weekly Content | Sun 11 PM | Analytics-driven content creation |
| Monthly SEO | 1st of month, 1 AM | Deep audit + content calendar |

The agent has full Read/Write/Bash access to this project and commits improvements autonomously during deep-work windows (10 PM – 6 AM).

---

## 📄 License

Personal portfolio — not for redistribution. © 2026 Do Minh Tuan.
