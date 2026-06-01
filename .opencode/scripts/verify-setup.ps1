<#
.SYNOPSIS
  Verifies the Tony Brand Master auto-start infrastructure.
  Run this anytime to check the status of all components.

  Usage: powershell -File verify-setup.ps1
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
Set-Location $ProjectRoot

$results = @()
$allOk = $true

function Test-Component {
  param([string]$Name, [scriptblock]$Test, [string]$FixHint = "")
  $result = @{
    Name = $Name
    Status = "?"
    Detail = ""
    Fix = $FixHint
  }
  try {
    $testResult = & $Test
    $result.Status = $testResult.Status
    $result.Detail = $testResult.Detail
    if ($testResult.Status -ne "OK" -and $testResult.Status -ne "SKIP") { $script:allOk = $false }
  } catch {
    $result.Status = "ERROR"
    $result.Detail = $_.Exception.Message
    $script:allOk = $false
  }
  $script:results += $result
}

# Test 1: Startup folder shortcut
Test-Component "Startup folder shortcut" {
  $shortcut = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\TonyBrandMaster-Dashboard.lnk"
  $old = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\TonyBrandMaster-Dashboard.url"
  if (Test-Path $shortcut) {
    @{ Status = "OK"; Detail = "Shortcut exists: $shortcut" }
  } elseif (Test-Path $old) {
    @{ Status = "ERROR"; Detail = "Old .url shortcut exists but won't execute. Delete it and re-run setup." }
  } else {
    @{ Status = "ERROR"; Detail = "No startup shortcut found." }
  }
} "Re-run .opencode\setup-tasks.bat as Administrator"

# Test 2: VBS launcher
Test-Component "VBS launcher" {
  $vbs = "$ProjectRoot\.opencode\launch-agent.vbs"
  if (Test-Path $vbs) {
    @{ Status = "OK"; Detail = "VBS file exists: $vbs" }
  } else {
    @{ Status = "ERROR"; Detail = "launch-agent.vbs missing" }
  }
}

# Test 3: Dashboard running
Test-Component "Dashboard (port 4097)" {
  $conn = Get-NetTCPConnection -LocalPort 4097 -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    try {
      $resp = Invoke-WebRequest -Uri "http://127.0.0.1:4097/api/status" -TimeoutSec 5 -UseBasicParsing
      @{ Status = "OK"; Detail = "PID $($conn.OwningProcess), API responded $($resp.StatusCode)" }
    } catch {
      @{ Status = "WARNING"; Detail = "Port open (PID $($conn.OwningProcess)) but API not responding: $_" }
    }
  } else {
    @{ Status = "ERROR"; Detail = "Port 4097 not listening" }
  }
} "Run .opencode\start-now.bat to start the dashboard"

# Test 4: OpenCode server
Test-Component "OpenCode server (port 4096)" {
  $conn = Get-NetTCPConnection -LocalPort 4096 -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    @{ Status = "OK"; Detail = "PID $($conn.OwningProcess), listening" }
  } else {
    @{ Status = "ERROR"; Detail = "Port 4096 not listening" }
  }
} "Run start-agent.ps1 to start the server"

# Test 5: Password file
Test-Component "Server password file" {
  $pf = "$ProjectRoot\.opencode\.opencode-server-password"
  if (Test-Path $pf) {
    $len = (Get-Content $pf -Raw).Trim().Length
    @{ Status = "OK"; Detail = "$len-char password in $pf" }
  } else {
    @{ Status = "WARNING"; Detail = "No password file. Will be generated on next server start." }
  }
}

# Test 6: Auth env var
Test-Component "OPENCODE_SERVER_PASSWORD env" {
  if ($env:OPENCODE_SERVER_PASSWORD) {
    @{ Status = "OK"; Detail = "Set ($($env:OPENCODE_SERVER_PASSWORD.Length) chars)" }
  } else {
    @{ Status = "WARNING"; Detail = "Not set in this session. Will be set when start-agent.ps1 runs." }
  }
} "Restart the machine, or run: `$env:OPENCODE_SERVER_PASSWORD = (Get-Content .opencode\.opencode-server-password -Raw).Trim()"

