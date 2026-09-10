/**
 * TraffiX-AI: Command Center Frontend Logic & Real-Time GIS Controller
 * Integrates:
 * - Leaflet WebGL-compatible dark matter map
 * - Real-time WebSocket telemetry stream
 * - Indo-HCM Level of Service (LOS) dynamic link styling
 * - Explainable Alert Triage and Human-in-the-Loop workflows
 * - Grand Finale "WOW Moment" split-screen demonstration
 */

// Application State
const AppState = {
    map: null,
    cameras: {},
    cameraMarkers: {},
    roadSegments: [],
    segmentPolylines: [],
    activeTrajectoryPolyline: null,
    activeTrajectoryMarkers: [],
    socket: null,
    activeAlerts: [],
    lastTelemetry: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initWebSocket();
    initEventListeners();
    fetchTopology();
    fetchAnalytics();
});

/* ==========================================================================
   1. GIS Map Initialization (Leaflet with Dark Matter Tiles)
   ========================================================================== */
function initMap() {
    // Centered over Delhi Central Arterial Corridor
    AppState.map = L.map('map-container', {
        center: [28.6150, 77.2280],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(AppState.map);

    // CartoDB Dark Matter Base Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
    }).addTo(AppState.map);
}

/* ==========================================================================
   2. Fetch Corridor Topology & Initial Render
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
        renderCameraGrid(data.cameras);
    } catch (err) {
        console.error("Topology fetch failed:", err);
    }
}

function renderCameraMarkers(cameras) {
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
        `, { className: 'custom-leaflet-popup' });

        AppState.cameraMarkers[cam.id] = marker;
    });
}

function renderRoadLinks(metrics) {
    // Clear previous segment lines
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
            opacity: 0.75,
            smoothFactor: 1
        }).addTo(AppState.map);

        polyline.bindTooltip(`
            <strong>${seg.segment_name}</strong><br>
            Indo-HCM: <strong>LOS ${seg.level_of_service}</strong> (${seg.los_description})<br>
            Flow: ${seg.flow_rate_vph} vph | Speed: ${seg.space_mean_speed_kmh} km/h
        `, { sticky: true });

        AppState.segmentPolylines.push(polyline);
    });
}

function renderCameraGrid(cameras) {
    const grid = document.getElementById('camera-health-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.values(cameras).forEach(cam => {
        const badge = document.createElement('div');
        badge.className = 'cam-badge online';
        badge.innerText = cam.id;
        badge.title = `${cam.name} (${cam.zone}) - Online`;
        badge.onclick = () => {
            AppState.map.flyTo([cam.lat, cam.lng], 15);
            AppState.cameraMarkers[cam.id].openPopup();
        };
        grid.appendChild(badge);
    });
}

/* ==========================================================================
   3. Real-Time WebSocket Telemetry Gateway
   ========================================================================== */
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;
    
    AppState.socket = new WebSocket(wsUrl);

    AppState.socket.onopen = () => {
        console.log("WebSocket connected to TraffiX-AI stream.");
    };

    AppState.socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_TICK') {
                updateDashboard(data);
            }
        } catch (e) {
            console.error("WS Parse error", e);
        }
    };

    AppState.socket.onclose = () => {
        console.warn("WS Disconnected. Reconnecting in 2s...");
        setTimeout(initWebSocket, 2000);
    };
}

function updateDashboard(data) {
    AppState.lastTelemetry = data;

    // Update Top KPIs
    document.getElementById('kpi-veh-val').innerText = `${data.total_vehicles_tracked} ACTIVE`;
    
    // Update Recent Sightings List
    if (data.recent_sightings) {
        renderRecentSightings(data.recent_sightings);
    }

    // Update Active Alerts Queue
    if (data.active_alerts) {
        AppState.activeAlerts = data.active_alerts;
        renderAlertQueue(data.active_alerts);
    }

    // Periodically update road link colors
    if (data.corridor_segments && Math.random() < 0.25) {
        renderRoadLinks(data.corridor_segments);
    }
}

function renderRecentSightings(sightings) {
    const container = document.getElementById('sightings-container');
    if (!container) return;

    container.innerHTML = '';
    sightings.slice(0, 8).forEach(s => {
        const card = document.createElement('div');
        card.className = 'sighting-card';
        card.innerHTML = `
            <div class="sighting-left">
                <span class="sighting-plate">${s.plate_display}</span>
                <span class="sighting-meta">${s.camera_id} • ${s.vehicle_color} ${s.vehicle_class}</span>
            </div>
            <div class="sighting-right">
                <span class="sighting-conf">${Math.round(s.plate_confidence * 100)}%</span>
                <span class="sighting-speed">${s.estimated_speed_kmh} km/h</span>
            </div>
        `;
        card.onclick = () => inspectVehicleTrajectory(s.plate_hash, s.plate_display);
        container.appendChild(card);
    });
}

