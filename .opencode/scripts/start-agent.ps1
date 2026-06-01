<#
.SYNOPSIS
  Starts the Tony Brand Master agent infrastructure on Windows startup/login.
  Launches the monitoring dashboard and starts the headless OpenCode server.

.DESCRIPTION
  This script is designed to run via Windows Task Scheduler at user login
  OR via the Startup folder shortcut. It starts:
    1. The health monitoring dashboard (port 4097)
    2. The OpenCode headless server (port 4096) for autonomous agent operation

  Logs everything to .opencode/logs/agent-startup.log
#>

param(
  [switch]$NoDashboard,
  [switch]$NoServer,
  [int]$DashboardPort = 4097,
  [int]$ServerPort = 4096
)

# ── Path resolution with safety checks ──────────────────────────────────
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Hardcoded fallback in case $PSScriptRoot is empty (e.g., when run via -File with stdin)
if (-not $ProjectRoot -or -not (Test-Path $ProjectRoot)) {
  $ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
}

$LogDir = Join-Path $ProjectRoot ".opencode\logs"
$LogFile = Join-Path $LogDir "agent-startup.log"
$DashboardScript = Join-Path $ProjectRoot ".opencode\scripts\dashboard.cjs"

# Ensure logs directory exists
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-Log {
  param([string]$Message)
  $entry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') | $Message"
  $entry | Out-File -FilePath $LogFile -Append
  Write-Host $entry
}

function Test-Port {
  param([int]$Port)
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return $null -ne $connection
}

function Find-OpenCodeBinary {
  # Try common install locations in order
  $candidates = @(
    (Join-Path $env:APPDATA "npm\opencode.cmd"),
    "C:\Program Files\opencode\opencode.cmd",
    "C:\Program Files (x86)\opencode\opencode.cmd",
    (Join-Path $env:LOCALAPPDATA "opencode\opencode.cmd")
  )
  foreach ($p in $candidates) {
    if ($p -and (Test-Path $p)) { return $p }
  }
  # Fallback: check if `opencode` is on PATH
  $onPath = (Get-Command "opencode.cmd" -ErrorAction SilentlyContinue)
  if ($onPath) { return $onPath.Source }
  if (Get-Command "opencode" -ErrorAction SilentlyContinue) {
    return (Get-Command "opencode").Source
  }
  return $null
}

Write-Log "====== Tony Brand Master Agent Starting ======"
Write-Log "Project: $ProjectRoot"
Write-Log "PID: $([System.Diagnostics.Process]::GetCurrentProcess().Id)"
Write-Log "User: $env:USERNAME"

# ── Pre-flight checks ──────────────────────────────────────────────────
if (-not (Test-Path $ProjectRoot)) {
  Write-Log "FATAL: Project root not found at $ProjectRoot"
  exit 1
}

if (-not (Test-Path $DashboardScript)) {
  Write-Log "FATAL: Dashboard script not found at $DashboardScript"
  exit 1
}

