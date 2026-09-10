"""
TraffiX-AI: City Corridor Topology & Road Network Graph
Implements the 15-node urban surveillance corridor for Delhi NCR
with topological connectivity, physical road distances, and kinematic bounds.
"""

from typing import Dict, List, Tuple, Optional
import math
import heapq

# 15 Strategic Urban Surveillance Nodes (Delhi NCR Arterial Corridor)
CAMERAS: Dict[str, Dict] = {
    "C01": {"id": "C01", "name": "Kashmere Gate ISBT", "lat": 28.6675, "lng": 77.2285, "heading": 175.0, "zone": "North Hub", "reliability": 0.98},
    "C02": {"id": "C02", "name": "Red Fort / Netaji Subhash", "lat": 28.6562, "lng": 77.2410, "heading": 160.0, "zone": "Old Delhi Heritage", "reliability": 0.94},
    "C03": {"id": "C03", "name": "Delhi Gate / Asaf Ali", "lat": 28.6415, "lng": 77.2405, "heading": 180.0, "zone": "Central Corridor", "reliability": 0.96},
    "C04": {"id": "C04", "name": "ITO Junction / Vikas Marg", "lat": 28.6295, "lng": 77.2435, "heading": 185.0, "zone": "Central Financial", "reliability": 0.99},
    "C05": {"id": "C05", "name": "Connaught Place Outer", "lat": 28.6315, "lng": 77.2167, "heading": 120.0, "zone": "Commercial Cordon", "reliability": 0.97},
    "C06": {"id": "C06", "name": "Mandi House Roundabout", "lat": 28.6255, "lng": 77.2340, "heading": 140.0, "zone": "Cultural Hub", "reliability": 0.95},
    "C07": {"id": "C07", "name": "India Gate C-Hexagon", "lat": 28.6129, "lng": 77.2295, "heading": 190.0, "zone": "Heritage Cordon", "reliability": 0.99},
    "C08": {"id": "C08", "name": "Pragati Maidan / Bhairon", "lat": 28.6160, "lng": 77.2450, "heading": 165.0, "zone": "Exhibition Corridor", "reliability": 0.93},
    "C09": {"id": "C09", "name": "Khan Market / Lodhi Road", "lat": 28.6002, "lng": 77.2270, "heading": 200.0, "zone": "South-Central", "reliability": 0.97},
    "C10": {"id": "C10", "name": "Sarai Kale Khan / Ring Rd", "lat": 28.5895, "lng": 77.2550, "heading": 215.0, "zone": "Transit Terminal", "reliability": 0.96},
    "C11": {"id": "C11", "name": "Lajpat Nagar Flyover", "lat": 28.5700, "lng": 77.2430, "heading": 240.0, "zone": "Ring Road South", "reliability": 0.98},
    "C12": {"id": "C12", "name": "Moolchand Underpass", "lat": 28.5650, "lng": 77.2330, "heading": 255.0, "zone": "Ring Road South", "reliability": 0.94},
    "C13": {"id": "C13", "name": "South Extension Ring Rd", "lat": 28.5685, "lng": 77.2180, "heading": 265.0, "zone": "Commercial Ring", "reliability": 0.96},
    "C14": {"id": "C14", "name": "AIIMS / Safdarjung Jn", "lat": 28.5695, "lng": 77.2085, "heading": 275.0, "zone": "Medical Arterial", "reliability": 0.98},
    "C15": {"id": "C15", "name": "Dhaula Kuan Interchange", "lat": 28.5925, "lng": 77.1610, "heading": 300.0, "zone": "Western Gateway", "reliability": 0.99},
}

