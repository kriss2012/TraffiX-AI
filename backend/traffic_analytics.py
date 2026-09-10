"""
TraffiX-AI: Urban Traffic Analytics Engine
Computes Indo-HCM compliant mobility metrics:
- Flow Rate (q), Space-Mean Speed (v_s), Density (k)
- Level of Service (LOS A through F)
- Dynamic Origin-Destination (OD) Matrix
- Corridor Bottleneck & Congestion Detector
"""

import time
import math
from typing import Dict, List, Tuple
from collections import defaultdict
from corridor_topology import ROAD_SEGMENTS, CAMERAS

class UrbanTrafficAnalyticsEngine:
    """Calculates macro-level traffic engineering metrics adhering to Indo-HCM standards."""

    def __init__(self, rolling_window_sec: float = 300.0):
        self.rolling_window_sec = rolling_window_sec
        # Store recent vehicle crossings: segment_key (u, v) -> list of (timestamp, speed_kmh)
        self.segment_crossings: Dict[Tuple[str, str], List[Tuple[float, float]]] = defaultdict(list)
        # Store completed journeys: (origin_cam, dest_cam) -> count
        self.od_matrix: Dict[Tuple[str, str], int] = defaultdict(int)

    def record_segment_transit(self, cam_u: str, cam_v: str, speed_kmh: float, timestamp: float = None):
        """Records a vehicle moving from Camera u to Camera v."""
        if timestamp is None:
            timestamp = time.time()
        self.segment_crossings[(cam_u, cam_v)].append((timestamp, speed_kmh))
        self.od_matrix[(cam_u, cam_v)] += 1

    def compute_corridor_metrics(self) -> List[Dict]:
        """
        Computes real-time flow rate, space-mean speed, density, and Indo-HCM LOS
        for all directed road segments in the network.
        """
        now = time.time()
        window_start = now - self.rolling_window_sec
        results = []

        for seg in ROAD_SEGMENTS:
            u, v = seg["u"], seg["v"]
            dist_m = float(seg["dist_m"])
            capacity = float(seg["capacity"])
            speed_limit = float(seg["speed_limit"])

            # Clean and filter events in rolling window
            events = [
                ev for ev in self.segment_crossings[(u, v)]
                if ev[0] >= window_start
            ]
            self.segment_crossings[(u, v)] = events

            vehicle_count = len(events)
            # Extrapolate flow rate to 1 hour (vph)
            flow_rate_vph = (vehicle_count / (self.rolling_window_sec / 3600.0))

            if events:
                speeds = [ev[1] for ev in events if ev[1] > 0]
                # Harmonic mean for space-mean speed
                if speeds:
                    space_mean_speed = len(speeds) / sum(1.0 / s for s in speeds)
                else:
                    space_mean_speed = speed_limit * 0.8
            else:
                space_mean_speed = speed_limit * 0.9

            space_mean_speed = max(5.0, min(speed_limit * 1.1, space_mean_speed))

            # Density k = q / v_s (vehicles/km)
            density_vpk = (flow_rate_vph / space_mean_speed) if space_mean_speed > 0 else 0.0

            # Volume-to-Capacity ratio (V/C)
            vc_ratio = flow_rate_vph / capacity

            # Indo-HCM Level of Service (LOS) Index
            if vc_ratio <= 0.60:
                los = "A"
                los_desc = "Free Flow (Optimal)"
            elif vc_ratio <= 0.70:
                los = "B"
                los_desc = "Reasonably Free Flow"
            elif vc_ratio <= 0.80:
                los = "C"
                los_desc = "Stable Flow"
            elif vc_ratio <= 0.90:
                los = "D"
                los_desc = "Approaching Unstable"
            elif vc_ratio <= 1.00:
                los = "E"
                los_desc = "Unstable / Capacity Limit"
            else:
                los = "F"
                los_desc = "Forced Breakdown (Severe Congestion)"

            # Congestion Index: (v_free - v_actual) / v_free
            congestion_index = max(0.0, min(1.0, (speed_limit - space_mean_speed) / speed_limit))

            results.append({
                "origin_cam": u,
                "dest_cam": v,
                "segment_name": seg["name"],
                "origin_coords": [CAMERAS[u]["lat"], CAMERAS[u]["lng"]],
                "dest_coords": [CAMERAS[v]["lat"], CAMERAS[v]["lng"]],
                "dist_m": dist_m,
                "speed_limit_kmh": speed_limit,
                "vehicle_count_5min": vehicle_count,
                "flow_rate_vph": round(flow_rate_vph, 1),
                "space_mean_speed_kmh": round(space_mean_speed, 1),
                "density_vpk": round(density_vpk, 1),
                "vc_ratio": round(vc_ratio, 3),
                "level_of_service": los,
                "los_description": los_desc,
                "congestion_index": round(congestion_index, 2),
                "is_congested": vc_ratio > 0.85 or congestion_index > 0.50
            })

        return results

    def get_origin_destination_matrix(self) -> Dict:
        """Returns the dynamic Origin-Destination flux matrix across all camera nodes."""
        od_list = []
        for (u, v), count in sorted(self.od_matrix.items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                od_list.append({
                    "origin": u,
                    "origin_name": CAMERAS[u]["name"],
                    "destination": v,
                    "dest_name": CAMERAS[v]["name"],
                    "trip_count": count
                })
        return {
            "total_trips": sum(self.od_matrix.values()),
            "od_flows": od_list[:15] # Top 15 OD corridors
        }

# Singleton Analytics Engine
ANALYTICS_ENGINE = UrbanTrafficAnalyticsEngine()
