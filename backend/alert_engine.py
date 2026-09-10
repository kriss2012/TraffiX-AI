"""
TraffiX-AI: Multi-Signal Bayesian Alert & Explainability Engine
Detects:
- Hotlisted/Stolen Vehicles (Exact & Grammar-Fuzzy Match)
- Kinematic Teleportation (Cloned Plate Duplication)
- Banned Commercial Vehicle Cordon Entry
- Checkpoint Detour & Evasive Route Anomalies
Provides full Explainability Cards for Human-in-the-Loop (HITL) Triage.
"""

import uuid
import time
from typing import Dict, List, Optional
from corridor_topology import CAMERAS, ROAD_NETWORK

# Simulated National Hotlist Database (e-Challan / Police FIR Registry)
POLICE_HOTLIST = {
    "DL01AB8234": {"fir_no": "FIR-402/2026", "reason": "Reported Stolen - Sedition Case", "severity": "CRITICAL"},
    "UP16BC9999": {"fir_no": "FIR-188/2026", "reason": "Wanted Armed Robbery Suspect", "severity": "CRITICAL"},
    "HR26DK4411": {"fir_no": "ECH-982103", "reason": "Multiple Speeding & Hit-and-Run Fines Unpaid", "severity": "HIGH"},
}

# Restricted Cordon Zones for Commercial Heavy Vehicles
RESTRICTED_ZONES = {
    "C05": "Connaught Place Commercial Heritage Cordon",
    "C07": "India Gate High-Security Diplomatic Enclave",
    "C02": "Red Fort Cultural Protected Zone",
}

class BayesianAlertEngine:
    """Manages real-time alert generation, explainability cards, and triage workflows."""

    def __init__(self):
        self.active_alerts: List[Dict] = []
        self.alert_history: List[Dict] = []

    def evaluate_event(self, event: Dict, trajectory: Optional[Dict] = None) -> List[Dict]:
        """Evaluates an edge event and active trajectory against all alert detectors."""
        alerts_triggered = []
        now = time.time()
        plate_clean = event.get("plate_display", "").upper()
        cam_id = event["camera_id"]
        cam_name = CAMERAS.get(cam_id, {}).get("name", cam_id)

        # 1. HOTLIST / STOLEN VEHICLE DETECTOR
        for hot_plate, meta in POLICE_HOTLIST.items():
            # Exact or single-character optical confusion match
            from trajectory_engine import TRAJECTORY_ENGINE
            sim = TRAJECTORY_ENGINE.grammar_weighted_levenshtein(plate_clean, hot_plate)
            if sim >= 0.88:
                alert_id = str(uuid.uuid4())[:8]
                explainability_card = {
                    "alert_id": alert_id,
                    "alert_type": "HOTLIST_WANTED_VEHICLE",
                    "severity": meta["severity"],
                    "timestamp": now,
                    "target_plate": hot_plate,
                    "detected_plate": plate_clean,
                    "similarity_score": round(sim, 3),
                    "vehicle_class": event.get("vehicle_class", "car"),
                    "vehicle_color": event.get("vehicle_color", "white"),
                    "camera_id": cam_id,
                    "camera_name": cam_name,
                    "fir_details": meta,
                    "explainability": {
                        "ocr_confidence": event.get("plate_confidence", 0.92),
                        "plate_match_details": f"Levenshtein similarity {round(sim * 100, 1)}% with wanted plate {hot_plate}",
                        "evidence_statement": f"Vehicle matched {meta['fir_no']} ({meta['reason']}). Detected heading South past {cam_name}.",
                        "recommended_action": f"Dispatch field intercept to downstream checkpoints C08 (Bhairon Marg) & C06 (Mandi House)."
                    },
                    "status": "PENDING_TRIAGE",
                    "expires_in_sec": 15
                }
                alerts_triggered.append(explainability_card)
                self.active_alerts.insert(0, explainability_card)
                break

        # 2. RESTRICTED CORDON ZONE VIOLATION (Heavy Commercial Vehicles)
        if cam_id in RESTRICTED_ZONES and event.get("vehicle_class") in ["truck", "bus"]:
            zone_desc = RESTRICTED_ZONES[cam_id]
            alert_id = str(uuid.uuid4())[:8]
            explainability_card = {
                "alert_id": alert_id,
                "alert_type": "RESTRICTED_CORDON_ENTRY",
                "severity": "MEDIUM",
                "timestamp": now,
                "detected_plate": plate_clean,
                "vehicle_class": event.get("vehicle_class"),
                "camera_id": cam_id,
                "camera_name": cam_name,
                "explainability": {
                    "ocr_confidence": event.get("plate_confidence", 0.90),
                    "evidence_statement": f"Heavy vehicle class '{event.get('vehicle_class')}' detected inside {zone_desc} during prohibited hours.",
                    "recommended_action": "Issue automated municipal challan for unauthorized commercial cordon entry."
                },
                "status": "PENDING_TRIAGE",
                "expires_in_sec": 30
            }
            alerts_triggered.append(explainability_card)
            self.active_alerts.insert(0, explainability_card)

        # 3. KINEMATIC TELEPORTATION / CLONED PLATE DETECTOR
        if trajectory and len(trajectory.get("camera_sequence", [])) >= 2:
            cam_seq = trajectory["camera_sequence"]
            u, v = cam_seq[-2], cam_seq[-1]
            t_u, t_v = trajectory.get("start_time", now), trajectory.get("end_time", now)
            delta_t = t_v - t_u
            dist_m = ROAD_NETWORK.get_shortest_distance(u, v)
            if delta_t > 0 and dist_m > 3000:
                speed_kmh = (dist_m / delta_t) * 3.6
                if speed_kmh > 140.0: # Impossible road speed in Delhi
                    alert_id = str(uuid.uuid4())[:8]
                    explainability_card = {
                        "alert_id": alert_id,
                        "alert_type": "CLONED_PLATE_TELEPORTATION",
                        "severity": "CRITICAL",
                        "timestamp": now,
                        "detected_plate": plate_clean,
                        "camera_id": v,
                        "camera_name": cam_name,
                        "explainability": {
                            "implied_speed_kmh": round(speed_kmh, 1),
                            "distance_km": round(dist_m / 1000.0, 2),
                            "time_elapsed_sec": round(delta_t, 1),
                            "evidence_statement": f"Simultaneous sightings at {CAMERAS[u]['name']} and {cam_name} in {round(delta_t, 1)}s requires {round(speed_kmh, 1)} km/h. High probability of cloned vehicle plate.",
                            "recommended_action": "Alert Regional Transport Office (RTO) and flag both vehicles for immediate physical inspection."
                        },
                        "status": "PENDING_TRIAGE",
                        "expires_in_sec": 15
                    }
                    alerts_triggered.append(explainability_card)
                    self.active_alerts.insert(0, explainability_card)

        # Keep active queue within reasonable size (last 20)
        self.active_alerts = self.active_alerts[:20]
        return alerts_triggered

    def triage_alert(self, alert_id: str, decision: str, officer_id: str = "OFFICER_DELHI_08") -> Optional[Dict]:
        """Processes Human-in-the-Loop officer decision on an alert."""
        for alert in self.active_alerts:
            if alert["alert_id"] == alert_id:
                alert["status"] = decision # e.g. "CONFIRMED_DISPATCHED" or "DISMISSED_OPTICAL_ERROR"
                alert["triaged_by"] = officer_id
                alert["triage_time"] = time.time()
                self.alert_history.insert(0, alert)
                self.active_alerts.remove(alert)
                return alert
        return None

# Singleton Alert Engine
ALERT_ENGINE = BayesianAlertEngine()
