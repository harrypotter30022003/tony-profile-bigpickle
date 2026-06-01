<#
.SYNOPSIS
  Weekly Content Task — runs every Sunday at 11:00 PM via Windows Task Scheduler.
  Checks content freshness and logs analytics for the agent to review.
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
$LogFile = Join-Path $ProjectRoot ".opencode\logs\weekly-content-task.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"[$Timestamp] ====== WEEKLY CONTENT CHECK STARTED ======" | Out-File -FilePath $LogFile -Append

# Step 1: Fetch analytics (7-day window)
"[$Timestamp] Fetching 7-day analytics..." | Out-File -FilePath $LogFile -Append
try {
  $analytics = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=summary&period=7d" -TimeoutSec 30
  "GA4 configured: $($analytics.configured.ga4)" | Out-File -FilePath $LogFile -Append
  "SC configured: $($analytics.configured.searchConsole)" | Out-File -FilePath $LogFile -Append
  if ($analytics.traffic) {
    "Traffic: $($analytics.traffic.totalUsers) users, $($analytics.traffic.totalSessions) sessions" | Out-File -FilePath $LogFile -Append
  }
  if ($analytics.recommendations.Count -gt 0) {
    "Recommendations:" | Out-File -FilePath $LogFile -Append
    $analytics.recommendations | ForEach-Object { "  - $_" | Out-File -FilePath $LogFile -Append }
  }
} catch {
  "Analytics error: $_" | Out-File -FilePath $LogFile -Append
}

# Step 2: Count and list articles
"[$Timestamp] Checking content freshness..." | Out-File -FilePath $LogFile -Append
try {
  $data = Invoke-RestMethod -Uri "https://me.tony.do/api/data" -TimeoutSec 15
  $articles = $data.blog
  "Total articles: $($articles.Count)" | Out-File -FilePath $LogFile -Append

  # Check last publish date
  $sorted = $articles | Sort-Object @{Expression={[datetime]::ParseExact($_.date, 'yyyy-MM-dd', $null)}; Descending=$true}
  $latest = $sorted | Select-Object -First 1
  $lastDate = [datetime]::ParseExact($latest.date, 'yyyy-MM-dd', $null)
  $daysSinceLastPost = [math]::Floor((Get-Date - $lastDate).TotalDays)
  "Last article: '$($latest.title)' — $($latest.date) ($daysSinceLastPost days ago)" | Out-File -FilePath $LogFile -Append

  if ($daysSinceLastPost -gt 14) {
    "⚠️ STALE: $daysSinceLastPost days since last post. Content creation needed." | Out-File -FilePath $LogFile -Append
  } else {
    "Content fresh: OK" | Out-File -FilePath $LogFile -Append
  }
} catch {
  "Content check error: $_" | Out-File -FilePath $LogFile -Append
}

# Step 3: Check build
"[$Timestamp] Verifying build..." | Out-File -FilePath $LogFile -Append
try {
  $build = & npm run build 2>&1
  if ($LASTEXITCODE -eq 0) { "Build: OK" | Out-File -FilePath $LogFile -Append }
  else { "Build: FAILED" | Out-File -FilePath $LogFile -Append }
} catch {
  "Build error: $_" | Out-File -FilePath $LogFile -Append
}

"[$Timestamp] ====== WEEKLY CONTENT CHECK COMPLETE ======" | Out-File -FilePath $LogFile -Append
