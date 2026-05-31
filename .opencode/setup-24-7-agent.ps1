# Tony Brand Master — 24/7 Agent Setup Script (Windows)
# Run this script as Administrator to install the agent as a background service.
# This creates a Windows Task Scheduler task that starts opencode serve on boot.

param(
    [string]$ProjectPath = "P:\OpenCode_Projects\Tony-cv-cloud",
    [int]$Port = 4096
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tony Brand Master — 24/7 Agent Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify opencode is installed
$opencodePath = Get-Command "opencode" -ErrorAction SilentlyContinue
if (-not $opencodePath) {
    Write-Host "❌ opencode CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ opencode found at: $($opencodePath.Source)" -ForegroundColor Green

# Step 2: Test that the project path exists
if (-not (Test-Path -LiteralPath $ProjectPath)) {
    Write-Host "❌ Project path not found: $ProjectPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project path verified: $ProjectPath" -ForegroundColor Green

# Step 3: Test run opencode serve (quick check, then kill)
Write-Host "🧪 Testing opencode serve on port $Port..." -ForegroundColor Yellow
try {
    $process = Start-Process -FilePath "opencode" -ArgumentList "serve --port $Port --hostname 127.0.0.1" -WorkingDirectory $ProjectPath -NoNewWindow -PassThru
    Start-Sleep -Seconds 3
    if (-not $process.HasExited) {
        Write-Host "✅ opencode serve started successfully on port $Port" -ForegroundColor Green
        $process.Kill()
        Write-Host "   (Test process stopped)" -ForegroundColor Gray
    } else {
        Write-Host "❌ opencode serve exited immediately. Check installation." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to start opencode serve: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Create Windows Task Scheduler task
$taskName = "TonyBrandMaster-Agent"
$taskDescription = "Tony Brand Master 24/7 Agent — opencode serve for me.tony.do project"
$opencodeExe = (Get-Command "opencode").Source
$scriptPath = Join-Path -Path $ProjectPath -ChildPath ".opencode\start-agent.bat"

# Create a batch file that starts the agent (more reliable than inline command)
$batchContent = @"
@echo off
cd /d "$ProjectPath"
echo [%date% %time%] Starting Tony Brand Master agent... >> "$ProjectPath\.opencode\logs\agent-boot.log"
start /B "" "$opencodeExe" serve --port $Port --hostname 127.0.0.1
echo [%date% %time%] Agent started on port $Port >> "$ProjectPath\.opencode\logs\agent-boot.log"
"@

Set-Content -Path $scriptPath -Value $batchContent -Encoding ASCII
Write-Host "✅ Startup script created: $scriptPath" -ForegroundColor Green

# Register the scheduled task (runs at user logon)
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtLogon
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $taskDescription -Force
    Write-Host "✅ Scheduled task '$taskName' created successfully!" -ForegroundColor Green
    Write-Host "   The agent will start automatically at your next logon." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    Write-Host "   Try running this script as Administrator." -ForegroundColor Yellow
    exit 1
}

# Step 5: Start the agent now
Write-Host ""
Write-Host "🚀 Starting Tony Brand Master agent NOW..." -ForegroundColor Cyan
try {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$scriptPath`"" -WindowStyle Hidden
    Write-Host "✅ Agent started! You can now connect to it from another terminal:" -ForegroundColor Green
    Write-Host "   opencode attach http://localhost:$Port" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to start agent: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!                        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor White
Write-Host "   - Agent will auto-start on login (Task Scheduler)" -ForegroundColor White
Write-Host "   - Port: $Port" -ForegroundColor White
Write-Host "   - Project: $ProjectPath" -ForegroundColor White
Write-Host "   - Agent prompt: personal-brand-pm.md (tony-brand-master)" -ForegroundColor White
Write-Host ""
Write-Host "📖 To connect: opencode attach http://localhost:$Port" -ForegroundColor Yellow
Write-Host "📖 To stop:    schtasks /End /TN `"$taskName`"" -ForegroundColor Yellow
Write-Host "📖 To remove:  schtasks /Delete /TN `"$taskName`" /F" -ForegroundColor Yellow
Write-Host ""
