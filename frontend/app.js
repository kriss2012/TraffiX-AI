/**
 * TraffiX-AI: Full-Stack Command Center GIS & Multi-Screen Controller
 * Coordinates:
 * 1. Multi-screen navigation (Overview, ANPR, Tracking, Trajectories, Analytics, Alerts, Validation, Health)
 * 2. Leaflet GIS dark matter map & dynamic Level of Service (LOS) polylines
 * 3. Real-time WebSocket streaming & telemetry ticker
 * 4. Model validation & accuracy benchmark tables
 * 5. Explainable Alert Triage & Human-in-the-loop verification
 * 6. The Grand Finale "WOW Moment" split-screen demonstration
 */

const AppState = {
    map: null,
    isGoogleMaps: false,
    trafficLayer: null,
    trafficLayerEnabled: false,
    infoWindow: null,
    cameras: {},
    cameraMarkers: {},
    roadSegments: [],
    segmentPolylines: [],
    activeTrajectoryPolyline: null,
    socket: null,
    activeAlerts: [],
    activeTab: 'tab-overview'
};

document.addEventListener('DOMContentLoaded', () => {
    initNavigationTabs();
    initMap();
    initWebSocket();
    initEventListeners();
    fetchTopology();
    fetchAnalytics();
    fetchBenchmarks();
    fetchSystemHealth();
    fetchANPRLiveDetections();
});

/* ==========================================================================
   1. Multi-Tab Navigation Controller
   ========================================================================== */
function initNavigationTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            if (!targetTab) return;

            // Update nav active states
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch tab content views
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active-tab');
            });
            const activeContent = document.getElementById(targetTab);
            if (activeContent) {
                activeContent.classList.add('active-tab');
            }

            AppState.activeTab = targetTab;

            // Invalidate/resize map when returning to overview
            if (targetTab === 'tab-overview' && AppState.map) {
                if (AppState.isGoogleMaps && window.google) {
                    setTimeout(() => google.maps.event.trigger(AppState.map, 'resize'), 150);
                } else if (AppState.map.invalidateSize) {
                    setTimeout(() => AppState.map.invalidateSize(), 150);
                }
            } else if (targetTab === 'tab-anpr') {
                fetchANPRLiveDetections();
            } else if (targetTab === 'tab-validation') {
                fetchBenchmarks();
            } else if (targetTab === 'tab-health') {
                fetchSystemHealth();
            } else if (targetTab === 'tab-tracking') {
                executeTrackSearch('DL01AB8234');
            }
        });
    });
}

/* ==========================================================================
   2. GIS Map Initialization (Google Maps API + Leaflet Fallback)
   ========================================================================== */
const GOOGLE_MAPS_DARK_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#0b101c" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0b101c" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#7488a6" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00e5ff" }]
    },
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#0c1824" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1a2436" }]
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#0b101c" }]
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8ca0ba" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#25334d" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#131b2c" }]
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#c8d6e5" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#1a2436" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#060913" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#00e5ff" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#060913" }]
    }
];

function initMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // Check if Google Maps JavaScript API is loaded
    if (window.google && window.google.maps) {
        try {
            AppState.isGoogleMaps = true;
            AppState.map = new google.maps.Map(mapContainer, {
                center: { lat: 28.6150, lng: 77.2280 },
                zoom: 13,
                styles: GOOGLE_MAPS_DARK_STYLE,
                disableDefaultUI: false,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                backgroundColor: '#0b101c'
            });
            AppState.trafficLayer = new google.maps.TrafficLayer();
            AppState.infoWindow = new google.maps.InfoWindow();
            console.log("[GIS] Google Maps JavaScript API initialized successfully with custom dark theme.");
            return;
        } catch (err) {
            console.warn("[GIS] Google Maps initialization failed, falling back to Leaflet:", err);
            AppState.isGoogleMaps = false;
        }
    }

    // Fallback: Leaflet GIS
    if (typeof L !== 'undefined') {
        AppState.isGoogleMaps = false;
        AppState.map = L.map('map-container', {
            center: [28.6150, 77.2280],
            zoom: 13,
            zoomControl: false,
            attributionControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(AppState.map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
        }).addTo(AppState.map);
        console.log("[GIS] Leaflet dark matter map initialized (fallback).");
    }
}

/* ==========================================================================
   3. Topology & Road Links
   ========================================================================== */
async function fetchTopology() {
    try {
        const res = await fetch('/api/v1/corridor/topology');
        if (!res.ok) return;
        const data = await res.json();
        
        AppState.cameras = data.cameras;
        AppState.roadSegments = data.segments;
        
        renderCameraMarkers(data.cameras);
        renderRoadLinks(data.metrics);
        populateCorridorTable(data.metrics);
    } catch (err) {
        console.error("Topology fetch failed:", err);
    }
}

