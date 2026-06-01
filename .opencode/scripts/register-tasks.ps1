<#
.SYNOPSIS
  One-time setup: Registers Windows Scheduled Tasks for Tony Brand Master.
  Also creates a startup shortcut in the Startup folder.

.DESCRIPTION
  Registers the following tasks:
    1. TonyBrandMaster-Startup      — Starts dashboard + headless server at login
    2. TonyBrandMaster-Nightly       — Runs nightly health review at 2:00 AM
    3. TonyBrandMaster-WeeklyContent — Runs weekly content check on Sundays at 11:00 PM
    4. TonyBrandMaster-MonthlySEO    — Runs monthly SEO audit on 1st at 1:00 AM

  Run this script once (as Administrator) to register all tasks:
    powershell -ExecutionPolicy Bypass -File .opencode\scripts\register-tasks.ps1
#>

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
$LogDir = Join-Path $ProjectRoot ".opencode\logs"
$StartupScript = Join-Path $ProjectRoot ".opencode\scripts\start-agent.ps1"
$TasksDir = Join-Path $ProjectRoot ".opencode\tasks"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Tony Brand Master - Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

function Register-Task {
  param(
    [string]$Name,
    [string]$Description,
    [string]$Trigger,
    [string]$ScriptPath
  )

  $TaskPath = "\TonyBrandMaster\"
  $fullTaskName = "$TaskPath$Name"
  $psExe = "powershell.exe"
  $psArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

  # Check if task already exists
  $existing = schtasks /query /tn "$fullTaskName" 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  [UPDATE] $Name - updating existing task..." -ForegroundColor Yellow
    schtasks /change /tn "$fullTaskName" /tr "`"$psExe`" $psArgs" 2>&1 | Out-Null
  } else {
    Write-Host "  [CREATE] $Name" -ForegroundColor Green
  }

  # Build schtasks command
  $cmd = "schtasks /create /tn `"$fullTaskName`" /tr `"`"$psExe`" $psArgs`" /sc $Trigger /ru `"$env:USERNAME`" /it /f /rl HIGHEST"
  $result = Invoke-Expression $cmd 2>&1

  if ($LASTEXITCODE -eq 0) {
    Write-Host "    $result" -ForegroundColor Green
  } else {
    Write-Host "    ERROR: $result" -ForegroundColor Red
  }

  # Set description separately
  schtasks /change /tn "$fullTaskName" /sd "$Description" 2>&1 | Out-Null
}

# ── 1. Startup task - runs at every user login ──────────────────────────
Write-Host "`nStep 1: Registering startup task (ONLOGON)..." -ForegroundColor Yellow
Register-Task -Name "Startup" -Trigger "ONLOGON" `
  -Description "Starts Tony Brand Master dashboard and headless OpenCode server" `
  -ScriptPath $StartupScript

# ── 2. Nightly review - daily at 2:00 AM ────────────────────────────────
Write-Host "`nStep 2: Registering nightly review (2:00 AM daily)..." -ForegroundColor Yellow
Register-Task -Name "Nightly" -Trigger "DAILY /st 02:00" `
  -Description "Runs nightly site health checks for Tony Brand Master" `
  -ScriptPath (Join-Path $TasksDir "nightly-task.ps1")

# ── 3. Weekly content check - Sundays at 11:00 PM ──────────────────────
Write-Host "`nStep 3: Registering weekly content check (Sun 11:00 PM)..." -ForegroundColor Yellow
Register-Task -Name "WeeklyContent" -Trigger "WEEKLY /d SUN /st 23:00" `
  -Description "Checks content freshness and analytics for Tony Brand Master" `
  -ScriptPath (Join-Path $TasksDir "weekly-content-task.ps1")

# ── 4. Monthly SEO audit - 1st of month at 1:00 AM ─────────────────────
Write-Host "`nStep 4: Registering monthly SEO audit (1st @ 1:00 AM)..." -ForegroundColor Yellow
Register-Task -Name "MonthlySEO" -Trigger "MONTHLY /d 1 /st 01:00" `
  -Description "Runs monthly SEO audit for Tony Brand Master" `
  -ScriptPath (Join-Path $TasksDir "monthly-seo-task.ps1")

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tasks registered under \TonyBrandMaster\:"
Write-Host "  Startup       - every LOGON (starts dashboard + server)" -ForegroundColor Green
Write-Host "  Nightly       - 2:00 AM daily" -ForegroundColor Green
Write-Host "  WeeklyContent - Sundays at 11:00 PM" -ForegroundColor Green
Write-Host "  MonthlySEO    - 1st of month at 1:00 AM" -ForegroundColor Green
Write-Host ""

# ── Persist OPENCODE_SERVER_PASSWORD as user env var ──────────────────
# Scheduled tasks don't inherit interactive session env vars. The task
# scripts can read the password from .opencode\.opencode-server-password,
# but we ALSO persist it as a user env var for convenience.
$passwordFile = Join-Path $ProjectRoot ".opencode\.opencode-server-password"
if (Test-Path $passwordFile) {
  $password = (Get-Content $passwordFile -Raw).Trim()
  if ($password) {
    [Environment]::SetEnvironmentVariable("OPENCODE_SERVER_PASSWORD", $password, "User")
    [Environment]::SetEnvironmentVariable("OPENCODE_SERVER_USERNAME", "opencode", "User")
    Write-Host "Persisted OPENCODE_SERVER_PASSWORD to user environment." -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Verification command:" -ForegroundColor Gray
Write-Host "  schtasks /query /tn `"TonyBrandMaster`" /v" -ForegroundColor Gray
Write-Host "  powershell -File .opencode\scripts\verify-setup.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Start the dashboard right now:" -ForegroundColor Gray
Write-Host "  .opencode\start-now.bat" -ForegroundColor Gray
Write-Host ""

# ── Create startup shortcut in the User's Startup folder ────────────────
$startupFolder = [Environment]::GetFolderPath("Startup")
Write-Host "Creating startup shortcut in: $startupFolder" -ForegroundColor Gray

# Remove old .url shortcut if it exists
$oldShortcut = Join-Path $startupFolder "TonyBrandMaster-Dashboard.url"
if (Test-Path $oldShortcut) { Remove-Item $oldShortcut -Force }

# Create proper .lnk shortcut to the VBS launcher (runs silently, no window)
$vbsPath = Join-Path $ProjectRoot ".opencode\launch-agent.vbs"
$shortcutPath = Join-Path $startupFolder "TonyBrandMaster-Dashboard.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $ProjectRoot
$shortcut.Description = "Tony Brand Master - monitoring dashboard + agent server"
$shortcut.WindowStyle = 7
$shortcut.Save()

Write-Host "Done! Dashboard will start silently on login." -ForegroundColor Green
