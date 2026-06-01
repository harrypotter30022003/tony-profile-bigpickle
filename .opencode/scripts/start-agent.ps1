<#
.SYNOPSIS
  Starts the Tony Brand Master agent infrastructure on Windows startup/login.
  Launches the monitoring dashboard and starts the headless OpenCode server.

.DESCRIPTION
  This script is designed to run via Windows Task Scheduler at user login.
  It starts:
    1. The health monitoring dashboard (port 4097)
    2. The OpenCode headless server (port 4096) for autonomous agent operation

  Logs everything to .opencode/logs/agent-startup.log
#>

param(
  [switch]$NoDashboard,
  [switch]$NoServer
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$LogFile = Join-Path $ProjectRoot ".opencode\logs\agent-startup.log"
$DashboardScript = Join-Path $ProjectRoot ".opencode\scripts\dashboard.cjs"
$StartupTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Ensure logs directory exists
$LogDir = Split-Path $LogFile -Parent
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
  param([string]$Message)
  "$(Get-Date -Format 'HH:mm:ss') | $Message" | Out-File -FilePath $LogFile -Append
  Write-Host "$Message"
}

Write-Log "====== Tony Brand Master Agent Starting ======"
Write-Log "Project: $ProjectRoot"
Write-Log "PID: $([System.Diagnostics.Process]::GetCurrentProcess().Id)"

# ── Step 1: Start the Dashboard ──────────────────────────────────────────
if (-not $NoDashboard) {
  # Check if dashboard is already running
  $existingDashboard = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*dashboard.cjs*" }
  
  if ($existingDashboard) {
    Write-Log "Dashboard already running (PID $($existingDashboard.Id)). Skipping."
  } else {
    Write-Log "Starting monitoring dashboard on port 4097..."
    $dashboardLog = Join-Path $LogDir "dashboard.log"
    
    try {
      $null = Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList @(
        "`"$DashboardScript`"", "--port=4097"
      )
      Write-Log "Dashboard started successfully."
    } catch {
      Write-Log "ERROR starting dashboard: $_"
    }
  }
}

# ── Step 2: Start the OpenCode Headless Server ──────────────────────────
if (-not $NoServer) {
  $existingServer = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*opencode*serve*" }
  
  if ($existingServer) {
    Write-Log "OpenCode headless server already running (PID $($existingServer.Id)). Skipping."
  } else {
    Write-Log "Starting OpenCode headless server on port 4096..."
    $serverLog = Join-Path $LogDir "opencode-server.log"
    
    try {
      $null = Start-Process -WindowStyle Hidden -FilePath "opencode.cmd" -ArgumentList @(
        "serve", "--port=4096", "--hostname=127.0.0.1"
      ) -WorkingDirectory $ProjectRoot
      Write-Log "OpenCode server started."
    } catch {
      Write-Log "ERROR starting OpenCode server: $_"
    }
  }
}

# ── Step 3: Quick health check ──────────────────────────────────────────
Start-Sleep -Seconds 3
try {
  $healthResult = node (Join-Path $ProjectRoot ".opencode\scripts\health-check.cjs") 2>&1
  Write-Log "Initial health check: OK"
} catch {
  Write-Log "Initial health check error (non-critical): $_"
}

Write-Log "====== Agent startup complete ======"
Write-Log ""
