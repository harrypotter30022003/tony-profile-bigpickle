#!/usr/bin/env node
/**
 * =============================================================================
 * Tony Brand Master — Rolling JSON-Lines Logger
 * =============================================================================
 *
 * A NoSQL-style local logging utility for the autonomous 24/7 agent.
 * Each log file stores one JSON object per line (.ndjson format).
 * Files auto-prune to prevent unbounded disk growth — no manual cleanup needed.
 *
 * WHY JSON-LINES (NDJSON)?
 *   - Append-only: fast writes, no file locking
 *   - Parseable: JSON.parse(line) on any single line
 *   - Queryable: grep/Select-String for specific actions or statuses
 *   - Auto-pruning: never exceeds configured max entries per file
 *   - Zero dependencies: pure Node.js built-in modules only
 *
 * LOG FILES (all stored in .opencode/logs/):
 *   agent-log.ndjson   — All autonomous agent actions (max 500 entries)
 *   heartbeat.ndjson   — Heartbeat pings every cycle (max 100 entries)
 *   audit.ndjson       — Monthly SEO audit reports (max 500 entries)
 *   fix-log.ndjson     — Bug fixes and incident responses (max 500 entries)
 *
 * USAGE:
 *   node .opencode/lib/logger.cjs log <type> <action> <status> [commitHash] [message]
 *   node .opencode/lib/logger.cjs heartbeat [status] [message]
 *   node .opencode/lib/logger.cjs tail <type> [lines=10]
 *   node .opencode/lib/logger.cjs stats
 *   node .opencode/lib/logger.cjs prune <type> [max=500]
 *   node .opencode/lib/logger.cjs recent-commits [lines=20]
 *
 * EXAMPLES:
 *   node .opencode/lib/logger.cjs log agent "nightly-review" ok "abc1234" "Fixed broken link"
 *   node .opencode/lib/logger.cjs heartbeat ok "Nightly review complete"
 *   node .opencode/lib/logger.cjs tail agent 5
 *
 * @module logger
 */

// ─── Core Modules ─────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

/** Directory where all .ndjson log files are stored */
const LOG_DIR = path.resolve(__dirname, '..', 'logs');

/** Maximum lines per log file before pruning kicks in (oldest lines removed) */
const MAX_ENTRIES = 500;

/** Map of log type keys to their file paths. Extend this to add new log types. */
const LOG_FILES = {
  agent:     path.join(LOG_DIR, 'agent-log.ndjson'),     // All agent actions
  heartbeat: path.join(LOG_DIR, 'heartbeat.ndjson'),     // Cycle heartbeats
  audit:     path.join(LOG_DIR, 'audit.ndjson'),         // Monthly audit reports
  fix:       path.join(LOG_DIR, 'fix-log.ndjson'),       // Bug fixes & incidents
};

// Ensure the log directory exists on first run
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Returns the current UTC timestamp as an ISO 8601 string.
 * Used as the `ts` field in every log entry.
 * @returns {string} ISO 8601 timestamp (e.g., "2026-05-31T10:30:55.209Z")
 */
function now() {
  return new Date().toISOString();
}

/**
 * Appends a JSON log entry to the specified file, then prunes if over limit.
 * @param {string} filePath - Absolute path to the .ndjson log file
 * @param {Object} entry    - Log entry object (will be JSON.stringify'd)
 * @param {string} entry.ts - ISO timestamp
 */
function appendLog(filePath, entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(filePath, line, 'utf-8');
  // Prune immediately after append to keep file size bounded
  doPruneFile(filePath, MAX_ENTRIES);
}

/**
 * Trims a log file to keep only the most recent N lines.
 * This prevents unbounded disk growth without needing log rotation tools.
 * @param {string} filePath - Absolute path to the .ndjson log file
 * @param {number} maxLines - Maximum number of lines to retain
 */
function doPruneFile(filePath, maxLines) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length > maxLines) {
      // Keep only the most recent `maxLines` lines
      const kept = lines.slice(lines.length - maxLines);
      fs.writeFileSync(filePath, kept.join('\n') + '\n', 'utf-8');
    }
  } catch {
    // Silently ignore if file doesn't exist yet — it will be created on first write
  }
}

/**
 * Reads the last N lines from a log file.
 * @param {string} filePath - Absolute path to the .ndjson log file
 * @param {number} lines    - Number of recent lines to return
 * @returns {string[]} Array of JSON strings, most recent last
 */
function readTail(filePath, lines) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.trim().split('\n').filter(Boolean);
    return allLines.slice(Math.max(0, allLines.length - lines));
  } catch {
    return [];
  }
}

/**
 * Gathers statistics for all log files: entry count, max allowed, last timestamp,
 * last status, and file size in bytes.
 * Also calculates heartbeat staleness (hours since last heartbeat).
 * @returns {Object} Stats object keyed by log type
 */
function gatherStats() {
  const stats = {};
  for (const [key, filePath] of Object.entries(LOG_FILES)) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        const lastEntry = lines.length > 0 ? JSON.parse(lines[lines.length - 1]) : null;
        stats[key] = {
          entries:   lines.length,
          max:       key === 'heartbeat' ? 100 : MAX_ENTRIES,
          lastTs:    lastEntry ? lastEntry.ts : null,
          lastStatus: lastEntry ? lastEntry.status : null,
          sizeBytes: Buffer.byteLength(content, 'utf-8'),
        };
      } else {
        stats[key] = { entries: 0, lastTs: null };
      }
    } catch (e) {
      stats[key] = { entries: 0, lastTs: null, error: e.message };
    }
  }
  // Heartbeat staleness check: if no heartbeat in 6+ hours, flag as stale
  if (stats.heartbeat && stats.heartbeat.lastTs) {
    const ageMs = Date.now() - new Date(stats.heartbeat.lastTs).getTime();
    const ageHours = Math.round(ageMs / 3600000 * 10) / 10;
    stats.heartbeat.ageHours = ageHours;
    stats.heartbeat.isStale = ageHours > 6;
  }
  return stats;
}

