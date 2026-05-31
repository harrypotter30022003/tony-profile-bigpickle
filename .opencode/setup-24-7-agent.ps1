<#
.SYNOPSIS
    Tony Brand Master — 24/7 Agent & Dashboard Setup Script (Windows)
.DESCRIPTION
    Installs TWO Windows Scheduled Tasks:
      1. TonyBrandMaster-Agent     — opencode serve (background agent)
      2. TonyBrandMaster-Dashboard  — local monitoring dashboard (port 4097)
    Both auto-start at user logon and restart on failure.
.PARAMETER ProjectPath
    Path to the project root (default: P:\OpenCode_Projects\Tony-cv-cloud)
.PARAMETER AgentPort
    Port for the opencode agent server (default: 4096)
.PARAMETER DashboardPort
    Port for the monitoring dashboard (default: 4097)
.EXAMPLE
    # Run as Administrator to install and start everything:
    .\.opencode\setup-24-7-agent.ps1

    # Custom ports:
    .\.opencode\setup-24-7-agent.ps1 -AgentPort 4096 -DashboardPort 8080
.NOTES
    Run this script from the tony-portfolio directory.
    Requires Administrator privileges to create scheduled tasks.
#>

param(
    [string]$ProjectPath = "P:\OpenCode_Projects\Tony-cv-cloud",
    [int]$AgentPort = 4096,
    [int]$DashboardPort = 4097
)

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Tony Brand Master — 24/7 Agent + Dashboard    " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Verify opencode is installed ────────────────────────────────────

