#!/usr/bin/env bash
# ===============================================================================
#     TraffiX-AI : City-Wide Multi-Camera ANPR Trajectory & Traffic Engine
#                     SIH 2026 Problem Statement: SIH26127
#                     One-Click Runner for Linux & macOS
# ===============================================================================

set -e

# Navigate to project root
cd "$(dirname "$0")"

echo "==============================================================================="
echo "    TraffiX-AI : City-Wide Multi-Camera ANPR Trajectory & Traffic Engine"
echo "                    SIH 2026 Problem Statement: SIH26127"
echo "==============================================================================="
echo ""

# Detect Python 3
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    echo "[ERROR] Python was not found on your system PATH!"
    echo "Please install Python 3.10+ and ensure it is available in terminal."
    exit 1
fi

echo "[*] Python detected: $($PY_CMD --version)"

# Verify dependencies
echo "[*] Checking required dependencies..."
if ! $PY_CMD -c "import fastapi, uvicorn, websockets, pydantic, numpy" &>/dev/null; then
    echo "[!] Missing dependencies detected. Launching automated installer..."
    chmod +x ./setup.sh 2>/dev/null || true
    ./setup.sh
fi

echo ""
echo "[*] Launching TraffiX-AI Backend Server (FastAPI + WebSocket + ST-DAG Engine)..."
echo "==============================================================================="
echo "  [SUCCESS] TraffiX-AI is starting!"
echo ""
echo "  - Frontend Dashboard : http://127.0.0.1:8000/"
echo "  - Backend API Docs   : http://127.0.0.1:8000/docs"
echo "  - Live WebSocket     : ws://127.0.0.1:8000/ws/live-stream"
echo "  - System Health      : http://127.0.0.1:8000/api/v1/system/health"
echo ""
echo "  Press Ctrl+C to shut down the server."
echo "==============================================================================="
echo ""

# Attempt to open browser in background after short delay
(
    sleep 2
    if command -v xdg-open &>/dev/null; then
        xdg-open "http://127.0.0.1:8000" &>/dev/null || true
    elif command -v open &>/dev/null; then
        open "http://127.0.0.1:8000" &>/dev/null || true
    fi
) &

# Run server from backend folder
cd backend
exec $PY_CMD -m uvicorn main:app --host 0.0.0.0 --port 8000
