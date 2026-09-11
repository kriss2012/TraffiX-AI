@echo off
setlocal enabledelayedexpansion
title TraffiX-AI - Automated Dependency Installer

echo ===============================================================================
echo     TraffiX-AI : City-Wide Multi-Camera ANPR Trajectory ^& Traffic Engine
echo                     Automated Setup ^& Dependency Installer
echo                     SIH 2026 Problem Statement: SIH26127
echo ===============================================================================
echo.

cd /d "%~dp0"

:: 1. Detect Python Executable
set "PY_CMD="

python --version >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=python"
    goto :python_found
)

py -3 --version >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=py -3"
    goto :python_found
)

python3 --version >nul 2>&1
if not errorlevel 1 (
    set "PY_CMD=python3"
    goto :python_found
)

echo [ERROR] Python was not found on your system PATH!
echo.
echo Please install Python (version 3.10, 3.11, or newer):
echo   1. Download installer from: https://www.python.org/downloads/
echo   2. IMPORTANT: During setup, CHECK the box "Add python.exe to PATH"
echo   3. Restart this script after installing Python.
echo.
pause
exit /b 1

:python_found
echo [*] Python interpreter detected:
for /f "tokens=*" %%v in ('%PY_CMD% --version') do echo     %%v
echo.

:: 2. Upgrade pip (optional, non-blocking)
echo [*] Upgrading pip to latest version...
%PY_CMD% -m pip install --upgrade pip >nul 2>&1
if errorlevel 1 (
    echo [!] Notice: pip upgrade skipped or offline, proceeding with package installation.
) else (
    echo [+] pip is up to date.
)
echo.

:: 3. Install required packages from requirements.txt
echo [*] Installing TraffiX-AI core dependencies...
echo     (FastAPI, Uvicorn, WebSockets, Pydantic, NumPy, PyTest)
echo.

%PY_CMD% -m pip install -r "%~dp0requirements.txt"
if errorlevel 1 (
    echo.
    echo [!] Standard install failed. Retrying with --user flag for non-admin accounts...
    %PY_CMD% -m pip install --user -r "%~dp0requirements.txt"
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install required packages!
        echo Please check your internet connection or college firewall/proxy settings.
        echo You can also try: pip install -r requirements.txt
        echo.
        pause
        exit /b 1
    )
)

echo.
:: 4. Verify installation
echo [*] Verifying library installation...
%PY_CMD% -c "import fastapi, uvicorn, websockets, pydantic, numpy; print('[+] All core libraries verified successfully!')"
if errorlevel 1 (
    echo [ERROR] Verification failed. One or more packages are missing.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo  [SUCCESS] All dependencies for TraffiX-AI are installed and ready!
echo ===============================================================================
echo.
echo Options:
echo   [1] Start TraffiX-AI right now (launches backend server + opens browser)
echo   [2] Exit
echo.
set /p choice="Enter your choice (1 or 2, default is 1): "

if "%choice%"=="" set choice=1
if "%choice%"=="1" (
    echo.
    echo [*] Starting TraffiX-AI...
    call "%~dp0run_traffix.bat"
)

exit /b 0