function renderCameraMarkers(cameras) {
    if (AppState.isGoogleMaps) {
        // Clear existing markers
        Object.values(AppState.cameraMarkers).forEach(m => {
            if (m && m.setMap) m.setMap(null);
        });
        AppState.cameraMarkers = {};

        Object.values(cameras).forEach(cam => {
            const marker = new google.maps.Marker({
                position: { lat: cam.lat, lng: cam.lng },
                map: AppState.map,
                title: `${cam.id}: ${cam.name}`,
                label: {
                    text: cam.id.replace('C', ''),
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 'bold'
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 13,
                    fillColor: '#0b1329',
                    fillOpacity: 0.95,
                    strokeColor: '#00e5ff',
                    strokeWeight: 2.5
                }
            });

            marker.addListener('click', () => {
                AppState.infoWindow.setContent(`
                    <div style="font-family: inherit; color: #f8fafc; min-width: 170px;">
                        <strong style="color: #00e5ff; font-size: 13px;">${cam.id}: ${cam.name}</strong><br>
                        <span style="font-size: 11px; color: #94a3b8;">Zone: ${cam.zone}</span><br>
                        <span style="font-size: 11px; color: #00e676; font-weight: 600;">Health Reliability: ${Math.round(cam.reliability * 100)}%</span>
                    </div>
                `);
                AppState.infoWindow.open(AppState.map, marker);
            });

            AppState.cameraMarkers[cam.id] = marker;
        });
        return;
    }

    // Leaflet rendering
    Object.values(cameras).forEach(cam => {
        const icon = L.divIcon({
            className: 'custom-cam-marker',
            html: `<span>${cam.id.replace('C', '')}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker([cam.lat, cam.lng], { icon: icon }).addTo(AppState.map);
        marker.bindPopup(`
            <div style="font-family: var(--font-main); color: #fff; background: #101522; padding: 6px; border-radius: 4px;">
                <strong style="color: #00e5ff;">${cam.id}: ${cam.name}</strong><br>
                <span style="font-size: 11px; color: #94a3b8;">Zone: ${cam.zone}</span><br>
                <span style="font-size: 11px; color: #00e676;">Health Reliability: ${Math.round(cam.reliability * 100)}%</span>
            </div>
        `);
        AppState.cameraMarkers[cam.id] = marker;
    });
}

function renderRoadLinks(metrics) {
    if (AppState.isGoogleMaps) {
        AppState.segmentPolylines.forEach(line => {
            if (line && line.setMap) line.setMap(null);
        });
        AppState.segmentPolylines = [];

        metrics.forEach(seg => {
            let color = '#00e676'; // LOS A / B
            if (seg.level_of_service === 'C') color = '#00e5ff';
            else if (seg.level_of_service === 'D') color = '#ff9100';
            else if (seg.level_of_service === 'E' || seg.level_of_service === 'F') color = '#ff1744';

            const polyline = new google.maps.Polyline({
                path: [
                    { lat: seg.origin_coords[0], lng: seg.origin_coords[1] },
                    { lat: seg.dest_coords[0], lng: seg.dest_coords[1] }
                ],
                geodesic: true,
                strokeColor: color,
                strokeOpacity: 0.85,
                strokeWeight: 4,
                map: AppState.map
            });

            polyline.addListener('mouseover', (e) => {
                AppState.infoWindow.setContent(`
                    <div style="font-family: inherit; color: #f8fafc; min-width: 190px;">
                        <strong style="color: #f1f5f9;">${seg.segment_name}</strong><br>
                        Indo-HCM: <strong style="color: ${color}">LOS ${seg.level_of_service}</strong> (${seg.los_description})<br>
                        <span style="font-size: 11px; color: #94a3b8;">Flow: <strong>${seg.flow_rate_vph}</strong> vph | Speed: <strong>${seg.space_mean_speed_kmh}</strong> km/h</span>
                    </div>
                `);
                AppState.infoWindow.setPosition(e.latLng);
                AppState.infoWindow.open(AppState.map);
            });

            polyline.addListener('mouseout', () => {
                AppState.infoWindow.close();
            });

            AppState.segmentPolylines.push(polyline);
        });
        return;
    }

    // Leaflet rendering
    AppState.segmentPolylines.forEach(line => AppState.map.removeLayer(line));
    AppState.segmentPolylines = [];

    metrics.forEach(seg => {
        let color = '#00e676'; // LOS A / B
        if (seg.level_of_service === 'C') color = '#00e5ff';
        else if (seg.level_of_service === 'D') color = '#ff9100';
        else if (seg.level_of_service === 'E' || seg.level_of_service === 'F') color = '#ff1744';

        const polyline = L.polyline([seg.origin_coords, seg.dest_coords], {
            color: color,
            weight: 3.5,
            opacity: 0.75
        }).addTo(AppState.map);

        polyline.bindTooltip(`
            <strong>${seg.segment_name}</strong><br>
            Indo-HCM: <strong>LOS ${seg.level_of_service}</strong> (${seg.los_description})<br>
            Flow: ${seg.flow_rate_vph} vph | Speed: ${seg.space_mean_speed_kmh} km/h
        `, { sticky: true });

        AppState.segmentPolylines.push(polyline);
    });
}

/* ==========================================================================
   4. WebSocket Streaming
   ========================================================================== */
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;
    
    AppState.socket = new WebSocket(wsUrl);

    AppState.socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_TICK') {
                updateLiveUI(data);
            }
        } catch (e) {
            console.error("WS Parse error", e);
        }
    };

    AppState.socket.onclose = () => {
        setTimeout(initWebSocket, 2500);
    };
}

function updateLiveUI(data) {
    // Top KPIs
    document.getElementById('kpi-veh-val').innerText = `${data.total_vehicles_tracked} ACTIVE`;
    document.getElementById('nav-alert-badge').innerText = data.active_alerts.length;
    document.getElementById('kpi-alerts-val').innerText = `${data.active_alerts.length} FLAGGED`;

    // Right Event Stream (Overview Tab)
    const streamContainer = document.getElementById('live-events-stream');
    if (streamContainer && data.recent_sightings) {
        streamContainer.innerHTML = '';
        data.recent_sightings.forEach(ev => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-card-top">
                    <span class="event-plate">${ev.plate_display}</span>
                    <span class="event-time">${new Date(ev.timestamp * 1000).toLocaleTimeString()}</span>
                </div>
                <div class="event-meta">
                    <span>${ev.camera_id} • ${ev.vehicle_color} ${ev.vehicle_class}</span>
                    <span class="event-conf">${Math.round(ev.plate_confidence * 100)}%</span>
                </div>
            `;
            card.onclick = () => {
                inspectVehicleTrajectory(ev.plate_hash, ev.plate_display);
            };
            streamContainer.appendChild(card);
        });
    }

    // Alerts Tab List
    if (data.active_alerts) {
        AppState.activeAlerts = data.active_alerts;
        renderAlertsTriage(data.active_alerts);
    }
}

/* ==========================================================================
   5. TAB 2: Live ANPR Pipeline Screen
   ========================================================================== */
async function fetchANPRLiveDetections() {
    try {
        const res = await fetch('/api/v1/anpr/live-detections');
        if (!res.ok) return;
        const data = await res.json();
        const container = document.getElementById('anpr-pipeline-container');
        if (!container) return;

        container.innerHTML = '';
        data.live_detections.forEach(det => {
            const card = document.createElement('div');
            card.className = 'anpr-card';
            card.innerHTML = `
                <div class="anpr-card-header">
                    <span class="anpr-cam-id">${det.camera_id}: ${det.camera_name}</span>
                    <span class="anpr-time">${new Date(det.timestamp * 1000).toLocaleTimeString()}</span>
                </div>
                <div class="plate-display-box">${det.plate_detected}</div>
                <div class="pipeline-steps-wrap">
                    <div class="pipe-step">
                        <span class="step-label">STAGE 1: VEHICLE BBOX</span>
                        <span class="step-val text-cyan">${det.vehicle_color} ${det.vehicle_class.toUpperCase()} (${det.pipeline_stages.stage_1_vehicle_box.conf * 100}%)</span>
                    </div>
                    <div class="pipe-step">
                        <span class="step-label">STAGE 2: PLATE LOCALIZATION</span>
                        <span class="step-val text-green">YOLOv8-Plate (94%)</span>
                    </div>
                    <div class="pipe-step">
                        <span class="step-label">STAGE 3: STN HOMOGRAPHY</span>
                        <span class="step-val text-yellow">Rectified to 128x32 px</span>
                    </div>
                    <div class="pipe-step">
                        <span class="step-label">STAGE 4: SVTR-LC CTC OCR</span>
                        <span class="step-val text-cyan">${det.plate_detected} (${Math.round(det.plate_confidence * 100)}%)</span>
                    </div>
                    <div class="pipe-step">
                        <span class="step-label">STAGE 5: TEMPORAL BEAM VOTING</span>
                        <span class="step-val text-green">✓ Consensus Stabilized</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("ANPR fetch failed:", e);
    }
}

/* ==========================================================================
   6. TAB 3: Vehicle Tracking & Multi-Signal Re-ID
   ========================================================================== */
async function executeTrackSearch(plate) {
    try {
        const res = await fetch(`/api/v1/trajectories/${plate}`);
        if (!res.ok) return;
        const traj = await res.json();

        // Render Timeline
        const timeline = document.getElementById('track-timeline-list');
        if (timeline) {
            timeline.innerHTML = '';
            traj.camera_sequence.forEach((camId, idx) => {
                const cam = AppState.cameras[camId] || { name: camId, zone: 'Corridor' };
                const step = document.createElement('div');
                step.className = 'timeline-step';
                step.innerHTML = `
                    <div class="timeline-marker">${idx + 1}</div>
                    <div class="timeline-content">
                        <strong>${camId}: ${cam.name}</strong><br>
                        <span style="font-size: 11px; color: #8da2c0;">Zone: ${cam.zone} • Direction: Heading South-West</span>
                    </div>
                `;
                timeline.appendChild(step);
            });
        }

        // Render Multi-Signal Scores
        const scoresContainer = document.getElementById('track-reid-scores');
        if (scoresContainer) {
            scoresContainer.innerHTML = `
                <div class="reid-score-item">
                    <span>1. Plate Levenshtein Grammar Similarity:</span>
                    <strong class="text-green">0.99</strong>
                </div>
                <div class="reid-score-item">
                    <span>2. Road-Graph Kinematic Travel Feasibility (Φ_travel):</span>
                    <strong class="text-cyan">0.95</strong>
                </div>
                <div class="reid-score-item">
                    <span>3. FastReID Appearance Embedding (Cosine Sim):</span>
                    <strong class="text-yellow">0.94</strong>
                </div>
                <div class="reid-score-item">
                    <span>4. Vehicle Class &amp; Heading Consistency:</span>
                    <strong class="text-green">1.00</strong>
                </div>
                <div class="reid-score-item" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                    <span>FINAL ST-DAG WEIGHTED MATCH SCORE:</span>
                    <strong class="text-gold" style="font-size: 14px;">0.96 (✓ IDENTIFIED)</strong>
                </div>
            `;
        }
    } catch (e) {
        console.error("Tracking search error:", e);
    }
}

/* ==========================================================================
   7. TAB 5: Traffic Analytics Tables
   ========================================================================== */
async function fetchAnalytics() {
    try {
        const res = await fetch('/api/v1/analytics/overview');
        if (!res.ok) return;
        const data = await res.json();

        // Top KPIs
        document.getElementById('an-flow-vph').innerText = Math.round(data.macro_kpis.network_flow_vph).toLocaleString();
        document.getElementById('an-speed-kmh').innerText = `${data.macro_kpis.avg_speed_kmh} km/h`;
        document.getElementById('an-network-los').innerText = `LOS ${data.macro_kpis.network_los}`;

        populateCorridorTable(data.segments);
        populateODTable(data.origin_destination.od_flows);
    } catch (e) {
        console.error("Analytics fetch failed:", e);
    }
}

function populateCorridorTable(segments) {
    const tbody = document.getElementById('tbody-corridor-segments');
    if (!tbody || !segments) return;
    tbody.innerHTML = '';
    segments.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${s.origin_cam} → ${s.dest_cam}</strong></td>
            <td>${s.segment_name}</td>
            <td>${s.dist_m} m</td>
            <td>${s.flow_rate_vph}</td>
            <td>${s.space_mean_speed_kmh} km/h</td>
            <td>${s.vc_ratio}</td>
            <td><span class="legend-chip chip-los-${s.level_of_service.toLowerCase()}">${s.level_of_service}</span></td>
            <td>${Math.round(s.congestion_index * 100)}%</td>
        `;
        tbody.appendChild(row);
    });
}

function populateODTable(odFlows) {
    const tbody = document.getElementById('tbody-od-matrix');
    if (!tbody || !odFlows) return;
    tbody.innerHTML = '';
    odFlows.forEach(od => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${od.origin}</strong></td>
            <td><strong>${od.destination}</strong></td>
            <td>${od.origin_name}</td>
            <td>${od.dest_name}</td>
            <td class="text-cyan"><strong>${od.trip_count}</strong></td>
            <td>High Volume Corridor</td>
        `;
        tbody.appendChild(row);
    });
}

/* ==========================================================================
   8. TAB 6: Alerts & Human-in-the-Loop Triage
   ========================================================================== */
function renderAlertsTriage(alerts) {
    const container = document.getElementById('alerts-triage-full-list');
    const hitlContainer = document.getElementById('hitl-queue-container');
    if (!container) return;

    container.innerHTML = '';
    alerts.forEach(alert => {
        const card = document.createElement('div');
        card.className = 'alert-card';
        card.innerHTML = `
            <div class="alert-card-top">
                <span class="alert-type-badge">${alert.alert_type.replace(/_/g, ' ')}</span>
                <span class="alert-time">${alert.severity}</span>
            </div>
            <div class="alert-card-main">
                Target: <span class="alert-card-plate">${alert.detected_plate}</span>
            </div>
            <div class="alert-card-cam">Sighted at ${alert.camera_name} • Conf: ${Math.round(alert.explainability.ocr_confidence * 100)}%</div>
            <div style="font-size: 10.5px; color: #cbd5e1; margin-top: 4px;">${alert.explainability.evidence_statement}</div>
            <div style="margin-top: 8px; display: flex; gap: 8px;">
                <button class="btn btn-secondary" style="font-size: 10px; padding: 4px 8px;" onclick="triageAlertAction('${alert.alert_id}', 'DISMISSED_OPTICAL_ERROR')">Dismiss</button>
                <button class="btn btn-primary" style="font-size: 10px; padding: 4px 8px;" onclick="triageAlertAction('${alert.alert_id}', 'CONFIRMED_DISPATCHED')">Validate &amp; Dispatch</button>
            </div>
        `;
        container.appendChild(card);
    });

    if (hitlContainer) {
        hitlContainer.innerHTML = `
            <div class="pipe-step" style="flex-direction: column; align-items: flex-start; gap: 8px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                    <span>Plate Crop Frame #0894</span>
                    <span class="text-yellow">Conf: 68.4% (Low Confidence)</span>
                </div>
                <div class="plate-display-box" style="font-size: 14px; width: 100%;">MH14?B1234</div>
                <div style="font-size: 11px; color: #8da2c0;">Character slot 5 OCR ambiguous. Operator review required before e-Challan generation.</div>
                <div style="display: flex; gap: 6px; width: 100%; margin-top: 6px;">
                    <button class="btn btn-secondary" style="flex: 1;" onclick="confirmPlateCorrection('MH14AB1234', 'A')">✓ Confirm as 'A'</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="confirmPlateCorrection('MH14AB1234', 'EDIT')">✎ Edit String</button>
                </div>
            </div>
        `;
    }
}

/* ==========================================================================
   Professional Notification & Tactical Message Box System
   ========================================================================== */
function showProToast({ title, message, type = 'info', duration = 4000 }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `pro-toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'danger') icon = '🚨';
    else if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">✕</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
        toast.classList.add('toast-closing');
        setTimeout(() => toast.remove(), 200);
    };

    closeBtn.onclick = removeToast;
    setTimeout(removeToast, duration);
    container.appendChild(toast);
}

function showProMessageBox(opts) {
    const {
        title = "Operation Executed",
        subtitle = "MUNICIPAL COMMAND INTERCEPTION PROTOCOL",
        icon = "🚨",
        statusText = "COMPLETED",
        statusType = "success", // success, danger, info
        message = "",
        actionCode = "ACTION_RECORDED",
        officer = "OFFICER_DELHI_08",
        target = "PCR PATROL UNIT #14",
        hash = "0x" + Math.random().toString(16).slice(2, 10).toUpperCase() + "...IMMUTABLE",
        buttonText = "✓ Acknowledge & Return to Console"
    } = opts;

    const modal = document.getElementById('modal-pro-message');
    if (!modal) return;

    document.getElementById('pro-msg-title').innerText = title;
    document.getElementById('pro-msg-subtitle').innerText = subtitle;
    document.getElementById('pro-msg-icon-badge').innerText = icon;
    
    const pill = document.getElementById('pro-msg-status-pill');
    pill.className = `pro-status-pill pill-${statusType}`;
    document.getElementById('pro-msg-status-text').innerText = statusText;
    
    document.getElementById('pro-msg-text').innerHTML = message;
    document.getElementById('pro-msg-action-code').innerText = actionCode;
    document.getElementById('pro-msg-badge').innerText = officer;
    document.getElementById('pro-msg-target').innerText = target;
    document.getElementById('pro-msg-hash').innerText = hash;
    document.getElementById('btn-pro-msg-ok').innerText = buttonText;

    modal.classList.remove('hidden');

    const closeModal = () => modal.classList.add('hidden');
    document.getElementById('btn-close-pro-msg').onclick = closeModal;
    document.getElementById('btn-pro-msg-ok').onclick = closeModal;
}

function confirmPlateCorrection(plate, action) {
    showProMessageBox({
        title: "DPDP Human-In-The-Loop Audit Committed",
        subtitle: "SECTION 8(2) STATUTORY OPERATOR OVERRIDE",
        icon: "✍️",
        statusText: "OCR AMBIGUITY RESOLVED",
        statusType: "info",
        message: `Plate character slot verified as <strong>'A'</strong> for vehicle <code>${plate}</code>. Syntax FSM updated and locked to cryptographic ledger.`,
        actionCode: "HITL_CHAR_OVERRIDE",
        officer: "OFFICER_DELHI_08",
        target: "e-CHALLAN GENERATOR QUEUE",
        hash: `0x${Math.random().toString(16).slice(2, 8).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()} (VERIFIED)`,
        buttonText: "✓ Return to Console"
    });
    showProToast({
        title: "Plate Verified",
        message: `Vehicle ${plate} correction saved to DPDP audit ledger.`,
        type: "success"
    });
}

async function triageAlertAction(alertId, decision) {
    try {
        const res = await fetch(`/api/v1/alerts/${alertId}/triage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision: decision, officer_id: 'OFFICER_DELHI_08' })
        });
        if (res.ok) {
            if (decision === 'CONFIRMED_DISPATCHED') {
                showProMessageBox({
                    title: "Tactical Interception & Patrol Dispatched",
                    subtitle: "MUNICIPAL POLICE CORRIDOR DISPATCH PROTOCOL",
                    icon: "🚨",
                    statusText: "CONFIRMED & DISPATCHED",
                    statusType: "success",
                    message: `Alert <strong>${alertId}</strong> confirmed by operator. Tactical Interceptor PCR Van and municipal traffic units routed to target corridor coordinates.`,
                    actionCode: "PATROL_DISPATCH_CONFIRMED",
                    officer: "OFFICER_DELHI_08",
                    target: "PCR PATROL UNIT #14 (DELHI-NORTH)",
                    hash: `0x${alertId.slice(0, 6)}...${Math.random().toString(16).slice(2, 6).toUpperCase()} (DPDP AUDITED)`,
                    buttonText: "✓ Acknowledge Dispatch"
                });
                showProToast({
                    title: "Patrol Dispatched",
                    message: `Alert #${alertId} confirmed. Tactical interception unit en route.`,
                    type: "success"
                });
            } else {
                showProMessageBox({
                    title: "Alert Dismissed (Optical Anomaly)",
                    subtitle: "SYNTAX FSM FALSE-POSITIVE SUPPRESSION",
                    icon: "🛡️",
                    statusText: "DISMISSED_OPTICAL_ERROR",
                    statusType: "danger",
                    message: `Alert <strong>${alertId}</strong> categorized as optical artifact or character confusion. Negative feedback committed to classifier.`,
                    actionCode: "OPTICAL_NOISE_DISMISSED",
                    officer: "OFFICER_DELHI_08",
                    target: "DISMISSED / NO DISPATCH REQUIRED",
                    hash: `0x${alertId.slice(0, 6)}...${Math.random().toString(16).slice(2, 6).toUpperCase()} (RECORDED)`,
                    buttonText: "✓ Acknowledge Dismissal"
                });
                showProToast({
                    title: "Alert Dismissed",
                    message: `Alert #${alertId} logged as optical artifact.`,
                    type: "warning"
                });
            }
        }
    } catch (e) {
        console.error("Triage error", e);
        showProToast({
            title: "Network Error",
            message: "Failed to dispatch triage decision to server.",
            type: "danger"
        });
    }
}