# Test 7: Scheduled tasks
Test-Component "Scheduled tasks (Task Scheduler)" {
  $taskNames = @("Startup", "Nightly", "WeeklyContent", "MonthlySEO")
  $found = @()
  $missing = @()
  foreach ($name in $taskNames) {
    $result = schtasks /query /tn "TonyBrandMaster\$name" 2>$null
    if ($LASTEXITCODE -eq 0) { $found += $name }
    else { $missing += $name }
  }
  if ($found.Count -eq $taskNames.Count) {
    @{ Status = "OK"; Detail = "All $($taskNames.Count) tasks registered" }
  } elseif ($found.Count -gt 0) {
    @{ Status = "WARNING"; Detail = "Found: $($found -join ', '). Missing: $($missing -join ', ')" }
  } else {
    @{ Status = "ERROR"; Detail = "No TonyBrandMaster tasks registered" }
  }
} "Right-click .opencode\setup-tasks.bat → 'Run as administrator'"

# Test 8: Live trigger test
Test-Component "Live trigger test" {
  if (-not $env:OPENCODE_SERVER_PASSWORD) {
    $pf = "$ProjectRoot\.opencode\.opencode-server-password"
    if (Test-Path $pf) {
      $env:OPENCODE_SERVER_PASSWORD = (Get-Content $pf -Raw).Trim()
    } else {
      return @{ Status = "SKIP"; Detail = "No password available, cannot test trigger" }
    }
  }
  $resp = Invoke-WebRequest -Uri "http://127.0.0.1:4096/session" -Method POST `
    -Headers @{Authorization="Basic $([Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('opencode:' + $env:OPENCODE_SERVER_PASSWORD)))"; "Content-Type"="application/json"} `
    -Body '{"title":"verify-setup test"}' -TimeoutSec 15 -UseBasicParsing
  if ($resp.StatusCode -eq 200) {
    $sessionId = ($resp.Content | ConvertFrom-Json).id
    @{ Status = "OK"; Detail = "Created session: $sessionId" }
  } else {
    @{ Status = "WARNING"; Detail = "Got HTTP $($resp.StatusCode)" }
  }
}

# Test 9: Git status
Test-Component "Git working tree" {
  $status = git status --porcelain 2>&1
  if (-not $status) {
    @{ Status = "OK"; Detail = "Clean" }
  } else {
    @{ Status = "WARNING"; Detail = "$((($status | Measure-Object -Line).Lines)) uncommitted file(s)" }
  }
}

# Test 10: Build
Test-Component "Build" {
  $build = & npm run build 2>&1
  if ($LASTEXITCODE -eq 0) {
    @{ Status = "OK"; Detail = "Built in $(($build | Select-String -Pattern 'built in (\d+)ms').Matches.Groups[1].Value)ms" }
  } else {
    @{ Status = "ERROR"; Detail = "Build failed" }
  }
}

# ── Display results ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Tony Brand Master - Setup Verification" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

foreach ($r in $results) {
  $icon = switch ($r.Status) {
    "OK" { "[OK]" }
    "WARNING" { "[WARN]" }
    "ERROR" { "[FAIL]" }
    "SKIP" { "[SKIP]" }
    default { "[?]" }
  }
  $color = switch ($r.Status) {
    "OK" { "Green" }
    "WARNING" { "Yellow" }
    "ERROR" { "Red" }
    "SKIP" { "Gray" }
    default { "White" }
  }
  Write-Host ("  {0,-6} {1,-30} {2}" -f $icon, $r.Name, $r.Detail) -ForegroundColor $color
  if ($r.Fix -and $r.Status -ne "OK") {
    Write-Host "         -> Fix: $($r.Fix)" -ForegroundColor DarkYellow
  }
}

Write-Host ""
if ($allOk) {
  Write-Host "ALL GREEN: Setup is fully operational." -ForegroundColor Green
} else {
  $errCount = ($results | Where-Object { $_.Status -eq "ERROR" }).Count
  $warnCount = ($results | Where-Object { $_.Status -eq "WARNING" }).Count
  Write-Host "ISSUES: $errCount error(s), $warnCount warning(s)" -ForegroundColor Yellow
}
Write-Host ""