# ── Step 1: Start the Dashboard ──────────────────────────────────────────
if (-not $NoDashboard) {
  if (Test-Port -Port $DashboardPort) {
    Write-Log "Dashboard already listening on port $DashboardPort. Skipping."
  } else {
    Write-Log "Starting monitoring dashboard on port $DashboardPort..."
    try {
      $null = Start-Process -WindowStyle Hidden -FilePath "node" `
        -ArgumentList @("`"$DashboardScript`"", "--port=$DashboardPort") `
        -RedirectStandardOutput (Join-Path $LogDir "dashboard-stdout.log") `
        -RedirectStandardError (Join-Path $LogDir "dashboard-stderr.log")
      Write-Log "Dashboard process launched (check dashboard-stdout.log for status)."

      # Wait briefly and verify it bound the port
      $waited = 0
      while ($waited -lt 10 -and -not (Test-Port -Port $DashboardPort)) {
        Start-Sleep -Seconds 1
        $waited++
      }
      if (Test-Port -Port $DashboardPort) {
        Write-Log "Dashboard confirmed listening on port $DashboardPort (after ${waited}s)."
      } else {
        Write-Log "WARNING: Dashboard did not bind port $DashboardPort within 10s. Check dashboard-stderr.log."
      }
    } catch {
      Write-Log "ERROR starting dashboard: $_"
    }
  }
}

# ── Step 2: Start the OpenCode Headless Server ──────────────────────────
if (-not $NoServer) {
  if (Test-Port -Port $ServerPort) {
    Write-Log "OpenCode headless server already listening on port $ServerPort. Skipping."
  } else {
    $opencodeBin = Find-OpencodeBinary
    if (-not $opencodeBin) {
      Write-Log "ERROR: opencode binary not found. Skipping headless server."
      Write-Log "  Searched: %APPDATA%\npm\opencode.cmd, Program Files, %LOCALAPPDATA%\opencode\, PATH"
    } else {
      # Set auth env vars. Password stored in .opencode\.opencode-server-password (machine-local).
      # If the file doesn't exist, generate a random one.
      $passwordFile = Join-Path $ProjectRoot ".opencode\.opencode-server-password"
      if (Test-Path $passwordFile) {
        $serverPassword = Get-Content $passwordFile -Raw | ConvertTo-Json | ConvertFrom-Json
      } else {
        $serverPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
        $serverPassword | Out-File -FilePath $passwordFile -Encoding ASCII -NoNewline
        Write-Log "Generated new server password (saved to .opencode\.opencode-server-password)."
      }

      Write-Log "Starting OpenCode headless server (binary: $opencodeBin) on port $ServerPort..."
      try {
        # Use cmd.exe with set to pass env vars to the child process
        $envPrefix = "set OPENCODE_SERVER_PASSWORD=$serverPassword&& set OPENCODE_SERVER_USERNAME=opencode&& "
        $fullCmd = "`"$opencodeBin`" serve --port=$ServerPort --hostname=127.0.0.1 --print-logs"
        $null = Start-Process -WindowStyle Hidden -FilePath "cmd.exe" `
          -ArgumentList "/d", "/c", "$envPrefix$fullCmd" `
          -WorkingDirectory $ProjectRoot `
          -RedirectStandardOutput (Join-Path $LogDir "opencode-server-stdout.log") `
          -RedirectStandardError (Join-Path $LogDir "opencode-server-stderr.log")
        Write-Log "OpenCode server process launched."

        $waited = 0
        while ($waited -lt 10 -and -not (Test-Port -Port $ServerPort)) {
          Start-Sleep -Seconds 1
          $waited++
        }
        if (Test-Port -Port $ServerPort) {
          Write-Log "OpenCode server confirmed listening on port $ServerPort (after ${waited}s)."

          # Persist the password for trigger-agent.ps1
          $env:OPENCODE_SERVER_PASSWORD = $serverPassword
          $env:OPENCODE_SERVER_USERNAME = "opencode"
          Write-Log "Auth env vars set for this session. trigger-agent.ps1 can now connect."
        } else {
          Write-Log "WARNING: OpenCode server did not bind port $ServerPort within 10s. Check opencode-server-stderr.log."
        }
      } catch {
        Write-Log "ERROR starting OpenCode server: $_"
      }
    }
  }
}

# ── Step 3: Quick health check ──────────────────────────────────────────
Start-Sleep -Seconds 2
try {
  $healthScript = Join-Path $ProjectRoot ".opencode\scripts\health-check.cjs"
  if (Test-Path $healthScript) {
    $healthOutput = node $healthScript 2>&1 | Out-String
    Write-Log "Health check executed. See agent-startup.log context for details."
  } else {
    Write-Log "Health check script not found, skipping."
  }
} catch {
  Write-Log "Health check error (non-critical): $_"
}

Write-Log "====== Agent startup complete ======"
Write-Log ""
