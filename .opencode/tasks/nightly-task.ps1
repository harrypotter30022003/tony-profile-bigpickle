<#
.SYNOPSIS
  Nightly Review Task — runs daily at 2:00 AM via Windows Task Scheduler.
  Performs site health checks, logs results, and alerts if issues found.

  Note: Full AI-powered review requires an active OpenCode session.
  This script handles mechanical checks and queuing.
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
$LogFile = Join-Path $ProjectRoot ".opencode\logs\nightly-task.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"[$Timestamp] ====== NIGHTLY REVIEW STARTED ======" | Out-File -FilePath $LogFile -Append

# Step 1: Health check
"[$Timestamp] Running health check..." | Out-File -FilePath $LogFile -Append
try {
  $result = node (Join-Path $ProjectRoot ".opencode\scripts\health-check.cjs") 2>&1
  $result | Out-File -FilePath $LogFile -Append
} catch {
  "ERROR: Health check failed — $_" | Out-File -FilePath $LogFile -Append
}

# Step 2: Check build
"[$Timestamp] Verifying build..." | Out-File -FilePath $LogFile -Append
try {
  $build = & npm run build 2>&1
  if ($LASTEXITCODE -eq 0) {
    "Build: OK" | Out-File -FilePath $LogFile -Append
  } else {
    "Build: FAILED" | Out-File -FilePath $LogFile -Append
  }
} catch {
  "Build error: $_" | Out-File -FilePath $LogFile -Append
}

# Step 3: Fetch analytics summary
"[$Timestamp] Fetching analytics data..." | Out-File -FilePath $LogFile -Append
try {
  $analytics = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=summary&period=7d" -TimeoutSec 30
  "Analytics: $($analytics.traffic.totalUsers) users, $($analytics.traffic.totalSessions) sessions, $($analytics.traffic.totalPageViews) page views" | Out-File -FilePath $LogFile -Append
  if ($analytics.recommendations.Count -gt 0) {
    "Recommendations:" | Out-File -FilePath $LogFile -Append
    $analytics.recommendations | ForEach-Object { "  - $_" | Out-File -FilePath $LogFile -Append }
  }
} catch {
  "Analytics error: $_" | Out-File -FilePath $LogFile -Append
}

# Step 4: Check git status
"[$Timestamp] Checking git status..." | Out-File -FilePath $LogFile -Append
try {
  $status = git status --short 2>&1
  if ($status) {
    "Uncommitted changes:" | Out-File -FilePath $LogFile -Append
    $status | Out-File -FilePath $LogFile -Append
  } else {
    "Git: clean" | Out-File -FilePath $LogFile -Append
  }
} catch {
  "Git error: $_" | Out-File -FilePath $LogFile -Append
}

"[$Timestamp] ====== NIGHTLY REVIEW COMPLETE ======" | Out-File -FilePath $LogFile -Append
