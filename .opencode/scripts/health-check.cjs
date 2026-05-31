#!/usr/bin/env node
/**
 * =============================================================================
 * Tony Brand Master — Agent Health Check
 * =============================================================================
 *
 * Runs 5 independent health checks and produces a JSON report with score.
 * Designed to be run anytime to verify the agent, site, and build are healthy.
 * Also called automatically at the end of every autonomous task cycle.
 *
 * CHECKS PERFORMED:
 *   1. Heartbeat Freshness — Was the agent active recently? (< 6h = healthy)
 *   2. Build Status        — Does the project compile successfully?
 *   3. Git State           — Clean working tree? Unpushed commits?
 *   4. Logger Stats        — Log files healthy, not bloated?
 *   5. Site Reachable      — Is me.tony.do responding 200 OK?
 *
 * EXIT CODES:
 *   0 = All healthy       — Site and agent operating normally
 *   1 = Warnings          — Minor issues (stale heartbeat, many uncommitted files)
 *   2 = Critical          — Action required (build broken, agent down, site unreachable)
 *
 * OUTPUT FORMAT (JSON):
 *   {
 *     "timestamp": "ISO date",
 *     "status": "healthy|warning|critical",
 *     "score": 0-100,
 *     "checks": [
 *       { "name": "Heartbeat", "status": "ok", "detail": "..." }
 *     ]
 *   }
 *
 * USAGE:
 *   node .opencode/scripts/health-check.cjs
 *
 * @module health-check
 */

// ─── Core Modules ─────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Paths ────────────────────────────────────────────────────────────────────

/** Root of the project (parent of .opencode/) */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/** Directory where agent logs are stored */
const LOG_DIR = path.resolve(PROJECT_ROOT, '.opencode', 'logs');

/** Heartbeat log file — used to check agent freshness */
const HEARTBEAT_FILE = path.join(LOG_DIR, 'heartbeat.ndjson');

// ─── Aggregator State ─────────────────────────────────────────────────────────

/**
 * Accumulates check results. Score starts at 100 and deducts for warnings/critical.
 * - Each warning  deducts 10-20 points
 * - Each critical deducts 30-50 points
 */
const results = { checks: [], healthy: true, score: 100 };
let exitCode = 0;

/**
 * Runs a health check function and records its result.
 * Automatically adjusts the score and exit code based on severity.
 *
 * @param {string}   name     - Human-readable check name (e.g., "Heartbeat")
 * @param {Function} fn       - Function that returns {status, detail, penalty?}
 * @param {string}   fn().status  - "ok" | "warning" | "critical"
 * @param {string}   fn().detail  - Human-readable description of the result
 * @param {number}   fn().penalty - Points to deduct (default: 10 for warning, 50 for critical)
 */
function check(name, fn) {
  try {
    const result = fn();
    results.checks.push({ name, status: result.status || 'ok', detail: result.detail });
    if (result.status === 'warning') {
      results.score -= result.penalty || 10;
      exitCode = Math.max(exitCode, 1);
    } else if (result.status === 'critical') {
      results.healthy = false;
      results.score -= result.penalty || 50;
      exitCode = Math.max(exitCode, 2);
    }
  } catch (e) {
    // Catch unexpected errors (file not found, JSON parse error, etc.)
    results.checks.push({ name, status: 'critical', detail: e.message });
    results.healthy = false;
    results.score -= 50;
    exitCode = Math.max(exitCode, 2);
  }
}

// ─── Check 1: Heartbeat Freshness ────────────────────────────────────────────
/**
 * Reads the last heartbeat from heartbeat.ndjson and checks if it's fresh.
 * - < 6 hours:   Agent is active and running normally
 * - 6-24 hours:  Agent may be sleeping or in light mode
 * - > 24 hours:  Agent is likely stopped or crashed
 *
 * Critical if: no heartbeat file found or > 24h stale
 * Warning if: 6-24h stale
 */
check('Heartbeat', () => {
  if (!fs.existsSync(HEARTBEAT_FILE)) {
    return { status: 'critical', detail: 'No heartbeat file found. Agent may have never started.', penalty: 50 };
  }
  const content = fs.readFileSync(HEARTBEAT_FILE, 'utf-8').trim();
  const lines = content.split('\n').filter(Boolean);
  if (lines.length === 0) {
    return { status: 'critical', detail: 'Heartbeat file is empty.', penalty: 50 };
  }
  const lastEntry = JSON.parse(lines[lines.length - 1]);
  const ageMs = Date.now() - new Date(lastEntry.ts).getTime();
  const ageHours = ageMs / 3600000;

  if (ageHours > 24) {
    return { status: 'critical', detail: `Last heartbeat was ${Math.round(ageHours)}h ago — agent may be down.`, penalty: 50 };
  } else if (ageHours > 6) {
    return { status: 'warning', detail: `Last heartbeat ${Math.round(ageHours)}h ago — agent may be sleeping.`, penalty: 20 };
  } else {
    return { status: 'ok', detail: `Last heartbeat ${Math.round(ageHours * 10) / 10}h ago — agent is active.` };
  }
});

