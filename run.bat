@echo off
title FlowTrack Launcher
echo ========================================================
echo               Starting FlowTrack Kanban
echo ========================================================
echo.
echo [1/3] Starting Django Backend (http://127.0.0.1:8000)...
start "FlowTrack - Backend (Port 8000)" cmd /k "cd /d %~dp0Backend\flowtrack && venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

timeout /t 3 /nobreak >nul

echo [2/3] Starting React Frontend (http://localhost:5173)...
start "FlowTrack - Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening FlowTrack in your browser...
start http://localhost:5173

echo.
echo ========================================================
echo FlowTrack is up and running!
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000
echo.
echo Ready-to-use Demo Accounts (Password for all: password123):
echo   * Organization Owner : owner@flowtrack.test
echo   * Manager            : manager@flowtrack.test
echo   * Member             : member@flowtrack.test
echo.
echo To stop FlowTrack, run stop.bat or close the server windows.
echo ========================================================
pause