# Directed Road Segments (origin, destination, road_distance_meters, speed_limit_kmh, capacity_vph)
ROAD_SEGMENTS: List[Dict] = [
    # North to Central Arterial Corridor
    {"u": "C01", "v": "C02", "dist_m": 1600, "speed_limit": 50, "capacity": 2400, "name": "Netaji Subhash Marg"},
    {"u": "C02", "v": "C01", "dist_m": 1600, "speed_limit": 50, "capacity": 2400, "name": "Netaji Subhash Marg (NB)"},
    {"u": "C02", "v": "C03", "dist_m": 1700, "speed_limit": 50, "capacity": 2200, "name": "Daryaganj Main Rd"},
    {"u": "C03", "v": "C02", "dist_m": 1700, "speed_limit": 50, "capacity": 2200, "name": "Daryaganj Main Rd (NB)"},
    {"u": "C03", "v": "C04", "dist_m": 1400, "speed_limit": 50, "capacity": 2600, "name": "Bahadur Shah Zafar Marg"},
    {"u": "C04", "v": "C03", "dist_m": 1400, "speed_limit": 50, "capacity": 2600, "name": "BSZ Marg (NB)"},
    
    # Connaught Place Radial Feeder Links
    {"u": "C03", "v": "C05", "dist_m": 2500, "speed_limit": 40, "capacity": 1800, "name": "Asaf Ali - Barakhamba Connector"},
    {"u": "C05", "v": "C03", "dist_m": 2500, "speed_limit": 40, "capacity": 1800, "name": "Barakhamba - Asaf Ali Connector"},
    {"u": "C05", "v": "C06", "dist_m": 1800, "speed_limit": 40, "capacity": 2000, "name": "Barakhamba Rd to Mandi House"},
    {"u": "C06", "v": "C05", "dist_m": 1800, "speed_limit": 40, "capacity": 2000, "name": "Mandi House to CP"},
    {"u": "C04", "v": "C06", "dist_m": 1100, "speed_limit": 45, "capacity": 2200, "name": "Sikandra Road"},
    {"u": "C06", "v": "C04", "dist_m": 1100, "speed_limit": 45, "capacity": 2200, "name": "Sikandra Road (EB)"},

    # Central to South Arterials
    {"u": "C06", "v": "C07", "dist_m": 1500, "speed_limit": 50, "capacity": 2800, "name": "Tilak Marg to C-Hexagon"},
    {"u": "C07", "v": "C06", "dist_m": 1500, "speed_limit": 50, "capacity": 2800, "name": "Tilak Marg (NB)"},
    {"u": "C04", "v": "C08", "dist_m": 1500, "speed_limit": 50, "capacity": 2500, "name": "Bhairon Marg Eastern Access"},
    {"u": "C08", "v": "C04", "dist_m": 1500, "speed_limit": 50, "capacity": 2500, "name": "Bhairon Marg to ITO"},
    {"u": "C07", "v": "C08", "dist_m": 1600, "speed_limit": 45, "capacity": 2000, "name": "Purana Qila Connector"},
    {"u": "C08", "v": "C07", "dist_m": 1600, "speed_limit": 45, "capacity": 2000, "name": "Purana Qila Connector (WB)"},

    # South Arterial to Ring Road
    {"u": "C07", "v": "C09", "dist_m": 1600, "speed_limit": 50, "capacity": 2400, "name": "Shahjahan Road to Lodhi"},
    {"u": "C09", "v": "C07", "dist_m": 1600, "speed_limit": 50, "capacity": 2400, "name": "Shahjahan Road (NB)"},
    {"u": "C08", "v": "C10", "dist_m": 3100, "speed_limit": 60, "capacity": 3200, "name": "Mathura Road to Sarai Kale Khan"},
    {"u": "C10", "v": "C08", "dist_m": 3100, "speed_limit": 60, "capacity": 3200, "name": "Mathura Road (NB)"},
    {"u": "C09", "v": "C11", "dist_m": 3800, "speed_limit": 55, "capacity": 2800, "name": "Lala Lajpat Rai Marg"},
    {"u": "C11", "v": "C09", "dist_m": 3800, "speed_limit": 55, "capacity": 2800, "name": "Lala Lajpat Rai Marg (NB)"},
    {"u": "C10", "v": "C11", "dist_m": 2400, "speed_limit": 60, "capacity": 3400, "name": "Mahatma Gandhi Ring Road South"},
    {"u": "C11", "v": "C10", "dist_m": 2400, "speed_limit": 60, "capacity": 3400, "name": "Ring Road Eastbound"},

    # Ring Road South Express Corridor
    {"u": "C11", "v": "C12", "dist_m": 1200, "speed_limit": 60, "capacity": 3400, "name": "Ring Road - Moolchand"},
    {"u": "C12", "v": "C11", "dist_m": 1200, "speed_limit": 60, "capacity": 3400, "name": "Ring Road - Moolchand (EB)"},
    {"u": "C12", "v": "C13", "dist_m": 1500, "speed_limit": 60, "capacity": 3400, "name": "Ring Road - South Ext"},
    {"u": "C13", "v": "C12", "dist_m": 1500, "speed_limit": 60, "capacity": 3400, "name": "Ring Road - South Ext (EB)"},
    {"u": "C13", "v": "C14", "dist_m": 1000, "speed_limit": 55, "capacity": 3600, "name": "Ring Road - AIIMS Flyover"},
    {"u": "C14", "v": "C13", "dist_m": 1000, "speed_limit": 55, "capacity": 3600, "name": "Ring Road - AIIMS (EB)"},
    {"u": "C14", "v": "C15", "dist_m": 5400, "speed_limit": 70, "capacity": 4000, "name": "Ring Road - Dhaula Kuan Express"},
    {"u": "C15", "v": "C14", "dist_m": 5400, "speed_limit": 70, "capacity": 4000, "name": "Ring Road - Dhaula Kuan (EB)"},
]

