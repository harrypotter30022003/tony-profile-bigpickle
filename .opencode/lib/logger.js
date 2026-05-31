#!/usr/bin/env node
/**
 * Rolling JSON-lines Logger for Tony Brand Master agent.
 *
 * "NoSQL-style" local logging — each line is a JSON object.
 * Auto-prunes to MAX_ENTRIES to prevent unbounded growth.
 * One file per log type: agent-log.ndjson, heartbeat.ndjson, audit.ndjson
 *
 * Usage:
 *   node .opencode/lib/logger.js log <type> <action> <status> [details...]
 *   node .opencode/lib/logger.js heartbeat
 *   node .opencode/lib/logger.js tail <type> [lines=10]
 *   node .opencode/lib/logger.js stats
 *   node .opencode/lib/logger.js prune <type> [max=500]
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const MAX_ENTRIES = 500;       // max lines per log file
const HEARTBEAT_FILE = path.join(LOG_DIR, 'heartbeat.ndjson');
const LOG_FILES = {
  agent: path.join(LOG_DIR, 'agent-log.ndjson'),
  heartbeat: HEARTBEAT_FILE,
  audit: path.join(LOG_DIR, 'audit.ndjson'),
  fix: path.join(LOG_DIR, 'fix-log.ndjson'),
};

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function now() {
  return new Date().toISOString();
}

function appendLog(filePath, entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(filePath, line, 'utf-8');
  // Prune if over limit
  pruneFile(filePath, MAX_ENTRIES);
}

function pruneFile(filePath, maxLines) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length > maxLines) {
      const kept = lines.slice(lines.length - maxLines);
      fs.writeFileSync(filePath, kept.join('\n') + '\n', 'utf-8');
    }
  } catch {
    // File might not exist yet
  }
}

function readTail(filePath, lines) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.trim().split('\n').filter(Boolean);
    return allLines.slice(Math.max(0, allLines.length - lines));
  } catch {
    return [];
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const [, , command, ...args] = process.argv;

switch (command) {
  case 'log': {
    // node logger.js log <type> <action> <status> [commitHash] [message...]
    const [type, action, status, commitHash, ...messageParts] = args;
    if (!type || !action || !status) {
      console.error('Usage: node logger.js log <type> <action> <status> [commitHash] [message]');
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

  case 'heartbeat': {
    // node logger.js heartbeat [status=ok] [message...]
    const hbStatus = args[0] || 'ok';
    const hbMessage = args.slice(1).join(' ') || '';
    const entry = {
      ts: now(),
      type: 'heartbeat',
      status: hbStatus,
    };
    if (hbMessage) entry.message = hbMessage;
    // Heartbeat only keeps last 100 entries
    const hbMax = 100;
    const hbFile = LOG_FILES.heartbeat;
    appendLog(hbFile, entry);
    pruneFile(hbFile, hbMax);
    console.log(JSON.stringify(entry));
    break;
  }

  case 'tail': {
    // node logger.js tail <type> [lines=10]
    const [tailType, tailLines] = args;
    const tailFile = LOG_FILES[tailType] || path.join(LOG_DIR, `${tailType}.ndjson`);
    const count = parseInt(tailLines, 10) || 10;
    const entries = readTail(tailFile, count);
    entries.forEach(e => console.log(e));
    break;
  }

  case 'stats': {
    // node logger.js stats
    const stats = {};
    for (const [key, filePath] of Object.entries(LOG_FILES)) {
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.trim().split('\n').filter(Boolean);
          const lastEntry = lines.length > 0 ? JSON.parse(lines[lines.length - 1]) : null;
          stats[key] = {
            entries: lines.length,
            max: key === 'heartbeat' ? 100 : MAX_ENTRIES,
            lastTs: lastEntry ? lastEntry.ts : null,
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
    // Check heartbeat freshness
    if (stats.heartbeat && stats.heartbeat.lastTs) {
      const ageMs = Date.now() - new Date(stats.heartbeat.lastTs).getTime();
      const ageHours = Math.round(ageMs / 3600000 * 10) / 10;
      stats.heartbeat.ageHours = ageHours;
      stats.heartbeat.isStale = ageHours > 6; // stale if no heartbeat in 6+ hours
    }
    console.log(JSON.stringify(stats, null, 2));
    break;
  }

  case 'prune': {
    // node logger.js prune <type> [max=500]
    const [pruneType, pruneMax] = args;
    const pruneFile = LOG_FILES[pruneType];
    if (!pruneFile) {
      console.error(`Unknown log type: ${pruneType}. Valid: ${Object.keys(LOG_FILES).join(', ')}`);
      process.exit(1);
    }
    const max = parseInt(pruneMax, 10) || MAX_ENTRIES;
    const before = fs.existsSync(pruneFile)
      ? fs.readFileSync(pruneFile, 'utf-8').trim().split('\n').filter(Boolean).length
      : 0;
    pruneFile(pruneFile, max);
    const after = fs.existsSync(pruneFile)
      ? fs.readFileSync(pruneFile, 'utf-8').trim().split('\n').filter(Boolean).length
      : 0;
    console.log(`Pruned ${pruneType}: ${before} → ${after} entries (max ${max})`);
    break;
  }

  case 'recent-commits': {
    // node logger.js recent-commits [lines=20]
    const maxCommits = parseInt(args[0], 10) || 20;
    const { execSync } = require('child_process');
    try {
      const log = execSync(`git log --oneline -${maxCommits}`, {
        cwd: path.resolve(__dirname, '..', '..'),
        encoding: 'utf-8',
      });
      console.log(log.trim());
    } catch {
      console.error('Failed to get git log');
    }
    break;
  }

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
