Option Explicit

' ============================================================
'  ArenaX - One-Click Hidden Launcher (no CMD windows)
'  - Frees ports 5000/5173 if busy
'  - Starts Backend hidden + fully detached (in-memory DB auto-seeds)
'  - Waits for Backend health check, then starts Frontend
'  - Opens the browser automatically
'  Logs: D:\ArenaX\backend\server.log , D:\ArenaX\frontend\vite.log
' ============================================================

Dim SHELL, BACKEND_DIR, FRONTEND_DIR, HEALTH_URL, i, ok, http
Set SHELL = CreateObject("WScript.Shell")

BACKEND_DIR  = "D:\ArenaX\backend"
FRONTEND_DIR = "D:\ArenaX\frontend"
HEALTH_URL   = "http://localhost:5000/api/v1/health"

' 1) Free ports 5000 / 5173 if something is already listening
SHELL.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 5000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True
WScript.Sleep 2000

' 2) Start Backend hidden + detached (starts listening + auto-seeds in-memory DB)
SHELL.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Start-Process -FilePath 'cmd' -ArgumentList '/c','cd /d " & BACKEND_DIR & " && node src/server.js >> server.log 2>&1' -WindowStyle Hidden""", 0, False

' 3) Wait until Backend responds on /health (max ~90 seconds)
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

' 4) Start Frontend hidden + detached (Vite dev server, strict port 5173)
SHELL.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Start-Process -FilePath 'cmd' -ArgumentList '/c','cd /d " & FRONTEND_DIR & " && node node_modules\vite\bin\vite.js --port 5173 --strictPort >> vite.log 2>&1' -WindowStyle Hidden""", 0, False

' 5) Open the browser + notify
If ok Then
    WScript.Sleep 3000
    SHELL.Run "http://localhost:5173", 1, False
    MsgBox "ArenaX is running!" & vbCrLf & vbCrLf & _
           "  Backend : http://localhost:5000" & vbCrLf & _
           "  Frontend: http://localhost:5173" & vbCrLf & vbCrLf & _
           "To stop: double-click stop-arenax.vbs", 64, "ArenaX"
Else
    MsgBox "Backend did not start within 90 seconds." & vbCrLf & _
           "Check D:\ArenaX\backend\server.log", 48, "ArenaX"
End If