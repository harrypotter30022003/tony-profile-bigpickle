@echo off
cd /d "%~dp0.."
echo Starting Tony Brand Master Dashboard...
start /B "" node ".opencode\scripts\dashboard.cjs" --port=4097
echo Dashboard starting on http://localhost:4097
echo.
echo To also start the agent, run in another terminal:
echo   opencode serve --port 4096 --hostname 127.0.0.1
echo.
echo To open the dashboard:
echo   start http://localhost:4097
