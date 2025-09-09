// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase project config (from the console)
const firebaseConfig = {
  apiKey: "AIzaSyCLQsl2qEIhEC7_GHeggzkbTa5QH48-_Ww",
  authDomain: "realtime-location-tracke-5e9a7.firebaseapp.com",
  databaseURL: "https://realtime-location-tracke-5e9a7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "realtime-location-tracke-5e9a7",
  storageBucket: "realtime-location-tracke-5e9a7.firebasestorage.app",
  messagingSenderId: "307624403558",
  appId: "1:307624403558:web:c1ce67a5ae3ee97e40c3a7",
  measurementId: "G-PCVFG0BGGL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);


