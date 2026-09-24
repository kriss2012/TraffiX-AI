"""
TraffiX-AI: Production API, Security & Governance Test Suite
Verifies:
1. REST API endpoint availability and response schemas
2. Dual-key lawful interception authorization vs rejection (DPDP Act 2023)
3. Pydantic input validation (strict enums, field lengths, regex rules)
4. Sliding-window rate limiter enforcement
5. Cryptographic audit ledger tamper-evidence verification
6. Zero secret leakage in configuration endpoints
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app, check_rate_limit, RATE_LIMIT_STORE
from security_governance import AUDIT_LEDGER, CryptographicAuditLedger

@pytest.fixture
def client():
    # Use TestClient with raise_server_exceptions=False to test exception handlers cleanly
    return TestClient(app, raise_server_exceptions=False)

def test_system_health_endpoint(client):
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "services" in data
    assert "camera_mesh" in data
    assert len(data["camera_mesh"]) == 15
    assert "telemetry" in data

def test_corridor_topology_endpoint(client):
    response = client.get("/api/v1/corridor/topology")
    assert response.status_code == 200
    data = response.json()
    assert "cameras" in data
    assert "segments" in data
    assert len(data["cameras"]) == 15

def test_maps_config_zero_secret_leak(client):
    response = client.get("/api/v1/config/maps")
    assert response.status_code == 200
    data = response.json()
    assert "engine" in data
    assert "status" in data
    # Ensure no hardcoded secret fallback is exposed
    key_val = data.get("google_maps_api_key", "")
    assert not key_val or not key_val.startswith("AIzaSy")

def test_lawful_search_authorized(client):
    payload = {
        "plate_number": "DL01AB8234",
        "warrant_token": "COURT-WARRANT-2026-8841",
        "officer_badge": "OFFICER_DELHI_08",
        "investigation_reason": "Hit and run trajectory reconstruction"
    }
    response = client.post("/api/v1/lawful-search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["AUTHORIZED_ACCESS_GRANTED", "NOT_FOUND"]
    assert "audit_block" in data
    assert data["audit_block"]["action_type"] == "LAWFUL_TRAJECTORY_SEARCH"

def test_lawful_search_unauthorized_token(client):
    payload = {
        "plate_number": "DL01AB8234",
        "warrant_token": "INVALID_FORGED_TOKEN",
        "officer_badge": "OFFICER_DELHI_08",
        "investigation_reason": "Unauthorized access attempt"
    }
    response = client.post("/api/v1/lawful-search", json=payload)
    assert response.status_code == 403
    assert "Lawful Interception Denied" in response.json().get("detail", "")

def test_lawful_search_input_validation(client):
    # Invalid plate with illegal characters
    payload = {
        "plate_number": "???$$$",
        "warrant_token": "COURT-WARRANT-2026-8841",
        "officer_badge": "OFFICER_DELHI_08",
        "investigation_reason": "Testing validation"
    }
    response = client.post("/api/v1/lawful-search", json=payload)
    assert response.status_code == 422

def test_triage_alert_enum_validation(client):
    # Invalid triage decision should be rejected with 422
    payload = {
        "decision": "RANDOM_INVALID_DECISION",
        "officer_id": "OFFICER_DELHI_08"
    }
    response = client.post("/api/v1/alerts/ALERT_NONEXISTENT/triage", json=payload)
    assert response.status_code == 422

def test_audit_ledger_tamper_detection():
    # Fresh isolated ledger
    ledger = CryptographicAuditLedger()
    
    # Add valid blocks
    block1 = ledger.record_access("BADGE_1", "QUERY_1", {"key": "val1"}, "COURT-WARRANT-1")
    block2 = ledger.record_access("BADGE_2", "QUERY_2", {"key": "val2"}, "COURT-WARRANT-2")
    
    is_valid, err_idx = ledger.verify_chain_integrity()
    assert is_valid is True
    assert err_idx == -1
    
    # Deliberately tamper with block 1 payload
    ledger.chain[1]["query_payload"] = {"tampered": True}
    is_tampered, corrupted_idx = ledger.verify_chain_integrity()
    assert is_tampered is False
    assert corrupted_idx == 1

def test_rate_limiting_enforcement(client):
    test_ip = "test_rate_limiter_client"
    RATE_LIMIT_STORE[f"lawful_{test_ip}"].clear()
    
    # Burst 35 requests where limit is 30
    limited = False
    for _ in range(35):
        allowed = check_rate_limit(f"lawful_{test_ip}", max_requests=30, window_seconds=60.0)
        if not allowed:
            limited = True
            break
            
    assert limited is True

def test_wow_moment_demo_endpoint(client):
    response = client.post("/api/v1/demo/trigger-wow-moment")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "WOW_MOMENT_SUCCESS"
    assert "target_plate" in data
    assert "degraded_sighting_plate" in data
    assert data["target_plate"] == "DL01AB8234"
    assert data["degraded_sighting_plate"] == "DL01AB823B"
