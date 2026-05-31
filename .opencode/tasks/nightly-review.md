# Nightly Site Review

**Schedule:** Every night at 2:00 AM
**Mode:** 🌙 Deep Work
**Estimated Duration:** 10-20 minutes

## Instructions

Log this file path before starting: `.opencode/logs/agent-log.ndjson`
Use `node .opencode/lib/logger.cjs` for all logging.

### Step 1: Health Check
- [ ] Fetch `https://me.tony.do` — confirm 200 OK
- [ ] Fetch `https://me.tony.do/blog` — confirm blog loads
- [ ] Run `npm run build` — verify success
- [ ] Check `git status` for uncommitted changes
- [ ] Log heartbeat: `node .opencode/lib/logger.cjs heartbeat nightly-start ok`

### Step 2: SEO Scan
- [ ] Review `<title>` tags on homepage and blog pages
- [ ] Check meta descriptions are present and unique
- [ ] Validate H1→H2→H3 hierarchy
- [ ] Ensure OG/Twitter meta tags exist

### Step 3: Schema Validation
- [ ] Fetch homepage and verify `Person` JSON-LD
- [ ] Fetch blog pages and verify `BlogPosting` + `BreadcrumbList`
- [ ] Check for schema syntax errors

### Step 4: Link Check
- [ ] Scan internal links for broken routes
- [ ] Check external links in blog posts
- [ ] Verify sitemap.xml returns valid XML

### Step 5: Content Freshness
- [ ] Count articles — check last publish date
- [ ] If stale (>14 days): flag for content creation
- [ ] If very stale (>21 days): create 1 blog post outline

### Step 6: Build & Verify
- [ ] Run `npm run build` — MUST pass before any commit
- [ ] If build fails: log the error, do NOT commit, abort the task
- [ ] If build passes: proceed

### Step 7: Commit & Log
- [ ] If fixes were made:
  ```bash
  git add -A
  git commit -m "nightly: [summary of changes]"
  git push origin main
  git log -1 --oneline | node .opencode/lib/logger.cjs log agent "nightly-review" ok -
  ```
- [ ] If no fixes needed:
  ```bash
  node .opencode/lib/logger.cjs log agent "nightly-review" ok - "No issues found"
  ```
- [ ] Final heartbeat:
  ```bash
  node .opencode/lib/logger.cjs heartbeat ok "Nightly review complete"
  ```
