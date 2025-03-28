"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
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
  const [positions, setPositions] = useState<number[][]>([]); // Default: Nashik

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
 <div>
     <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '20px', marginTop: '20px', flexWrap: 'wrap', marginBottom:'20px' }}>
            <div style={{
              backgroundColor: '#E3F5FF',
              borderRadius: '8px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', maxWidth: '190px', margin: '0 auto',
              flex: '1 1 calc(20% - 20px)', // Makes each box take up 1/3 of the space when there's enough room
              minWidth: '150px' // Prevents the boxes from shrinking too small on small screens
            }}>
              <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%'   }}>Distance travelled</p>
              <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  gap: '30px', 
                  justifyContent: 'center',
                  alignItems: 'center', 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row',
                    gap:"5px" 
                  }}>
                    <img src={dis.src} alt="Image" style={{ height: "30px" }} />
                    <p style={{ color: '#4186E5', fontSize: '22px'}}>24 KM</p>
                   
                  </div>
                </div>
                <p style={{fontSize: "11px", margin:"3px"}}>Today's total : 104 km</p>
 
            </div>

            <div style={{
              backgroundColor: '#E3F5FF',
              borderRadius: '8px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', maxWidth: '190px', margin: '0 auto',
              flex: '1 1 calc(20% - 20px)', // Makes each box take up 1/3 of the space when there's enough room
              minWidth: '150px' // Prevents the boxes from shrinking too small on small screens
            }}>
              <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%'   }}>Hours tested</p>
              <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  gap: '30px', 
                  justifyContent: 'center',
                  alignItems: 'center', 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: '10px' 
                  }}>
                    <p style={{ color: '#4186E5', fontSize: '22px'}}>06:31:54</p>
                    {/* <p style={{ fontWeight: 'bold', color: 'Black', fontSize: '22px' }}>KM</p> */}
                  </div>
                </div>
                <p style={{fontSize: "11px", margin:"3px"}}>Today's total : 7Hrs</p>
 
            </div>

            <div style={{
              backgroundColor: '#E3F5FF',
              borderRadius: '8px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', maxWidth: '190px', margin: '0 auto',
              flex: '1 1 calc(20% - 20px)', // Makes each box take up 1/3 of the space when there's enough room
              minWidth: '150px' // Prevents the boxes from shrinking too small on small screens
            }}>
              <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%'   }}>Live location</p>
              <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  gap: '30px', 
                  justifyContent: 'center',
                  alignItems: 'center', 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: '5px' 
                  }}>
                    <img src={loc.src} alt="Image" style={{ height: "27px" , marginTop:"4px"}} />
                    <p style={{ color: '#4186E5', fontSize: '22px'}}>Faridabad</p>
                  </div>
                </div>
                <p style={{fontSize: "11px", margin:"3px"}}>28.4089° N, 77.3178° E</p>
            </div>
            
          </div>
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
 </div>
  );
};

export default LiveMap;
