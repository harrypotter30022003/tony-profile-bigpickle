<#
.SYNOPSIS
  Nightly Review Task — runs daily at 2:00 AM via Windows Task Scheduler.
  Triggers the Tony Brand Master agent to perform an AI-powered review
  of site health, analytics, and any pending work.

.DESCRIPTION
  This script is the bridge from Windows Task Scheduler to the
  OpenCode agent. It:
    1. Runs quick mechanical checks (build, git, health) for context
    2. Loads recent analytics from the API
    3. Sends a comprehensive prompt to the agent for AI-powered review
    4. Logs all results

  The agent will:
    - Review analytics trends
    - Check for broken pages, errors, or issues
    - Identify content opportunities
    - Take action if needed (with safety limits)
    - Log findings to .opencode/logs/
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"

# CRITICAL: Always run from the project root, not from C:\Windows\System32
Set-Location $ProjectRoot

$LogFile = Join-Path $ProjectRoot ".opencode\logs\nightly-task.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Ensure log dir
$LogDir = Split-Path $LogFile -Parent
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
  param([string]$Message)
  $entry = "[$Timestamp] $Message"
  $entry | Out-File -FilePath $LogFile -Append
  Write-Host $entry
}

Write-Log "====== NIGHTLY REVIEW STARTED ======"

# ── Step 1: Build the prompt with context ────────────────────────────────
$promptLines = @()
$promptLines += "You are running the NIGHTLY REVIEW task for me.tony.do (Tony Brand Master)."
$promptLines += ""
$promptLines += "Current time: $Timestamp"
$promptLines += ""
$promptLines += "Mechanical checks already performed:"
$promptLines += "- Build: $(if($LASTEXITCODE -eq 0){'OK'}else{'CHECK'})"
$promptLines += ""

# Step 2: Get analytics for context
Write-Log "Fetching 7-day analytics for context..."
$analyticsJson = ""
try {
  $resp = Invoke-WebRequest -Uri "https://me.tony.do/api/analytics?report=summary&period=7d" -TimeoutSec 30 -UseBasicParsing
  $analyticsJson = $resp.Content
  $analytics = $resp.Content | ConvertFrom-Json
  if ($analytics.traffic) {
    $promptLines += "Last 7d traffic: $($analytics.traffic.totalUsers) users, $($analytics.traffic.totalSessions) sessions, $($analytics.traffic.totalPageViews) page views"
  }
  if ($analytics.recommendations -and $analytics.recommendations.Count -gt 0) {
    $promptLines += "System recommendations:"
    $analytics.recommendations | ForEach-Object { $promptLines += "  - $_" }
  }
  Write-Log "Analytics loaded."
} catch {
  Write-Log "Analytics fetch failed: $_"
  $promptLines += "Analytics fetch FAILED: $_"
}

# Step 3: Get health check
Write-Log "Running health check..."
try {
  $healthOutput = node (Join-Path $ProjectRoot ".opencode\scripts\health-check.cjs") 2>&1 | Out-String
  $healthJson = $healthOutput | ConvertFrom-Json
  $promptLines += "Health score: $($healthJson.score)/100, status: $($healthJson.status)"
  $healthJson.checks | ForEach-Object {
    $promptLines += "  - $($_.name): $($_.status) — $($_.detail)"
  }
  Write-Log "Health check score: $($healthJson.score)/100"
} catch {
  Write-Log "Health check failed: $_"
  $promptLines += "Health check FAILED: $_"
}

$promptLines += ""
$promptLines += "Your tasks:"
$promptLines += "1. Review the health and analytics data above."
$promptLines += "2. Run a quick health check yourself: node .opencode\scripts\health-check.cjs"
$promptLines += "3. If there are issues, fix them (be conservative, only fix clear bugs)."
$promptLines += "4. If you made any code changes, commit them with a clear message."
$promptLines += "5. Log a summary of what you found and did."
$promptLines += "6. Be CONCISE in your final reply. Use under 300 words."

$fullPrompt = $promptLines -join "`n"
Write-Log "Prompt prepared: $($fullPrompt.Length) chars"

# ── Step 4: Trigger the agent via HTTP ──────────────────────────────────
Write-Log "Triggering agent via HTTP API..."
$triggerScript = Join-Path $ProjectRoot ".opencode\scripts\trigger-agent.ps1"

# Password must be set in this session (start-agent.ps1 sets it)
if (-not $env:OPENCODE_SERVER_PASSWORD) {
  $passwordFile = Join-Path $ProjectRoot ".opencode\.opencode-server-password"
  if (Test-Path $passwordFile) {
    $env:OPENCODE_SERVER_PASSWORD = (Get-Content $passwordFile -Raw).Trim()
    Write-Log "Loaded password from $passwordFile"
  } else {
    Write-Log "ERROR: No OPENCODE_SERVER_PASSWORD set and no password file found." "ERROR"
    Write-Log "====== NIGHTLY REVIEW ABORTED ======"
    exit 1
  }
}

& $triggerScript -Prompt $fullPrompt -TimeoutSeconds 600

$exitCode = $LASTEXITCODE
Write-Log "Trigger exit code: $exitCode"
Write-Log "====== NIGHTLY REVIEW COMPLETE ======"
exit $exitCode