function renderAlertQueue(alerts) {
    const container = document.getElementById('alert-triage-container');
    const badge = document.getElementById('alert-count-badge');
    if (!container) return;

    badge.innerText = alerts.length;
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🛡️</span>
                <p>No active anomalies flagged. Real-time surveillance operational.</p>
            </div>
        `;
        return;
    }

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
                <span class="alert-card-plate">${alert.detected_plate}</span>
            </div>
            <div class="alert-card-cam">Sighted at ${alert.camera_name}</div>
        `;
        card.onclick = () => openAlertDetailModal(alert);
        container.appendChild(card);
    });
}

/* ==========================================================================
   4. Trajectory Inspection & GIS Polyline Snapping
   ========================================================================== */
async function inspectVehicleTrajectory(plateHash, plateDisplay) {
    try {
        const res = await fetch(`/api/v1/trajectories/${plateHash}`);
        if (!res.ok) return;
        const traj = await res.json();
        drawTrajectoryOnMap(traj);
    } catch (err) {
        console.error("Failed to load trajectory:", err);
    }
}

function drawTrajectoryOnMap(traj) {
    clearTrajectoryLayer();

    if (!traj.route_points || traj.route_points.length === 0) return;

    // Draw glowing polyline
    AppState.activeTrajectoryPolyline = L.polyline(traj.route_points, {
        color: '#00e5ff',
        weight: 5,
        opacity: 0.9,
        dashArray: '8, 4',
        className: 'pulse-glow'
    }).addTo(AppState.map);

    // Zoom to fit trajectory
    AppState.map.fitBounds(AppState.activeTrajectoryPolyline.getBounds(), { padding: [60, 60] });

    // Show Trajectory Banner
    const banner = document.getElementById('trajectory-banner');
    document.getElementById('traj-plate-display').innerText = traj.plate_display;
    document.getElementById('traj-stats-display').innerText = `${traj.camera_sequence.length} Cameras • ${traj.total_distance_m} m • Avg ${traj.avg_speed_kmh} km/h`;
    document.getElementById('traj-conf-val').innerText = `${Math.round(traj.confidence_score * 100)}%`;
    banner.classList.remove('hidden');
}

function clearTrajectoryLayer() {
    if (AppState.activeTrajectoryPolyline) {
        AppState.map.removeLayer(AppState.activeTrajectoryPolyline);
        AppState.activeTrajectoryPolyline = null;
    }
    const banner = document.getElementById('trajectory-banner');
    if (banner) banner.classList.add('hidden');
}

/* ==========================================================================
   5. Macro Traffic Analytics & OD Matrix Fetch
   ========================================================================== */
async function fetchAnalytics() {
    try {
        const res = await fetch('/api/v1/analytics/overview');
        if (!res.ok) return;
        const data = await res.json();

        // Update Macro Stats
        document.getElementById('stat-network-flow').innerText = Math.round(data.macro_kpis.network_flow_vph).toLocaleString();
        document.getElementById('stat-congested-links').innerText = `${data.macro_kpis.congested_segments} / ${data.macro_kpis.total_segments}`;
        document.getElementById('kpi-speed-val').innerText = `${data.macro_kpis.avg_speed_kmh} km/h`;

        // Render Top OD Flows
        const odContainer = document.getElementById('od-matrix-container');
        if (odContainer && data.origin_destination.od_flows) {
            odContainer.innerHTML = '';
            data.origin_destination.od_flows.slice(0, 6).forEach(od => {
                const item = document.createElement('div');
                item.className = 'od-item';
                item.innerHTML = `
                    <span class="od-corridor">${od.origin} → ${od.destination} (${od.origin_name.split('/')[0]})</span>
                    <span class="od-count">${od.trip_count} trips</span>
                `;
                odContainer.appendChild(item);
            });
        }
    } catch (err) {
        console.error("Analytics fetch failed:", err);
    }
}

/* ==========================================================================
   6. Modals & Action Event Handlers
   ========================================================================== */
