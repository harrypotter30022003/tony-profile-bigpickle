@echo off
REM ===============================================================
REM  Setup Tony Brand Master Scheduled Tasks (Run as Administrator)
REM ===============================================================
REM  This batch file requests elevation to admin, then runs the
REM  PowerShell registration script that creates Windows Scheduled
REM  Tasks for autonomous agent operation.
REM ===============================================================

echo ==============================================
echo  Tony Brand Master - Task Scheduler Setup
echo ==============================================
echo.
echo This script requires Administrator privileges to
echo register Windows Scheduled Tasks.
echo.
echo Tasks to create:
echo   1. TonyBrandMaster\Startup       - At logon
echo   2. TonyBrandMaster\Nightly        - Daily at 2:00 AM
echo   3. TonyBrandMaster\WeeklyContent  - Sunday at 11:00 PM
echo   4. TonyBrandMaster\MonthlySEO     - 1st of month at 1:00 AM
echo.

REM Self-elevate: if not admin, restart with admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Not running as Administrator.
    echo [INFO] Requesting elevation...
    echo.
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo [OK] Running with Administrator privileges.
echo.

REM Run the PowerShell registration script
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\register-tasks.ps1"

echo.
echo ==============================================
echo  Setup complete! Press any key to exit.
echo ==============================================
pause
