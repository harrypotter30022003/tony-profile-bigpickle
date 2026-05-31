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

// ─── Configuration ────────────────────────────────────────────────────────────

/** Parse command-line arguments for port, default to 4097 */
const PORT = parseInt(process.argv.find(a => a.startsWith('--port='))?.split('=')[1], 10) || 4097;

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
 * Handler for /api/status — returns agent status and log statistics.
 * Determines agent state from heartbeat freshness:
 *   active    → heartbeat within 1 hour
 *   sleeping  → heartbeat 1-6 hours ago
 *   stopped   → heartbeat > 6 hours ago or no heartbeat
 */
function handleStatus() {
  // Read heartbeat log to determine agent state
  const heartbeats = readLogFile(path.join(LOG_DIR, 'heartbeat.ndjson'), 1);
  let agentState = 'stopped';
  let lastHeartbeat = null;
  let lastHeartbeatMessage = '';

  if (heartbeats.length > 0) {
    const hb = heartbeats[heartbeats.length - 1];
    lastHeartbeat = hb.ts;
    lastHeartbeatMessage = hb.message || '';
    const ageMs = Date.now() - new Date(hb.ts).getTime();
    const ageHours = ageMs / 3600000;
    if (ageHours < 1) {
      agentState = 'active';
    } else if (ageHours < 6) {
      agentState = 'sleeping';
    }
  }

  // Get log file stats
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

  // Get git info
  const lastCommit = safeExec('git log -1 --oneline', { cwd: PROJECT_ROOT });

  return JSON.stringify({
    agent: {
      state: agentState,
      lastHeartbeat,
      lastMessage: lastHeartbeatMessage,
    },
    logs: logStats,
    git: {
      lastCommit: lastCommit || 'N/A',
    },
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
    <span id="agentStateBadge" class="status-badge status-stopped">⏳ Loading...</span>
  </div>
</div>

<div class="grid">
  <!-- Agent Status Card -->
  <div class="card">
    <h3>🤖 Agent Status</h3>
    <div class="stat-row"><span class="label">State</span><span class="value" id="agentState">—</span></div>
    <div class="stat-row"><span class="label">Last Heartbeat</span><span class="value" id="lastHeartbeat">—</span></div>
    <div class="stat-row"><span class="label">Last Message</span><span class="value" id="lastMessage" style="font-size:0.8rem;word-break:break-word;text-align:right;max-width:60%">—</span></div>
    <div class="stat-row"><span class="label">Last Commit</span><span class="value" id="lastCommit" style="font-size:0.8rem;font-family:monospace">—</span></div>
  </div>

  <!-- Log Stats Card -->
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

  async function refreshStatus() {
    const data = await fetchJSON('/api/status');
    if (!data) return;

    // Agent state
    const state = data.agent.state;
    const badge = document.getElementById('agentStateBadge');
    badge.textContent = state === 'active' ? '🟢 Active' : state === 'sleeping' ? '🟡 Sleeping' : '🔴 Stopped';
    badge.className = 'status-badge status-' + state;

    document.getElementById('agentState').textContent = state.charAt(0).toUpperCase() + state.slice(1);
    document.getElementById('lastHeartbeat').textContent = data.agent.lastHeartbeat
      ? new Date(data.agent.lastHeartbeat).toLocaleString() : 'Never';
    document.getElementById('lastMessage').textContent = data.agent.lastMessage || '—';
    document.getElementById('lastCommit').textContent = data.git.lastCommit || '—';

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

  async function refreshAll() {
    document.getElementById('lastRefresh').textContent = new Date().toLocaleString();
    await Promise.all([refreshStatus(), refreshHealth(), refreshLogs(), refreshCommits()]);
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

const server = http.createServer((req, res) => {
  const url = req.url;
  const startTime = Date.now();

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
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  🤖 Tony Brand Master — Local Dashboard              ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  📍 http://localhost:${PORT}                            ║`);
  console.log('║  📡 Auto-refreshes every 30s                        ║');
  console.log(`║  🕐 Started: ${new Date().toLocaleString()}              ║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Dashboard server shutting down...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.close();
  process.exit(0);
});