$opencodePath = Get-Command "opencode" -ErrorAction SilentlyContinue
if (-not $opencodePath) {
    Write-Host "❌ opencode CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ opencode found at: $($opencodePath.Source)" -ForegroundColor Green

# ─── Step 2: Verify project path ─────────────────────────────────────────────

if (-not (Test-Path -LiteralPath $ProjectPath)) {
    Write-Host "❌ Project path not found: $ProjectPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project path verified: $ProjectPath" -ForegroundColor Green

# ─── Step 3: Verify dashboard script exists ──────────────────────────────────

$dashboardScript = Join-Path -Path $ProjectPath -ChildPath ".opencode\scripts\dashboard.cjs"
if (-not (Test-Path -LiteralPath $dashboardScript)) {
    Write-Host "❌ Dashboard script not found at: $dashboardScript" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dashboard script found" -ForegroundColor Green

# ─── Step 4: Create startup batch files ──────────────────────────────────────

$opencodeExe = (Get-Command "opencode").Source

# Agent startup script
$agentScriptPath = Join-Path -Path $ProjectPath -ChildPath ".opencode\start-agent.bat"
$agentBatchContent = @"
@echo off
cd /d "$ProjectPath"
echo [%date% %time%] Starting Tony Brand Master agent... >> "$ProjectPath\.opencode\logs\agent-boot.log"
start /B "" "$opencodeExe" serve --port %AGENT_PORT% --hostname 127.0.0.1
echo [%date% %time%] Agent started on port %AGENT_PORT% >> "$ProjectPath\.opencode\logs\agent-boot.log"
"@

# Dashboard startup script
$dashboardScriptPath = Join-Path -Path $ProjectPath -ChildPath ".opencode\start-dashboard.bat"
$dashboardBatchContent = @"
@echo off
cd /d "$ProjectPath"
echo [%date% %time%] Starting Tony Brand Master dashboard... >> "$ProjectPath\.opencode\logs\dashboard-boot.log"
start /B "" "node" "$dashboardScript" --port=%DASHBOARD_PORT%
echo [%date% %time%] Dashboard started on port %DASHBOARD_PORT% >> "$ProjectPath\.opencode\logs\dashboard-boot.log"
"@

# Use PowerShell to write batch files with correct ports
$agentBatchContent = $agentBatchContent.Replace('%AGENT_PORT%', "$AgentPort")
$dashboardBatchContent = $dashboardBatchContent.Replace('%DASHBOARD_PORT%', "$DashboardPort")

Set-Content -Path $agentScriptPath -Value $agentBatchContent -Encoding ASCII
Set-Content -Path $dashboardScriptPath -Value $dashboardBatchContent -Encoding ASCII
Write-Host "✅ Startup scripts created" -ForegroundColor Green

# ─── Step 5: Create Scheduled Tasks ──────────────────────────────────────────

$agentTaskName = "TonyBrandMaster-Agent"
$dashboardTaskName = "TonyBrandMaster-Dashboard"

# Helper to create a scheduled task
function Register-BackgroundTask {
    param($TaskName, $TaskDescription, $BatchFilePath)
    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$BatchFilePath`""
    $trigger = New-ScheduledTaskTrigger -AtLogon
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Limited
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    try {
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $TaskDescription -Force
        Write-Host "  ✅ '$TaskName' registered" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Failed to register '$TaskName': $_" -ForegroundColor Red
        throw
    }
}

Write-Host "`n📋 Registering scheduled tasks (may prompt for admin)..." -ForegroundColor Yellow

Register-BackgroundTask -TaskName $agentTaskName -TaskDescription "Tony Brand Master 24/7 Agent — opencode serve" -BatchFilePath $agentScriptPath
Register-BackgroundTask -TaskName $dashboardTaskName -TaskDescription "Tony Brand Master Local Dashboard — http://localhost:$DashboardPort" -BatchFilePath $dashboardScriptPath

Write-Host "✅ Both tasks registered successfully!" -ForegroundColor Green

# ─── Step 6: Start services now ──────────────────────────────────────────────

Write-Host "`n🚀 Starting services NOW..." -ForegroundColor Cyan

try {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$agentScriptPath`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$dashboardScriptPath`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "✅ Services started!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start services: $_" -ForegroundColor Red
}

# ─── Step 7: Verify they're running ──────────────────────────────────────────

Write-Host "`n🔍 Verifying services..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if dashboard is responding
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$DashboardPort/api/status" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Dashboard is LIVE at http://localhost:$DashboardPort" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Dashboard not yet responding. It may take a few more seconds." -ForegroundColor Yellow
    Write-Host "   Try opening http://localhost:$DashboardPort in your browser." -ForegroundColor White
}

# ─── Summary ─────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ✅ Setup Complete!                            " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 WHAT WAS INSTALLED:" -ForegroundColor White
Write-Host "  1. TonyBrandMaster-Agent (port $AgentPort)" -ForegroundColor White
Write-Host "     → Background AI agent that monitors & improves the site" -ForegroundColor White
Write-Host "  2. TonyBrandMaster-Dashboard (port $DashboardPort)" -ForegroundColor White
Write-Host "     → Local web dashboard for monitoring agent activity" -ForegroundColor White
Write-Host ""
Write-Host "📖 HOW TO USE:" -ForegroundColor Yellow
Write-Host "  📍 Open dashboard:  http://localhost:$DashboardPort" -ForegroundColor White
Write-Host "  🔗 Attach to agent: opencode attach http://localhost:$AgentPort" -ForegroundColor White
Write-Host "  🩺 Health check:    node .opencode\scripts\health-check.cjs" -ForegroundColor White
Write-Host "  📝 View logs:       node .opencode\lib\logger.cjs tail agent 10" -ForegroundColor White
Write-Host ""
Write-Host "🛑 HOW TO STOP:" -ForegroundColor Yellow
Write-Host "  schtasks /End /TN `"$agentTaskName`"" -ForegroundColor White
Write-Host "  schtasks /End /TN `"$dashboardTaskName`"" -ForegroundColor White
Write-Host ""
Write-Host "🗑️  HOW TO REMOVE:" -ForegroundColor Yellow
Write-Host "  schtasks /Delete /TN `"$agentTaskName`" /F" -ForegroundColor White
Write-Host "  schtasks /Delete /TN `"$dashboardTaskName`" /F" -ForegroundColor White
Write-Host ""