function initEventListeners() {
    // Close trajectory banner
    document.getElementById('btn-close-traj').onclick = clearTrajectoryLayer;

    // WOW Moment Trigger
    const btnWow = document.getElementById('btn-wow-moment');
    btnWow.onclick = async () => {
        btnWow.disabled = true;
        btnWow.innerText = "⏳ COMPUTING ST-DAG...";
        try {
            const res = await fetch('/api/v1/demo/trigger-wow-moment', { method: 'POST' });
            const data = await res.json();
            openWowModal(data);
        } catch (err) {
            console.error("WOW Moment error:", err);
        } finally {
            btnWow.disabled = false;
            btnWow.innerText = "⚡ TRIGGER WOW MOMENT";
        }
    };

    // Close WOW Modal
    document.getElementById('btn-close-wow').onclick = () => {
        document.getElementById('modal-wow').classList.add('hidden');
    };

    document.getElementById('btn-view-wow-on-map').onclick = () => {
        document.getElementById('modal-wow').classList.add('hidden');
        inspectVehicleTrajectory("DL01AB8234", "DL01AB8234");
    };

    // Lawful Interception Search Modal
    document.getElementById('btn-lawful-search').onclick = () => {
        document.getElementById('modal-lawful').classList.remove('hidden');
    };
    document.getElementById('btn-close-lawful').onclick = () => {
        document.getElementById('modal-lawful').classList.add('hidden');
    };

    // Lawful Search Form Submit
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
                    <div>Cameras Linked: ${data.trajectory.camera_sequence.join(' → ')}</div>
                    <div>Confidence: ${Math.round(data.trajectory.confidence_score * 100)}%</div>
                    <div style="margin-top: 6px; font-size: 10px; color: #7c4dff;">Audit Block #${data.audit_block.block_id}: ${data.audit_block.block_hash.slice(0, 20)}...</div>
                    <button class="btn btn-primary btn-block" style="margin-top: 8px;" onclick="viewSearchedTraj('${data.trajectory.plate_hash}')">View on Map</button>
                `;
            } else {
                resultBox.innerHTML = `<div style="color: #ff1744;">❌ ${data.detail || 'Access Denied: Warrant Invalid'}</div>`;
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
                card.className = 'audit-block-card';
                card.innerHTML = `
                    <div class="audit-block-header">
                        <span>BLOCK #${b.block_id}: ${b.action_type}</span>
                        <span>Officer: ${b.officer_badge}</span>
                    </div>
                    <div>Warrant Token: ${b.warrant_token}</div>
                    <div class="audit-hash">Prev Hash: ${b.prev_hash}</div>
                    <div class="audit-hash">Curr Hash: ${b.block_hash}</div>
                `;
                list.appendChild(card);
            });
        } catch (err) {
            console.error("Audit ledger fetch error:", err);
        }
    };
    document.getElementById('btn-close-audit').onclick = () => {
        document.getElementById('modal-audit').classList.add('hidden');
    };

    // Close Alert Detail Modal
    document.getElementById('btn-close-alert-detail').onclick = () => {
        document.getElementById('modal-alert-detail').classList.add('hidden');
    };
}

function viewSearchedTraj(hash) {
    document.getElementById('modal-lawful').classList.add('hidden');
    inspectVehicleTrajectory(hash, "");
}

function openWowModal(data) {
    const modal = document.getElementById('modal-wow');
    modal.classList.remove('hidden');
}

function openAlertDetailModal(alert) {
    const modal = document.getElementById('modal-alert-detail');
    document.getElementById('modal-alert-title').innerText = `🚨 ${alert.alert_type.replace(/_/g, ' ')}`;
    
    const body = document.getElementById('modal-alert-body');
    body.innerHTML = `
        <div style="margin-bottom: 14px;">
            <div style="font-size: 16px; font-family: var(--font-mono); color: var(--accent-yellow); font-weight: 800;">
                Target: ${alert.detected_plate}
            </div>
            <div style="color: #94a3b8; font-size: 11px;">
                Sighted at ${alert.camera_name} (${alert.camera_id})
            </div>
        </div>

        <div class="evidence-metrics" style="margin-bottom: 14px;">
            <div class="ev-item">
                <span class="ev-label">Evidence Statement:</span>
                <span class="ev-val text-cyan">${alert.explainability.evidence_statement}</span>
            </div>
            <div class="ev-item">
                <span class="ev-label">OCR Recognition Confidence:</span>
                <span class="ev-val text-green">${Math.round(alert.explainability.ocr_confidence * 100)}%</span>
            </div>
            <div class="ev-item">
                <span class="ev-label">Recommended Field Action:</span>
                <span class="ev-val text-yellow">${alert.explainability.recommended_action}</span>
            </div>
        </div>
    `;

    const actions = document.getElementById('modal-alert-actions');
    actions.innerHTML = `
        <button class="btn btn-secondary" onclick="triageAlertAction('${alert.alert_id}', 'DISMISSED_OPTICAL_ERROR')">Dismiss as Optical Error</button>
        <button class="btn btn-primary" onclick="triageAlertAction('${alert.alert_id}', 'CONFIRMED_DISPATCHED')">Confirm &amp; Dispatch Field Intercept</button>
    `;

    modal.classList.remove('hidden');
}

async function triageAlertAction(alertId, decision) {
    try {
        const res = await fetch(`/api/v1/alerts/${alertId}/triage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision: decision, officer_id: 'OFFICER_DELHI_08' })
        });
        if (res.ok) {
            document.getElementById('modal-alert-detail').classList.add('hidden');
        }
    } catch (e) {
        console.error("Triage error", e);
    }
}
