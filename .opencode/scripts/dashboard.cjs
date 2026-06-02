#!/usr/bin/env node
/**
 * =============================================================================
 * Tony Brand Master — Local Monitoring Dashboard
 * =============================================================================
 *
 * A lightweight HTTP dashboard that shows real-time agent status, recent logs,
 * health checks, and git activity. Designed to run alongside `opencode serve`
 * so you can monitor the agent from your browser.
 *
 * WHAT IT SHOWS:
 *   - Agent status (active/sleeping/stopped) based on heartbeat freshness
 *   - Recent agent actions with timestamps, status, and commit hashes
 *   - Health check results (build, git, logs, site)
 *   - Log file statistics (entry counts, sizes)
 *   - Recent git commits
 *   - Auto-refreshes every 30 seconds
 *
 * USAGE:
 *   node .opencode/scripts/dashboard.cjs              # Start server (port 4097)
 *   node .opencode/scripts/dashboard.cjs --port=8080   # Custom port
 *   node .opencode/scripts/dashboard.cjs --help        # Show help
 *
 * ACCESS:
 *   Open http://localhost:4097 in your browser
 *
 * API ENDPOINTS:
 *   GET /              — Dashboard HTML page
 *   GET /api/status    — Agent status + log statistics (JSON)
 *   GET /api/logs      — Recent log entries (JSON, query: ?type=agent&lines=20)
 *   GET /api/health    — Full health check results (JSON)
 *   GET /api/commits   — Recent git commits (JSON)
 *
 * @module dashboard
 */

// ─── Core Modules ─────────────────────────────────────────────────────────────
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Paths ────────────────────────────────────────────────────────────────────

/** Project root directory */
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

/** Log directory */
const LOG_DIR = path.resolve(PROJECT_ROOT, '.opencode', 'logs');

/** Logger utility path */
const LOGGER_PATH = path.resolve(PROJECT_ROOT, '.opencode', 'lib', 'logger.cjs');

/** Health check script path */
const HEALTH_PATH = path.resolve(PROJECT_ROOT, '.opencode', 'scripts', 'health-check.cjs');

/**
 * Agent crash log path — captures stderr from the agent process.
 * When the agent crashes, its last stderr output is here for investigation.
 * The agent itself can read this file to diagnose why it crashed and fix itself.
 */
const CRASH_LOG_PATH = path.resolve(LOG_DIR, 'agent-crash.log');

/** Previous crash log (rotated before each restart) */
const CRASH_LOG_PREV_PATH = path.resolve(LOG_DIR, 'agent-crash.prev.log');

// ─── Configuration ────────────────────────────────────────────────────────────

/** Parse command-line arguments for port, default to 4097 */
  const PORT = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1], 10) || 4097;

/** Agent server port (opencode serve) */
const AGENT_PORT = 4096;

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Safely executes a shell command and returns its stdout.
 * Returns null if the command fails.
 * @param {string} cmd - Command to execute
 * @param {Object} [opts] - Optional execSync options
 * @returns {string|null} stdout or null on failure
 */
function safeExec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 30000, ...opts }).trim();
  } catch {
    return null;
  }
}

/**
 * Captures error details from the crash log for agent self-investigation.
 *
 * When the agent process crashes, its stderr output is saved to CRASH_LOG_PATH.
 * This function reads the last N lines of that file (plus the previous crash log),
 * plus the last few heartbeat entries before the crash, to build a structured
 * crash report. The agent can then read this report to diagnose and fix itself.
 *
 * Returns { hasCrached, lastStderr, previousStderr, recentHeartbeats, timestamp }
 */
