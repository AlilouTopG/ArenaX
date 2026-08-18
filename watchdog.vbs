Option Explicit

' ============================================================
'  ArenaX - Watchdog (hidden supervisor)
'  Runs forever: checks Backend + Frontend every 5 seconds
'  and restarts any service that stopped or crashed.
'  Started automatically by start-arenax.vbs (never run manually)
' ============================================================

Dim fso, SHELL, APP_DIR, BACKEND_DIR, FRONTEND_DIR, HEALTH_URL, FE_URL, okB, okF, launched, http, wmi, proc

Set fso   = CreateObject("Scripting.FileSystemObject")
Set SHELL = CreateObject("WScript.Shell")
Set wmi   = GetObject("winmgmts:\\.\root\cimv2")

APP_DIR      = fso.GetParentFolderName(WScript.ScriptFullName)
BACKEND_DIR  = APP_DIR & "\backend"
FRONTEND_DIR = APP_DIR & "\frontend"
HEALTH_URL   = "http://localhost:5000/api/v1/health"
FE_URL       = "http://localhost:5173/"
launched     = False

' 1) Write own PID so stop-arenax.vbs can terminate the watchdog
For Each proc In wmi.ExecQuery("SELECT ProcessId, CommandLine FROM Win32_Process WHERE Name='wscript.exe'")
    If InStr(1, proc.CommandLine, "watchdog.vbs", vbTextCompare) > 0 Then
        fso.CreateTextFile(APP_DIR & "\watchdog.pid", True).Write proc.ProcessId
        Exit For
    End If
Next

On Error Resume Next

' 2) Supervise forever
Do
    okB = CheckUrl(HEALTH_URL)
    If Not okB Then
        FreePorts 5000
        WScript.Sleep 1500
        SHELL.Run "cmd /c ""cd /d " & BACKEND_DIR & " && node src/server.js >> server.log 2>&1""", 0, False
    End If

    okF = CheckUrl(FE_URL)
    If Not okF Then
        FreePorts 5173
        WScript.Sleep 1500
        SHELL.Run "cmd /c ""cd /d " & FRONTEND_DIR & " && node node_modules\vite\bin\vite.js --port 5173 --strictPort >> vite.log 2>&1""", 0, False
    End If

    ' Open the browser once, when both services are up
    If Not launched And okB And okF Then
        SHELL.Run "http://localhost:5173", 1, False
        launched = True
    End If

    WScript.Sleep 5000
Loop

' ------------------------------------------------------------
Function CheckUrl(url)
    Dim h
    On Error Resume Next
    Set h = CreateObject("MSXML2.XMLHTTP")
    h.open "GET", url, False
    h.send
    CheckUrl = (Err.Number = 0 And h.Status = 200)
    Err.Clear
    Set h = Nothing
    On Error GoTo 0
End Function

Sub FreePorts(port)
    On Error Resume Next
    SHELL.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort " & port & " -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, False
End Sub