/**
 * Deployment Verification — Vercel Serverless Function
 *
 * Checks the health of the deployment pipeline:
 *   1. Local build status (via build output)
 *   2. Vercel deployment status for latest commit
 *   3. Site reachability check
 *   4. Service endpoints health check
 *
 * This is a ONE-TIME verification the agent runs after setup,
 * and also runs as part of the nightly review for ongoing monitoring.
 *
 * If a check fails, the response includes diagnostic info for the agent
 * to investigate and self-fix.
 *
 * Env vars required:
 *   VERCEL_TOKEN (optional) — Vercel API token for deployment status check.
 *     Without it, deployment check is skipped gracefully.
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store'); // always fresh for agent

  const results = [];
  let allPassed = true;
  const siteUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://me.tony.do';
  const vercelToken = process.env.VERCEL_TOKEN;
  const startTime = Date.now();

  // ── Check 1: Build output exists ──────────────────────────────────────────
  try {
    const fs = await import('fs');
    const path = await import('path');
    const buildDir = path.join(process.cwd(), 'dist');
    const hasIndex = fs.existsSync(path.join(buildDir, 'index.html'));
    const hasAssets = fs.existsSync(path.join(buildDir, 'assets'));
    const buildFiles = hasAssets ? fs.readdirSync(path.join(buildDir, 'assets')).length : 0;

    if (hasIndex && hasAssets) {
      results.push({
        check: 'Local build output',
        status: 'ok',
        detail: `dist/ found with index.html + ${buildFiles} assets`,
      });
    } else {
      results.push({
        check: 'Local build output',
        status: 'warning',
        detail: 'dist/ incomplete — may need `npm run build`',
        fix: 'Run `npm run build` locally',
      });
      allPassed = false;
    }
  } catch (err) {
    results.push({
      check: 'Local build output',
      status: 'error',
      detail: `Build directory not found: ${err.message}`,
      fix: 'Run `npm run build` to generate dist/',
    });
    allPassed = false;
  }

  // ── Check 2: Site reachability ────────────────────────────────────────────
  try {
    const response = await fetch(siteUrl, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      results.push({
        check: 'Site reachability',
        status: 'ok',
        detail: `${siteUrl} returned ${response.status}`,
      });
    } else {
      results.push({
        check: 'Site reachability',
        status: 'warning',
        detail: `${siteUrl} returned ${response.status}`,
      });
      allPassed = false;
    }
  } catch (err) {
    results.push({
      check: 'Site reachability',
      status: 'error',
      detail: `Cannot reach ${siteUrl}: ${err.message}`,
      fix: 'Check Vercel deployment status in dashboard',
    });
    allPassed = false;
  }

  // ── Check 3: API endpoints health ─────────────────────────────────────────
  const endpoints = ['/api/data', '/api/summary', '/api/subscribe', '/api/unsubscribe'];
  for (const endpoint of endpoints) {
    try {
      const url = `${siteUrl}${endpoint}`;
      const response = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        results.push({
          check: `Endpoint ${endpoint}`,
          status: 'ok',
          detail: `HTTP ${response.status}`,
        });
      } else {
        results.push({
          check: `Endpoint ${endpoint}`,
          status: 'warning',
          detail: `HTTP ${response.status}`,
          fix: `Check serverless function logs for ${endpoint}`,
        });
        allPassed = false;
      }
    } catch (err) {
      results.push({
        check: `Endpoint ${endpoint}`,
        status: 'error',
        detail: `Request failed: ${err.message}`,
        fix: `Check if ${endpoint} function is deployed correctly`,
      });
      allPassed = false;
    }
  }

  // ── Check 5: Git status (in Vercel, we can check env) ─────────────────────
  if (process.env.VERCEL) {
    results.push({
      check: 'Vercel environment',
      status: 'ok',
      detail: `Running in Vercel (${process.env.VERCEL_ENV || 'production'}): ${process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8) || 'unknown'}`,
    });

    // Check Vercel deployment status if token is available
    if (vercelToken && process.env.VERCEL_PROJECT_ID) {
      try {
        const deployRes = await fetch(
          `https://api.vercel.com/v1/deployments?projectId=${process.env.VERCEL_PROJECT_ID}&limit=1&target=production`,
          { headers: { Authorization: `Bearer ${vercelToken}` } }
        );
        if (deployRes.ok) {
          const deployData = await deployRes.json();
          const latestDeploy = deployData.deployments?.[0];
          if (latestDeploy) {
            results.push({
              check: 'Latest Vercel deployment',
              status: latestDeploy.state === 'READY' ? 'ok' : 'warning',
              detail: `State: ${latestDeploy.state}, Created: ${latestDeploy.createdAt ? new Date(latestDeploy.createdAt).toISOString() : 'unknown'}`,
              fix: latestDeploy.state !== 'READY'
                ? `Deployment is ${latestDeploy.state}. Check Vercel Dashboard for details.`
                : undefined,
            });
            if (latestDeploy.state !== 'READY') allPassed = false;
          }
        }
      } catch (err) {
        results.push({
          check: 'Vercel deployment API',
          status: 'warning',
          detail: `Could not fetch deployment status: ${err.message}`,
        });
      }
    } else {
      results.push({
        check: 'Vercel deployment API',
        status: 'info',
        detail: 'VERCEL_TOKEN not set — skipping deployment status check. Agent should set this for full CI/CD monitoring.',
      });
    }
  }

  // Build final response
  const duration = Date.now() - startTime;

  return res.status(200).json({
    status: allPassed ? 'healthy' : 'degraded',
    allPassed,
    totalChecks: results.length,
    passedChecks: results.filter(r => r.status === 'ok').length,
    warnings: results.filter(r => r.status === 'warning').length,
    errors: results.filter(r => r.status === 'error').length,
    checks: results,
    duration: `${duration}ms`,
    siteUrl,
    timestamp: new Date().toISOString(),
    agentAction: allPassed
      ? '✅ CI/CD pipeline is healthy. No action needed.'
      : '🔧 CI/CD has issues. Agent should read the failing checks above and fix them.',
  });
}
