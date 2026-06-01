<#
.SYNOPSIS
  Weekly Content Task — runs every Sunday at 11:00 PM via Windows Task Scheduler.
  Triggers the agent to review content freshness and create new content if needed.
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"

# CRITICAL: Always run from the project root, not from C:\Windows\System32
Set-Location $ProjectRoot

$LogFile = Join-Path $ProjectRoot ".opencode\logs\weekly-content-task.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$LogDir = Split-Path $LogFile -Parent
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
  param([string]$Message)
  $entry = "[$Timestamp] $Message"
  $entry | Out-File -FilePath $LogFile -Append
  Write-Host $entry
}

Write-Log "====== WEEKLY CONTENT CHECK STARTED ======"

# ── Build the prompt with context ───────────────────────────────────────
$promptLines = @()
$promptLines += "You are running the WEEKLY CONTENT task for me.tony.do (Tony Brand Master)."
$promptLines += ""
$promptLines += "Current time: $Timestamp (Sunday night)"
$promptLines += ""

# Get analytics
Write-Log "Fetching 7-day analytics..."
try {
  $resp = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=summary&period=7d" -TimeoutSec 30
  if ($resp.traffic) {
    $promptLines += "Last 7d traffic: $($resp.traffic.totalUsers) users, $($resp.traffic.totalSessions) sessions, $($resp.traffic.totalPageViews) page views"
  }
  if ($resp.recommendations -and $resp.recommendations.Count -gt 0) {
    $promptLines += "Recommendations from system:"
    $resp.recommendations | ForEach-Object { $promptLines += "  - $_" }
  }
  Write-Log "Analytics loaded."
} catch {
  Write-Log "Analytics fetch failed: $_"
  $promptLines += "Analytics fetch FAILED: $_"
}

# Get article count and last publish date
Write-Log "Checking content freshness..."
try {
  $data = Invoke-RestMethod -Uri "https://me.tony.do/api/data" -TimeoutSec 15
  $articles = $data.blog
  $promptLines += "Total articles: $($articles.Count)"

  $sorted = $articles | Sort-Object @{Expression={[datetime]::ParseExact($_.date, 'yyyy-MM-dd', $null)}; Descending=$true}
  $latest = $sorted | Select-Object -First 1
  $lastDate = [datetime]::ParseExact($latest.date, 'yyyy-MM-dd', $null)
  $daysSinceLastPost = [math]::Floor((Get-Date - $lastDate).TotalDays)
  $promptLines += "Last article: '$($latest.title)' — $($latest.date) ($daysSinceLastPost days ago)"
  Write-Log "Last article $daysSinceLastPost days ago: $($latest.title)"
} catch {
  Write-Log "Content check failed: $_"
  $promptLines += "Content check FAILED: $_"
}

$promptLines += ""
$promptLines += "Your tasks:"
$promptLines += "1. Review the analytics and content data above."
$promptLines += "2. Read the weekly-content task instructions: .opencode/tasks/weekly-content.md"
$promptLines += "3. If the site is stale (over 7 days since last post), write a new high-quality article."
$promptLines += "4. Follow the existing article format (check src/admin/data.json and existing articles)."
$promptLines += "5. Use the Gemini API to rewrite any RSS-sourced content if needed (or write original)."
$promptLines += "6. After writing, commit and push the changes to GitHub."
$promptLines += "7. Log a summary of what you did and any insights."
$promptLines += "8. Be CONCISE in your final reply. Use under 300 words."

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

& $triggerScript -Prompt $fullPrompt -TimeoutSeconds 900

$exitCode = $LASTEXITCODE
Write-Log "Trigger exit code: $exitCode"
Write-Log "====== WEEKLY CONTENT CHECK COMPLETE ======"
exit $exitCode
