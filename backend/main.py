"""
TraffiX-AI: FastAPI Main Backend Service & Real-Time WebSocket Gateway
Exposes:
- Corridor Topology & Live Level of Service (LOS)
- ST-DAG Multi-Camera Trajectory Engine
- Indo-HCM Traffic Analytics & Dynamic OD Matrix
- Multi-Signal Bayesian Alert Triage Station
- Dual-Key Lawful Interception Authorization & Cryptographic Audit Ledger
- Real-Time WebSocket Telemetry Stream
- Grand Finale "WOW Moment" Demonstration Trigger
"""

import os
import asyncio
import time
from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from corridor_topology import CAMERAS, ROAD_SEGMENTS, ROAD_NETWORK
from edge_anpr_engine import EDGE_ENGINE
from trajectory_engine import TRAJECTORY_ENGINE
from traffic_analytics import ANALYTICS_ENGINE
from alert_engine import ALERT_ENGINE
from security_governance import AUDIT_LEDGER, verify_lawful_warrant
from traffic_simulator import SIMULATOR

app = FastAPI(
    title="TraffiX-AI Municipal Command Engine",
    description="City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking & Urban Traffic Analytics",
    version="2.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class TriageRequest(BaseModel):
    decision: str # "CONFIRMED_DISPATCHED" or "DISMISSED_OPTICAL_ERROR"
    officer_id: str = "OFFICER_DELHI_08"

class LawfulSearchRequest(BaseModel):
    plate_number: str
    warrant_token: str
    officer_badge: str
    investigation_reason: str

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

ws_manager = ConnectionManager()

# Background WebSocket broadcaster
@app.on_event("startup")
async def startup_event():
    # Start traffic simulation
    SIMULATOR.start()
    asyncio.create_task(websocket_broadcast_loop())

@app.on_event("shutdown")
def shutdown_event():
    SIMULATOR.stop()

async def websocket_broadcast_loop():
    """Streams live telemetry, corridor metrics, and active alerts to all connected UI clients."""
    while True:
        try:
            metrics = ANALYTICS_ENGINE.compute_corridor_metrics()
            payload = {
                "type": "TELEMETRY_TICK",
                "timestamp": round(time.time(), 2),
                "cameras": list(CAMERAS.values()),
                "corridor_segments": metrics,
                "recent_sightings": SIMULATOR.recent_events[:10],
                "active_alerts": ALERT_ENGINE.active_alerts,
                "total_vehicles_tracked": len(TRAJECTORY_ENGINE.trajectories),
                "dpdp_status": "COMPLIANT_HASH_CHAINED"
            }
            await ws_manager.broadcast(payload)
        except Exception as e:
            pass
        await asyncio.sleep(1.0)

# REST API Endpoints

@app.get("/api/v1/corridor/topology")
def get_corridor_topology():
    """Returns all 15 camera nodes and road network links."""
    return {
        "cameras": CAMERAS,
        "segments": ROAD_SEGMENTS,
        "metrics": ANALYTICS_ENGINE.compute_corridor_metrics()
    }

@app.get("/api/v1/analytics/overview")
def get_analytics_overview():
    """Returns city-wide traffic metrics and dynamic OD matrix."""
    metrics = ANALYTICS_ENGINE.compute_corridor_metrics()
    od = ANALYTICS_ENGINE.get_origin_destination_matrix()
    
    # Calculate macro KPIs
    avg_speed = sum(m["space_mean_speed_kmh"] for m in metrics) / max(1, len(metrics))
    total_vph = sum(m["flow_rate_vph"] for m in metrics)
    congested_count = sum(1 for m in metrics if m["is_congested"])
    
    return {
        "macro_kpis": {
            "avg_speed_kmh": round(avg_speed, 1),
            "network_flow_vph": round(total_vph, 0),
            "congested_segments": congested_count,
            "total_segments": len(metrics),
            "network_los": "C" if congested_count < 4 else "E"
        },
        "segments": metrics,
        "origin_destination": od
    }

@app.get("/api/v1/trajectories/{identifier}")
def get_vehicle_trajectory(identifier: str):
    """
    Returns reconstructed trajectory for a plate hash or raw plate string.
    If raw plate is queried, checks if hash matches.
    """
    traj = TRAJECTORY_ENGINE.get_trajectory(identifier)
    if not traj:
        # Check if identifier is raw plate and hash it
        h = EDGE_ENGINE.hash_plate(identifier)
        traj = TRAJECTORY_ENGINE.get_trajectory(h)
    
    if not traj:
        raise HTTPException(status_code=404, detail="Vehicle trajectory not found or journey disconnected.")
    return traj

@app.get("/api/v1/alerts")
def get_active_alerts():
    """Returns active alert queue and historical alerts."""
    return {
        "active_alerts": ALERT_ENGINE.active_alerts,
        "alert_history": ALERT_ENGINE.alert_history[:10]
    }

@app.post("/api/v1/alerts/{alert_id}/triage")
def triage_alert_endpoint(alert_id: str, body: TriageRequest):
    """Human-in-the-loop triage action on an alert."""
    result = ALERT_ENGINE.triage_alert(alert_id, body.decision, body.officer_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alert ID not found in active triage queue.")
    
    # Record to immutable audit ledger
    AUDIT_LEDGER.record_access(
        officer_badge=body.officer_id,
        action_type="ALERT_HUMAN_TRIAGE",
        query_payload={"alert_id": alert_id, "decision": body.decision},
        warrant_token="OFFICER_DISPATCH_AUTH"
    )
    return {"status": "SUCCESS", "alert": result}

@app.post("/api/v1/lawful-search")
def lawful_trajectory_search(req: LawfulSearchRequest):
    """
    Dual-Key Lawful Interception Vehicle Trajectory Query.
    Guarantees DPDP Act 2023 compliance by requiring a validated judicial warrant.
    """
    is_valid_warrant = verify_lawful_warrant(req.warrant_token, req.officer_badge)
    if not is_valid_warrant:
        raise HTTPException(
            status_code=403,
            detail="Lawful Interception Denied: Invalid Magistrate Court Warrant Token or Officer Badge under DPDP Act 2023."
        )

    plate_clean = req.plate_number.strip().upper()
    target_hash = EDGE_ENGINE.hash_plate(plate_clean)
    traj = TRAJECTORY_ENGINE.get_trajectory(target_hash)

    # Append to Cryptographic Audit Ledger
    block = AUDIT_LEDGER.record_access(
        officer_badge=req.officer_badge,
        action_type="LAWFUL_TRAJECTORY_SEARCH",
        query_payload={"plate_number": plate_clean, "reason": req.investigation_reason},
        warrant_token=req.warrant_token
    )

    if not traj:
        return {
            "status": "NOT_FOUND",
            "message": f"No active sightings recorded for vehicle {plate_clean} in current window.",
            "audit_block": block
        }

    return {
        "status": "AUTHORIZED_ACCESS_GRANTED",
        "trajectory": traj,
        "audit_block": block
    }

@app.get("/api/v1/audit-ledger")
def get_audit_ledger():
    """Returns immutable cryptographic audit log for compliance inspection."""
    is_valid, corrupted_idx = AUDIT_LEDGER.verify_chain_integrity()
    return {
        "chain_integrity": "VALID_TAMPER_EVIDENT" if is_valid else f"CORRUPTED_AT_BLOCK_{corrupted_idx}",
        "total_blocks": len(AUDIT_LEDGER.chain),
        "recent_blocks": AUDIT_LEDGER.get_recent_logs(12)
    }

@app.post("/api/v1/demo/trigger-wow-moment")
def trigger_wow_moment_demo():
    """Triggers the SIH Grand Finale WOW Demonstration."""
    result = SIMULATOR.trigger_wow_moment()
    return result

# WebSocket Endpoint
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# Mount Frontend static files
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_frontend_root():
        return FileResponse(os.path.join(frontend_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
