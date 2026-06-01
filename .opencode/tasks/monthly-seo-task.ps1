<#
.SYNOPSIS
  Monthly SEO Audit Task — runs 1st of every month at 1:00 AM.
  Fetches 30-day analytics, checks trends, logs findings.
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
$LogFile = Join-Path $ProjectRoot ".opencode\logs\monthly-seo-task.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"[$Timestamp] ====== MONTHLY SEO AUDIT STARTED ======" | Out-File -FilePath $LogFile -Append

# Step 1: Fetch 30-day analytics
"[$Timestamp] Fetching 30-day analytics..." | Out-File -FilePath $LogFile -Append
try {
  $analytics = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=summary&period=30d" -TimeoutSec 30
  "GA4 configured: $($analytics.configured.ga4)" | Out-File -FilePath $LogFile -Append
  "SC configured: $($analytics.configured.searchConsole)" | Out-File -FilePath $LogFile -Append
  if ($analytics.traffic) {
    "Traffic (30d): $($analytics.traffic.totalUsers) users, $($analytics.traffic.totalSessions) sessions, $($analytics.traffic.totalPageViews) page views" | Out-File -FilePath $LogFile -Append
  }
  if ($analytics.recommendations.Count -gt 0) {
    "Recommendations:" | Out-File -FilePath $LogFile -Append
    $analytics.recommendations | ForEach-Object { "  - $_" | Out-File -FilePath $LogFile -Append }
  }
} catch {
  "Analytics error: $_" | Out-File -FilePath $LogFile -Append
}

# Step 2: Fetch individual reports
"[$Timestamp] Fetching individual reports..." | Out-File -FilePath $LogFile -Append
try {
  $ga4 = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=ga4&period=30d" -TimeoutSec 30
  if ($ga4.rows) {
    "Top pages:" | Out-File -FilePath $LogFile -Append
    $ga4.rows | Select-Object -First 5 | ForEach-Object {
      "  [$($_.sessions) sessions] $($_.pageTitle) - $($_.pagePath)" | Out-File -FilePath $LogFile -Append
    }
  }
} catch {
  "GA4 detail error: $_" | Out-File -FilePath $LogFile -Append
}

try {
  $sc = Invoke-RestMethod -Uri "https://me.tony.do/api/analytics?report=sc&period=30d" -TimeoutSec 30
  if ($sc.rows) {
    "Top search queries:" | Out-File -FilePath $LogFile -Append
    $sc.rows | Select-Object -First 5 | ForEach-Object {
      "  [$($_.impressions) impressions / $($_.clicks) clicks] $($_.query)" | Out-File -FilePath $LogFile -Append
    }
  }
} catch {
  "SC detail error: $_" | Out-File -FilePath $LogFile -Append
}

# Step 3: Verify site reachability
"[$Timestamp] Checking site status..." | Out-File -FilePath $LogFile -Append
try {
  $resp = Invoke-WebRequest -Uri "https://me.tony.do" -TimeoutSec 15 -UseBasicParsing
  "Homepage: $($resp.StatusCode) ($($resp.Headers.'Content-Length' ?? 'unknown') bytes)" | Out-File -FilePath $LogFile -Append

  $sitemap = Invoke-WebRequest -Uri "https://me.tony.do/sitemap.xml" -TimeoutSec 15 -UseBasicParsing
  "Sitemap: $($sitemap.StatusCode)" | Out-File -FilePath $LogFile -Append

  $analyticsEndpoint = Invoke-WebRequest -Uri "https://me.tony.do/api/analytics?report=summary&period=7d" -TimeoutSec 15 -UseBasicParsing
  "Analytics API: $($analyticsEndpoint.StatusCode)" | Out-File -FilePath $LogFile -Append
} catch {
  "Site check error: $_" | Out-File -FilePath $LogFile -Append
}

# Step 4: Build verification
"[$Timestamp] Build check..." | Out-File -FilePath $LogFile -Append
try {
  $build = & npm run build 2>&1
  if ($LASTEXITCODE -eq 0) { "Build: OK" | Out-File -FilePath $LogFile -Append }
  else { "Build: FAILED`n$build" | Out-File -FilePath $LogFile -Append }
} catch {
  "Build error: $_" | Out-File -FilePath $LogFile -Append
}

"[$Timestamp] ====== MONTHLY SEO AUDIT COMPLETE ======" | Out-File -FilePath $LogFile -Append
