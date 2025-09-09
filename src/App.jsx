// src/App.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ref, onValue } from "firebase/database";
import { db } from "./firebaseConfig";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function App() {
  const [position, setPosition] = useState([30.3165, 78.0322]); // default Dehradun

  useEffect(() => {
    const busRef = ref(db, "bus/location");
    onValue(busRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPosition([data.lat, data.lng]);
      }
    });
  }, []);

  return (
    <MapContainer center={position} zoom={15} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={markerIcon}>
        <Popup>Driver is here 🚍</Popup>
      </Marker>
    </MapContainer>
  );
}
