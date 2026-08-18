Option Explicit

' ============================================================
'  ArenaX - One-Click Hidden Launcher (no CMD windows)
'  - Stops any previous ArenaX watchdog + frees ports 5000/5173
'  - Starts Backend hidden + fully detached (in-memory DB auto-seeds)
'  - Waits for Backend health, then starts Frontend
'  - Launches the hidden Watchdog (auto-restarts any stopped service forever)
'  - Opens the browser automatically
'  Logs: <project>\backend\server.log , <project>\frontend\vite.log
'  NOTE: paths are derived automatically from this script's location
' ============================================================

Dim fso, SHELL, APP_DIR, BACKEND_DIR, FRONTEND_DIR, HEALTH_URL, i, ok, http, wmi, proc, pidFile

Set fso   = CreateObject("Scripting.FileSystemObject")
Set SHELL = CreateObject("WScript.Shell")
Set wmi   = GetObject("winmgmts:\\.\root\cimv2")

APP_DIR      = fso.GetParentFolderName(WScript.ScriptFullName)
BACKEND_DIR  = APP_DIR & "\backend"
FRONTEND_DIR = APP_DIR & "\frontend"
HEALTH_URL   = "http://localhost:5000/api/v1/health"
pidFile      = APP_DIR & "\watchdog.pid"

' 0) Terminate any previous ArenaX watchdog + free ports 5000 / 5173
If fso.FileExists(pidFile) Then
    On Error Resume Next
    Dim pidTxt
    pidTxt = Trim(fso.OpenTextFile(pidFile, 1).ReadAll)
    If Len(pidTxt) > 0 Then wmi.Get("Win32_Process.Handle=" & pidTxt).Terminate
    Err.Clear
    On Error GoTo 0
    fso.DeleteFile pidFile, True
End If
SHELL.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 5000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True
WScript.Sleep 2000

' 1) Start Backend hidden + detached (starts listening + auto-seeds in-memory DB)
SHELL.Run "cmd /c ""cd /d " & BACKEND_DIR & " && node src/server.js >> server.log 2>&1""", 0, False

' 2) Wait until Backend responds on /health (max ~90 seconds)
ok = False
For i = 1 To 45
    WScript.Sleep 2000
    Set http = CreateObject("MSXML2.XMLHTTP")
    On Error Resume Next
    http.open "GET", HEALTH_URL, False
    http.send
    If Err.Number = 0 And http.Status = 200 Then
        ok = True
        Err.Clear
        Exit For
    End If
    Err.Clear
    On Error GoTo 0
Next

' 3) Start Frontend hidden + detached (Vite dev server, strict port 5173)
SHELL.Run "cmd /c ""cd /d " & FRONTEND_DIR & " && node node_modules\vite\bin\vite.js --port 5173 --strictPort >> vite.log 2>&1""", 0, False

' 4) Start the hidden Watchdog (keeps services alive forever)
SHELL.Run "wscript.exe """ & APP_DIR & "\watchdog.vbs""", 0, False

' 5) Notify (auto-closes after 6 seconds, never blocks)
If ok Then
    SHELL.Popup "ArenaX started successfully." & vbCrLf & vbCrLf & _
                "  Backend : http://localhost:5000" & vbCrLf & _
                "  Frontend: http://localhost:5173" & vbCrLf & vbCrLf & _
                "A hidden watchdog keeps both services running automatically." & vbCrLf & _
                "To stop everything: double-click stop-arenax.vbs", 6, "ArenaX", 64
Else
    SHELL.Popup "Backend was not reachable within 90 seconds." & vbCrLf & _
                "The watchdog will keep retrying automatically." & vbCrLf & _
                "Check " & BACKEND_DIR & "\server.log", 8, "ArenaX", 48
End If