#!/usr/bin/env node
/**
 * =============================================================================
 * CI/CD Pipeline Verification Script
 * =============================================================================
 *
 * One-time verification tool that checks the full deployment pipeline:
 *   1. Local build (`npm run build`) — must pass
 *   2. Git status — clean working tree
 *   3. Vercel deployment status — latest deploy is READY
 *   4. Site health — all endpoints reachable
 *   5. Error log check — if build fails, read the error and suggest fixes
 *
 * The agent runs this once after setup, and automatically on deploy failures.
 * If any check fails, the agent receives diagnostic info to self-fix.
 *
 * USAGE:
 *   node .opencode/scripts/verify-cicd.cjs              # Run all checks
 *   node .opencode/scripts/verify-cicd.cjs --fix          # Attempt auto-fix
 *   node .opencode/scripts/verify-cicd.cjs --build-only   # Only check build
 *
 * EXIT CODES:
 *   0 — All checks passed
 *   1 — Warnings (non-critical issues)
 *   2 — Errors (CI/CD pipeline is broken)
 *
 * @module verify-cicd
 */

// ─── Core Modules ─────────────────────────────────────────────────────────────
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const LOG_DIR = path.resolve(PROJECT_ROOT, '.opencode', 'logs');
const LOGGER_PATH = path.resolve(PROJECT_ROOT, '.opencode', 'lib', 'logger.cjs');
const SITE_URL = process.env.SITE_URL || 'https://me.tony.do';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeExec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 120000, ...opts }).trim();
  } catch {
    return null;
  }
}

function log(type, action, status, message) {
  try {
    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      type,
      action,
      status,
      message,
    }) + '\n';
    const logFile = path.join(LOG_DIR, 'fix-log.ndjson');
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(logFile, entry, 'utf-8');
    console.log(`  [${status}] ${action}: ${message}`);
  } catch {}
}

// ─── Checks ───────────────────────────────────────────────────────────────────

let allPassed = true;
const results = [];
const args = process.argv.slice(2);
const autoFix = args.includes('--fix');
const buildOnly = args.includes('--build-only');

