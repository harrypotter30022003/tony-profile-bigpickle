<#
.SYNOPSIS
  Triggers the Tony Brand Master OpenCode agent via the HTTP API.
  Sends a prompt to a running headless OpenCode server and logs the result.

.DESCRIPTION
  This script is the bridge between Windows Scheduled Tasks and the
  AI-powered agent. It calls the OpenCode server's HTTP API:

    POST /session                  -> Create new session
    POST /session/{id}/message     -> Send prompt, wait for response

  Requirements:
    - OpenCode serve must be running with OPENCODE_SERVER_PASSWORD env var
    - The server defaults to http://127.0.0.1:4096

  Usage:
    powershell -File trigger-agent.ps1 -Prompt "Run the nightly review"
    powershell -File trigger-agent.ps1 -PromptFile .opencode\tasks\nightly-prompt.md

  Logs to .opencode/logs/agent-trigger.log
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$Prompt,

  [int]$ServerPort = 4096,

  [int]$TimeoutSeconds = 300,

  [string]$AgentName = "tony-brand-master",

  [string]$LogFile = ""
)

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
Set-Location $ProjectRoot

# Resolve log file path
if (-not $LogFile) {
  $LogDir = Join-Path $ProjectRoot ".opencode\logs"
  if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
  $LogFile = Join-Path $LogDir "agent-trigger.log"
}

function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  $entry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
  $entry | Out-File -FilePath $LogFile -Append
  Write-Host $entry
}

# ── Read auth from env (must match what started the server) ─────────────
$username = $env:OPENCODE_SERVER_USERNAME
if (-not $username) { $username = "opencode" }
$password = $env:OPENCODE_SERVER_PASSWORD
if (-not $password) {
  Write-Log "ERROR: OPENCODE_SERVER_PASSWORD env var not set." "ERROR"
  Write-Log "  Set it before running this script, matching the password used to start opencode serve." "ERROR"
  exit 1
}

$cred64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:$password"))
$authHeader = @{Authorization="Basic $cred64"; "Content-Type"="application/json"}
$base = "http://127.0.0.1:$ServerPort"

Write-Log "====== Triggering agent ======"
Write-Log "Server: $base"
Write-Log "Agent: $AgentName"
Write-Log "Prompt length: $($Prompt.Length) chars"
Write-Log "Timeout: ${TimeoutSeconds}s"

# ── Check server is up ──────────────────────────────────────────────────
$conn = Get-NetTCPConnection -LocalPort $ServerPort -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
  Write-Log "ERROR: No server listening on port $ServerPort." "ERROR"
  Write-Log "  Start it with: start-agent.ps1" "ERROR"
  exit 2
}

# ── Step 1: Create session ─────────────────────────────────────────────
Write-Log "Creating session..."
try {
  $sessionResp = Invoke-WebRequest -Uri "$base/session" -Method POST -Headers $authHeader `
    -Body ('{"title":"Scheduled: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm') + '"}') `
    -TimeoutSec 30 -UseBasicParsing
  $sessionJson = $sessionResp.Content | ConvertFrom-Json
  $sessionId = $sessionJson.id
  Write-Log "Session created: $sessionId"
} catch {
  Write-Log "ERROR creating session: $_" "ERROR"
  exit 3
}

# ── Step 2: Send prompt, wait for response ─────────────────────────────
Write-Log "Sending prompt (this may take 30s-2min for AI response)..."
$body = @{ parts = @(@{ type = "text"; text = $Prompt }) } | ConvertTo-Json -Depth 5

$startTime = Get-Date
try {
  $resp = Invoke-WebRequest -Uri "$base/session/$sessionId/message" -Method POST `
    -Headers $authHeader -Body $body -TimeoutSec $TimeoutSeconds -UseBasicParsing
  $elapsed = (Get-Date) - $startTime
  Write-Log "Response received in $($elapsed.TotalSeconds)s, status $($resp.StatusCode)"

  # Parse response
  $responseData = $resp.Content | ConvertFrom-Json

  # Extract the assistant's text reply
  $textReply = ""
  if ($responseData.parts) {
    foreach ($part in $responseData.parts) {
      if ($part.type -eq "text") {
        $textReply += $part.text + "`n"
      }
    }
  }

  # Extract info
  $info = $responseData.info
  $modelInfo = ""
  if ($info) {
    $modelInfo = "Model: $($info.modelID) via $($info.providerID) | Cost: $($info.cost) | Tokens: in=$($info.tokens.input) out=$($info.tokens.output)"
  }

  Write-Log "Agent response (first 500 chars):"
  $truncatedReply = $textReply.Trim()
  if ($truncatedReply.Length -gt 500) { $truncatedReply = $truncatedReply.Substring(0, 500) + "..." }
  $truncatedReply | Out-File -FilePath $LogFile -Append
  Write-Log $modelInfo
  Write-Log "====== Trigger complete ======"

  # Save full response to its own log file for later review
  $fullLog = Join-Path (Split-Path $LogFile -Parent) "agent-response-$sessionId.json"
  $resp.Content | Out-File -FilePath $fullLog -Encoding UTF8
  Write-Log "Full response saved: $fullLog"

  exit 0
} catch {
  $elapsed = (Get-Date) - $startTime
  Write-Log "ERROR after $($elapsed.TotalSeconds)s: $_" "ERROR"
  exit 4
}
