"""
TraffiX-AI: Spatiotemporally Constrained Directed Acyclic Graph (ST-DAG) Engine
Reconstructs vehicle journeys across non-overlapping surveillance cameras by fusing:
- Grammar-constrained Levenshtein distance
- Road-network kinematic travel-time feasibility bounds
- FastReID appearance embedding cosine similarity
- Vehicle classification consistency
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Optional
from corridor_topology import ROAD_NETWORK, CAMERAS

# Optical confusion pairs with discounted Levenshtein substitution cost
OPTICAL_CONFUSION_PAIRS = {
    ('8', 'B'), ('B', '8'),
    ('0', 'D'), ('D', '0'),
    ('0', 'O'), ('O', '0'),
    ('1', 'I'), ('I', '1'),
    ('5', 'S'), ('S', '5'),
    ('2', 'Z'), ('Z', '2'),
}

class STDAGTrajectoryEngine:
    """Core Spatiotemporal Graph Engine for Multi-Camera Trajectory Reconstruction."""

    def __init__(
        self,
        w_plate: float = 0.40,
        w_kinematic: float = 0.35,
        w_reid: float = 0.15,
        w_class: float = 0.10,
        min_connection_threshold: float = 0.65,
        max_speed_kmh: float = 110.0,
        journey_timeout_sec: float = 1800.0
    ):
        self.w_plate = w_plate
        self.w_kinematic = w_kinematic
        self.w_reid = w_reid
        self.w_class = w_class
        self.min_threshold = min_connection_threshold
        self.max_speed_kmh = max_speed_kmh
        self.journey_timeout_sec = journey_timeout_sec

        # Stores raw events partitioned by plate_hash
        # plate_hash -> list of event dicts ordered by timestamp
        self.event_store: Dict[str, List[Dict]] = {}
        # Completed & active trajectories
        # trajectory_id -> trajectory summary dict
        self.trajectories: Dict[str, Dict] = {}

    def grammar_weighted_levenshtein(self, s1: str, s2: str) -> float:
        """
        Calculates normalized Levenshtein similarity with domain-specific
        substitution costs for Indian surveillance optical confusion pairs.
        Returns value in [0.0, 1.0].
        """
        s1, s2 = s1.upper(), s2.upper()
        if s1 == s2:
            return 1.0

        n, m = len(s1), len(s2)
        if n == 0 or m == 0:
            return 0.0

        dp = [[0.0] * (m + 1) for _ in range(n + 1)]
        for i in range(n + 1):
            dp[i][0] = float(i)
        for j in range(m + 1):
            dp[0][j] = float(j)

        for i in range(1, n + 1):
            c1 = s1[i - 1]
            for j in range(1, m + 1):
                c2 = s2[j - 1]
                if c1 == c2:
                    cost = 0.0
                elif (c1, c2) in OPTICAL_CONFUSION_PAIRS:
                    cost = 0.10  # Heavily discounted optical confusion
                else:
                    cost = 1.00  # Standard character substitution

                dp[i][j] = min(
                    dp[i - 1][j] + 1.0,       # Deletion
                    dp[i][j - 1] + 1.0,       # Insertion
                    dp[i - 1][j - 1] + cost   # Substitution
                )

        raw_dist = dp[n][m]
        max_possible = max(n, m)
        sim = max(0.0, 1.0 - (raw_dist / max_possible))
        return round(sim, 4)

    def kinematic_feasibility(self, cam_u: str, cam_v: str, delta_t_sec: float) -> Tuple[float, float, str]:
        """
        Evaluates the kinematic travel-time feasibility function Phi_travel(u, v, Delta t).
        Returns: (feasibility_score [0.0 - 1.0], implied_speed_kmh, status_reason)
        """
        if delta_t_sec <= 0:
            return 0.0, 0.0, "TEMPORAL_INVERSION"

        if cam_u == cam_v:
            # Sighting at the same camera within a short window is acceptable stationary/loitering
            if delta_t_sec < 60.0:
                return 0.85, 0.0, "SAME_CAMERA_LOITER"
            return 0.20, 0.0, "EXPIRED_STATIONARY"

        road_dist_m = ROAD_NETWORK.get_shortest_distance(cam_u, cam_v)
        if math.isinf(road_dist_m):
            return 0.0, 0.0, "TOPOLOGICALLY_UNREACHABLE"

        # Calculate implied physical speed
        speed_mps = road_dist_m / delta_t_sec
        speed_kmh = speed_mps * 3.6

        # Rule 1: Physical speed violation (teleportation rejection)
        if speed_kmh > self.max_speed_kmh:
            return 0.0, speed_kmh, "SPEED_VIOLATION_TELEPORTATION"

        # Rule 2: Exceeded maximum journey timeout
        if delta_t_sec > self.journey_timeout_sec:
            return 0.0, speed_kmh, "JOURNEY_TIMEOUT_EXPIRED"

        # Rule 3: Gaussian probability density centered at free-flow travel time
        exp_free_flow_sec = ROAD_NETWORK.get_expected_travel_time(cam_u, cam_v)
        # Sigma scaled by distance (longer routes have wider variance due to traffic lights)
        sigma_sec = max(30.0, exp_free_flow_sec * 0.35)

        # Vehicles moving slower due to traffic are natural, but moving significantly faster is penalized
        if delta_t_sec < exp_free_flow_sec * 0.70:
            # Over-speeding on urban corridor
            penalty_ratio = (exp_free_flow_sec * 0.70) - delta_t_sec
            score = max(0.1, math.exp(- (penalty_ratio ** 2) / (2 * (sigma_sec ** 2))))
            return round(score, 4), round(speed_kmh, 1), "HIGH_SPEED_TRANSIT"
        else:
            # Normal to congested transit
            diff = delta_t_sec - exp_free_flow_sec
            score = math.exp(- (diff ** 2) / (2 * (sigma_sec ** 2)))
            # Floor feasibility for delayed vehicles that are still within timeout
            score = max(0.40, score)
            return round(score, 4), round(speed_kmh, 1), "KINEMATICALLY_FEASIBLE"

    def appearance_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculates cosine similarity of 256-d FastReID appearance feature embeddings."""
        if not vec1 or not vec2:
            return 0.50
        v1, v2 = np.array(vec1, dtype=np.float32), np.array(vec2, dtype=np.float32)
        dot = float(np.dot(v1, v2))
        norm1 = float(np.linalg.norm(v1))
        norm2 = float(np.linalg.norm(v2))
        if norm1 <= 0 or norm2 <= 0:
            return 0.50
        cos_sim = dot / (norm1 * norm2)
        # Scale [-1, 1] to [0, 1]
        return round(float((cos_sim + 1.0) / 2.0), 4)

    def calculate_transition_weight(self, ev_u: Dict, ev_v: Dict) -> Tuple[float, Dict]:
        """
        Calculates directed edge weight W(e_u -> e_v) fusing all 4 independent signals.
        """
        cam_u, cam_v = ev_u["camera_id"], ev_v["camera_id"]
        t_u, t_v = ev_u["timestamp"], ev_v["timestamp"]
        delta_t = t_v - t_u

        # Signal 1: Grammar-weighted plate similarity
        plate_u = ev_u.get("plate_display", "")
        plate_v = ev_v.get("plate_display", "")
        sim_plate = self.grammar_weighted_levenshtein(plate_u, plate_v)

        # Signal 2: Kinematic road-network feasibility
        phi_kinematic, speed_kmh, kinematic_status = self.kinematic_feasibility(cam_u, cam_v, delta_t)

        # If kinematic test completely fails (e.g. impossible speed), connection is strictly 0.0
        if phi_kinematic <= 0.0:
            return 0.0, {
                "plate_sim": sim_plate,
                "kinematic_score": 0.0,
                "speed_kmh": speed_kmh,
                "reid_sim": 0.0,
                "class_match": False,
                "status": kinematic_status
            }

        # Signal 3: FastReID appearance similarity
        sim_reid = self.appearance_cosine_similarity(ev_u.get("embedding", []), ev_v.get("embedding", []))

        # Signal 4: Vehicle class match
        class_match = 1.0 if ev_u.get("vehicle_class") == ev_v.get("vehicle_class") else 0.0

        # Weighted combination
        total_weight = (
            self.w_plate * sim_plate +
            self.w_kinematic * phi_kinematic +
            self.w_reid * sim_reid +
            self.w_class * class_match
        )

        details = {
            "plate_sim": sim_plate,
            "kinematic_score": phi_kinematic,
            "speed_kmh": speed_kmh,
            "reid_sim": sim_reid,
            "class_match": bool(class_match),
            "status": kinematic_status,
            "total_weight": round(total_weight, 4)
        }
        return round(total_weight, 4), details

    def ingest_event(self, event: Dict) -> Dict:
        """
        Ingests a new edge telemetry event, attaches it to the vehicle's event log,
        and dynamically updates or reconstructs the trajectory.
        """
        plate_hash = event["plate_hash"]
        if plate_hash not in self.event_store:
            self.event_store[plate_hash] = []
        self.event_store[plate_hash].append(event)
        # Ensure chronological ordering
        self.event_store[plate_hash].sort(key=lambda x: x["timestamp"])

        # Reconstruct optimal trajectory path
        traj = self.reconstruct_trajectory(plate_hash)
        return traj

    def reconstruct_trajectory(self, plate_hash: str) -> Dict:
        """
        Reconstructs the optimal trajectory for a vehicle across all its sightings
        using Dynamic Programming over the ST-DAG.
        """
        events = self.event_store.get(plate_hash, [])
        if not events:
            return {}

        if len(events) == 1:
            ev = events[0]
            cam_info = CAMERAS.get(ev["camera_id"], {})
            traj = {
                "plate_hash": plate_hash,
                "plate_display": ev.get("plate_display", ""),
                "vehicle_class": ev.get("vehicle_class", "car"),
                "vehicle_color": ev.get("vehicle_color", "white"),
                "start_time": ev["timestamp"],
                "end_time": ev["timestamp"],
                "camera_sequence": [ev["camera_id"]],
                "route_points": [[cam_info.get("lat", 0.0), cam_info.get("lng", 0.0)]],
                "total_distance_m": 0.0,
                "avg_speed_kmh": ev.get("estimated_speed_kmh", 45.0),
                "confidence_score": ev.get("plate_confidence", 0.90),
                "is_multicamera": False,
                "transition_details": []
            }
            self.trajectories[plate_hash] = traj
            return traj

        # Solve optimal path through sightings
        n = len(events)
        dp = [0.0] * n
        parent = [-1] * n
        transition_info = {}

        # Initialize base
        for i in range(n):
            dp[i] = events[i].get("plate_confidence", 0.90)

        # Dynamic programming forward pass
        for j in range(1, n):
            best_val = dp[j]
            best_prev = -1
            best_det = None
            for i in range(j):
                weight, det = self.calculate_transition_weight(events[i], events[j])
                if weight >= self.min_threshold:
                    candidate_score = dp[i] + weight
                    if candidate_score > best_val:
                        best_val = candidate_score
                        best_prev = i
                        best_det = det
            dp[j] = best_val
            parent[j] = best_prev
            if best_det:
                transition_info[j] = best_det

        # Backtrack best path
        best_end_idx = max(range(n), key=lambda idx: dp[idx])
        path_indices = []
        curr = best_end_idx
        while curr != -1:
            path_indices.append(curr)
            curr = parent[curr]
        path_indices.reverse()

        linked_events = [events[idx] for idx in path_indices]
        camera_seq = [ev["camera_id"] for ev in linked_events]
        route_points = [[CAMERAS[cid]["lat"], CAMERAS[cid]["lng"]] for cid in camera_seq if cid in CAMERAS]

        # Calculate total distance along road graph
        total_dist_m = 0.0
        for k in range(len(camera_seq) - 1):
            d = ROAD_NETWORK.get_shortest_distance(camera_seq[k], camera_seq[k + 1])
            if not math.isinf(d):
                total_dist_m += d

        duration_sec = linked_events[-1]["timestamp"] - linked_events[0]["timestamp"]
        avg_speed_kmh = (total_dist_m / max(1.0, duration_sec)) * 3.6 if duration_sec > 0 else 45.0

        # Mean trajectory confidence across all links
        conf_scores = [ev.get("plate_confidence", 0.9) for ev in linked_events]
        for idx in path_indices[1:]:
            if idx in transition_info:
                conf_scores.append(transition_info[idx]["total_weight"])
        mean_confidence = float(np.mean(conf_scores)) if conf_scores else 0.90

        traj = {
            "plate_hash": plate_hash,
            "plate_display": linked_events[-1].get("plate_display", ""),
            "vehicle_class": linked_events[-1].get("vehicle_class", "car"),
            "vehicle_color": linked_events[-1].get("vehicle_color", "white"),
            "start_time": linked_events[0]["timestamp"],
            "end_time": linked_events[-1]["timestamp"],
            "camera_sequence": camera_seq,
            "route_points": route_points,
            "total_distance_m": round(total_dist_m, 1),
            "avg_speed_kmh": round(avg_speed_kmh, 1),
            "confidence_score": round(mean_confidence, 4),
            "is_multicamera": len(camera_seq) > 1,
            "transition_details": [transition_info.get(idx, {}) for idx in path_indices[1:]]
        }
        self.trajectories[plate_hash] = traj
        return traj

    def get_trajectory(self, plate_hash: str) -> Optional[Dict]:
        return self.trajectories.get(plate_hash)

# Singleton Trajectory Engine
TRAJECTORY_ENGINE = STDAGTrajectoryEngine()