class RoadGraph:
    """Graph structure managing adjacency, shortest paths, and travel times."""
    
    def __init__(self):
        self.adj: Dict[str, List[Tuple[str, float, float]]] = {cid: [] for cid in CAMERAS}
        self.segments: Dict[Tuple[str, str], Dict] = {}
        for seg in ROAD_SEGMENTS:
            u, v = seg["u"], seg["v"]
            dist = float(seg["dist_m"])
            spd = float(seg["speed_limit"])
            self.adj[u].append((v, dist, spd))
            self.segments[(u, v)] = seg

        # Precompute all-pairs shortest road distance and free-flow travel times
        self.shortest_dist: Dict[Tuple[str, str], float] = {}
        self.shortest_time: Dict[Tuple[str, str], float] = {}
        self._compute_all_pairs()

    def _compute_all_pairs(self):
        for src in CAMERAS:
            # Dijkstra for distance
            dist_map = {c: float("inf") for c in CAMERAS}
            time_map = {c: float("inf") for c in CAMERAS}
            dist_map[src] = 0.0
            time_map[src] = 0.0
            
            pq = [(0.0, 0.0, src)] # (dist, time, node)
            while pq:
                d, t, curr = heapq.heappop(pq)
                if d > dist_map[curr]:
                    continue
                for neighbor, seg_dist, seg_spd in self.adj[curr]:
                    free_flow_sec = (seg_dist / 1000.0) / (seg_spd / 3600.0)
                    new_d = d + seg_dist
                    new_t = t + free_flow_sec
                    if new_d < dist_map[neighbor]:
                        dist_map[neighbor] = new_d
                        time_map[neighbor] = new_t
                        heapq.heappush(pq, (new_d, new_t, neighbor))

            for dst in CAMERAS:
                self.shortest_dist[(src, dst)] = dist_map[dst]
                self.shortest_time[(src, dst)] = time_map[dst]

    def get_shortest_distance(self, u: str, v: str) -> float:
        """Returns shortest road network distance in meters (inf if unreachable)."""
        return self.shortest_dist.get((u, v), float("inf"))

    def get_expected_travel_time(self, u: str, v: str) -> float:
        """Returns expected free-flow travel time in seconds."""
        return self.shortest_time.get((u, v), float("inf"))

    def get_segment(self, u: str, v: str) -> Optional[Dict]:
        return self.segments.get((u, v))

# Singleton Graph Instance
ROAD_NETWORK = RoadGraph()
