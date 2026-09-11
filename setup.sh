#!/usr/bin/env bash
# ===============================================================================
#     TraffiX-AI : City-Wide Multi-Camera ANPR Trajectory & Traffic Engine
#                     Setup & Dependency Installer (Linux / macOS)
#                     SIH 2026 Problem Statement: SIH26127
# ===============================================================================

set -e

# Navigate to script directory
cd "$(dirname "$0")"

echo "==============================================================================="
echo "    TraffiX-AI Automated Setup (Linux / macOS / POSIX)"
echo "==============================================================================="

# Find Python 3
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    echo "[ERROR] Python 3 was not found! Please install Python 3.10+."
    exit 1
fi

echo "[*] Using Python: $($PY_CMD --version)"

# Upgrade pip
echo "[*] Checking pip..."
$PY_CMD -m pip install --upgrade pip >/dev/null 2>&1 || true

# Install requirements
echo "[*] Installing TraffiX-AI dependencies..."
if ! $PY_CMD -m pip install -r requirements.txt; then
    echo "[!] Standard install failed. Retrying with --user..."
    $PY_CMD -m pip install --user -r requirements.txt
fi

# Verify
echo "[*] Verifying installation..."
$PY_CMD -c "import fastapi, uvicorn, websockets, pydantic, numpy; print('[+] All core libraries verified successfully!')"

echo ""
echo "==============================================================================="
echo " [SUCCESS] All dependencies for TraffiX-AI are installed and ready!"
echo " To run TraffiX-AI on Linux/macOS:"
echo "   cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000"
echo "==============================================================================="
