# Run the 24/7 agent setup with admin privileges
$scriptPath = Join-Path -Path $PSScriptRoot -ChildPath "setup-24-7-agent.ps1"
Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -Wait
