$logFile = "$env:TEMP\admin-fix-log.txt"
function Log { param([string]$m) "$((Get-Date -Format 'HH:mm:ss')) $m" | Out-File $logFile -Append }

Log "=== Admin Fix Started ==="
Log "User: $env:USERNAME"

$ProjectRoot = "P:\OpenCode_Projects\Tony-cv-cloud\tony-portfolio"
$TasksDir = Join-Path $ProjectRoot ".opencode\tasks"
$ScriptsDir = Join-Path $ProjectRoot ".opencode\scripts"
$userName = $env:USERNAME

$tasks = @(
  @{Name="Startup"; Trigger="ONLOGON"; Schedule=""; Script="$ScriptsDir\start-agent.ps1"; Desc="Starts Tony Brand Master dashboard + headless OpenCode server"},
  @{Name="Nightly"; Trigger="DAILY"; Schedule="/st 02:00"; Script="$TasksDir\nightly-task.ps1"; Desc="Nightly site health checks"},
  @{Name="WeeklyContent"; Trigger="WEEKLY"; Schedule="/d SUN /st 23:00"; Script="$TasksDir\weekly-content-task.ps1"; Desc="Weekly content freshness check"},
  @{Name="MonthlySEO"; Trigger="MONTHLY"; Schedule="/d 1 /st 01:00"; Script="$TasksDir\monthly-seo-task.ps1"; Desc="Monthly SEO audit"}
)

foreach ($t in $tasks) {
  $fullName = "\TonyBrandMaster\$($t.Name)"
  Log "--- $($t.Name) ---"

  # Delete old
  schtasks /delete /tn "$fullName" /f 2>$null
  Log "  Deleted old task (if existed)"

  # Build XML trigger
  $triggerXml = switch ($t.Trigger) {
    "ONLOGON" { "<LogonTrigger><Enabled>true</Enabled></LogonTrigger>" }
    "DAILY"   { "<CalendarTrigger><StartBoundary>2026-06-04T02:00:00</StartBoundary><ScheduleByDay><DaysInterval>1</DaysInterval></ScheduleByDay><Enabled>true</Enabled></CalendarTrigger>" }
    "WEEKLY"  { "<CalendarTrigger><StartBoundary>2026-06-07T23:00:00</StartBoundary><ScheduleByWeek><DaysOfWeek><Sunday /></DaysOfWeek><WeeksInterval>1</WeeksInterval></ScheduleByWeek><Enabled>true</Enabled></CalendarTrigger>" }
    "MONTHLY" { "<CalendarTrigger><StartBoundary>2026-07-01T01:00:00</StartBoundary><ScheduleByMonth><DaysOfMonth><Day>1</Day></DaysOfMonth><Months><January /><February /><March /><April /><May /><June /><July /><August /><September /><October /><November /><December /></Months></ScheduleByMonth><Enabled>true</Enabled></CalendarTrigger>" }
  }

  $xml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>2026-06-04T12:00:00</Date>
    <Author>$userName</Author>
    <Description>$($t.Desc)</Description>
  </RegistrationInfo>
  <Triggers>$triggerXml</Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>$userName</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings><StopOnIdleEnd>true</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT2H</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-NoProfile -ExecutionPolicy Bypass -File "$($t.Script)"</Arguments>
      <WorkingDirectory>$ProjectRoot</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
"@

  $xmlFile = "$env:TEMP\task_$($t.Name).xml"
  [System.IO.File]::WriteAllText($xmlFile, $xml, [System.Text.Encoding]::Unicode)

  $result = schtasks /create /xml "$xmlFile" /tn "$fullName" /f 2>&1
  Log "  Create result: $result"

  Remove-Item $xmlFile -Force -ErrorAction SilentlyContinue
}

Log "Enabling Task Scheduler event log..."
wevtutil sl "Microsoft-Windows-TaskScheduler/Operational" /e:true 2>&1 | ForEach-Object { Log "  $_" }

Log "=== Verification ==="
@("Startup","Nightly","WeeklyContent","MonthlySEO") | ForEach-Object {
  schtasks /query /tn "\TonyBrandMaster\$_" /v /fo LIST 2>&1 | Out-File $logFile -Append
}
Log "=== Done ==="
