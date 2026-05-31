# Revert Guide — Tony Brand Master Agent

If the agent pushes a bad change, here's how to roll back safely.

## Quick Revert (Last Commit)

```bash
# Undo the last commit but keep the changes in your working directory:
git reset --soft HEAD~1

# Or fully undo the last commit (destroys changes):
git reset --hard HEAD~1

# Or create a new commit that undoes the last one (safest):
git revert HEAD
git push origin main
```

## Revert a Specific Commit

Every agent commit includes the commit hash in the log file (`.opencode/logs/agent-log.ndjson`). To find it:

```powershell
# Find the commit hash of a specific action:
node .opencode\lib\logger.js tail agent 20

# Then revert it:
git revert <commit-hash>
git push origin main
```

## Roll Back to a Known Good State

All agent commits are tagged in the log. To find the last known-good commit:

```powershell
# Check recent commits:
git log --oneline -20

# Roll back to a specific commit:
git reset --hard <known-good-commit-hash>
git push origin main --force
```

> ⚠️ Force push is destructive. Only do this if you're sure.

## Prevent Bad Commits (Built-in Safeguards)

The agent automatically:
1. Runs `npm run build` before every commit — bad code won't compile
2. Commits with descriptive prefixed messages (`nightly:`, `content:`, `fix:`, `audit:`)
3. Records every commit hash in `.opencode/logs/agent-log.ndjson`
4. Tags non-trivial commits with `git tag agent-YYYYMMDD-N`

To disable the agent temporarily:

```powershell
# Stop the server:
opencode serve --stop

# Or via Task Scheduler:
schtasks /End /TN "TonyBrandMaster-Agent"
```

## File-Level Restore

If only one file is broken:

```bash
# Restore a single file from the last commit:
git checkout HEAD -- path/to/file.js

# Or from a specific commit:
git checkout <commit-hash> -- path/to/file.js
```