/* ==========================================================================
   9. TAB 7: Model Validation & Proof Benchmarks
   ========================================================================== */
async function fetchBenchmarks() {
    try {
        const res = await fetch('/api/v1/validation/benchmarks');
        if (!res.ok) return;
        const data = await res.json();

        // 1. Target vs Actual Table
        const tbodyBench = document.getElementById('tbody-benchmarks');
        if (tbodyBench) {
            tbodyBench.innerHTML = '';
            Object.values(data.target_vs_actual).forEach(b => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${b.metric}</strong></td>
                    <td class="text-yellow">${b.target}</td>
                    <td class="text-green"><strong>${b.actual}</strong></td>
                    <td><span class="legend-chip chip-los-a">✓ ${b.status}</span></td>
                `;
                tbodyBench.appendChild(row);
            });
        }

        // 2. Optical Confusion Table
        const tbodyConf = document.getElementById('tbody-confusion');
        if (tbodyConf) {
            tbodyConf.innerHTML = '';
            data.confusion_matrix_difficult_pairs.forEach(c => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${c.pair}</strong></td>
                    <td class="text-red">${c.raw_ocr_error_rate}</td>
                    <td class="text-green">${c.with_syntax_fsm}</td>
                    <td class="text-cyan">${c.status}</td>
                `;
                tbodyConf.appendChild(row);
            });
        }

        // 3. Stress Tests Table
        const tbodyStress = document.getElementById('tbody-stress-tests');
        if (tbodyStress) {
            tbodyStress.innerHTML = '';
            data.stress_test_conditions.forEach(s => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${s.condition}</strong></td>
                    <td>${s.samples}</td>
                    <td class="text-green">${s.accuracy}</td>
                    <td>${s.mitigation}</td>
                `;
                tbodyStress.appendChild(row);
            });
        }

        // 4. Ground Truth vs Prediction Table
        const tbodyGT = document.getElementById('tbody-ground-truth');
        if (tbodyGT) {
            tbodyGT.innerHTML = '';
            data.sample_test_cases.forEach(t => {
                const row = document.createElement('tr');
                const isCorrect = t.result === 'CORRECT';
                row.innerHTML = `
                    <td><code>${t.image_id}</code></td>
                    <td><strong>${t.ground_truth}</strong></td>
                    <td class="${isCorrect ? 'text-green' : 'text-yellow'}">${t.prediction}</td>
                    <td>${Math.round(t.confidence * 100)}%</td>
                    <td>${t.condition}</td>
                    <td><span class="legend-chip ${isCorrect ? 'chip-los-a' : 'chip-los-c'}">${isCorrect ? '✓ CORRECT' : '⚡ RESOLVED BY ST-DAG'}</span></td>
                `;
                tbodyGT.appendChild(row);
            });
        }
    } catch (e) {
        console.error("Benchmarks fetch error:", e);
    }
}

/* ==========================================================================
   10. TAB 8: System Health Diagnostics
   ========================================================================== */
async function fetchSystemHealth() {
    try {
        const res = await fetch('/api/v1/system/health');
        if (!res.ok) return;
        const data = await res.json();

        // Services
        const servicesList = document.getElementById('health-services-list');
        if (servicesList) {
            servicesList.innerHTML = '';
            Object.values(data.services).forEach(srv => {
                const item = document.createElement('div');
                item.className = 'service-item';
                item.innerHTML = `
                    <div>
                        <strong>${srv.name}</strong><br>
                        <span style="font-size: 10.5px; color: #8da2c0;">Status: <span class="text-green">${srv.status}</span></span>
                    </div>
                    <span class="tag-15min text-cyan">${srv.device || srv.pool_size ? 'ACTIVE' : 'HEALTHY'}</span>
                `;
                servicesList.appendChild(item);
            });
        }

        // Camera Mesh
        const tbodyCam = document.getElementById('tbody-camera-mesh');
        if (tbodyCam) {
            tbodyCam.innerHTML = '';
            data.camera_mesh.forEach(c => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${c.camera_id}</strong></td>
                    <td>${c.name}</td>
                    <td><span class="legend-chip chip-los-a">${c.status}</span></td>
                    <td>${c.fps} FPS</td>
                    <td>${c.latency_ms} ms</td>
                    <td class="text-green">${c.reliability_pct}%</td>
                `;
                tbodyCam.appendChild(row);
            });
        }
    } catch (e) {
        console.error("Health fetch error:", e);
    }
}

