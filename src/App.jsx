import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "./firebaseConfig";
import { ref, onValue } from "firebase/database";

function haversine([lat1, lon1], [lat2, lon2]) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const busIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/61/61291.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 0.6 });
  }, [center, map]);
  return null;
}

export default function App() {
  const [buses, setBuses] = useState({}); 
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [playbackBus, setPlaybackBus] = useState(null);
  const playbackRef = useRef(null);

  useEffect(() => {
    const r = ref(db, "buses");
    const unsub = onValue(r, (snap) => {
      const val = snap.val() || {};

      const next = {};
      Object.keys(val).forEach((id) => {
        const node = val[id] || {};
        const loc = node.location || null;
        const meta = node.meta || {};
        const prev = buses[id] || { history: [] };
        const history = prev.history ? [...prev.history] : [];
        if (loc) {
          
          const last = history.length ? history[history.length - 1] : null;
          if (!last || last.timestamp !== loc.timestamp) {
            history.push(loc);
            if (history.length > 40) history.shift();
          }
        }
        next[id] = { meta, location: loc, history };
      });
      setBuses(next);
    });
    return () => unsub();
    
  }, []);

  
  function computeETA(busLoc) {
    if (!busLoc || !selectedStop) return null;
    const d = haversine([busLoc.lat, busLoc.lng], selectedStop); // km
    const avgSpeedKmph = 25; // demo default
    const minutes = (d / avgSpeedKmph) * 60;
    return Math.max(1, Math.round(minutes));
  }

  
  function startPlayback(busId) {
    if (!buses[busId] || !buses[busId].history || buses[busId].history.length < 2) return;
    setPlaybackBus(busId);
    let idx = 0;
    playbackRef.current && clearInterval(playbackRef.current);
    playbackRef.current = setInterval(() => {
      const hist = buses[busId].history;
      if (idx >= hist.length) {
        clearInterval(playbackRef.current);
        setPlaybackBus(null);
        return;
      }
      const h = hist[idx];
      setSelectedBus({ id: busId, loc: [h.lat, h.lng] });
      idx++;
    }, 600);
  }

  function stopPlayback() {
    clearInterval(playbackRef.current);
    playbackRef.current = null;
    setPlaybackBus(null);
  }

  
  const center = selectedBus?.loc || Object.values(buses)[0]?.location ? [
    Object.values(buses)[0].location?.lat ?? 30.3165,
    Object.values(buses)[0].location?.lng ?? 78.0322
  ] : [30.3165, 78.0322];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      <div style={{ flex: 1 }}>
        <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {Object.entries(buses).map(([id, b]) => {
            if (!b.location) return null;
            const pos = [b.location.lat, b.location.lng];
            return (
              <React.Fragment key={id}>
                <Marker
                  position={pos}
                  icon={busIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedBus({ id, loc: pos });
                    }
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <b>{id}</b><br />
                      {b.meta.route ? <span>Route: {b.meta.route}<br/></span> : null}
                      Updated: {new Date(b.location.timestamp).toLocaleTimeString()}<br />
                      {b.history && b.history.length >= 2 ? (
                        <>
                          Speed (approx): {Math.round( haversine(
                            [b.history[b.history.length-2].lat, b.history[b.history.length-2].lng],
                            [b.location.lat, b.location.lng]
                          ) / ((b.location.timestamp - b.history[b.history.length-2].timestamp)/3600000) ) || 0} km/h
                        </>
                      ) : null}
                    </div>
                  </Popup>
                </Marker>

                {/* history polyline */}
                {b.history && b.history.length > 1 ? (
                  <Polyline positions={b.history.map(h => [h.lat, h.lng])} />
                ) : null}
              </React.Fragment>
            );
          })}
          {/* fly to selected */}
          <FlyTo center={selectedBus?.loc || center} />
        </MapContainer>
      </div>

      {/* Sidebar / admin */}
      <div style={{ width: 340, borderLeft: "1px solid #ddd", padding: 12, overflowY: "auto" }}>
        <h3>Fleet Dashboard</h3>
        <div style={{ marginBottom: 8 }}>
          <label>Select Stop (click on an input to set lat,lng):</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input placeholder="lat" id="stopLat" style={{ flex:1 }} />
            <input placeholder="lng" id="stopLng" style={{ flex:1 }} />
            <button onClick={() => {
              const lat = parseFloat(document.getElementById("stopLat").value);
              const lng = parseFloat(document.getElementById("stopLng").value);
              if (!isNaN(lat) && !isNaN(lng)) {
                setSelectedStop([lat, lng]);
              }
            }}>Set</button>
          </div>
          <div style={{ marginTop: 6 }}>
            Selected stop: {selectedStop ? `${selectedStop[0].toFixed(5)}, ${selectedStop[1].toFixed(5)}` : "none"}
          </div>
        </div>

        <h4>Active buses ({Object.keys(buses).length})</h4>
        <div style={{ display: "grid", gap: 8 }}>
          {Object.entries(buses).length === 0 && <div>No buses reporting</div>}
          {Object.entries(buses).map(([id, b]) => {
            const last = b.location;
            const minutesAgo = last ? Math.round((Date.now() - last.timestamp)/60000) : null;
            const eta = b.location && selectedStop ? computeETA(b.location) : null;
            return (
              <div key={id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6 }}>
                <b>{id}</b> {b.meta.route ? `• ${b.meta.route}` : null}
                <div>Last: {last ? new Date(last.timestamp).toLocaleTimeString() : "—" } {minutesAgo!=null ? `(${minutesAgo}m)` : ""}</div>
                <div>Coord: {last ? `${last.lat.toFixed(5)}, ${last.lng.toFixed(5)}` : "—"}</div>
                {eta ? <div>ETA to stop: ~{eta} min</div> : null}
                <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                  <button onClick={() => { setSelectedBus({ id, loc: [last.lat, last.lng]}); }}>
                    Focus
                  </button>
                  <button onClick={() => startPlayback(id)} disabled={!b.history || b.history.length<2}>Play</button>
                  <button onClick={stopPlayback}>Stop</button>
                </div>
              </div>
            );
          })}
        </div>

        <hr />
        <h4>Demo Controls</h4>
        <div>
          <p>Use the driver page on phone (or run simulator) to update buses live.</p>
        </div>
      </div>
    </div>
  );
}
