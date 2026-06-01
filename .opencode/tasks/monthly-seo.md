# Monthly Deep SEO Audit

**Schedule:** 1st of every month at 1:00 AM
**Mode:** 🌙 Deep Work
**Estimated Duration:** 45-90 minutes

## Instructions

Log everything with `node .opencode/lib/logger.cjs`.

### Step 1: Analytics Review (GA4 + Search Console)
- [ ] Call `https://me.tony.do/api/analytics?report=summary&period=30d` to get combined GA4 + Search Console data
- [ ] Review traffic trends: total users, sessions, page views vs last month
- [ ] Review search performance: impressions, clicks, CTR, avg position vs last month
- [ ] Identify top pages by traffic and top search queries
- [ ] Check for any analytics configuration issues
- [ ] Log findings:
  ```bash
  node .opencode/lib/logger.cjs log audit monthly-ga4 $(date +%Y-%m) - "GA4: X users, Y sessions, Z page views (30d)"
  node .opencode/lib/logger.cjs log audit monthly-sc $(date +%Y-%m) - "Search Console: X impressions, Y clicks, Z% CTR (30d)"
  ```

### Step 2: Full Site Crawl
- [ ] Fetch all known routes: `/`, `/blog`, `/blog/*`, `/admin`, `/api/*`
- [ ] Verify all return 200
- [ ] Check `robots.txt`
- [ ] Check `sitemap.xml` includes all slugs

### Step 3: Schema Audit
- [ ] Validate all JSON-LD against schema.org
- [ ] Check `Person` completeness (name, jobTitle, knowsAbout, url)
- [ ] Check `BlogPosting` on articles (author, datePublished, dateModified)
- [ ] Check `BreadcrumbList` on blog detail
- [ ] Check `FAQPage` if sections exist
- [ ] Validate syntax (no trailing commas, valid JSON)

### Step 4: Content Freshness
- [ ] List all blog posts with dates
- [ ] Identify top 3 oldest articles needing updates
- [ ] For each: suggest improvements

### Step 5: Page Speed
- [ ] Review bundle sizes from `npm run build` output
- [ ] Check for heavy new dependencies
- [ ] Verify lazy loading is intact

### Step 6: E-E-A-T Assessment
- [ ] Does homepage show Experience? (15+ years, specific projects)
- [ ] Does site show Expertise? (technical depth)
- [ ] Authoritativeness? (LinkedIn, speaking, mentions)
- [ ] Trustworthiness? (realistic claims, no fluff)
- [ ] Score 1-10

### Step 7: Competitor Scan
- [ ] Check 2-3 peer personal brand sites
- [ ] Note what they do better
- [ ] Note what Tony does better

### Step 7: Analytics-Driven Content Calendar (Next 30 Days)
- [ ] Review analytics data from Step 1:
  - Which pages get the most traffic? → Create more content on those topics
  - Which search queries drive impressions? → Optimize existing pages, create deeper content
  - Which channels drive users? → Double down on what works
  - Any pages with high bounce rate? → Improve content quality or CTAs
- [ ] Generate 4-6 article ideas based on:
  - High-performing topics (from GA4 top pages)
  - Keyword opportunities (from Search Console queries with high impressions, low CTR)
  - Topics with rising search interest
  - Alignment with Tony's expertise and brand pillars
- [ ] Prioritize by: SEO potential × Audience value × Effort

### Step 9: Build & Verify
- [ ] Run `npm run build` — MUST pass
- [ ] If it fails: log error, abort, do NOT commit

### Step 10: Log Individual Improvements Before Commit
For EACH fix or improvement made during the audit, log it separately so the
dashboard can display it as an auto-improvement:

```bash
# Example fix logs (adjust based on what you actually fixed):
# node .opencode/lib/logger.cjs log fix "fix:schema" "" "Updated Person schema with missing fields"
# node .opencode/lib/logger.cjs log fix "fix:content" "" "Refreshed article: [title] with new data"
# node .opencode/lib/logger.cjs log fix "fix:seo" "" "Added FAQ schema to homepage"
```

### Step 11: Commit Report with All Fixes
```bash
MONTH=$(date +%Y-%m)
SUMMARY="Monthly SEO audit: [X] improvements made"

# Commit all fixes
git add -A
git commit -m "audit: $SUMMARY"
git push origin main
HASH=$(git log -1 --oneline | ForEach-Object { $_.Split(' ')[0] })

# Log the audit action for dashboard tracking
node .opencode/lib/logger.cjs log audit "monthly-audit-$MONTH" ok - "$SUMMARY"
node .opencode/lib/logger.cjs log agent "monthly-seo" ok "$HASH" "$SUMMARY"
node .opencode/lib/logger.cjs heartbeat ok "Monthly audit done"
```
