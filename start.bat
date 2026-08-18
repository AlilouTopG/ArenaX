@echo off
title ArenaX - One Click Runner
cd /d "%~dp0"

echo ============================================================
echo   ArenaX Sports Hub - Starting both services...
echo   Backend  : http://localhost:5000   (API: /api/v1)
echo   Frontend : http://localhost:5173  (open this in your browser)
echo   Close the two new windows to stop the services.
echo ============================================================

start "ArenaX Backend (port 5000)" cmd /k "cd /d %~dp0backend && npm start"
start "ArenaX Frontend (port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"