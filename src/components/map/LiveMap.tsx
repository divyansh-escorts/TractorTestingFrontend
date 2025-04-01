"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush, AreaChart, Area, ResponsiveContainer
} from 'recharts';

interface WebSocketData {
  DEVICE_ID: string;
  TIME: string;
  FUEL_LEVEL: string;
  SPEED: string;
  ENGINE_RPM: string;
}

interface ChartData {
  name: string;
  DEVICE_ID: string;
  FUEL_LEVEL: number;
  SPEED: number;
  ENGINE_RPM: number;
}

interface _Data {
  TIME: string;
  DEVICE_ID: string;
  LATITUDE:string;
  LONGITUDE:string
  FUEL_LEVEL: string;
  SPEED: string;
  ENGINE_RPM: string;
}

interface GraphDataProps {
  newData: _Data | null; // Assuming it expects a `data` prop
}

const customIcon =  L.icon({
  iconUrl: 'images/loaction.png', // put your image path here
  iconSize: [32, 32], // size of the icon
  iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -32] // point from which the popup should open relative to the iconAnchor
});


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

const LiveMap: React.FC<GraphDataProps> = ({ newData }) => {
  const [positions, setPositions] = useState<number[][]>([]); // Default: Nashik
  const [data, setData] = useState<ChartData[]>([]);
  const [brushIndices, setBrushIndices] = useState<{ startIndex: number, endIndex: number }>({ startIndex: 0, endIndex: 20 });

  useEffect(() => {
    try{
      console.log(newData)
      if(newData){
        setData((prevData) => {
            const updatedData = [
              ...prevData,
              {
                TIME: new Date().toLocaleTimeString(),
                name: new Date().toLocaleTimeString(),
                DEVICE_ID: newData.DEVICE_ID,
                FUEL_LEVEL: parseFloat(newData.FUEL_LEVEL),
                SPEED: parseFloat(newData.SPEED),
                ENGINE_RPM: parseFloat(newData.ENGINE_RPM),
              },
            ];
            console.log(updatedData)
            return updatedData;
          });
      }
    }
    catch(err){
      console.log(err)
    }
  },[newData])  

  // Handle Brush changes with optional startIndex and endIndex
  const handleBrushChange = (newIndex: { startIndex?: number; endIndex?: number }) => {
    setBrushIndices({
      startIndex: newIndex.startIndex ?? 0, // Use fallback if undefined
      endIndex: newIndex.endIndex ?? 20,   // Use fallback if undefined
    });
  };

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080"); // Change to your WebSocket server

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event?.data);
        if (data.LATITUDE && data.LONGITUDE) {
          console.log("New Position:", data.latitude, data.longitude);

          // Append new position to the list without refreshing the map
          setPositions((prevPositions) => [
            ...prevPositions,
            [parseFloat(data.LATITUDE), parseFloat(data.LONGITUDE)]
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
    <div style={{ display: 'flex', width: '100%' }}>
      {/* Left side: Stats Section */}
      <div style={{
          flex: 1, // Make it take up 50% of the container
          display: 'flex', 
          flexDirection: 'column', 
          margin:'20px'
        }}>
          <div style={{display:'flex'}}>
            <div style={{
            backgroundColor: '#E3F5FF',
            borderRadius: '8px', 
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
            maxWidth: '190px', 
            margin: '0 auto',
            flex: '1 1 calc(33% - 20px)', // Adjust for 3 items in a row
            minWidth: '150px'
          }}>
          <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>Distance travelled</p>
          <div style={{
              display: 'flex', 
              flexDirection: 'row', 
              gap: '30px', 
              justifyContent: 'center', 
              alignItems: 'center'
            }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row',
                gap:"5px"
              }}>
              <img src={dis.src} alt="Image" style={{ height: "30px" }} />
              <p style={{ color: '#4186E5', fontSize: '22px' }}>24 KM</p>
            </div>
          </div>
          <p style={{fontSize: "11px", margin:"3px"}}>Today's total : 104 km</p>
        </div>

        <div style={{
          backgroundColor: '#E3F5FF',
          borderRadius: '8px', 
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
          maxWidth: '190px', 
          margin: '0 auto',
          flex: '1 1 calc(33% - 20px)',
          minWidth: '150px'
        }}>
          <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>Hours tested</p>
          <div style={{
              display: 'flex',
              flexDirection: 'row', 
              gap: '30px', 
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: '10px'
              }}>
              <p style={{ color: '#4186E5', fontSize: '22px' }}>06:31:54</p>
            </div>
          </div>
          <p style={{fontSize: "11px", margin:"3px"}}>Today's total : 7Hrs</p>
        </div>

        <div style={{
          backgroundColor: '#E3F5FF',
          borderRadius: '8px', 
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
          maxWidth: '190px', 
          margin: '0 auto',
          flex: '1 1 calc(33% - 20px)',
          minWidth: '150px'
        }}>
          <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>Live location</p>
          <div style={{
              display: 'flex',
              flexDirection: 'row', 
              gap: '30px', 
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <div style={{
                display: 'flex', 
                flexDirection: 'row', 
                gap: '5px'
              }}>
              <img src={loc.src} alt="Image" style={{ height: "27px", marginTop:"4px"}} />
              <p style={{ color: '#4186E5', fontSize: '22px' }}>Faridabad</p>
            </div>
          </div>
          <p style={{fontSize: "11px", margin:"3px"}}>28.4089° N, 77.3178° E</p>
        </div>
          </div>
        
        <Map center={latestPosition} zoom={20} style={{ height: "500px", width: "100%", marginTop:"20px" }}>
          <TileLayerComp url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <UpdateMapView position={latestPosition} />

          {/* Render all markers */}
          {positions.map((pos, index) => (
            <MarkerComp key={index} position={pos} icon={customIcon} >
              <PopupComp>Point {index + 1}: {pos[0]}, {pos[1]}</PopupComp>
            </MarkerComp>
          ))}
          {/* Draw a polyline connecting the points */}
          {positions.length > 1 && (
            <PolylineComp positions={positions} color="blue" weight={3} />
          )}
        </Map>
      </div>

      {/* Right side: Map and Charts Section */}
      <div style={{
        flex: 1, // Take up 50% of the width
        display: 'flex',
        flexDirection: 'column'
      }}>
        

        <div style={{ width: '100%' }}>
          <h2 style={{ fontSize: '25px', color: 'gray' }}>Fuel Level</h2>
          <ResponsiveContainer width="100%" height={200} >
            <LineChart data={data} syncId="fuelChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="TIME" />
              <YAxis label={{ value: 'Fuel (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} tickCount={6} />
              <Tooltip />
              <Line type="monotone" dataKey="FUEL_LEVEL" stroke="#8884d8" fill="#8884d8" isAnimationActive={false} animationDuration={0} />
            </LineChart>
          </ResponsiveContainer>

          <h2 style={{ fontSize: '25px', color: 'gray' }}>Speed</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} syncId="speedChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="TIME" />
              <YAxis label={{ value: 'Speed km/h', angle: -90, position: 'insideLeft' }} domain={[0, 60]} tickCount={6} />
              <Tooltip />
              <Line type="monotone" dataKey="SPEED" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
            </LineChart>
          </ResponsiveContainer>

          <h2 style={{ fontSize: '25px', color: 'gray' }}>RPM</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} syncId="rpmChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="TIME" />
              <YAxis label={{ value: 'RPM', angle: -90, position: 'insideLeft' }} domain={[0, 3000]} tickCount={6} />
              <Tooltip />
              <Area type="monotone" dataKey="ENGINE_RPM" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
              <Brush height={20} startIndex={brushIndices.startIndex} onChange={handleBrushChange} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>


  );
};

export default LiveMap;
