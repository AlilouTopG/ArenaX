Option Explicit

' ============================================================
'  ArenaX - Stop everything (hidden)
'  - Terminates the Watchdog
'  - Kills whatever listens on ports 5000 (Backend) and 5173 (Frontend)
' ============================================================

Dim fso, SHELL, APP_DIR, pidFile, pidTxt, wmi

Set fso   = CreateObject("Scripting.FileSystemObject")
Set SHELL = CreateObject("WScript.Shell")
Set wmi   = GetObject("winmgmts:\\.\root\cimv2")

APP_DIR = fso.GetParentFolderName(WScript.ScriptFullName)
pidFile = APP_DIR & "\watchdog.pid"

' 1) Terminate the watchdog first (so it cannot restart services)
On Error Resume Next
If fso.FileExists(pidFile) Then
    pidTxt = Trim(fso.OpenTextFile(pidFile, 1).ReadAll)
    If Len(pidTxt) > 0 Then wmi.Get("Win32_Process.Handle=" & pidTxt).Terminate
    Err.Clear
    fso.DeleteFile pidFile, True
End If
Err.Clear
On Error GoTo 0

' 2) Free ports 5000 / 5173
SHELL.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 5000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True

' 3) Confirm + auto-close
SHELL.Popup "ArenaX services and watchdog stopped.", 4, "ArenaX", 64