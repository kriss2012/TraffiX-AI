@echo off
setlocal enabledelayedexpansion
title TraffiX-AI Launcher - SIH26127

echo ===============================================================================
echo     TraffiX-AI : City-Wide Multi-Camera ANPR Trajectory & Traffic Engine
echo                     SIH 2026 Problem Statement: SIH26127
echo ===============================================================================
echo.

:: Switch directory to batch file location
cd /d "%~dp0"

echo [*] Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python was not found on your system PATH!
    echo Please install Python 3.10+ from python.org and add it to PATH.
    pause
    exit /b 1
)

echo [*] Python detected:
for /f "tokens=*" %%i in ('python --version') do echo     %%i

echo.
echo [*] Launching TraffiX-AI Backend Server (FastAPI + WebSocket + ST-DAG Engine)...
start "TraffiX-AI Backend Engine (SIH26127)" cmd /k "cd /d "%~dp0backend" && echo Starting FastAPI server on http://127.0.0.1:8000 ... && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [*] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo [*] Opening TraffiX-AI Command Center Dashboard in your default browser...
start http://127.0.0.1:8000

echo.
echo ===============================================================================
echo  [SUCCESS] TraffiX-AI is now live!
echo.
echo  - Frontend Dashboard : http://127.0.0.1:8000/
echo  - Backend API Docs   : http://127.0.0.1:8000/docs
echo  - Live WebSocket     : ws://127.0.0.1:8000/ws/live-stream
echo  - System Health      : http://127.0.0.1:8000/api/v1/system/health
echo.
echo  To shut down TraffiX-AI:
echo    Close the 'TraffiX-AI Backend Engine' terminal window or press Ctrl+C in it.
echo ===============================================================================
echo.
pause