// ─── CLI Command Router ───────────────────────────────────────────────────────

const [, , command, ...args] = process.argv;

switch (command) {
  // ── log: Append a log entry ─────────────────────────────────────────────────
  // Usage: node logger.cjs log <type> <action> <status> [commitHash] [message...]
  //   type       — Log category (agent|heartbeat|audit|fix)
  //   action     — What happened (e.g., "nightly-review", "weekly-content")
  //   status     — Outcome (ok|failed|warning|critical)
  //   commitHash — Git commit hash (use "-" if not applicable)
  //   message    — Human-readable summary of what was done
  case 'log': {
    const [type, action, status, commitHash, ...messageParts] = args;
    if (!type || !action || !status) {
      console.error('Usage: node logger.cjs log <type> <action> <status> [commitHash] [message]');
      process.exit(1);
    }
    const logFile = LOG_FILES[type] || path.join(LOG_DIR, `${type}.ndjson`);
    const entry = {
      ts: now(),
      type,
      action,
      status,
    };
    if (commitHash && commitHash !== '-') entry.commit = commitHash;
    if (messageParts.length) entry.message = messageParts.join(' ');
    appendLog(logFile, entry);
    console.log(JSON.stringify(entry));
    break;
  }

  // ── heartbeat: Record a heartbeat ping ──────────────────────────────────────
  // Usage: node logger.cjs heartbeat [status] [message...]
  //   status  — ok | warning | critical (default: ok)
  //   message — Optional context (e.g., "Nightly review starting")
  case 'heartbeat': {
    const hbStatus = args[0] || 'ok';
    const hbMessage = args.slice(1).join(' ') || '';
    const entry = {
      ts: now(),
      type: 'heartbeat',
      status: hbStatus,
    };
    if (hbMessage) entry.message = hbMessage;
    // Heartbeat uses a smaller retention (100 entries) since it fires frequently
    const hbMax = 100;
    const hbFile = LOG_FILES.heartbeat;
    appendLog(hbFile, entry);
    doPruneFile(hbFile, hbMax);
    console.log(JSON.stringify(entry));
    break;
  }

  // ── tail: Read recent log entries ───────────────────────────────────────────
  // Usage: node logger.cjs tail <type> [lines=10]
  case 'tail': {
    const [tailType, tailLines] = args;
    const tailFile = LOG_FILES[tailType] || path.join(LOG_DIR, `${tailType}.ndjson`);
    const count = parseInt(tailLines, 10) || 10;
    const entries = readTail(tailFile, count);
    entries.forEach(e => console.log(e));
    break;
  }

  // ── stats: Display log statistics ───────────────────────────────────────────
  // Usage: node logger.cjs stats
  // Shows entry counts, file sizes, heartbeat freshness for all log files.
  case 'stats': {
    const stats = gatherStats();
    console.log(JSON.stringify(stats, null, 2));
    break;
  }

  // ── prune: Manually trim a log file ────────────────────────────────────────
  // Usage: node logger.cjs prune <type> [max=500]
  // Useful if you want to reduce retention (e.g., "prune agent 200")
  case 'prune': {
    const [pruneType, pruneMax] = args;
    const pruneFilePath = LOG_FILES[pruneType];
    if (!pruneFilePath) {
      console.error(`Unknown log type: ${pruneType}. Valid: ${Object.keys(LOG_FILES).join(', ')}`);
      process.exit(1);
    }
    const max = parseInt(pruneMax, 10) || MAX_ENTRIES;
    const before = fs.existsSync(pruneFilePath)
      ? fs.readFileSync(pruneFilePath, 'utf-8').trim().split('\n').filter(Boolean).length
      : 0;
    doPruneFile(pruneFilePath, max);
    const after = fs.existsSync(pruneFilePath)
      ? fs.readFileSync(pruneFilePath, 'utf-8').trim().split('\n').filter(Boolean).length
      : 0;
    console.log(`Pruned ${pruneType}: ${before} → ${after} entries (max ${max})`);
    break;
  }

  // ── recent-commits: Show recent git history ─────────────────────────────────
  // Usage: node logger.cjs recent-commits [lines=20]
  case 'recent-commits': {
    const maxCommits = parseInt(args[0], 10) || 20;
    const { execSync } = require('child_process');
    try {
      const log = execSync(`git log --oneline -${maxCommits}`, {
        cwd: path.resolve(__dirname, '..', '..'),
        encoding: 'utf-8',
      });
      console.log(log.trim());
    } catch {
      console.error('Failed to get git log — not a git repository or git not available');
    }
    break;
  }

  // ── default: Show help ──────────────────────────────────────────────────────
  default:
    console.log(`
Tony Brand Master — Logger Utility

Commands:
  log <type> <action> <status> [commit] [msg]    Append a log entry
  heartbeat [status] [message]                    Record heartbeat
  tail <type> [lines=10]                          Read recent entries
  stats                                           Show log statistics
  prune <type> [max=500]                          Trim log to N entries
  recent-commits [lines=20]                       Show recent git commits

Log types: ${Object.keys(LOG_FILES).join(', ')}
Max entries per file: ${MAX_ENTRIES} (heartbeat: 100)
Log directory: ${LOG_DIR}
`);
}
