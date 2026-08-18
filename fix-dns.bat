@echo off
title ArenaX - DNS Fix
echo ==================================================
echo   ArenaX - DNS Fix & Network Unblock (1.1.1.1/8.8.8.8)
echo ==================================================
echo.
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrator privileges (click Yes on UAC)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','%~dp0fix-dns.ps1'"
    exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-dns.ps1"