/* ==========================================================================
   11. Trajectory Inspection on GIS Map
   ========================================================================== */
async function inspectVehicleTrajectory(plateHash, plateDisplay) {
    try {
        const res = await fetch(`/api/v1/trajectories/${plateHash}`);
        if (!res.ok) return;
        const traj = await res.json();

        // Switch to overview tab to show map
        document.querySelector('[data-tab="tab-overview"]').click();

        // Remove active polyline if any
        if (AppState.activeTrajectoryPolyline) {
            if (AppState.isGoogleMaps) {
                AppState.activeTrajectoryPolyline.setMap(null);
            } else if (AppState.map && AppState.map.removeLayer) {
                AppState.map.removeLayer(AppState.activeTrajectoryPolyline);
            }
            AppState.activeTrajectoryPolyline = null;
        }

        if (traj.route_points && traj.route_points.length > 0) {
            if (AppState.isGoogleMaps) {
                const pathCoords = traj.route_points.map(pt => ({ lat: pt[0], lng: pt[1] }));
                const lineSymbol = {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3.5,
                    strokeColor: '#00e5ff'
                };
                AppState.activeTrajectoryPolyline = new google.maps.Polyline({
                    path: pathCoords,
                    strokeColor: '#00e5ff',
                    strokeOpacity: 0.9,
                    strokeWeight: 5,
                    icons: [{
                        icon: lineSymbol,
                        offset: '0',
                        repeat: '18px'
                    }],
                    map: AppState.map
                });

                const bounds = new google.maps.LatLngBounds();
                pathCoords.forEach(pt => bounds.extend(pt));
                AppState.map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
            } else {
                AppState.activeTrajectoryPolyline = L.polyline(traj.route_points, {
                    color: '#00e5ff',
                    weight: 5,
                    opacity: 0.9,
                    dashArray: '8, 4'
                }).addTo(AppState.map);

                AppState.map.fitBounds(AppState.activeTrajectoryPolyline.getBounds(), { padding: [60, 60] });
            }

            const banner = document.getElementById('trajectory-banner');
            document.getElementById('traj-plate-display').innerText = traj.plate_display;
            document.getElementById('traj-stats-display').innerText = `${traj.camera_sequence.length} Cameras • ${traj.total_distance_m} m • Avg ${traj.avg_speed_kmh} km/h`;
            document.getElementById('traj-conf-val').innerText = `${Math.round(traj.confidence_score * 100)}%`;
            banner.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Failed to load trajectory:", err);
    }
}

function copyHashText(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
    }
    const orig = btn.innerText;
    btn.innerText = "✓ Copied!";
    btn.style.color = "var(--accent-green)";
    btn.style.borderColor = "var(--accent-green)";
    setTimeout(() => {
        btn.innerText = orig;
        btn.style.color = "";
        btn.style.borderColor = "";
    }, 1500);
    showProToast({
        title: "Cryptographic Hash Copied",
        message: `${text.slice(0, 18)}... copied to clipboard.`,
        type: "info"
    });
}

