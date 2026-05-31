# Weekly Content Creation

**Schedule:** Every Sunday at 11:00 PM
**Mode:** 🌙 Deep Work
**Estimated Duration:** 30-60 minutes

## Instructions

Log with `node .opencode/lib/logger.cjs` throughout.

### Step 1: Content Gap Analysis
- [ ] Count total articles in blog
- [ ] List articles by category — identify thin categories
- [ ] Check RSS feeds for trending PM/tech themes
- [ ] Review Tony's expertise areas for content opportunities

### Step 2: Draft 1-2 Blog Posts
For each post:
- [ ] Choose topic from gap analysis
- [ ] Write 800-1500 words, clear H1/H2/H3
- [ ] Answer-first style (insight in first 2 sentences)
- [ ] Include real specifics for E-E-A-T
- [ ] Closing "Takeaway" section

### Step 3: Technical Setup
- [ ] Add `Article` JSON-LD schema
- [ ] Set OG image (getFallbackImage or real URL)
- [ ] Assign category: Tech Made Simple 💡 / Business Hackers 🚀 / Future Pulse 🔮 / Developer Corner 💻
- [ ] Unique slug (append -1, -2 if collision)
- [ ] Format content with `\n\n` paragraph breaks

### Step 4: Critical — Build & Verify Before Commit
- [ ] Run `npm run build`
- [ ] If build FAILS: **DO NOT COMMIT**. Log error and abort.
  ```bash
  node .opencode/lib/logger.cjs log agent "weekly-content" failed - "Build failed after content creation"
  ```
- [ ] If build passes: proceed to commit

### Step 5: Commit with Tag
```bash
TAG="content-$(date +%Y%m%d)"
git add -A
git commit -m "content: [article title]"
git tag "$TAG"
git push origin main --tags
HASH=$(git log -1 --oneline | cut -d' ' -f1)
node .opencode/lib/logger.cjs log agent "weekly-content" ok "$HASH" "Published: [article title]"
```

### Step 6: LinkedIn Draft (Optional)
- [ ] Draft 150-300 word LinkedIn post version
- [ ] Save to `.opencode/logs/linkedin-drafts.md`

### Step 7: Final Heartbeat
```bash
node .opencode/lib/logger.cjs heartbeat ok "Weekly content complete"
```
