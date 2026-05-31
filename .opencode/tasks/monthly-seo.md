# Monthly Deep SEO Audit

**Schedule:** 1st of every month at 1:00 AM
**Mode:** 🌙 Deep Work
**Estimated Duration:** 45-90 minutes

## Instructions

Log everything with `node .opencode/lib/logger.cjs`.

### Step 1: Full Site Crawl
- [ ] Fetch all known routes: `/`, `/blog`, `/blog/*`, `/admin`, `/api/*`
- [ ] Verify all return 200
- [ ] Check `robots.txt`
- [ ] Check `sitemap.xml` includes all slugs

### Step 2: Schema Audit
- [ ] Validate all JSON-LD against schema.org
- [ ] Check `Person` completeness (name, jobTitle, knowsAbout, url)
- [ ] Check `BlogPosting` on articles (author, datePublished, dateModified)
- [ ] Check `BreadcrumbList` on blog detail
- [ ] Check `FAQPage` if sections exist
- [ ] Validate syntax (no trailing commas, valid JSON)

### Step 3: Content Freshness
- [ ] List all blog posts with dates
- [ ] Identify top 3 oldest articles needing updates
- [ ] For each: suggest improvements

### Step 4: Page Speed
- [ ] Review bundle sizes from `npm run build` output
- [ ] Check for heavy new dependencies
- [ ] Verify lazy loading is intact

### Step 5: E-E-A-T Assessment
- [ ] Does homepage show Experience? (15+ years, specific projects)
- [ ] Does site show Expertise? (technical depth)
- [ ] Authoritativeness? (LinkedIn, speaking, mentions)
- [ ] Trustworthiness? (realistic claims, no fluff)
- [ ] Score 1-10

### Step 6: Competitor Scan
- [ ] Check 2-3 peer personal brand sites
- [ ] Note what they do better
- [ ] Note what Tony does better

### Step 7: Content Calendar (Next 30 Days)
- [ ] Generate 4-6 article ideas
- [ ] Align with Tony's expertise and trends
- [ ] Prioritize by SEO potential + audience value

### Step 8: Build & Verify
- [ ] Run `npm run build` — MUST pass
- [ ] If it fails: log error, abort, do NOT commit

### Step 9: Commit Report
```bash
MONTH=$(date +%Y-%m)
node .opencode/lib/logger.cjs log audit "monthly-audit-$MONTH" ok - "Full audit complete"

# Commit any fixes made during audit
git add -A
git commit -m "audit: monthly SEO fixes $MONTH"
git push origin main
HASH=$(git log -1 --oneline | cut -d' ' -f1)
node .opencode/lib/logger.cjs log agent "monthly-seo" ok "$HASH" "Monthly audit complete"
node .opencode/lib/logger.cjs heartbeat ok "Monthly audit done"
```
