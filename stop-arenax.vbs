Option Explicit

' ============================================================
'  ArenaX - Stop services (hidden)
'  Kills whatever listens on ports 5000 (Backend) and 5173 (Frontend)
' ============================================================

Dim SHELL
Set SHELL = CreateObject("WScript.Shell")

SHELL.Run "powershell -NoProfile -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 5000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True

MsgBox "ArenaX services stopped.", 64, "ArenaX"