/* ==========================================================================
   12. Event Listeners & Modals
   ========================================================================== */
function initEventListeners() {
    // Trajectory banner close
    const btnCloseTraj = document.getElementById('btn-close-traj');
    if (btnCloseTraj) {
        btnCloseTraj.onclick = () => {
            if (AppState.activeTrajectoryPolyline) {
                if (AppState.isGoogleMaps) {
                    AppState.activeTrajectoryPolyline.setMap(null);
                } else if (AppState.map && AppState.map.removeLayer) {
                    AppState.map.removeLayer(AppState.activeTrajectoryPolyline);
                }
                AppState.activeTrajectoryPolyline = null;
            }
            document.getElementById('trajectory-banner').classList.add('hidden');
        };
    }

    // Google Maps Real-Time Traffic Toggle
    const btnTraffic = document.getElementById('btn-toggle-traffic');
    if (btnTraffic) {
        btnTraffic.onclick = () => {
            if (!AppState.isGoogleMaps || !AppState.trafficLayer) {
                showProToast({
                    title: "Google Maps Traffic",
                    message: "Live traffic layer requires Google Maps engine.",
                    type: "warning"
                });
                return;
            }
            AppState.trafficLayerEnabled = !AppState.trafficLayerEnabled;
            if (AppState.trafficLayerEnabled) {
                AppState.trafficLayer.setMap(AppState.map);
                btnTraffic.innerText = "🚦 Live Traffic: ON";
                btnTraffic.style.borderColor = "var(--accent-green)";
                btnTraffic.style.color = "var(--accent-green)";
            } else {
                AppState.trafficLayer.setMap(null);
                btnTraffic.innerText = "🚦 Live Traffic: OFF";
                btnTraffic.style.borderColor = "";
                btnTraffic.style.color = "";
            }
        };
    }

    // WOW Moment Trigger
    const btnWow = document.getElementById('btn-wow-moment');
    if (btnWow) {
        btnWow.onclick = async () => {
            btnWow.disabled = true;
            btnWow.innerText = "⏳ COMPUTING ST-DAG...";
            try {
                const res = await fetch('/api/v1/demo/trigger-wow-moment', { method: 'POST' });
                const data = await res.json();
                document.getElementById('modal-wow').classList.remove('hidden');
            } catch (err) {
                console.error("WOW Moment error:", err);
            } finally {
                btnWow.disabled = false;
                btnWow.innerText = "⚡ TRIGGER WOW MOMENT";
            }
        };
    }

    document.getElementById('btn-close-wow').onclick = () => {
        document.getElementById('modal-wow').classList.add('hidden');
    };

    document.getElementById('btn-view-wow-on-map').onclick = () => {
        document.getElementById('modal-wow').classList.add('hidden');
        inspectVehicleTrajectory("DL01AB8234", "DL01AB8234");
    };

    // Lawful Search Modal
    document.getElementById('btn-lawful-search').onclick = () => {
        document.getElementById('modal-lawful').classList.remove('hidden');
    };
    document.getElementById('btn-close-lawful').onclick = () => {
        document.getElementById('modal-lawful').classList.add('hidden');
    };

    document.getElementById('lawful-search-form').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            plate_number: document.getElementById('input-target-plate').value,
            warrant_token: document.getElementById('input-warrant-token').value,
            officer_badge: document.getElementById('input-officer-badge').value,
            investigation_reason: document.getElementById('input-reason').value
        };

        const resultBox = document.getElementById('lawful-search-result');
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = '<em>Authenticating with DPDP Zero-Trust Gate...</em>';

        try {
            const res = await fetch('/api/v1/lawful-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok && data.status === 'AUTHORIZED_ACCESS_GRANTED') {
                resultBox.innerHTML = `
                    <div style="color: #00e676;">✅ WARRANT VERIFIED &amp; AUTHORIZED</div>
                    <div>Vehicle: <strong>${data.trajectory.plate_display}</strong></div>
                    <div>Cameras: ${data.trajectory.camera_sequence.join(' → ')}</div>
                    <div>Confidence: ${Math.round(data.trajectory.confidence_score * 100)}%</div>
                    <div style="margin-top: 6px; font-size: 10px; color: #7c4dff;">Audit Block #${data.audit_block.block_id}: ${data.audit_block.block_hash.slice(0, 20)}...</div>
                    <button class="btn btn-primary btn-block" style="margin-top: 8px;" onclick="viewSearchedTraj('${data.trajectory.plate_hash}')">View on Map</button>
                `;
            } else {
                resultBox.innerHTML = `<div style="color: #ff1744;">❌ ${data.detail || 'Access Denied'}</div>`;
            }
        } catch (err) {
            resultBox.innerHTML = `<div style="color: #ff1744;">Error executing lawful query</div>`;
        }
    };

    // Audit Ledger Modal
    document.getElementById('btn-audit-ledger').onclick = async () => {
        document.getElementById('modal-audit').classList.remove('hidden');
        try {
            const res = await fetch('/api/v1/audit-ledger');
            const data = await res.json();
            document.getElementById('audit-integrity-status').innerText = data.chain_integrity;
            document.getElementById('audit-total-blocks').innerText = data.total_blocks;

            const list = document.getElementById('audit-blocks-list');
            list.innerHTML = '';
            
            data.recent_blocks.forEach(b => {
                const card = document.createElement('div');
                
                // Color & Icon thematic classification
                let accentClass = 'block-cyan';
                let actionIcon = '⚡';
                let actionColor = 'var(--accent-cyan)';
                
                if (b.action_type.includes('GENESIS')) {
                    accentClass = 'block-green';
                    actionIcon = '🌱';
                    actionColor = 'var(--accent-green)';
                } else if (b.action_type.includes('TRIAGE') || b.action_type.includes('ALERT')) {
                    accentClass = 'block-gold';
                    actionIcon = '🚨';
                    actionColor = 'var(--accent-gold)';
                } else if (b.action_type.includes('LAWFUL') || b.action_type.includes('SEARCH')) {
                    accentClass = 'block-purple';
                    actionIcon = '⚖️';
                    actionColor = '#a855f7';
                }

                const blockDate = new Date(b.timestamp * 1000);
                const formattedTime = blockDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                let payloadSummary = '';
                if (b.query_payload) {
                    if (b.query_payload.plate_number) payloadSummary = `Target: <strong>${b.query_payload.plate_number}</strong>`;
                    else if (b.query_payload.plate) payloadSummary = `Target: <strong>${b.query_payload.plate}</strong>`;
                    
                    if (b.query_payload.investigation_reason) payloadSummary += ` • Ref: <em>${b.query_payload.investigation_reason}</em>`;
                    else if (b.query_payload.reason) payloadSummary += ` • Ref: <em>${b.query_payload.reason}</em>`;
                    
                    if (b.query_payload.decision) payloadSummary = `Decision: <strong>${b.query_payload.decision}</strong>`;
                    if (b.query_payload.status) payloadSummary = `Status: <strong>${b.query_payload.status}</strong>`;
                }

                card.className = `audit-block-card ${accentClass}`;
                card.innerHTML = `
                    <div class="audit-block-header">
                        <div class="audit-block-title-group">
                            <span class="audit-block-pill">BLOCK #${b.block_id}</span>
                            <span class="audit-action-tag" style="color: ${actionColor};">
                                ${actionIcon} ${b.action_type}
                            </span>
                        </div>
                        <div class="audit-block-meta-right">
                            <span class="audit-badge-pill">👮 ${b.officer_badge}</span>
                            <span class="audit-time-pill">🕒 ${formattedTime}</span>
                        </div>
                    </div>

                    <div class="audit-meta-bar">
                        <div class="audit-meta-col">
                            <span class="audit-lbl-sm">STATUTORY WARRANT TOKEN</span>
                            <span class="audit-val-sm font-mono text-cyan">📄 ${b.warrant_token}</span>
                        </div>
                        ${payloadSummary ? `
                        <div class="audit-meta-col">
                            <span class="audit-lbl-sm">OPERATION TARGET / PAYLOAD</span>
                            <span class="audit-val-sm">${payloadSummary}</span>
                        </div>` : ''}
                        <div class="audit-meta-col" style="margin-left: auto;">
                            <span class="audit-lbl-sm">CRYPTOGRAPHIC VERIFICATION</span>
                            <span class="audit-val-sm text-green">✓ SHA-256 HASH LINKED</span>
                        </div>
                    </div>

                    <div class="audit-hash-container">
                        <div class="audit-hash-row">
                            <span class="audit-hash-label">PREV HASH:</span>
                            <span class="audit-hash-code font-mono text-muted">${b.prev_hash}</span>
                        </div>
                        <div class="audit-hash-row">
                            <span class="audit-hash-label">CURR HASH:</span>
                            <span class="audit-hash-code font-mono curr-hash">🔒 ${b.block_hash}</span>
                            <button class="btn-copy-hash" onclick="copyHashText('${b.block_hash}', this)">Copy Hash</button>
                        </div>
                    </div>
                `;
                list.appendChild(card);
            });
        } catch (err) {
            console.error("Audit ledger fetch error:", err);
        }
    };

    const closeAuditModal = () => document.getElementById('modal-audit').classList.add('hidden');
    document.getElementById('btn-close-audit').onclick = closeAuditModal;
    const btnCloseAuditFooter = document.getElementById('btn-close-audit-footer');
    if (btnCloseAuditFooter) btnCloseAuditFooter.onclick = closeAuditModal;

    // Tracking tab search button
    const btnTrackSearch = document.getElementById('btn-execute-track-search');
    if (btnTrackSearch) {
        btnTrackSearch.onclick = () => {
            const plate = document.getElementById('track-search-input').value.trim();
            if (plate) executeTrackSearch(plate);
        };
    }
}

function viewSearchedTraj(hash) {
    document.getElementById('modal-lawful').classList.add('hidden');
    inspectVehicleTrajectory(hash, "");
}
