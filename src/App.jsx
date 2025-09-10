import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ref, onValue } from "firebase/database";
import { db } from "./firebaseConfig";

const busIcon = new L.Icon({
  iconUrl: "/bus.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export default function App() {
  const [buses, setBuses] = useState({});
  const [history, setHistory] = useState({});
  const [playback, setPlayback] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const playbackRef = useRef(null);

  const stop = [30.285, 78.005];

  useEffect(() => {
    if (!playback) {
      const busesRef = ref(db, "buses");
      onValue(busesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const newBuses = {};
          const newHistory = { ...history };

          Object.keys(data).forEach((busId) => {
            const pos = [data[busId].location.lat, data[busId].location.lng];
            newBuses[busId] = pos;
            newHistory[busId] = [...(newHistory[busId] || []), pos];
          });

          setBuses(newBuses);
          setHistory(newHistory);
        }
      });
    }
  }, [playback]);

  
  const startPlayback = () => {
    if (Object.keys(history).length === 0) return;
    setPlayback(true);
    setPlayIndex(0);

    playbackRef.current = setInterval(() => {
      setPlayIndex((i) => {
        let maxLen = Math.max(...Object.values(history).map((h) => h.length));
        if (i < maxLen) {
          const newBuses = {};
          Object.keys(history).forEach((busId) => {
            if (history[busId][i]) {
              newBuses[busId] = history[busId][i];
            }
          });
          setBuses(newBuses);
          return i + 1;
        } else {
          clearInterval(playbackRef.current);
          setPlayback(false);
          return i;
        }
      });
    }, 1000);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "300px", background: "#f8f9fa", padding: "15px", borderRight: "1px solid #ccc" }}>
        <h2>🚌 Bus Tracker</h2>
        <p><strong>Buses Online:</strong> {Object.keys(buses).length}</p>

        <ul>
          {Object.entries(buses).map(([busId, pos]) => (
            <li key={busId}>
              <strong>{busId}:</strong> {pos[0].toFixed(4)}, {pos[1].toFixed(4)}
            </li>
          ))}
        </ul>

        <hr />
        <button 
          style={{ padding: "10px", marginTop: "10px", width: "100%" }}
          onClick={startPlayback}
          disabled={playback}
        >
          ▶ Playback Route
        </button>
      </div>

      {/* Map */}
      <div style={{ flexGrow: 1 }}>
        <MapContainer center={[30.3165, 78.0322]} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Bus Markers */}
          {Object.entries(buses).map(([busId, pos]) => (
            <Marker key={busId} position={pos} icon={busIcon}>
              <Popup>{busId} is here 🚍</Popup>
            </Marker>
          ))}

          {/* Stop */}
          <Marker position={stop}>
            <Popup>Destination Stop</Popup>
          </Marker>

          {/* Routes */}
          {Object.entries(history).map(([busId, path]) => (
            <Polyline key={busId} positions={path} color="blue" />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
