#!/usr/bin/env node
/**
 * Agent Health Check
 *
 * Verifies the agent is running correctly by checking:
 * 1. Heartbeat freshness (has the agent run recently?)
 * 2. Build status (does the project still compile?)
 * 3. Git state (are there uncommitted changes? last commit time?)
 * 4. Logger stats (are logs growing as expected?)
 * 5. Site reachability (is me.tony.do responding?)
 *
 * Exit codes:
 *   0 = All healthy
 *   1 = Warnings (minor issues)
 *   2 = Critical (agent or site is down)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const LOG_DIR = path.resolve(PROJECT_ROOT, '.opencode', 'logs');
const HEARTBEAT_FILE = path.join(LOG_DIR, 'heartbeat.ndjson');

const results = { checks: [], healthy: true, score: 100 };
let exitCode = 0;

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
    results.checks.push({ name, status: 'critical', detail: e.message });
    results.healthy = false;
    results.score -= 50;
    exitCode = Math.max(exitCode, 2);
  }
}

// ─── Check 1: Heartbeat Freshness ────────────────────────────────────────────

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

check('Git', () => {
  const status = execSync('git status --porcelain', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  const lastCommit = execSync('git log -1 --oneline', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  const unpushed = execSync('git log --oneline origin/main..HEAD', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();

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

  // Warn if logs exceed 1 MB total
  if (totalSize > 1_048_576) {
    return { status: 'warning', detail: details.join('; ') + ` — total ${(totalSize / 1024 / 1024).toFixed(1)} MB, consider pruning`, penalty: 10 };
  }
  return { status: 'ok', detail: details.join('; ') + ` — total ${(totalSize / 1024).toFixed(1)} KB` };
});

// ─── Check 5: Site Reachability ───────────────────────────────────────────────

check('Site Reachable', () => {
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
    // curl might not be available on Windows — try with Node.js fetch
    try {
      const https = require('https');
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

// ─── Output ───────────────────────────────────────────────────────────────────

results.timestamp = new Date().toISOString();
results.exitCode = exitCode;
results.status = exitCode === 0 ? 'healthy' : exitCode === 1 ? 'warning' : 'critical';

console.log(JSON.stringify(results, null, 2));
process.exit(exitCode);
