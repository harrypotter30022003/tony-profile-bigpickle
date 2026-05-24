# Tony Do - Senior Project Manager & Tech Leader Portfolio

An elite, high-performance, and responsive portfolio website designed for Tony Do (Senior PM & Tech Leader). This site features an immersive glassmorphism cyberpunk theme, a password-secured administration panel (`/admin`), dynamic cloud database storage, and a fully automated AI-powered technical blog.

## 🌟 Key Features

*   **Cyberpunk Glassmorphism UI**: Beautiful, interactive front-end with lightweight GSAP scroll triggers, counting animations, floating background orbs, and a "Hidden Wisdom" frosted glass spotlight.
*   **Dual Mode Theme Switcher**: Toggle smoothly between an immersive Dark Mode and a highly accessible Light Mode.
*   **Dynamic CMS (/admin)**: Securely manage Tony's basic bio, experience, skills, projects, and footer credits directly from a password-protected admin panel.
*   **Hybrid Cloud Persistence**: Uses `@vercel/kv` (Upstash Redis) to load and save data permanently in production, with a robust local `data.json` fallback on disk.
*   **Stateless HMAC Authentication**: Uses secure HMAC-SHA256 tokens derived from `ADMIN_PASSWORD` to authorize `/api/save` calls, making it completely stateless and compatible with Vercel's serverless edge.
*   **Automated AI Blog Engine**:
    *   **Self-Balancing Importer**: Dynamically queries active XML feeds from TechCrunch, Dev.to, and InfoQ. Evaluates current category counts and targets the least-populated group first.
    *   **Gemini 1.5 Flash AI Writer**: Calls Google's API to rewrite tech news into 600-word, high-quality, original posts customized to Tony's technical authority voice.
    *   **Dual-Audience Optimization**: Structurally partitions posts with clear headers, a **Developer Tip** block (code snippets), and a simplified **Business Growth Takeaway** block to capture high-volume beginner traffic.
    *   **SEO Meta Injection**: Automatically updates `<title>`, `<meta name="description">` tags, and injects **JSON-LD Schema structured data** into the document `<head>` on the fly.
    *   **404 Image Fallbacks**: Implements a React image-error boundary that swaps broken RSS links with valid high-res tech covers from Unsplash.
*   **4-Column Grid & Pagination**: Beautiful desktop card grid limited to exactly 12 posts per page, linked to a fully responsive, tactile pagination controller.

---

## 🛠️ Architecture & Tech Stack

*   **Frontend**: React 19, Vite, GSAP (animations), Vanilla CSS
*   **Serverless APIs**: Next-generation Node.js serverless lambdas in `/api`
*   **Database**: Vercel KV (Upstash Redis cloud container) & static JSON files
*   **AI Models**: Google Gemini 1.5 API (via `gemini-flash-latest`)
*   **Deployment**: CI/CD on Vercel connected to the `main` branch

---

## ⚙️ Setting Up Environment Variables

To run the automated blog and secure the database, set up these Environment Variables inside your **Vercel Project Dashboard Settings**:

| Variable Key | Description | Example / Source |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | Secure password to log into `/admin` | `Hogwarts011#` |
| `GEMINI_API_KEY` | Google AI Studio Key | `AIzaSy...` |
| `KV_REST_API_URL` | Vercel KV Rest Connection URL | Created automatically upon Vercel KV setup |
| `KV_REST_API_TOKEN` | Vercel KV Rest Connection Token | Created automatically upon Vercel KV setup |
| `CRON_SECRET` | Secure verification token for Vercel Crons | Generate a random 32-char string |

---

## 📅 Weekly Automated Blog Scheduler

The blog is fully automated using Vercel Cron. The scheduler is defined in `vercel.json` and is configured to trigger the API **every Sunday at midnight** on autopilot:

```json
"crons": [
  {
    "path": "/api/cron-fetch-news",
    "schedule": "0 0 * * 0"
  }
]
```

To run manually: Execute a `GET` request to `https://me.tony.do/api/cron-fetch-news` spoofing the User-Agent header `vercel-cron/1.0`.

---

## 🚀 Local Development

1.  Clone the repository and install dependencies:
    ```bash
    npm install
    ```
2.  Start the local Vite development server (strictly bounded to **Port 5190**):
    ```bash
    npm run dev -- --port 5190
    ```
3.  Compile a production-ready package:
    ```bash
    npm run build
    ```
