"""
TraffiX-AI: Automated Verification & Unit Test Suite
Verifies:
1. Indian RTO Plate Syntax Validation (MoRTH CMVR Rule 50)
2. In-Camera Multi-Frame Tracklet Beam Voting
3. Grammar-Constrained Levenshtein Distance for Optical Confusions
4. ST-DAG Kinematic Road Graph Feasibility Filter (Teleportation Rejection)
5. DPDP Act 2023 Cryptographic Hash-Chained Audit Ledger Integrity
"""

import pytest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from edge_anpr_engine import EDGE_ENGINE
from trajectory_engine import TRAJECTORY_ENGINE
from corridor_topology import ROAD_NETWORK
from security_governance import AUDIT_LEDGER

def test_indian_plate_syntax_validation():
    # Valid standard plates
    valid1, t1 = EDGE_ENGINE.validate_indian_syntax("DL01AB1234")
    assert valid1 is True
    assert t1 == "STANDARD_HSRP"

    valid2, t2 = EDGE_ENGINE.validate_indian_syntax("MH12CD5678")
    assert valid2 is True

    # Valid Bharat series
    valid_bh, t_bh = EDGE_ENGINE.validate_indian_syntax("22BH1029AB")
    assert valid_bh is True
    assert t_bh == "BHARAT_SERIES"

    # Invalid syntax
    invalid, t_inv = EDGE_ENGINE.validate_indian_syntax("1234INVALID")
    assert invalid is False
    assert t_inv == "NON_STANDARD_SYNTAX"

def test_multi_frame_beam_voting():
    # Simulate 5 frames of noisy detections for plate 'DL01AB8234'
    frames = [
        {"plate": "DL01AB8234", "conf": 0.95},
        {"plate": "DL01AB8234", "conf": 0.92},
        {"plate": "DL01ABB234", "conf": 0.70}, # '8' fluttered to 'B'
        {"plate": "DL01AB8234", "conf": 0.94},
        {"plate": "DL01AB8234", "conf": 0.91},
    ]
    consensus_plate, boosted_conf = EDGE_ENGINE.multi_frame_beam_voting(frames)
    # The consensus voting must resolve to the correct character '8'
    assert consensus_plate == "DL01AB8234"
    assert boosted_conf >= 0.92

def test_grammar_weighted_levenshtein():
    # Exact match
    assert TRAJECTORY_ENGINE.grammar_weighted_levenshtein("DL01AB8234", "DL01AB8234") == 1.0

    # Optical confusion: '8' vs 'B' (discounted to 0.1 cost)
    sim_optical = TRAJECTORY_ENGINE.grammar_weighted_levenshtein("DL01AB8234", "DL01ABB234")
    assert sim_optical >= 0.98

    # Arbitrary character replacement: '8' vs 'Z' (full 1.0 cost)
    sim_arbitrary = TRAJECTORY_ENGINE.grammar_weighted_levenshtein("DL01AB8234", "DL01ABZ234")
    assert sim_arbitrary <= 0.90

    # Optical similarity must be significantly higher than arbitrary substitution
    assert sim_optical > sim_arbitrary

def test_kinematic_feasibility_teleportation_rejection():
    # Cameras C01 (Kashmere Gate) to C14 (AIIMS) are ~15 km apart
    # Sighting after only 20 seconds requires >2500 km/h -> MUST BE REJECTED
    score, speed, reason = TRAJECTORY_ENGINE.kinematic_feasibility("C01", "C14", 20.0)
    assert score == 0.0
    assert speed > 150.0
    assert "SPEED_VIOLATION" in reason

    # Sighting after realistic 1500 seconds (~25 minutes) -> KINEMATICALLY FEASIBLE
    score_real, speed_real, reason_real = TRAJECTORY_ENGINE.kinematic_feasibility("C01", "C14", 1500.0)
    assert score_real > 0.30
    assert speed_real < 100.0

def test_cryptographic_audit_ledger_integrity():
    # Verify genesis
    valid, idx = AUDIT_LEDGER.verify_chain_integrity()
    assert valid is True
    assert idx == -1

    # Record legitimate search access
    block = AUDIT_LEDGER.record_access(
        officer_badge="TEST_INSPECTOR_01",
        action_type="TEST_TRAJECTORY_SEARCH",
        query_payload={"plate": "DL01AB8234"},
        warrant_token="COURT-WARRANT-2026-4412"
    )
    assert block["block_id"] > 0

    # Verify chain integrity
    valid_after, _ = AUDIT_LEDGER.verify_chain_integrity()
    assert valid_after is True

if __name__ == "__main__":
    pytest.main(["-v", __file__])