// ─── Check 2: Build Status ───────────────────────────────────────────────────
/**
 * Runs `npm run build` and checks if it succeeds.
 * This is the most critical check — a broken build means the site won't deploy.
 *
 * Critical if: build fails or output doesn't contain "built in"
 */
check('Build', () => {
  try {
    const output = execSync('npm run build 2>&1', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 60000 });
    if (output.includes('built in')) {
      const match = output.match(/built in (\d+)ms/);
      const time = match ? `${match[1]}ms` : 'unknown';
      return { status: 'ok', detail: `Build succeeded (${time})` };
    } else {
      return { status: 'critical', detail: 'Build output did not indicate success.', penalty: 50 };
    }
  } catch (e) {
    return { status: 'critical', detail: `Build failed: ${e.message}`, penalty: 50 };
  }
});

// ─── Check 3: Git State ──────────────────────────────────────────────────────
/**
 * Checks the working tree status and unpushed commits.
 * - Clean tree with no unpushed commits: healthy
 * - Some uncommitted files: OK unless > 5 files
 * - Unpushed commits: OK, just informational
 *
 * Warning if: many uncommitted files (> 5)
 */
check('Git', () => {
  const status = execSync('git status --porcelain', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  const lastCommit = execSync('git log -1 --oneline', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  const unpushed = execSync('git log --oneline origin/main..HEAD 2>nul', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();

  const details = [`Last commit: ${lastCommit}`];
  if (status) {
    const lines = status.split('\n').length;
    details.push(`${lines} uncommitted file(s)`);
    if (lines > 5) {
      return { status: 'warning', detail: details.join('; ') + ' — many uncommitted files', penalty: 10 };
    }
  } else {
    details.push('Working tree clean');
  }
  if (unpushed) {
    const count = unpushed.split('\n').length;
    details.push(`${count} commit(s) not pushed`);
  }
  return { status: 'ok', detail: details.join('; ') };
});

// ─── Check 4: Logger Stats ───────────────────────────────────────────────────
/**
 * Checks that log files are not excessively large (> 1 MB total).
 * This verifies the auto-pruning is working correctly.
 *
 * Warning if: total log size > 1 MB
 */
check('Logger Stats', () => {
  const logFiles = ['agent-log.ndjson', 'heartbeat.ndjson', 'audit.ndjson', 'fix-log.ndjson'];
  let totalEntries = 0;
  let totalSize = 0;
  const details = [];

  for (const file of logFiles) {
    const filePath = path.join(LOG_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean).length;
      const size = Buffer.byteLength(content, 'utf-8');
      totalEntries += lines;
      totalSize += size;
      details.push(`${file}: ${lines} entries (${(size / 1024).toFixed(1)} KB)`);
    } else {
      details.push(`${file}: (empty)`);
    }
  }

  if (totalSize > 1_048_576) {
    return { status: 'warning', detail: details.join('; ') + ` — total ${(totalSize / 1024 / 1024).toFixed(1)} MB, consider pruning`, penalty: 10 };
  }
  return { status: 'ok', detail: details.join('; ') + ` — total ${(totalSize / 1024).toFixed(1)} KB` };
});

// ─── Check 5: Site Reachability ───────────────────────────────────────────────
/**
 * Attempts to fetch https://me.tony.do and checks for HTTP 200 response.
 * First tries curl (faster), falls back to Node.js https module (more portable).
 *
 * Warning if: non-200 response, timeout, or unreachable
 * (Not critical because local dev environment may not have internet access)
 */
check('Site Reachable', () => {
  // Try curl first (available on most systems, faster)
  try {
    const result = execSync('curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://me.tony.do', {
      encoding: 'utf-8',
      timeout: 15000,
    });
    if (result.trim() === '200') {
      return { status: 'ok', detail: 'me.tony.do responds 200 OK' };
    } else {
      return { status: 'warning', detail: `me.tony.do returned HTTP ${result.trim()}`, penalty: 20 };
    }
  } catch {
    // curl not available (Windows) — try Node.js built-in https module
    try {
      const https = require('https');
      // Return a promise that resolves with the check result
      return new Promise((resolve) => {
        const req = https.get('https://me.tony.do', { timeout: 10000 }, (res) => {
          if (res.statusCode === 200) {
            resolve({ status: 'ok', detail: 'me.tony.do responds 200 OK' });
          } else {
            resolve({ status: 'warning', detail: `me.tony.do returned HTTP ${res.statusCode}`, penalty: 20 });
          }
        });
        req.on('error', (e) => resolve({ status: 'warning', detail: `Site unreachable: ${e.message}`, penalty: 30 }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 'warning', detail: 'Site request timed out', penalty: 20 }); });
      });
    } catch {
      return { status: 'warning', detail: 'Could not check site reachability', penalty: 5 };
    }
  }
});

// ─── Output & Exit ────────────────────────────────────────────────────────────

/** Timestamp of when this health check was run */
results.timestamp = new Date().toISOString();

/** Numeric exit code: 0=healthy, 1=warning, 2=critical */
results.exitCode = exitCode;

/** Overall health status string */
results.status = exitCode === 0 ? 'healthy' : exitCode === 1 ? 'warning' : 'critical';

// Output the full report as JSON
console.log(JSON.stringify(results, null, 2));

// Exit with appropriate code for scripting/automation
process.exit(exitCode);
