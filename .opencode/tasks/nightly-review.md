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

### Step 5: CI/CD Deployment Check
- [ ] Check Vercel deployment status via `https://me.tony.do/api/verify-deployment`
- [ ] If deployment is degraded or failed:
  ```bash
  # Log the issue for agent investigation
  node .opencode/lib/logger.cjs log fix "fix:deployment" warning "" "CI/CD pipeline issue detected - check /api/verify-deployment on production"
  ```
- [ ] If build failed (Step 6): check error log and categorize:
  - Module not found → `npm install`
  - Syntax error → review recent file changes
  - Vercel config error → check vercel.json
  - Other → read error log and self-fix

### Step 6: Content Freshness
- [ ] Count articles — check last publish date
- [ ] If stale (>14 days): flag for content creation
- [ ] If very stale (>21 days): create 1 blog post outline

### Step 7: Build & Verify
- [ ] Run `npm run build` — MUST pass before any commit
- [ ] If build fails: log the error, do NOT commit, abort the task
- [ ] If build passes: proceed

### Step 8: Log Individual Fixes (IMPORTANT for Dashboard Tracking)
For EACH fix you make, log it separately with type "fix" so the dashboard
can count and display it as an auto-improvement:

```bash
# Log each fix individually (dashboard reads these for improvement tracking):
node .opencode/lib/logger.cjs log fix "fix:schema" ok "<commit-hash>" "Fixed missing BlogPosting JSON-LD on article X"
node .opencode/lib/logger.cjs log fix "fix:broken-link" ok "<commit-hash>" "Fixed broken external link in article Y"
node .opencode/lib/logger.cjs log fix "fix:meta" ok "<commit-hash>" "Added missing OG description tag"
node .opencode/lib/logger.cjs log fix "fix:heading" ok "<commit-hash>" "Fixed H1→H2 hierarchy on homepage"
node .opencode/lib/logger.cjs log fix "fix:typo" ok "<commit-hash>" "Fixed typo in article Z"
```

### Step 9: Commit with Summary
- [ ] If fixes were made:
  ```bash
  # Build a summary message listing what was fixed
  SUMMARY="Fixed [X] issues: [broken links/schema/meta/etc]"

  git add -A
  git commit -m "nightly: $SUMMARY"
  git push origin main
  HASH=$(git log -1 --oneline | ForEach-Object { $_.Split(' ')[0] })
  node .opencode/lib/logger.cjs log agent "nightly-review" ok $HASH "$SUMMARY"
  ```
- [ ] If no fixes needed:
  ```bash
  node .opencode/lib/logger.cjs log agent "nightly-review" ok - "No issues found — all checks passed"
  ```
- [ ] Final heartbeat:
  ```bash
  node .opencode/lib/logger.cjs heartbeat ok "Nightly review complete"
  ```
