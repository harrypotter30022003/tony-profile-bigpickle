' Tony Brand Master — Silent Dashboard Launcher
' This VBScript starts the monitoring dashboard without showing
' a console window. Put a shortcut to this file in your Startup folder.
'
' Created by: setup-startup.vbs
' Runs: .opencode\scripts\start-agent.ps1 (which starts dashboard + server)

Dim shell, scriptPath, projectRoot, fso

Set fso = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Project root is parent of .opencode directory
projectRoot = fso.GetParentFolderName(scriptDir)

' The PowerShell script to run
psScript = projectRoot & "\.opencode\scripts\start-agent.ps1"

' Run PowerShell with the script, hidden window
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & psScript & """", 0, False

' Also start the server in background
' shell.Run "cmd /c start /B opencode serve --port=4096", 0, False

Set shell = Nothing
Set fso = Nothing
