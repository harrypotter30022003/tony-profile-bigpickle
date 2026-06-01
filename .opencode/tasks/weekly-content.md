# Weekly Content Creation

**Schedule:** Every Sunday at 11:00 PM
**Mode:** 🌙 Deep Work
**Estimated Duration:** 30-60 minutes

## Instructions

Log with `node .opencode/lib/logger.cjs` throughout.

### Step 1: Analytics Review (Traffic + Search Data)
- [ ] Call `https://me.tony.do/api/analytics?report=summary&period=7d` to get last 7 days of data
- [ ] Review recommendations from analytics summary
- [ ] Identify content gaps from search queries that have impressions but no matching article
- [ ] Note which categories drive the most traffic
- [ ] Log findings:
  ```bash
  node .opencode/lib/logger.cjs log audit weekly-analytics - - "Last 7 days: X users, Y search clicks, Z% CTR"
  ```

### Step 2: Content Gap Analysis
- [ ] Count total articles in blog
- [ ] List articles by category — identify thin categories
- [ ] Check RSS feeds for trending PM/tech themes
- [ ] Cross-reference with analytics: what topics do visitors search for that we don't cover?
- [ ] Review Tony's expertise areas for content opportunities

### Step 3: Draft 1-2 Blog Posts (Analytics-Informed)
For each post:
- [ ] Choose topic from gap analysis
- [ ] Write 800-1500 words, clear H1/H2/H3
- [ ] Answer-first style (insight in first 2 sentences)
- [ ] Include real specifics for E-E-A-T
- [ ] Closing "Takeaway" section

### Step 4: Technical Setup
- [ ] Add `Article` JSON-LD schema
- [ ] Set OG image (getFallbackImage or real URL)
- [ ] Assign category: Tech Made Simple 💡 / Business Hackers 🚀 / Future Pulse 🔮 / Developer Corner 💻
- [ ] Unique slug (append -1, -2 if collision)
- [ ] Format content with `\n\n` paragraph breaks

### Step 5: Critical — Build & Verify Before Commit
- [ ] Run `npm run build`
- [ ] If build FAILS: **DO NOT COMMIT**. Log error and abort.
  ```bash
  node .opencode/lib/logger.cjs log agent "weekly-content" failed - "Build failed after content creation"
  ```
- [ ] If build passes: proceed to commit

### Step 6: Commit with Tag
```bash
TITLE="[article title]"
TAG="content-$(date +%Y%m%d)"
git add -A
git commit -m "content: $TITLE"
git tag "$TAG"
git push origin main --tags
HASH=$(git log -1 --oneline | ForEach-Object { $_.Split(' ')[0] })

# Log as agent action (for dashboard activity summary)
node .opencode/lib/logger.cjs log agent "weekly-content" ok "$HASH" "Published: $TITLE"

# Also log as a content improvement (for dashboard improvement tracking)
node .opencode/lib/logger.cjs log fix "fix:content" "$HASH" "Published new article: $TITLE"
```

### Step 7: LinkedIn Draft (Optional)
- [ ] Draft 150-300 word LinkedIn post version
- [ ] Save to `.opencode/logs/linkedin-drafts.md`

### Step 8: Final Heartbeat
```bash
node .opencode/lib/logger.cjs heartbeat ok "Weekly content complete"
```
