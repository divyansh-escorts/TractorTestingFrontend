"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import "leaflet/dist/leaflet.css";



// Dynamic import for SSR fix
const Map = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayerComp = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const MarkerComp = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const PopupComp = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const PolylineComp = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

// Custom component to move the map when new data arrives
const UpdateMapView = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  return null;
};

const LiveMap = () => {
  const [positions, setPositions] = useState([]); // Default: Nashik

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080"); // Change to your WebSocket server

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event?.data);
        if (data.latitude && data.longitude) {
          console.log("New Position:", data.latitude, data.longitude);

          // Append new position to the list without refreshing the map
          setPositions((prevPositions) => [
            ...prevPositions,
            [parseFloat(data.latitude), parseFloat(data.longitude)]
          ]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket data:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, []);

  // Get the latest position for centering the map
  const latestPosition = positions.length > 0 ? positions[0] : [19.9975, 73.7898];

  return (
    <Map center={latestPosition} zoom={20} style={{ height: "500px", width: "100%" }}>
      <TileLayerComp url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <UpdateMapView position={latestPosition} />
      
      {/* Render all markers */}
      {positions.map((pos, index) => (
        <MarkerComp key={index} position={pos} >
          <PopupComp>Point {index + 1}: {pos[0]}, {pos[1]}</PopupComp>
        </MarkerComp>
      ))}
       {/* Draw a polyline connecting the points */}
       {positions.length > 1 && (
        <PolylineComp positions={positions} color="blue" weight={3} />
      )}
    </Map>
  );
};

export default LiveMap;