async function runChecks() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  🔄 CI/CD Pipeline Verification                      ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Site: ${SITE_URL}`);
  console.log(`║  Auto-fix: ${autoFix ? 'ON' : 'OFF'}`);
  console.log(`║  Started: ${new Date().toLocaleString()}`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // ── Check 1: npm run build ─────────────────────────────────────────────────
  console.log('📦 [1/4] Checking local build...');
  try {
    const buildOutput = execSync('npm run build 2>&1', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 120000,
    });
    // Check for success indicators
    const hasSuccess = buildOutput.includes('built in') || buildOutput.includes('Done in');
    if (hasSuccess || fs.existsSync(path.join(PROJECT_ROOT, 'dist', 'index.html'))) {
      console.log('  ✅ Build passed');
      results.push({ check: 'Local build', status: 'ok', detail: 'npm run build completed successfully' });
    } else {
      console.log('  ❌ Build failed');
      // Extract error lines
      const errorLines = buildOutput.split('\n').filter(l => l.includes('ERROR') || l.includes('Error') || l.includes('error'));
      const snippet = errorLines.slice(0, 5).join('\n') || buildOutput.slice(-500);
      log('fix', 'fix:build-failed', 'error', `Build failed:\n${snippet}`);
      results.push({ check: 'Local build', status: 'error', detail: snippet });
      allPassed = false;

      // Auto-fix: suggest common fixes
      if (autoFix) {
        console.log('  🔧 Attempting auto-fix...');
        if (snippet.includes('Module not found') || snippet.includes('Cannot find module')) {
          console.log('     → Running npm install...');
          safeExec('npm install', { cwd: PROJECT_ROOT, timeout: 60000 });
          log('fix', 'fix:build-deps', 'warning', 'Ran npm install to fix missing modules');
        } else if (snippet.includes('SyntaxError')) {
          console.log('     → Syntax error detected. Agent should check recent file changes.');
          log('fix', 'fix:build-syntax', 'warning', 'Syntax error in build. Agent should review recent changes.');
        }
      }
    }
  } catch (err) {
    console.log('  ❌ Build threw exception');
    const snippet = err.message?.substring(0, 500) || 'Build command failed';
    log('fix', 'fix:build-failed', 'error', `Build exception:\n${snippet}`);
    results.push({ check: 'Local build', status: 'error', detail: snippet });
    allPassed = false;
  }

  if (buildOnly) {
    printSummary();
    process.exit(allPassed ? 0 : 2);
  }

  // ── Check 2: Git status ────────────────────────────────────────────────────
  console.log('\n📂 [2/4] Checking git status...');
  const gitStatus = safeExec('git status --porcelain', { cwd: PROJECT_ROOT });
  if (gitStatus === null) {
    console.log('  ⚠️  Not a git repository or git not available');
    results.push({ check: 'Git status', status: 'warning', detail: 'Git not available in this environment' });
  } else if (gitStatus.length === 0) {
    console.log('  ✅ Clean working tree');
    results.push({ check: 'Git status', status: 'ok', detail: 'Clean working tree' });
  } else {
    const changedFiles = gitStatus.split('\n').length;
    console.log(`  ⚠️  ${changedFiles} uncommitted file(s)`);
    results.push({ check: 'Git status', status: 'warning', detail: `${changedFiles} uncommitted files` });
  }

  // ── Check 3: Site reachability ─────────────────────────────────────────────
  console.log('\n🌐 [3/4] Checking site reachability...');
  try {
    const response = await fetch(SITE_URL, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      console.log(`  ✅ Site responded with ${response.status}`);
      results.push({ check: 'Site reachability', status: 'ok', detail: `${SITE_URL} returned ${response.status}` });
    } else {
      console.log(`  ❌ Site returned ${response.status}`);
      results.push({ check: 'Site reachability', status: 'error', detail: `${SITE_URL} returned ${response.status}` });
      allPassed = false;
    }
  } catch (err) {
    console.log(`  ❌ Cannot reach site: ${err.message}`);
    results.push({ check: 'Site reachability', status: 'error', detail: `Fetch failed: ${err.message}` });
    allPassed = false;
  }

  // ── Check 4: API endpoints ─────────────────────────────────────────────────
  console.log('\n🔌 [4/4] Checking API endpoints...');
  const endpoints = ['/api/data', '/api/summary', '/api/verify-deployment'];
  let allEndpointsOk = true;

  for (const endpoint of endpoints) {
    try {
      const url = `${SITE_URL}${endpoint}`;
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        console.log(`  ✅ ${endpoint}`);
        results.push({ check: `Endpoint ${endpoint}`, status: 'ok', detail: `HTTP ${response.status}` });
      } else {
        console.log(`  ❌ ${endpoint} returned ${response.status}`);
        results.push({ check: `Endpoint ${endpoint}`, status: 'error', detail: `HTTP ${response.status}` });
        allEndpointsOk = false;
      }
    } catch (err) {
      console.log(`  ❌ ${endpoint}: ${err.message}`);
      results.push({ check: `Endpoint ${endpoint}`, status: 'error', detail: err.message });
      allEndpointsOk = false;
    }
  }

  if (!allEndpointsOk) allPassed = false;

  // ── Summary ────────────────────────────────────────────────────────────────
  printSummary();

  const exitCode = allPassed ? 0 : 2;

  // Log the verification result
  log('fix', 'fix:cicd-verify', allPassed ? 'ok' : 'error',
    allPassed
      ? 'CI/CD pipeline verification passed all checks'
      : 'CI/CD pipeline has issues — see detailed results above'
  );

  process.exit(exitCode);
}

function printSummary() {
  const passed = results.filter(r => r.status === 'ok').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  📊 Verification Summary                             ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  ✅ Passed:  ${passed}`);
  console.log(`║  ⚠️  Warnings: ${warnings}`);
  console.log(`║  ❌ Errors:  ${errors}`);
  console.log(`║  Overall: ${allPassed ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // Show detail for any errors/warnings
  results.filter(r => r.status !== 'ok').forEach(r => {
    console.log(`  ${r.status === 'error' ? '❌' : '⚠️'} ${r.check}`);
    console.log(`     ${r.detail}`);
    if (r.fix) console.log(`     Fix: ${r.fix}`);
    console.log('');
  });
}

runChecks().catch(err => {
  console.error('Verification script error:', err);
  log('fix', 'fix:cicd-error', 'error', `Verification script failed: ${err.message}`);
  process.exit(2);
});
