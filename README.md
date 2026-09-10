<div align="center">

<!-- ═══════════════════════════════════════════════════════════════ -->
<!--                         HERO BANNER                           -->
<!-- ═══════════════════════════════════════════════════════════════ -->

<img
  src="https://capsule-render.vercel.app/api?type=waving&amp;height=280&amp;color=0:050505,35:0a192f,70:0284c7,100:00f2fe&amp;text=TraffiX-AI&amp;fontColor=ffffff&amp;fontSize=62&amp;fontAlignY=36&amp;desc=Autonomous%20Computer%20Vision%20%26%20Edge%20Traffic%20Optimization%20Engine&amp;descAlignY=58&amp;descSize=19&amp;animation=fadeIn"
  width="100%"
  alt="TraffiX-AI Main Banner"
/>

<br>

### 🏆 SMART INDIA HACKATHON (SIH) INNOVATION PROJECT
### Developed by Team **`Logic Legend`**

<br>

[![GitHub Stars](https://img.shields.io/github/stars/202tejaspatil-hash/TraffiX-AI?style=for-the-badge&amp;color=0284c7&amp;logo=github)](https://github.com/202tejaspatil-hash/TraffiX-AI/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/202tejaspatil-hash/TraffiX-AI?style=for-the-badge&amp;color=00f2fe&amp;logo=github)](https://github.com/202tejaspatil-hash/TraffiX-AI/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge&amp;color=0f172a)](./LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.9%20%7C%203.10%20%7C%203.11-3776AB?style=for-the-badge&amp;logo=python&amp;logoColor=white)](https://python.org)
[![Inference Architecture](https://img.shields.io/badge/Inference-YOLOv8%20%2B%20ByteTrack-FF6F00?style=for-the-badge&amp;logo=opencv&amp;logoColor=white)](#)
[![Hardware Target](https://img.shields.io/badge/Edge%20Ready-NVIDIA%20Jetson%20%2F%20CUDA-76B900?style=for-the-badge&amp;logo=nvidia&amp;logoColor=white)](#)

<br>

> ### 🚦 *"Eliminating urban gridlock through autonomous edge vision, real-time spatial queuing analysis, and intelligent signal orchestration."*

</div>

---

# 🌐 COMMAND CENTER // SYSTEM IDENTITY

```text
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║                                     TRAFFIX-AI RUNTIME v2.4                                  ║
╠══════════════════════════════════════════════════════════════════════════════════════════════╣
║  Project Origin       : Smart India Hackathon (SIH) Initiative                              ║
║  Engineering Team     : Logic Legend                                                         ║
║  Project Lead         : Krishna Patil                                                        ║
║  Core Contributor     : Tejas Patil (@202tejaspatil-hash)                                    ║
║  Architecture         : Deep Vision Inference + Dynamic Density Matrix + Actuation Pipeline  ║
║  Inference Backbone   : Ultralytics YOLOv8 (CSPDarknet + PANet Feature Pyramid)             ║
║  Tracking Engine      : ByteTrack Two-Stage Association + Kalman Kinematics                  ║
║  Ingestion Feeds      : IP CCTV (RTSP), Drone Footage, Offline Dashcam (MP4/AVI)             ║
║  Operating Precision  : FP32 / FP16 Mixed Precision / TensorRT INT8 Quantized               ║
║  Deployment Target    : NVIDIA Jetson Orin/Nano, Linux GPU Nodes, Edge Gateways              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
```

**TraffiX-AI** is an industrial-grade, edge-deployable intelligent traffic management system engineered by team **Logic Legend** for the **Smart India Hackathon (SIH)**. Urban traffic congestion causes billions in lost economic productivity, massive fuel wastage, and increased emergency response delays. Traditional timer-based signals operate blindly without real-time awareness of vehicular queues.

TraffiX-AI solves this systemic problem by transforming ordinary junction surveillance cameras into autonomous sensor grids. The system processes visual streams locally, detects and categorizes vehicles into discrete weight classes, computes instantaneous polygon-based road occupancy, calculates velocity and dwell intervals, and feeds live signal controllers to dynamically adjust green-light intervals on demand.

---

# 👥 TEAM LOGIC LEGEND

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     TEAM: LOGIC LEGEND                                       │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  We are a team of developers, AI practitioners, and systems architects participating in the  │
│  Smart India Hackathon. Our goal is to build resilient, accessible, and high-impact          │
│  computational systems that solve high-stakes civic infrastructure problems.                 │
│                                                                                              │
│  • Project Lead                    : Krishna Patil                                           │
│  • Core Developer & Contributor    : Tejas Patil (@202tejaspatil-hash)                       │
│  • Engineering Focus               : Edge AI, Real-Time Vision Systems, Smart Mobility       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 💎 CORE SYSTEM CAPABILITIES

<div align="center">

| Module | Core Functionality | Technical Mechanism | Operational State |
| :--- | :--- | :--- | :---: |
| 🚗 **Heterogeneous Detection** | Detects mixed traffic: cars, buses, heavy trucks, bikes, auto-rickshaws, pedestrians | Multi-head anchor-free YOLOv8 feature extraction | `PRODUCTION` |
| 🎯 **Associative Tracking** | Tracks individual vehicles persistently through dense clusters and flyover occlusions | ByteTrack with low-score detection matching & Kalman state prediction | `PRODUCTION` |
| 📐 **Dynamic ROI Lane Masking** | Arbitrary polygon zone mapping for multi-lane intersections and roundabout approaches | Shapely vector geometry & point-in-polygon (PIP) ray casting | `STABLE` |
| 📊 **Dynamic Congestion Index** | Evaluates occupancy percentage, queue length, and vehicle density coefficients per lane | Weighted passenger-car-unit (PCU) matrix aggregation | `STABLE` |
| ⚡ **Adaptive Signal Logic** | Dynamically calculates proportional green signal phases based on actual queue depth | Actuation heuristic algorithm feeding traffic signal microcontrollers | `ACTIVE` |
| 🚨 **Incident & Hazard Alerting** | Flags wrong-way vehicles, stalled autos in box junctions, and pedestrian hazards | Velocity vector divergence & temporal dwell thresholds | `BETA` |
| 📡 **Distributed Telemetry** | Broadcasts live density metrics, camera state, and flow logs via low-latency sockets | FastAPI AsyncIO WebSockets with Redis pub/sub backplane | `ACTIVE` |
| 🧊 **Edge Hardware Engine** | Runs low-latency onboard inference without continuous reliance on high-bandwidth cloud | TensorRT FP16/INT8 serialized engine execution | `INTEGRATING` |

</div>

---

# 🏛️ END-TO-END SYSTEM ARCHITECTURE

```mermaid
flowchart TD
    subgraph INGESTION["📥 LAYER 1: Optical Feed Ingestion"]
        CCTV["📹 Traffic Junction CCTV (RTSP Stream)"] --> Buffer["Frame Grabbing & Threaded FIFO Buffer"]
        Drone["🚁 Aerial / Drone Surveillance Feeds"] --> Buffer
        Video["📁 Stored Video Benchmark (.mp4, .avi)"] --> Buffer
    end

    subgraph PREPROCESSING["⚙️ LAYER 2: Hardware Acceleration & Preprocessing"]
        Buffer --> Letterbox["Letterbox Rescaling & Aspect Ratio Padding"]
        Letterbox --> TensorConv["BGR to RGB Conversion & Normalization (1/255)"]
        TensorConv --> MemoryAlloc["Pinned Host-to-Device Memory Transfer (CUDA)"]
    end

    subgraph NEURAL["🧠 LAYER 3: Deep Vision Inference"]
        MemoryAlloc --> YOLO["YOLOv8 Deep Neural Network (Backbone + PAN-Neck)"]
        YOLO --> BBoxes["Raw Bounding Boxes + Confidence Probabilities + Class IDs"]
        BBoxes --> NMS["Non-Maximum Suppression (IoU Thresholding)"]
    end

    subgraph TRACKING["🔄 LAYER 4: State Estimation & Trajectory Tracking"]
        NMS --> ByteTrack["ByteTrack Association Engine"]
        ByteTrack --> Kalman["Kalman Filter (Position, Velocity, Acceleration Estimation)"]
        Kalman --> TrackStore["Persistent Track Identity & History Cache"]
    end

    subgraph SPATIAL["📐 LAYER 5: Spatial Computation & Density Matrix"]
        TrackStore --> ROI["Region of Interest (ROI) Multi-Lane Polygon Mapping"]
        ROI --> PCU["Passenger Car Unit (PCU) Weighted Density Accumulator"]
        ROI --> Trajectory["Centroid Directional Vector & Velocity Calculation"]
        ROI --> Anomaly["Spatial Anomaly Evaluator (Wrong-Way, Stationary Vehicle)"]
    end

    subgraph ACTUATION["🚀 LAYER 6: Telemetry, WebSockets & Signal Control"]
        PCU --> SignalEngine["🚦 Adaptive Signal Timing Controller (Green-Split Algorithm)"]
        SignalEngine --> HardwareRelay["Microcontroller / Traffic Light Relay Unit"]
        PCU --> FastAPIServer["📡 FastAPI High-Throughput WebSocket Server"]
        Trajectory --> FastAPIServer
        Anomaly --> FastAPIServer
        FastAPIServer --> LiveHUD["💻 Real-Time Analytics Dashboard UI"]
        FastAPIServer --> Database[("🗄️ Time-Series Metrics Store (PostGIS / MongoDB)")]
    end
```

---

# 🧬 PIPELINE DATA PROCESSING LIFECYCLE

```text
   +-------------------------------------------------------------------------+
   |                     LAYER 1: CAMERA STREAM CAPTURE                      |
   |   OpenCV VideoCapture / GStreamer Pipeline / RTSP Live Video Feeds      |
   +------------------------------------+------------------------------------+
                                        |
                                        ▼
   +-------------------------------------------------------------------------+
   |                    LAYER 2: NEURAL INFERENCE ENGINE                     |
   |   YOLOv8 Forward Pass (640x640 Input Tensor)                           |
   |   Extract: [x1, y1, x2, y2, confidence_score, class_index]             |
   +------------------------------------+------------------------------------+
                                        |
                                        ▼
   +-------------------------------------------------------------------------+
   |                     LAYER 3: KALMAN KINEMATICS & ID                     |
   |   ByteTrack: Associates high-confidence AND low-confidence boxes       |
   |   Prevents ID switches during occlusions, lane merges, and stops        |
   +------------------------------------+------------------------------------+
                                        |
                                        ▼
   +-------------------------------------------------------------------------+
   |                 LAYER 4: POLYGON INTERSECTION COMPUTATION               |
   |   Point-in-Polygon check against predefined coordinates:                |
   |   Lane A (Northbound) | Lane B (Southbound) | Lane C (East) | Lane D    |
   +------------------------------------+------------------------------------+
                                        |
                                        ▼
   +-------------------------------------------------------------------------+
   |                  LAYER 5: TRAFFIC DENSITY FORMULATION                   |
   |   Density Score = Σ (Vehicle_Count[class] * Weight_Factor[class])       |
   |   Auto = 0.5 | Car = 1.0 | Bus = 3.0 | Heavy Truck = 3.5                |
   +------------------------------------+------------------------------------+
                                        |
                      +-----------------+-----------------+
                      |                                   |
                      ▼                                   ▼
   +-------------------------------------+ +---------------------------------+
   |      SIGNAL DISPATCH CONTROLLER     | |      REAL-TIME HUD TELEMETRY    |
   | Allocates dynamic green phase time  | | WebSocket JSON transmission to  |
   | (e.g., Lane A = 45s, Lane B = 15s)  | | React / Web Analytics dashboard |
   +-------------------------------------+ +---------------------------------+
```

---

# 🧮 TRAFFIC OPTIMIZATION MATHEMATICS

To prevent arbitrary signal distribution, team **Logic Legend** uses a weighted Passenger Car Unit (**PCU**) formulation to compute dynamic green intervals:

### 1. Equivalent Vehicle Weighting (PCU Index)

$$\text{PCU}_{\text{lane}} = \sum_{i=1}^{N} w_{i}$$

Where individual vehicle weights $w_i$ reflect roadway space consumption:
* **Two-Wheeler (Motorcycle/Bicycle):** $0.5$
* **Standard Passenger Car:** $1.0$
* **Auto-Rickshaw:** $1.0$
* **Medium Commercial (Bus/Mini-truck):** $2.5$
* **Heavy Multi-Axle Truck:** $3.5$

### 2. Adaptive Green Time Distribution

$$\Delta T_{\text{green}} = T_{\text{min}} + \left( \frac{\text{PCU}_{\text{active}}}{\sum_{k=1}^{M} \text{PCU}_{k}} \right) \times \left( T_{\text{cycle}} - M \times T_{\text{yellow}} \right)$$

This mathematical approach guarantees that lanes carrying heavily loaded commercial vehicles, buses, or emergency priority traffic are cleared systematically, reducing queue propagation at bottle-necked junctions.

---

# 🛠️ TECHNOLOGY STACK

<div align="center">

| System Tier | Technologies |
| :--- | :--- |
| **Vision & AI Frameworks** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&amp;logo=python&amp;logoColor=white) ![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&amp;logo=opencv&amp;logoColor=white) ![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&amp;logo=pytorch&amp;logoColor=white) ![Ultralytics](https://img.shields.io/badge/YOLOv8-00FFFF?style=flat-square&amp;logo=visual-studio-code&amp;logoColor=black) ![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&amp;logo=numpy&amp;logoColor=white) ![Shapely](https://img.shields.io/badge/Shapely-Geometry-43B02A?style=flat-square) |
| **Backend & WebSockets** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&amp;logo=fastapi&amp;logoColor=white) ![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&amp;logo=flask&amp;logoColor=white) ![Uvicorn](https://img.shields.io/badge/Uvicorn-499848?style=flat-square&amp;logo=gunicorn&amp;logoColor=white) ![WebSockets](https://img.shields.io/badge/WebSockets-Protocol-red?style=flat-square) |
| **Databases & Telemetry** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&amp;logo=postgresql&amp;logoColor=white) ![PostGIS](https://img.shields.io/badge/PostGIS-Spatial-336791?style=flat-square) ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&amp;logo=mongodb&amp;logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&amp;logo=redis&amp;logoColor=white) |
| **Edge Hardware & Acceleration** | ![NVIDIA](https://img.shields.io/badge/NVIDIA-CUDA-76B900?style=flat-square&amp;logo=nvidia&amp;logoColor=white) ![TensorRT](https://img.shields.io/badge/NVIDIA-TensorRT-76B900?style=flat-square) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&amp;logo=docker&amp;logoColor=white) ![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&amp;logo=linux&amp;logoColor=black) |

</div>

---

# ⚡ GETTING STARTED & LOCAL INSTALLATION

### Prerequisites

* **OS:** Ubuntu 20.04/22.04 LTS (preferred) or Windows 10/11
* **Python Runtime:** `Python 3.9` through `3.11`
* **GPU Compute:** NVIDIA GPU with CUDA 11.8 or 12.x and cuDNN (optional, CPU mode supported)
* **Video Tools:** FFmpeg installed on system path

### 1. Clone the Official Repository

```bash
git clone [https://github.com/202tejaspatil-hash/TraffiX-AI.git](https://github.com/202tejaspatil-hash/TraffiX-AI.git)
cd TraffiX-AI
```

### 2. Set Up Virtual Environment

```bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Install All Project Dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Lane Boundaries (ROI)

Define your polygon coordinates for intersection lanes inside `config/zones_config.json`:

```json
{
  "lanes": [
    {
      "id": "North_Approach",
      "polygon": [[240, 480], [420, 210], [580, 210], [510, 480]],
      "weight_multiplier": 1.0
    },
    {
      "id": "South_Approach",
      "polygon": [[680, 720], [740, 310], [920, 310], [980, 720]],
      "weight_multiplier": 1.0
    }
  ]
}
```

### 5. Launch the Traffic Tracking Pipeline

Run the tracker on test video footage:

```bash
python main.py --source data/sample_traffic.mp4 --weights models/yolov8n.pt --conf 0.40 --show
```

Run against a live network security camera (RTSP stream):

```bash
python main.py --source "rtsp://admin:pass@192.168.1.100:554/live/ch0" --weights models/yolov8s.pt --conf 0.50 --save-metrics
```

---

# 📂 REPOSITORY ARCHITECTURE

```text
TraffiX-AI/
├── 📁 .github/                      # CI/CD pipelines & automated workflows
│   └── workflows/
│       └── build-test.yml           # Automated unit tests and linting
├── 📁 config/                       # System configuration & calibration files
│   ├── detector_config.yaml         # YOLO confidence and NMS thresholds
│   ├── tracker_config.yaml          # ByteTrack Kalman filter hyperparameters
│   └── zones_config.json            # Polygonal coordinates for traffic lanes
├── 📁 data/                         # Sample assets and benchmark recordings
│   ├── sample_traffic.mp4           # Default verification video
│   └── calibration_sample.jpg       # Static image for coordinate mapping
├── 📁 models/                       # Weight checkpoints & model assets
│   ├── yolov8n.pt                   # Lightweight model (Edge & Testing)
│   ├── yolov8s.pt                   # Balanced model (Standard deployment)
│   └── custom_traffic_weights.pt    # Fine-tuned on Indian traffic datasets
├── 📁 src/                          # Core application logic
│   ├── __init__.py
│   ├── detector.py                  # YOLOv8 tensor parsing & inference wrapper
│   ├── tracker.py                   # ByteTrack tracking & Kalman state updater
│   ├── analytics.py                 # PCU index calculation & queue metrics
│   ├── lane_manager.py              # Shapely geometry & polygon mask checks
│   ├── anomaly_detector.py          # Stalled vehicle & reverse movement flags
│   ├── signal_controller.py         # Dynamic green-light phase timing algorithm
│   └── visualizer.py                # OpenCV HUD, polygon render, live metrics
├── 📁 web/                          # Telemetry API and dashboard UI
│   ├── server.py                    # FastAPI async WebSocket server
│   ├── static/                      # CSS styling, JavaScript charting clients
│   └── templates/
│       └── index.html               # Real-time traffic monitoring HUD
├── main.py                          # Primary execution entry-point script
├── requirements.txt                 # Exact pinned dependencies
├── Dockerfile                       # Containerized edge deployment build recipe
├── docker-compose.yml               # Multi-container orchestration (App + Redis)
├── LICENSE                          # MIT Open Source License
└── README.md                        # Documentation
```

---

# 🎯 DEVELOPMENT ROADMAP & MILESTONES

```text
                   SIH PROJECT ROADMAP - TEAM LOGIC LEGEND

     ┌───────────────────────────────────────────────────────────────────┐
     │                                                                   │
     │  ✅ Phase 1: Real-time Multi-Class YOLOv8 Vehicular Detection     │
     │                                                                   │
     │  ✅ Phase 2: Kalman-based ByteTrack ID Persistence & Trajectories │
     │                                                                   │
     │  ✅ Phase 3: Shapely Polygon Multi-Lane Geometric Masking         │
     │                                                                   │
     │  ✅ Phase 4: Passenger Car Unit (PCU) Density Scoring Engine      │
     │                                                                   │
     │  🔄 Phase 5: Autonomous Microcontroller Relay Signaling Logic     │
     │                                                                   │
     │  🔄 Phase 6: TensorRT INT8 Quantization for NVIDIA Jetson Edge   │
     │                                                                   │
     │  ⬜ Phase 7: Multi-Junction Coordinated Green Wave Mesh System    │
     │                                                                   │
     │  ⬜ Phase 8: Emergency Vehicle (Ambulance/Fire) Priority Routing │
     │                                                                   │
     └───────────────────────────────────────────────────────────────────┘
```

---

# 🏆 SMART INDIA HACKATHON VALUE PROPOSITION

* **Zero Infrastructure Overhaul:** Works directly on top of legacy CCTV cameras without requiring expensive inductive road loops.
* **Low Latency on Edge Hardware:** Designed to run fully on-premise on devices like the NVIDIA Jetson Orin Nano, preventing reliance on high-bandwidth optical uplinks.
* **Tailored for High-Entropy Traffic:** Tuned to identify mixed vehicles, dense clustering, and unstructured driving patterns typical in major Indian metropolitan intersections.

---

# 🤝 CONTRIBUTING TO TRAFFIX-AI

We welcome issues, feedback, and pull requests from other developers and hackathon participants:

1. **Fork the Repository**
2. Create your Feature Branch (`git checkout -b feature/SmartTrafficOptimization`)
3. Commit your Changes (`git commit -m 'feat: Add green wave multi-junction sync'`)
4. Push to the Branch (`git push origin feature/SmartTrafficOptimization`)
5. Open a **Pull Request**

---

# 📄 LICENSE

This project is open-source under the **MIT License**. Check the [LICENSE](./LICENSE) file for terms and conditions.

---

<div align="center">

### Developed for Smart India Hackathon by  
## ⚡ Team **Logic Legend** ⚡

**Project Lead:** Krishna Patil  
**Core Contributor:** [Tejas Patil](https://github.com/202tejaspatil-hash)

<br>

<img
  src="https://capsule-render.vercel.app/api?type=waving&amp;height=120&amp;section=footer&amp;color=0:00f2fe,50:0284c7,100:050505"
  width="100%"
  alt="Footer Banner"
/>

</div>