function captureCrashInfo() {
  const info = {
    hasCrashed: false,
    lastStderr: null,
    previousStderr: null,
    recentHeartbeats: [],
    crashLogSizeBytes: 0,
    timestamp: new Date().toISOString(),
  };

  // Read last 20 lines of current crash log
  try {
    if (fs.existsSync(CRASH_LOG_PATH)) {
      const content = fs.readFileSync(CRASH_LOG_PATH, 'utf-8');
      info.crashLogSizeBytes = Buffer.byteLength(content, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      info.lastStderr = lines.slice(-20).join('\n');
      info.hasCrashed = lines.length > 0;
    }
  } catch {}

  // Read last 10 lines of previous crash log (from before last rotation)
  try {
    if (fs.existsSync(CRASH_LOG_PREV_PATH)) {
      const content = fs.readFileSync(CRASH_LOG_PREV_PATH, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      info.previousStderr = lines.slice(-10).join('\n');
    }
  } catch {}

  // Read last 5 heartbeat entries for context before crash
  try {
    const hbPath = path.join(LOG_DIR, 'heartbeat.ndjson');
    if (fs.existsSync(hbPath)) {
      const content = fs.readFileSync(hbPath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      info.recentHeartbeats = lines
        .slice(-5)
        .map(l => {
          try { return JSON.parse(l); } catch { return null; }
        })
        .filter(Boolean);
    }
  } catch {}

  return info;
}

/**
 * Checks if a TCP port is in use on localhost.
 * Returns true if something is listening on that port.
 * Used to detect if opencode serve (port 4096) is actually running.
 * This is more reliable than checking process names across different OSes.
 */
function isPortInUse(port) {
  try {
    // netstat output examples:
    //   TCP    127.0.0.1:4096         0.0.0.0:0              LISTENING       12345
    //   TCP    [::1]:4096             [::1]:0                LISTENING       12345
    // We use findstr (cmd.exe compatible) instead of Select-String (PowerShell only)
    // because safeExec runs through cmd.exe /c.
    const result = safeExec(`netstat -ano | findstr /R /C:":${port} .*LISTENING"`, { timeout: 10000 });
    if (result === null || result.length === 0) {
      // Try IPv6 variant: netstat shows "[::1]:4096" for IPv6 localhost
      const result6 = safeExec(`netstat -ano | findstr /R /C:"\\[::1\\]:${port} .*LISTENING"`, { timeout: 10000 });
      return result6 !== null && result6.length > 0;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Agent restart retry state. Tracks retry attempts with exponential backoff
 * so we don't hammer the system if the agent keeps crashing.
 * Resets to 0 when the agent is confirmed running.
 */
let agentRestartRetries = 0;

/**
 * Attempts to restart the opencode serve agent process.
 *
 * IMPROVEMENTS over v1:
 *   1. Captures stderr output to a crash log file for agent self-investigation
 *   2. Rotates the crash log before each restart so we always have the last crash
 *   3. Logs crash details (stderr, heartbeat context) in the fix-log entry
 *   4. Uses direct spawn (not cmd.exe /c start /B) for better error capture
 *   5. Includes retry count + exponential backoff in the log entry
 *   6. Returns crash info so the dashboard can display it
 *
 * Returns {success: bool, message: string, crashInfo?: object}
 */
function restartAgent() {
  try {
    // First check if it's already running
    if (isPortInUse(AGENT_PORT)) {
      agentRestartRetries = 0; // reset retry count since it's running
      return { success: true, message: `Agent already running on port ${AGENT_PORT}` };
    }

    // ── Capture crash info before restarting ────────────────────────────────
    // This is the error/issue data the agent can use to investigate and fix itself.
    const crashInfo = captureCrashInfo();

    // ── Rotate crash log ────────────────────────────────────────────────────
    // Rename current crash log to .prev so we have a record of the last crash.
    // The new process will write fresh stderr to the crash log.
    try {
      if (fs.existsSync(CRASH_LOG_PATH)) {
        if (fs.existsSync(CRASH_LOG_PREV_PATH)) fs.unlinkSync(CRASH_LOG_PREV_PATH);
        fs.renameSync(CRASH_LOG_PATH, CRASH_LOG_PREV_PATH);
      }
    } catch {}

    // Ensure log directory exists
    try { if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}

    // ── Start opencode serve with stderr → crash log ────────────────────────
    // We spawn opencode via cmd.exe (needed for .cmd batch files on Windows)
    // and pipe stderr to the crash log file for agent self-investigation.
    //
    // IMPORTANT: We do NOT use `detached: true` because on Windows, detached
    // + pipe causes EINVAL. The dashboard is a 24/7 persistent process, so the
    // child agent process stays alive naturally as long as the dashboard runs.
    // If the dashboard ever restarts, it will re-spawn the agent immediately
    // via the fast health check loop (every 10s).
    const { spawn } = require('child_process');
    const crashStream = fs.createWriteStream(CRASH_LOG_PATH, { flags: 'a' });
    const child = spawn('cmd.exe', ['/c', 'opencode.cmd', 'serve', `--port=${AGENT_PORT}`, '--hostname=127.0.0.1'], {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });
    child.stderr.pipe(crashStream);
    child.on('error', (err) => {
      try {
        crashStream.write(`[dashboard] spawn error: ${err.message}\n`);
      } catch {}
    });
    child.on('exit', (code, signal) => {
      try {
        crashStream.write(`[dashboard] agent exited code=${code} signal=${signal}\n`);
        // If agent exited unexpectedly, log to fix-log for agent investigation
        const fixLog = path.join(LOG_DIR, 'fix-log.ndjson');
        fs.appendFileSync(fixLog, JSON.stringify({
          ts: new Date().toISOString(),
          type: 'fix',
          action: 'fix:agent-exited',
          status: 'warning',
          message: `Agent process exited (code=${code}, signal=${signal}). Check crash log for details.`,
          exitCode: code,
          exitSignal: signal,
        }) + '\n', 'utf-8');
      } catch {}
      try { crashStream.end(); } catch {}
    });

    // ── Wait and verify it started (up to 15s) ──────────────────────────────
    const maxWait = 15;
    for (let i = 0; i < maxWait; i++) {
      try {
        const { execSync } = require('child_process');
        execSync('ping -n 2 127.0.0.1 > nul', { timeout: 2000 });
      } catch {}
      if (isPortInUse(AGENT_PORT)) {
        // Success! Reset retry count and log the restart with crash details
        agentRestartRetries = 0;

        // Build a detailed log entry with crash context for agent investigation
        const logEntry = {
          ts: new Date().toISOString(),
          type: 'fix',
          action: 'fix:agent-restart',
          status: 'ok',
          message: 'Agent process was down — auto-restarted successfully',
          retryCount: agentRestartRetries,
          crashLogLines: crashInfo.lastStderr
            ? crashInfo.lastStderr.split('\n').length + ' lines'
            : 'none',
          heartbeatsBeforeCrash: crashInfo.recentHeartbeats.length,
          crashLogSizeBytes: crashInfo.crashLogSizeBytes,
        };

        // Write the fix-log entry
        try {
          const fixLog = path.join(LOG_DIR, 'fix-log.ndjson');
          fs.appendFileSync(fixLog, JSON.stringify(logEntry) + '\n', 'utf-8');
        } catch {}

        // Also write a heartbeat so the dashboard shows active immediately
        try {
          const hbFile = path.join(LOG_DIR, 'heartbeat.ndjson');
          const hbEntry = JSON.stringify({
            ts: new Date().toISOString(),
            type: 'heartbeat',
            status: 'ok',
            message: 'Agent restarted by dashboard self-healing (retry #' + agentRestartRetries + ')',
          }) + '\n';
          fs.appendFileSync(hbFile, hbEntry, 'utf-8');
        } catch {}

        return { success: true, message: 'Agent restarted successfully', crashInfo };
      }
    }

    // ── Timed out — increment retry count, log failure ─────────────────────
    agentRestartRetries++;
    const backoffMin = Math.min(Math.pow(2, agentRestartRetries), 30); // exponential backoff capped at 30 min

    try {
      const fixLog = path.join(LOG_DIR, 'fix-log.ndjson');
      fs.appendFileSync(fixLog, JSON.stringify({
        ts: new Date().toISOString(),
        type: 'fix',
        action: 'fix:agent-restart',
        status: 'warning',
        message: `Agent restart timed out (retry #${agentRestartRetries}, next in ${backoffMin}m)`,
        retryCount: agentRestartRetries,
        crashLogLines: crashInfo.lastStderr
          ? crashInfo.lastStderr.split('\n').length + ' lines'
          : 'none',
        heartbeatsBeforeCrash: crashInfo.recentHeartbeats.length,
        lastStderrSnippet: crashInfo.lastStderr
          ? crashInfo.lastStderr.substring(0, 500) // first 500 chars of error
          : null,
      }) + '\n', 'utf-8');
    } catch {}

    return {
      success: false,
      message: `Agent restart timed out (retry #${agentRestartRetries}, next in ${backoffMin}m)`,
      crashInfo,
    };
  } catch (e) {
    const errorMsg = `Failed to restart agent: ${e.message}`;
    try {
      const fixLog = path.join(LOG_DIR, 'fix-log.ndjson');
      fs.appendFileSync(fixLog, JSON.stringify({
        ts: new Date().toISOString(),
        type: 'fix',
        action: 'fix:agent-restart',
        status: 'error',
        message: errorMsg,
        stack: e.stack ? e.stack.substring(0, 500) : null,
      }) + '\n', 'utf-8');
    } catch {}
    return { success: false, message: errorMsg };
  }
}

/**
 * Reads an ndjson log file and returns parsed entries.
 * @param {string} filePath - Path to .ndjson file
 * @param {number} [lines=20] - Number of recent entries to read
 * @returns {Array} Array of parsed log entry objects
 */
function readLogFile(filePath, lines = 20) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const allLines = content.trim().split('\n').filter(Boolean);
    const selected = allLines.slice(Math.max(0, allLines.length - lines));
    return selected.map(line => {
      try { return JSON.parse(line); } catch { return { raw: line }; }
    });
  } catch {
    return [];
  }
}

// ─── API Handlers ─────────────────────────────────────────────────────────────

/**
 * Handler for /api/status — returns agent status with actual process detection.
 *
 * Uses TWO data points to determine true state:
 *   1. Process check: is opencode serve actually running on port 4096?
 *   2. Heartbeat check: has the agent logged activity recently?
 *
 * Combined states:
 *   active    → process running + heartbeat < 1h  (agent is working now)
 *   idle      → process running + heartbeat > 1h  (waiting for next scheduled task)
 *   stopped   → process NOT running               (agent needs restart)
 *
 * Also includes auto-restart info if a previous restart was attempted.
 */
function handleStatus() {
  // ── Check 1: Is the actual agent process running? ─────────────────────────
  const processRunning = isPortInUse(AGENT_PORT);

  // ── Check 2: Read heartbeat freshness ────────────────────────────────────
  const heartbeats = readLogFile(path.join(LOG_DIR, 'heartbeat.ndjson'), 1);
  let heartbeatAge = null;
  let lastHeartbeat = null;
  let lastHeartbeatMessage = '';

  if (heartbeats.length > 0) {
    const hb = heartbeats[heartbeats.length - 1];
    lastHeartbeat = hb.ts;
    lastHeartbeatMessage = hb.message || '';
    heartbeatAge = (Date.now() - new Date(hb.ts).getTime()) / 3600000;
  }

  // ── Determine true agent state ───────────────────────────────────────────
  let agentState = 'stopped';
  let stateReason = '';

  if (!processRunning) {
    agentState = 'stopped';
    stateReason = 'Agent process is not running on port ' + AGENT_PORT;
  } else if (heartbeatAge !== null && heartbeatAge < 1) {
    agentState = 'active';
    stateReason = 'Process running + heartbeat ' + Math.round(heartbeatAge * 10) / 10 + 'h ago';
  } else {
    agentState = 'idle';
    stateReason = 'Process running, waiting for next scheduled task';
    if (heartbeatAge !== null) {
      stateReason += ' (last heartbeat ' + Math.round(heartbeatAge * 10) / 10 + 'h ago)';
    }
  }

  // ── Check for previous restart attempts in fix log ────────────────────────
  const fixEntries = readLogFile(path.join(LOG_DIR, 'fix-log.ndjson'), 20);
  const lastRestart = fixEntries
    .filter(e => e.action === 'fix:agent-restart')
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 1)
    .map(e => ({ ts: e.ts, message: e.message }));

  // ── Get log file stats ───────────────────────────────────────────────────
  const logTypes = ['agent-log.ndjson', 'heartbeat.ndjson', 'audit.ndjson', 'fix-log.ndjson'];
  const logStats = {};
  for (const file of logTypes) {
    const filePath = path.join(LOG_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entries = content.trim().split('\n').filter(Boolean).length;
      logStats[file.replace('.ndjson', '')] = { entries, sizeBytes: Buffer.byteLength(content, 'utf-8') };
    } else {
      logStats[file.replace('.ndjson', '')] = { entries: 0, sizeBytes: 0 };
    }
  }

  // ── Crash info (for agent self-investigation) ────────────────────────────
  const crashInfo = captureCrashInfo();

  // ── Get git info ─────────────────────────────────────────────────────────
  const lastCommit = safeExec('git log -1 --oneline', { cwd: PROJECT_ROOT });

  return JSON.stringify({
    agent: {
      state: agentState,
      stateReason,
      processRunning,
      lastHeartbeat,
      lastMessage: lastHeartbeatMessage,
      heartbeatAgeHours: heartbeatAge !== null ? Math.round(heartbeatAge * 10) / 10 : null,
      lastRestartAttempt: lastRestart.length > 0 ? lastRestart[0] : null,
      restartRetryCount: agentRestartRetries,
      hasCrashLog: crashInfo.hasCrashed,
      crashLogSizeBytes: crashInfo.crashLogSizeBytes,
      crashLogSnippet: crashInfo.hasCrashed
        ? (crashInfo.lastStderr || '').substring(0, 300) // preview in status
        : null,
      recentHeartbeatsBeforeCrash: crashInfo.recentHeartbeats.length,
    },
    logs: logStats,
    git: {
      lastCommit: lastCommit || 'N/A',
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler for /api/agent/restart — attempts to restart the agent process.
 * Returns crash info so the dashboard can display what went wrong.
 */
function handleAgentRestart() {
  const result = restartAgent();
  return JSON.stringify({
    ...result,
    retryCount: agentRestartRetries,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler for /api/agent/crash-report — returns the crash log for agent
 * self-investigation. The agent can read this to diagnose why it crashed
 * and implement a fix.
 */
function handleCrashReport() {
  const crashInfo = captureCrashInfo();

  // Try to read the .prev log too for full picture
  let prevContent = null;
  try {
    if (fs.existsSync(CRASH_LOG_PREV_PATH)) {
      prevContent = fs.readFileSync(CRASH_LOG_PREV_PATH, 'utf-8');
    }
  } catch {}

  return JSON.stringify({
    ...crashInfo,
    previousCrashLog: prevContent ? prevContent.substring(0, 2000) : null,
    retryCount: agentRestartRetries,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler for /api/logs — returns recent log entries.
 * Query params: type (agent|heartbeat|audit|fix), lines (default 20)
 */
function handleLogs(url) {
  const params = new URL(url, 'http://localhost').searchParams;
  const type = params.get('type') || 'agent';
  const lines = parseInt(params.get('lines'), 10) || 20;
  const filePath = path.join(LOG_DIR, `${type}-log.ndjson`);
  const entries = readLogFile(filePath, lines);
  return JSON.stringify({ type, entries, count: entries.length, timestamp: new Date().toISOString() });
}

/**
 * Handler for /api/health — runs the full health check script.
 * Returns the health check JSON output.
 */
function handleHealth() {
  try {
    const output = execSync(`node "${HEALTH_PATH}"`, { encoding: 'utf-8', timeout: 120000 });
    // The health check outputs JSON — extract it from the last JSON object
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    return JSON.stringify({ status: 'error', detail: 'Could not parse health check output' });
  } catch (e) {
    return JSON.stringify({ status: 'error', detail: e.message });
  }
}

/**
 * Handler for /api/commits — returns recent git commits.
 * Query params: lines (default 10)
 */
function handleCommits(url) {
  const params = new URL(url, 'http://localhost').searchParams;
  const lines = parseInt(params.get('lines'), 10) || 10;
  const log = safeExec(`git log --oneline -${lines}`, { cwd: PROJECT_ROOT });
  const commits = log ? log.split('\n').map(line => {
    const [hash, ...msg] = line.split(' ');
    return { hash, message: msg.join(' ') };
  }) : [];
  return JSON.stringify({ commits, count: commits.length, timestamp: new Date().toISOString() });
}

/**
 * Handler for /api/summary — returns human-readable activity summary.
 *
 * Analyzes agent-log.ndjson and groups entries by day to show:
 *   - Daily activity summaries (nightly review passed/fixed, content published, fixes)
 *   - Content status (article count, last publish date)
 *   - Improvement counts (last 7 days, last 30 days)
 *   - Recent improvements list with descriptions
 */
function handleSummary() {
  // ── Read all log entries (agent + fix + audit) ─────────────────────────────
  const agentLogPath = path.join(LOG_DIR, 'agent-log.ndjson');
  const fixLogPath = path.join(LOG_DIR, 'fix-log.ndjson');
  const auditLogPath = path.join(LOG_DIR, 'audit.ndjson');
  const allEntries = [
    ...readLogFile(agentLogPath, 500),
    ...readLogFile(fixLogPath, 200),
    ...readLogFile(auditLogPath, 100),
  ];

  // ── Group entries by date ──────────────────────────────────────────────────
  const byDay = {};
  for (const entry of allEntries) {
    if (!entry.ts) continue;
    const day = entry.ts.substring(0, 10); // "2026-05-31"
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(entry);
  }

  // ── Build daily summaries (last 14 days) ──────────────────────────────────
  const days = Object.keys(byDay).sort().reverse().slice(0, 14);
  const dailySummaries = days.map(day => {
    const entries = byDay[day];
    const summary = { date: day, actions: [], hasIssues: false };
    let hasReview = false, hasContent = false, hasFixes = false, hasAudit = false;

    for (const e of entries) {
      if (e.action === 'nightly-review') {
        hasReview = true;
        if (e.status === 'ok') {
          summary.reviewStatus = 'passed';
          summary.reviewDetail = e.message || 'No issues found';
        } else if (e.status === 'warning') {
          summary.reviewStatus = 'warnings';
          summary.reviewDetail = e.message || 'Issues found and fixed';
          summary.hasIssues = true;
        } else {
          summary.reviewStatus = 'failed';
          summary.reviewDetail = e.message || 'Review had errors';
          summary.hasIssues = true;
        }
      }
      if (e.action === 'weekly-content') {
        hasContent = true;
        summary.contentMessage = e.message || 'Content published';
        if (e.commit) summary.contentCommit = e.commit;
      }
      if (e.action && (e.action.startsWith('fix:') || e.type === 'fix')) {
        hasFixes = true;
        if (!summary.fixes) summary.fixes = [];
        summary.fixes.push({ message: e.message || e.action, commit: e.commit });
      }
      if (e.action === 'monthly-seo') {
        hasAudit = true;
        summary.auditStatus = e.status;
        summary.auditMessage = e.message || 'Monthly audit completed';
      }
      // Also count "content:" prefix actions (from weekly-content creating articles)
      if (e.action && e.action.startsWith('content:')) {
        hasContent = true;
        summary.contentMessage = e.message || e.action;
      }
    }

    // Build action list for this day
    const actions = [];
    if (hasReview) actions.push(summary.reviewStatus === 'passed' ? '✅ Nightly review passed' :
      summary.reviewStatus === 'warnings' ? '⚠️ Nightly review: issues fixed' : '❌ Nightly review failed');
    if (hasContent) actions.push('📝 ' + (summary.contentMessage || 'Content created'));
    if (hasFixes) actions.push('🛠️ ' + (summary.fixes ? summary.fixes.length + ' fix(es) applied' : 'Fixes applied'));
    if (hasAudit) actions.push('📊 Monthly SEO audit completed');
    if (actions.length === 0) actions.push('💤 Monitoring only — no issues detected');
    summary.actions = actions;
    summary.actionCount = entries.length;

    return summary;
  });

  // ── Improvements count (last 7 and 30 days) ───────────────────────────────
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  let fixes7d = 0, fixes30d = 0;
  let content7d = 0, content30d = 0;
  let reviews7d = 0, reviews30d = 0;

  for (const entry of allEntries) {
    if (!entry.ts) continue;
    const entryTime = new Date(entry.ts).getTime();
    const age = now - entryTime;

    if (entry.type === 'fix' || (entry.action && entry.action.startsWith('fix'))) {
      if (age < SEVEN_DAYS) fixes7d++;
      if (age < THIRTY_DAYS) fixes30d++;
    }
    if (entry.action === 'weekly-content') {
      if (age < SEVEN_DAYS) content7d++;
      if (age < THIRTY_DAYS) content30d++;
    }
    if (entry.action === 'nightly-review') {
      if (age < SEVEN_DAYS) reviews7d++;
      if (age < THIRTY_DAYS) reviews30d++;
    }
  }

  // ── Content status (read article count from blog data) ─────────────────────
  let articleCount = 0;
  let lastArticleDate = null;
  try {
    const dataPath = path.resolve(PROJECT_ROOT, 'src', 'admin', 'data.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(raw);
      if (data.blog && Array.isArray(data.blog)) {
        articleCount = data.blog.length;
        // Find most recent article date
        const dates = data.blog
          .map(a => a.date || a.publishedAt || a.createdAt)
          .filter(Boolean)
          .sort()
          .reverse();
        if (dates.length > 0) lastArticleDate = dates[0];
      }
    }
  } catch {
    // Blog data might not exist locally
  }

  // If we couldn't get from blog JSON, try from git log for content commits
  if (articleCount === 0) {
    const contentCommits = safeExec('git log --oneline --grep="content:" -5', { cwd: PROJECT_ROOT });
    if (contentCommits) {
      articleCount = contentCommits.split('\n').length;
    }
  }

  // ── Compute freshness score ────────────────────────────────────────────────
  let freshnessScore = 'unknown';
  let freshnessLabel = 'No data';
  if (lastArticleDate) {
    const lastPub = new Date(lastArticleDate).getTime();
    const daysSince = Math.floor((now - lastPub) / (24 * 60 * 60 * 1000));
    if (daysSince <= 14) { freshnessScore = 'fresh'; freshnessLabel = `📅 ${daysSince} day(s) ago — looking good`; }
    else if (daysSince <= 30) { freshnessScore = 'stale'; freshnessLabel = `⚠️ ${daysSince} day(s) ago — could use a new post`; }
    else { freshnessScore = 'critical'; freshnessLabel = `🔴 ${daysSince} day(s) ago — needs content ASAP`; }
  }

  // ── Recent improvements list (from combined entries) ──────────────────────
  const recentImprovements = allEntries
    .filter(e => e.type === 'fix' || (e.action && e.action.startsWith('fix:')))
    .sort((a, b) => {
      const ta = a.ts ? new Date(a.ts).getTime() : 0;
      const tb = b.ts ? new Date(b.ts).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 10)
    .map(e => ({
      ts: e.ts,
      message: e.message || e.action || 'Fix applied',
      commit: e.commit || null,
    }));

  return JSON.stringify({
    daily: dailySummaries,
    improvements: {
      last7days: { fixes: fixes7d, content: content7d, reviews: reviews7d },
      last30days: { fixes: fixes30d, content: content30d, reviews: reviews30d },
      recent: recentImprovements,
    },
    content: {
      articleCount,
      lastArticleDate,
      freshnessScore,
      freshnessLabel,
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Returns the complete HTML dashboard page.
 */
function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tony Brand Master — Agent Dashboard</title>
<style>
  :root {
    --bg: #0d1117;
    --card: #161b22;
    --border: #30363d;
    --text: #e6edf3;
    --muted: #8b949e;
    --green: #3fb950;
    --yellow: #d29922;
    --red: #f85149;
    --blue: #58a6ff;
    --purple: #bc8cff;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    padding: 20px;
    line-height: 1.5;
  }
  .header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 24px; padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }
  .header h1 { font-size: 1.5rem; display: flex; align-items: center; gap: 10px; }
  .header .subtitle { color: var(--muted); font-size: 0.85rem; }
  .status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;
  }
  .status-active { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid var(--green); }
  .status-sleeping { background: rgba(210,153,34,0.15); color: var(--yellow); border: 1px solid var(--yellow); }
  .status-stopped { background: rgba(248,81,73,0.15); color: var(--red); border: 1px solid var(--red); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .card {
    background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px;
  }
  .card h3 {
    font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--muted); margin-bottom: 12px;
  }
  .card-full { grid-column: 1 / -1; }
  .stat-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
  .stat-row .label { color: var(--muted); }
  .stat-row .value { font-weight: 600; }
  .log-entry {
    padding: 8px 12px; margin-bottom: 4px; border-radius: 4px;
    font-family: 'SF Mono', Consolas, monospace; font-size: 0.8rem;
    background: rgba(255,255,255,0.03); border-left: 3px solid var(--border);
  }
  .log-entry:hover { background: rgba(255,255,255,0.06); }
  .log-entry .ts { color: var(--muted); margin-right: 8px; }
  .log-entry .status-ok { color: var(--green); }
  .log-entry .status-failed, .log-entry .status-critical { color: var(--red); }
  .log-entry .status-warning { color: var(--yellow); }
  .log-entry .commit-hash { color: var(--blue); font-size: 0.75rem; }
  .log-entry .msg { color: var(--text); }
  .health-ok { color: var(--green); }
  .health-warning { color: var(--yellow); }
  .health-critical { color: var(--red); }
  .health-score { font-size: 2rem; font-weight: 700; text-align: center; }
  .timestamp { color: var(--muted); font-size: 0.75rem; margin-top: 8px; }
  .refresh-note {
    text-align: center; color: var(--muted); font-size: 0.75rem; margin-top: 20px;
    padding: 12px; border-top: 1px solid var(--border);
  }
  .check-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
  .check-item .check-name { color: var(--text); }
  .check-item .check-result { font-size: 0.85rem; }
  .log-filters { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .log-filters button {
    padding: 4px 12px; border: 1px solid var(--border); border-radius: 12px;
    background: transparent; color: var(--muted); cursor: pointer; font-size: 0.8rem;
  }
  .log-filters button.active { background: var(--blue); color: #fff; border-color: var(--blue); }
  .commit-list { font-family: 'SF Mono', Consolas, monospace; font-size: 0.8rem; }
  .commit-list .commit { padding: 4px 0; }
  .commit-list .hash { color: var(--blue); margin-right: 8px; }

  /* ── Activity Summary ─────────────────────────────────────────────────── */
  .summary-day {
    background: rgba(255,255,255,0.02); border-radius: 6px; padding: 10px 14px; margin-bottom: 8px;
    border-left: 3px solid var(--border);
  }
  .summary-day.passed { border-left-color: var(--green); }
  .summary-day.issues { border-left-color: var(--yellow); }
  .summary-day.failed { border-left-color: var(--red); }
  .summary-day .day-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.85rem; margin-bottom: 6px;
  }
  .summary-day .day-date { font-weight: 600; color: var(--text); }
  .summary-day .day-actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .summary-day .day-action {
    font-size: 0.78rem; padding: 2px 8px; border-radius: 10px;
    background: rgba(255,255,255,0.04); color: var(--muted);
  }
  .summary-day .day-action.fix { color: var(--yellow); }
  .summary-day .day-action.content { color: var(--blue); }
  .summary-day .day-action.review-ok { color: var(--green); }
  .summary-day .day-action.review-issue { color: var(--yellow); }
  .summary-day .day-detail { font-size: 0.78rem; color: var(--muted); margin-top: 4px; }

  /* ── Content Status ────────────────────────────────────────────────────── */
  .content-fresh { color: var(--green); }
  .content-stale { color: var(--yellow); }
  .content-critical { color: var(--red); }

  /* ── Improvements List ─────────────────────────────────────────────────── */
  .improvement-item {
    padding: 6px 10px; margin-bottom: 3px; border-radius: 4px; font-size: 0.8rem;
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(255,255,255,0.02);
  }
  .improvement-item:hover { background: rgba(255,255,255,0.05); }
  .improvement-item .imp-msg { color: var(--text); }
  .improvement-item .imp-ts { color: var(--muted); font-size: 0.72rem; }
  .improvement-item .imp-commit { color: var(--blue); font-size: 0.72rem; font-family: monospace; }
  .imp-counter {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 10px; border-radius: 10px; font-size: 0.78rem; font-weight: 600;
  }
  .imp-counter.fixes { background: rgba(210,153,34,0.15); color: var(--yellow); }
  .imp-counter.content { background: rgba(88,166,255,0.15); color: var(--blue); }
  .imp-counter.reviews { background: rgba(63,185,80,0.15); color: var(--green); }
  .empty-state { color: var(--muted); font-size: 0.85rem; text-align: center; padding: 20px; }

  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>🤖 Tony Brand Master</h1>
    <div class="subtitle">Local Agent Dashboard — auto-refreshes every 30s</div>
  </div>
  <div>
    <div style="display:flex;gap:10px;align-items:center;">
      <span id="agentStateBadge" class="status-badge status-stopped">⏳ Loading...</span>
      <button id="restartBtn" onclick="restartAgent()" style="display:none;padding:6px 14px;border-radius:20px;font-size:0.8rem;background:rgba(248,81,73,0.15);color:var(--red);border:1px solid var(--red);cursor:pointer;">🔄 Restart Agent</button>
    </div>
  </div>
</div>

<!-- Activity Summary (top section, before grid) -->
<div class="card" style="margin-bottom:20px;">
  <h3>📋 Activity Summary <span style="font-weight:400;color:var(--muted);font-size:0.75rem;">— last 14 days</span></h3>
  <div id="activitySummary"><div class="empty-state">Loading...</div></div>
  <div class="timestamp" id="summaryTimestamp"></div>
</div>

<div class="grid">
  <!-- Agent Status Card -->
  <div class="card">
    <h3>🤖 Agent Status</h3>
    <div class="stat-row"><span class="label">Process</span><span class="value" id="agentProcess">—</span></div>
    <div class="stat-row"><span class="label">State</span><span class="value" id="agentState">—</span></div>
    <div class="stat-row"><span class="label">Last Heartbeat</span><span class="value" id="lastHeartbeat">—</span></div>
    <div class="stat-row"><span class="label">Last Message</span><span class="value" id="lastMessage" style="font-size:0.8rem;word-break:break-word;text-align:right;max-width:60%">—</span></div>
    <div class="stat-row"><span class="label">Last Commit</span><span class="value" id="lastCommit" style="font-size:0.8rem;font-family:monospace">—</span></div>
    <div class="stat-row"><span class="label">Restart Retries</span><span class="value" id="restartRetries" style="font-size:0.8rem;">—</span></div>
    <div class="stat-row" id="crashLogRow" style="display:none;">
      <span class="label">Recent Crash Log</span>
      <span class="value" style="font-size:0.72rem;max-width:65%;text-align:right;word-break:break-all;">
        <pre id="crashLogSnippet" style="background:rgba(248,81,73,0.08);border-radius:4px;padding:4px 6px;margin:0;white-space:pre-wrap;font-size:0.7rem;color:var(--red);max-height:80px;overflow-y:auto;"></pre>
        <a href="/api/agent/crash-report" target="_blank" style="color:var(--blue);font-size:0.7rem;">📄 Full crash report</a>
      </span>
    </div>
    <div id="restartStatus" style="margin-top:8px;"></div>
  </div>

  <!-- Content Status Card -->
  <div class="card">
    <h3>📄 Content Status</h3>
    <div class="stat-row"><span class="label">Total Articles</span><span class="value" id="articleCount">—</span></div>
    <div class="stat-row"><span class="label">Last Published</span><span class="value" id="lastArticleDate">—</span></div>
    <div class="stat-row"><span class="label">Freshness</span><span class="value" id="contentFreshness">—</span></div>
    <div class="stat-row" style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
      <span class="label">Improvements (7d / 30d)</span>
      <span class="value" id="improvementCounts" style="font-size:0.78rem;">—</span>
    </div>
  </div>

  <!-- Auto-Improvements Card (left column) -->
  <div class="card">
    <h3>🛠️ Auto-Improvements <span style="font-weight:400;color:var(--muted);font-size:0.75rem;">— recent fixes & changes</span></h3>
    <div id="recentImprovements"><div class="empty-state">Loading...</div></div>
  </div>

  <!-- Log Stats Card (right column) -->
  <div class="card">
    <h3>📊 Log Storage</h3>
    <div class="stat-row"><span class="label">Agent Log</span><span class="value" id="logStats-agent">—</span></div>
    <div class="stat-row"><span class="label">Heartbeat</span><span class="value" id="logStats-heartbeat">—</span></div>
    <div class="stat-row"><span class="label">Audit</span><span class="value" id="logStats-audit">—</span></div>
    <div class="stat-row"><span class="label">Fixes</span><span class="value" id="logStats-fix">—</span></div>
    <div class="timestamp" id="statusTimestamp"></div>
  </div>

  <!-- Health Check Card -->
  <div class="card card-full">
    <h3>🩺 Health Check <span style="font-weight:400;color:var(--muted);font-size:0.75rem;">(runtime & site)</span></h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <div class="health-score" id="healthScore">—</div>
        <div style="text-align:center;color:var(--muted);font-size:0.85rem;" id="healthStatus">—</div>
      </div>
      <div>
        <div id="healthChecks"></div>
      </div>
    </div>
    <div class="timestamp" id="healthTimestamp"></div>
  </div>

  <!-- Recent Actions Card -->
  <div class="card card-full">
    <h3>📝 Recent Agent Actions</h3>
    <div class="log-filters">
      <button class="active" data-type="agent">Agent</button>
      <button data-type="heartbeat">Heartbeats</button>
      <button data-type="fix">Fixes</button>
      <button data-type="audit">Audits</button>
    </div>
    <div id="logEntries">Loading...</div>
  </div>

  <!-- Recent Commits Card -->
  <div class="card card-full">
    <h3>📦 Recent Git Commits</h3>
    <div class="commit-list" id="commitList">Loading...</div>
  </div>
</div>

<div class="refresh-note">
  🔄 Auto-refreshes every 30 seconds · Last refreshed: <span id="lastRefresh">—</span>
  · <a href="javascript:void(0)" onclick="refreshAll()" style="color:var(--blue);text-decoration:underline;">Refresh now</a>
</div>

<script>
  let currentLogType = 'agent';

  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch {
      return null;
    }
  }

  let agentProcessWasDown = false; // track previous state to avoid repeated restarts

  async function refreshStatus() {
    const data = await fetchJSON('/api/status');
    if (!data) return;

    // Agent process (actual running check)
    const procRunning = data.agent.processRunning;
    const procEl = document.getElementById('agentProcess');
    procEl.textContent = procRunning ? '✅ Running (port ' + 4096 + ')' : '❌ Not running';
    procEl.style.color = procRunning ? 'var(--green)' : 'var(--red)';

    // Agent state (combined process + heartbeat)
    const state = data.agent.state;
    const badge = document.getElementById('agentStateBadge');
    const stateLabels = { active: '🟢 Active', idle: '🟡 Idle', stopped: '🔴 Stopped' };
    badge.textContent = stateLabels[state] || '🔴 Unknown';
    badge.className = 'status-badge status-' + (state === 'active' ? 'active' : state === 'idle' ? 'sleeping' : 'stopped');

    document.getElementById('agentState').textContent = (state.charAt(0).toUpperCase() + state.slice(1)) +
      (data.agent.stateReason ? ' — ' + data.agent.stateReason : '');
    document.getElementById('lastHeartbeat').textContent = data.agent.lastHeartbeat
      ? new Date(data.agent.lastHeartbeat).toLocaleString() : 'Never';
    document.getElementById('lastMessage').textContent = data.agent.lastMessage || '—';
    document.getElementById('lastCommit').textContent = data.git.lastCommit || '—';

    // Restart retry count
    document.getElementById('restartRetries').textContent =
      '#' + (data.agent.restartRetryCount || 0);

    // Crash log section
    const crashRow = document.getElementById('crashLogRow');
    const crashSnippet = document.getElementById('crashLogSnippet');
    if (data.agent.hasCrashLog && data.agent.crashLogSnippet) {
      crashRow.style.display = '';
      crashSnippet.textContent = data.agent.crashLogSnippet;
      if (data.agent.crashLogSizeBytes) {
        crashSnippet.title = 'Crash log size: ' + (data.agent.crashLogSizeBytes / 1024).toFixed(1) + ' KB';
      }
    } else {
      crashRow.style.display = 'none';
    }

    // Restart button visibility + auto-restart
    const restartBtn = document.getElementById('restartBtn');
    const restartStatus = document.getElementById('restartStatus');

    if (!procRunning) {
      restartBtn.style.display = 'inline-flex';

      // Show last restart attempt info
      if (data.agent.lastRestartAttempt) {
        const rts = new Date(data.agent.lastRestartAttempt.ts).toLocaleString();
        restartStatus.innerHTML = '<div style="font-size:0.78rem;color:var(--yellow);margin-top:4px;">⚠️ Last restart: ' + rts +
          '<br>' + (data.agent.lastRestartAttempt.message || '') + '</div>';
      }

      // Auto-restart ONCE per detection cycle if we just detected it went down
      // This avoids infinite restart loops: we only restart once when transitioning
      // from "was running" -> "now stopped". After restart, if it goes down again,
      // the flag resets when it comes back up, allowing another restart.
      if (!agentProcessWasDown) {
        agentProcessWasDown = true;
        restartStatus.innerHTML += '<div style="font-size:0.78rem;color:var(--yellow);">🔄 Auto-restarting agent...</div>';
        await doRestartAgent();
      }
    } else {
      restartBtn.style.display = 'none';
      agentProcessWasDown = false; // reset so we can detect future failures

      if (data.agent.lastRestartAttempt) {
        const rts = new Date(data.agent.lastRestartAttempt.ts).toLocaleString();
        restartStatus.innerHTML = '<div style="font-size:0.78rem;color:var(--green);">✅ Last restart: ' + rts + ' — ' +
          (data.agent.lastRestartAttempt.message || '') + '</div>';
      } else {
        restartStatus.innerHTML = '';
      }
    }

    // Log stats
    for (const [key, stats] of Object.entries(data.logs)) {
      const el = document.getElementById('logStats-' + key);
      if (el) {
        const sizeKB = (stats.sizeBytes / 1024).toFixed(1);
        el.textContent = stats.entries + ' entries (' + sizeKB + ' KB)';
      }
    }
    document.getElementById('statusTimestamp').textContent = 'Updated: ' + new Date(data.timestamp).toLocaleString();
  }

  // ── Manual restart button ─────────────────────────────────────────────────
  async function restartAgent() {
    const btn = document.getElementById('restartBtn');
    btn.textContent = '⏳ Restarting...';
    btn.disabled = true;
    await doRestartAgent();
    btn.disabled = false;
    btn.textContent = '🔄 Restart Agent';
    // Refresh immediately to show new status
    refreshAll();
  }

  async function doRestartAgent() {
    const result = await fetchJSON('/api/agent/restart');
    const restartStatus = document.getElementById('restartStatus');
    if (result && result.success) {
      restartStatus.innerHTML = '<div style="font-size:0.78rem;color:var(--green);">✅ ' + result.message + '</div>';
      // Wait a moment then refresh
      await new Promise(r => setTimeout(r, 3000));
      refreshAll();
    } else if (result) {
      restartStatus.innerHTML = '<div style="font-size:0.78rem;color:var(--red);">❌ ' + (result.message || 'Restart failed') + '</div>';
    }
  }

  async function refreshHealth() {
    const data = await fetchJSON('/api/health');
    if (!data) return;

    document.getElementById('healthScore').textContent = data.score !== undefined ? data.score + '/100' : '—';
    document.getElementById('healthScore').style.color = data.score >= 80 ? 'var(--green)' : data.score >= 50 ? 'var(--yellow)' : 'var(--red)';
    document.getElementById('healthStatus').textContent = data.status || '—';

    const checksDiv = document.getElementById('healthChecks');
    checksDiv.innerHTML = '';
    if (data.checks) {
      data.checks.forEach(c => {
        const div = document.createElement('div');
        div.className = 'check-item';
        div.innerHTML = '<span class="check-name">' + c.name + '</span><span class="check-result health-' + c.status + '">' +
          (c.status === 'ok' ? '✅' : c.status === 'warning' ? '⚠️' : '❌') + ' ' + c.status + '</span>';
        checksDiv.appendChild(div);
      });
    }
    document.getElementById('healthTimestamp').textContent = 'Checked: ' + (data.timestamp ? new Date(data.timestamp).toLocaleString() : '—');
  }

  async function refreshLogs() {
    const data = await fetchJSON('/api/logs?type=' + currentLogType + '&lines=20');
    if (!data || !data.entries) {
      document.getElementById('logEntries').innerHTML = '<div style="color:var(--muted)">No log entries yet</div>';
      return;
    }
    const container = document.getElementById('logEntries');
    container.innerHTML = '';
    data.entries.slice().reverse().forEach(e => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      const statusClass = 'status-' + (e.status || 'info');
      const ts = e.ts ? new Date(e.ts).toLocaleString() : '—';
      div.innerHTML = '<span class="ts">' + ts + '</span>' +
        '<span class="' + statusClass + '">[' + (e.status || '?') + ']</span> ' +
        '<span class="msg">' + (e.action || '') + (e.message ? ': ' + e.message : '') + '</span>' +
        (e.commit ? ' <span class="commit-hash">(' + e.commit + ')</span>' : '');
      container.appendChild(div);
    });
  }

  async function refreshCommits() {
    const data = await fetchJSON('/api/commits?lines=10');
    if (!data || !data.commits) {
      document.getElementById('commitList').innerHTML = '<div style="color:var(--muted)">No commits</div>';
      return;
    }
    const container = document.getElementById('commitList');
    container.innerHTML = '';
    data.commits.forEach(c => {
      const div = document.createElement('div');
      div.className = 'commit';
      div.innerHTML = '<span class="hash">' + c.hash + '</span>' + (c.message || '');
      container.appendChild(div);
    });
  }

  // ── Activity Summary ─────────────────────────────────────────────────────
  async function refreshSummary() {
    const data = await fetchJSON('/api/summary');
    if (!data) return;

    // Daily summaries
    const container = document.getElementById('activitySummary');
    container.innerHTML = '';
    if (data.daily && data.daily.length > 0) {
      let hasAnyActivity = false;
      data.daily.forEach(day => {
        const div = document.createElement('div');
        const cssClass = day.hasIssues ? 'issues' : (day.reviewStatus === 'failed' ? 'failed' : 'passed');
        div.className = 'summary-day ' + cssClass;

        const dateObj = new Date(day.date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

        let actionsHtml = '';
        day.actions.forEach(a => {
          let cls = 'day-action';
          if (a.includes('✅') || a.includes('Nightly')) cls += ' review-ok';
          if (a.includes('⚠️') || a.includes('issues')) cls += ' review-issue';
          if (a.includes('📝')) cls += ' content';
          if (a.includes('🛠️')) cls += ' fix';
          actionsHtml += '<span class="' + cls + '">' + a + '</span>';
        });

        const detailHtml = day.reviewDetail && day.reviewStatus !== 'passed'
          ? '<div class="day-detail">' + day.reviewDetail + '</div>' : '';

        if (actionsHtml) hasAnyActivity = true;
        div.innerHTML = '<div class="day-header"><span class="day-date">' + dateStr + '</span>' +
          '<span style="color:var(--muted);font-size:0.72rem;">' + day.actionCount + ' log entries</span></div>' +
          '<div class="day-actions">' + actionsHtml + '</div>' + detailHtml;
        container.appendChild(div);
      });
      if (!hasAnyActivity) {
        container.innerHTML = '<div class="empty-state">No agent activity recorded yet — check back after the next cycle</div>';
      }
    } else {
      container.innerHTML = '<div class="empty-state">No agent activity recorded yet — check back after the next cycle</div>';
    }

    // Content status
    if (data.content) {
      document.getElementById('articleCount').textContent = data.content.articleCount || '0';
      document.getElementById('lastArticleDate').textContent = data.content.lastArticleDate
        ? new Date(data.content.lastArticleDate).toLocaleDateString() : '—';

      const freshnessEl = document.getElementById('contentFreshness');
      const freshnessScore = data.content.freshnessScore || 'unknown';
      if (freshnessScore === 'fresh') freshnessEl.className = 'value content-fresh';
      else if (freshnessScore === 'stale') freshnessEl.className = 'value content-stale';
      else freshnessEl.className = 'value content-critical';
      freshnessEl.textContent = data.content.freshnessLabel || '—';
    }

    // Improvement counts
    if (data.improvements) {
      const imp = data.improvements;
      const html = '<span class="imp-counter fixes">🛠️ ' + imp.last7days.fixes + '/' + imp.last30days.fixes + '</span> ' +
        '<span class="imp-counter content">📝 ' + imp.last7days.content + '/' + imp.last30days.content + '</span> ' +
        '<span class="imp-counter reviews">✅ ' + imp.last7days.reviews + '/' + imp.last30days.reviews + '</span>';
      document.getElementById('improvementCounts').innerHTML = html;
    }

    // Recent improvements list
    const impContainer = document.getElementById('recentImprovements');
    if (data.improvements && data.improvements.recent && data.improvements.recent.length > 0) {
      impContainer.innerHTML = '';
      data.improvements.recent.slice(0, 8).forEach(imp => {
        const div = document.createElement('div');
        div.className = 'improvement-item';
        const ts = imp.ts ? new Date(imp.ts).toLocaleString() : '—';
        div.innerHTML = '<span class="imp-msg">' + (imp.message || 'Fix applied') + '</span>' +
          (imp.commit ? ' <span class="imp-commit">(' + imp.commit + ')</span>' : '') +
          ' <span class="imp-ts">' + ts + '</span>';
        impContainer.appendChild(div);
      });
    } else {
      impContainer.innerHTML = '<div class="empty-state">No fixes or improvements recorded yet</div>';
    }

    document.getElementById('summaryTimestamp').textContent = 'Updated: ' + new Date(data.timestamp).toLocaleString();
  }

  async function refreshAll() {
    document.getElementById('lastRefresh').textContent = new Date().toLocaleString();
    await Promise.all([refreshStatus(), refreshHealth(), refreshLogs(), refreshCommits(), refreshSummary()]);
  }

  // Log type filter buttons
  document.querySelectorAll('.log-filters button').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.log-filters button').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentLogType = this.dataset.type;
      refreshLogs();
    });
  });

  // Initial load + auto-refresh every 30s
  refreshAll();
  setInterval(refreshAll, 30000);
</script>
</body>
</html>`;
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = req.url;
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Route the request to the appropriate handler
    if (url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(handleStatus());
    } else if (url.startsWith('/api/logs')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(handleLogs(url));
    } else if (url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(handleHealth());
    } else if (url === '/api/summary') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(handleSummary());
    } else if (url === '/api/agent/restart') {
      const result = handleAgentRestart();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(result);
    } else if (url === '/api/agent/crash-report') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(handleCrashReport());
    } else if (url.startsWith('/api/commits')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(handleCommits(url));
    } else if (url === '/favicon.ico') {
      res.writeHead(204);
      res.end();
    } else {
      // Default: serve dashboard HTML
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getDashboardHTML());
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🤖 Tony Brand Master — Local Dashboard               ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  📍 http://localhost:${PORT}                             ║`);
  console.log('║  📡 Dashboard UI refreshes every 30s                  ║');
  console.log('║  🔄 Agent process health-check every 10s              ║');
  console.log('║  🛡️ Auto-restart with crash log capture               ║');
  console.log(`║  🕐 Started: ${new Date().toLocaleString()}               ║`);
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
});

// ─── Fast Process Health Check Loop (Always-Online) ──────────────────────────

/**
 * Runs every 10 seconds to check if the agent process is alive.
 * If the process is down, triggers auto-restart with crash info capture.
 * Logs heartbeat when agent is running to show active status.
 * This is SEPARATE from the dashboard UI refresh (30s) — it runs server-side.
 */
let fastCheckActive = true;
const FAST_CHECK_INTERVAL = 10000; // 10 seconds

function fastProcessCheck() {
  if (!fastCheckActive) return;

  const processRunning = isPortInUse(AGENT_PORT);

  if (!processRunning) {
    // Agent is down — log a warning and try to restart
    try {
      const fixLog = path.join(LOG_DIR, 'fix-log.ndjson');
      const crashInfo = captureCrashInfo();
      fs.appendFileSync(fixLog, JSON.stringify({
        ts: new Date().toISOString(),
        type: 'fix',
        action: 'fix:agent-down-detected',
        status: 'warning',
        message: `Fast check: agent process not running on port ${AGENT_PORT}. Triggering restart.`,
        crashLogLines: crashInfo.lastStderr
          ? crashInfo.lastStderr.split('\n').length + ' lines'
          : 'none',
        heartbeatsBeforeCrash: crashInfo.recentHeartbeats.length,
      }) + '\n', 'utf-8');
    } catch {}

    // Attempt restart
    const result = restartAgent();

    // If restart failed, schedule a retry with exponential backoff
    if (!result.success) {
      const backoffMs = Math.min(Math.pow(2, agentRestartRetries) * 1000, 300000); // max 5 min
      console.log(`⚠️  Agent restart failed (retry #${agentRestartRetries}). Next retry in ${backoffMs / 1000}s`);
      setTimeout(fastProcessCheck, backoffMs);
      return; // don't schedule the normal interval
    } else {
      console.log(`✅ Agent auto-restarted via fast health check (${new Date().toLocaleString()})`);
    }
  } else {
    // Agent is running — check if we need to log a heartbeat
    // Only log heartbeat if it's been > 5 minutes since last one
    try {
      const hbPath = path.join(LOG_DIR, 'heartbeat.ndjson');
      if (fs.existsSync(hbPath)) {
        const content = fs.readFileSync(hbPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          const lastHb = JSON.parse(lines[lines.length - 1]);
          const ageMs = Date.now() - new Date(lastHb.ts).getTime();
          // Log a keepalive heartbeat every 5 minutes so dashboard shows "online"
          if (ageMs > 5 * 60 * 1000) {
            const hbEntry = JSON.stringify({
              ts: new Date().toISOString(),
              type: 'heartbeat',
              status: 'ok',
              message: 'Keepalive — agent process confirmed running',
            }) + '\n';
            fs.appendFileSync(hbPath, hbEntry, 'utf-8');
          }
        }
      } else {
        // No heartbeat file yet — create it
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
        const hbEntry = JSON.stringify({
          ts: new Date().toISOString(),
          type: 'heartbeat',
          status: 'ok',
          message: 'Agent process running (dashboard health check)',
        }) + '\n';
        fs.appendFileSync(hbPath, hbEntry, 'utf-8');
      }
    } catch {}

    // Reset retry count when agent is stable
    agentRestartRetries = 0;
  }
}

// Start the fast health check loop
setInterval(fastProcessCheck, FAST_CHECK_INTERVAL);

// Also run an initial check immediately on startup
setTimeout(fastProcessCheck, 2000);

// ─── One-Time Crash Diagnostics on Startup ────────────────────────────────────

// On dashboard startup, check if there's a crash log from a previous crash
// and log it as a warning so the agent can investigate.
setTimeout(() => {
  try {
    const crashInfo = captureCrashInfo();
    if (crashInfo.hasCrashed) {
      console.log('⚠️  Found crash log from previous agent session:');
      console.log(`   ${crashInfo.crashLogSizeBytes} bytes, ${(crashInfo.lastStderr || '').split('\n').length} lines`);
      console.log('   The agent will investigate this on next task cycle.');
      try {
        const fixLog = path.join(LOG_DIR, 'fix-log.ndjson');
        fs.appendFileSync(fixLog, JSON.stringify({
          ts: new Date().toISOString(),
          type: 'fix',
          action: 'fix:crash-log-found',
          status: 'warning',
          message: `Previous crash log found (${crashInfo.crashLogSizeBytes} bytes, ` +
            `${(crashInfo.lastStderr || '').split('\n').length} lines). Agent should investigate.`,
          lastStderrSnippet: crashInfo.lastStderr
            ? crashInfo.lastStderr.substring(0, 1000)
            : null,
        }) + '\n', 'utf-8');
      } catch {}
    }
  } catch {}
}, 5000);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\n📴 Dashboard server shutting down...');
  fastCheckActive = false; // stop the fast check loop
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  fastCheckActive = false;
  server.close();
  process.exit(0);
});
