<#
.SYNOPSIS
  Monthly SEO Audit Task — runs 1st of every month at 1:00 AM.
  Triggers the agent to do a deep 30-day SEO review.
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"

# CRITICAL: Always run from the project root, not from C:\Windows\System32
Set-Location $ProjectRoot

$LogFile = Join-Path $ProjectRoot ".opencode\logs\monthly-seo-task.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$LogDir = Split-Path $LogFile -Parent
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
  param([string]$Message)
  $entry = "[$Timestamp] $Message"
  $entry | Out-File -FilePath $LogFile -Append
  Write-Host $entry
}

Write-Log "====== MONTHLY SEO AUDIT STARTED ======"

# ── Build prompt with deep context ──────────────────────────────────────
$promptLines = @()
$promptLines += "You are running the MONTHLY SEO AUDIT task for me.tony.do (Tony Brand Master)."
$promptLines += ""
$promptLines += "Current time: $Timestamp (1st of month)"
$promptLines += ""

# Fetch 30-day analytics
Write-Log "Fetching 30-day analytics..."
try {
  $summary = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=summary&period=30d" -TimeoutSec 30
  if ($summary.traffic) {
    $promptLines += "30d traffic: $($summary.traffic.totalUsers) users, $($summary.traffic.totalSessions) sessions, $($summary.traffic.totalPageViews) page views"
  }
  if ($summary.recommendations -and $summary.recommendations.Count -gt 0) {
    $promptLines += "System recommendations:"
    $summary.recommendations | ForEach-Object { $promptLines += "  - $_" }
  }
  Write-Log "30-day summary loaded."
} catch {
  Write-Log "Summary fetch failed: $_"
}

# Fetch top pages
Write-Log "Fetching top pages..."
try {
  $ga4 = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=ga4&period=30d" -TimeoutSec 30
  if ($ga4.rows) {
    $promptLines += "Top pages (30d):"
    $ga4.rows | Select-Object -First 10 | ForEach-Object {
      $promptLines += "  - [$($_.sessions) sessions] $($_.pageTitle) - $($_.pagePath)"
    }
  }
} catch {
  Write-Log "GA4 detail fetch failed: $_"
}

# Fetch top queries
Write-Log "Fetching top search queries..."
try {
  $sc = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=sc&period=30d" -TimeoutSec 30
  if ($sc.rows) {
    $promptLines += "Top search queries (30d):"
    $sc.rows | Select-Object -First 10 | ForEach-Object {
      $promptLines += "  - [$($_.impressions) imp / $($_.clicks) clk] $($_.query)"
    }
  }
} catch {
  Write-Log "SC detail fetch failed: $_"
}

# Check site reachability
Write-Log "Checking site..."
try {
  $home = Invoke-WebRequest -Uri "https://me.tony.do" -TimeoutSec 15 -UseBasicParsing
  $promptLines += "Homepage: HTTP $($home.StatusCode)"
  $sitemap = Invoke-WebRequest -Uri "https://me.tony.do/sitemap.xml" -TimeoutSec 15 -UseBasicParsing
  $promptLines += "Sitemap: HTTP $($sitemap.StatusCode)"
} catch {
  Write-Log "Site check failed: $_"
  $promptLines += "Site check FAILED: $_"
}

$promptLines += ""
$promptLines += "Your tasks:"
$promptLines += "1. Read the monthly-seo task instructions: .opencode/tasks/monthly-seo.md"
$promptLines += "2. Analyze the 30-day analytics data above."
$promptLines += "3. Identify trends, opportunities, and issues."
$promptLines += "4. Take conservative action if clear issues found (broken pages, missing meta tags, etc)."
$promptLines += "5. Generate a brief monthly SEO report and save it to .opencode/logs/monthly-seo-report-YYYY-MM.md"
$promptLines += "6. Commit any changes with a clear message."
$promptLines += "7. Be CONCISE in your final reply. Use under 400 words."

$fullPrompt = $promptLines -join "`n"
Write-Log "Prompt prepared: $($fullPrompt.Length) chars"

# ── Trigger the agent ──────────────────────────────────────────────────
Write-Log "Triggering agent..."
$triggerScript = Join-Path $ProjectRoot ".opencode\scripts\trigger-agent.ps1"

if (-not $env:OPENCODE_SERVER_PASSWORD) {
  $passwordFile = Join-Path $ProjectRoot ".opencode\.opencode-server-password"
  if (Test-Path $passwordFile) {
    $env:OPENCODE_SERVER_PASSWORD = (Get-Content $passwordFile -Raw).Trim()
    Write-Log "Loaded password from file"
  } else {
    Write-Log "ERROR: No OPENCODE_SERVER_PASSWORD available." "ERROR"
    exit 1
  }
}

& $triggerScript -Prompt $fullPrompt -TimeoutSeconds 1200

$exitCode = $LASTEXITCODE
Write-Log "Trigger exit code: $exitCode"
Write-Log "====== MONTHLY SEO AUDIT COMPLETE ======"
exit $exitCode
