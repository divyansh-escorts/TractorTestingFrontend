"use client";
// yahan tak code theek tha 
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
import L, { LatLngExpression, LatLngTuple } from 'leaflet';
import speedImage from "../../../public/images/icons8-speed-24.png"
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

const customIcon = L.icon({
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

interface UpdateMapViewProps {
  position: LatLngExpression | undefined;
}
// Custom component to move the map when new data arrives
const UpdateMapView = ({position}:UpdateMapViewProps) => {
  if (typeof window !== 'undefined' && position) {
const map = useMap();
useEffect(() => {
if (position) {
map?.setView(position, 15);
}
}, [position, map]);
return null;
  }
};

const LiveMap= () => {
const [positions, setPositions] = useState<LatLngTuple[]>([]); // Default: Nashik
const [center, setCenter] = useState<LatLngExpression>(); 
const [data, setData] = useState<ChartData[]>([]);
const [brushIndices, setBrushIndices] = useState<{ startIndex: number, endIndex: number }>({ startIndex: 0, endIndex: 20 });
const [disPositions, setDisPositions] = useState<number[][]>([]);
const [totalDistance, setTotalDistance] = useState<number>(0);
const [location, setLocation] = useState<string[]>([]);  
const [speed, setSpeed] = useState<number>(0); 
const [lat, setLat] = useState<number>(0);
const [long, setLong] = useState<number>(0);


// Handle Brush changes with optional startIndex and endIndex
const handleBrushChange = (newIndex: { startIndex?: number; endIndex?: number }) => {
setBrushIndices({
startIndex: newIndex.startIndex ?? 0, // Use fallback if undefined
endIndex: newIndex.endIndex ?? 20, // Use fallback if undefined
});
};

useEffect(() => {
  const socket = new WebSocket("ws://localhost:8080"); // Change to your WebSocket server
  
  socket.onopen = () => {
  console.log("Connected to WebSocket");
  };
  
  socket.onmessage = (event) => {
  try {
    console.log("Event data",event?.data)
      const data = JSON.parse(event?.data);
      if (data && 
          data.DEVICE_ID && 
          data.LATITUDE!=="0"&&
          data.LONGITUDE!=="0" &&
          !isNaN(parseFloat(data.ENGINE_RPM)) &&
          !isNaN(parseFloat(data.FUEL_LEVEL)) &&
          !isNaN(parseFloat(data.SPEED))) {
        
        setData((prevData) => {
          const updatedData = [
            ...prevData,
            {
              TIME: new Date().toLocaleTimeString(),
              name: new Date().toLocaleTimeString(),
              DEVICE_ID: data.DEVICE_ID,
              FUEL_LEVEL: parseFloat(data.FUEL_LEVEL),
              SPEED: parseFloat(data.SPEED),
              ENGINE_RPM: parseFloat(data.ENGINE_RPM),
            },
          ];
          setLat(parseFloat(data.LATITUDE))
          setLong(parseFloat(data.LONGITUDE))
          setSpeed(parseFloat(data.SPEED))
          return updatedData;
        });
      }
  console.log(data);
  
  if (data.LATITUDE && data.LONGITUDE && data.LATITUDE!=="0" && data.LONGITUDE!=="0") {
  console.log("New Position:", data.LATITUDE, data.LONGITUDE);
  
  setDisPositions((prevPositions) => {
      if (prevPositions.length > 0) {
        const lastPos = prevPositions[prevPositions.length - 1];
        const distance = haversine(lastPos[0], lastPos[1], data.LATITUDE, data.LONGITUDE);
        setTotalDistance((prevDistance) => prevDistance + distance);
      }
  
      return [...prevPositions, [data.LATITUDE, data.LONGITUDE]]; // Add new position to the list
    });
  
  // Append new position to the list without refreshing the map
  setPositions((prevPositions) => [
  ...prevPositions,
  [parseFloat(data.LATITUDE), parseFloat(data.LONGITUDE)]
  ]);
  setCenter([data.LATITUDE, data.LATITUDE])
  }
  } catch (error) {
  console.log("Error parsing WebSocket data:", error);
  }
  };
  
  socket.onerror = (error) => {
  console.log("WebSocket error:", error);
  };
  
  socket.onclose = () => {
  console.log("WebSocket connection closed");
  };
  
  return () => {
  socket.close();
  };
  }, []);

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);  // Convert degrees to radians
    const dLon = (lon2 - lon1) * (Math.PI / 180);  // Convert degrees to radians
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // Returns distance in km
  };

if (typeof window === 'undefined') {
  return null;  // Prevent rendering on the server-side
}

const fetchLocation = async () => {
    console.log("hi",lat,long)
    if (lat !== 0 && long !== 0) {
      const location = await getLocationFromCoordinates(lat, long);
      const locationArray = location.split(",");  
      setLocation(locationArray);
    }
  };

  async function getLocationFromCoordinates(lat: number, lng: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error with the request ${response.statusText}`);
      }
      const data: { display_name: string } = await response.json();
      return data?.display_name || "Location not found";
    } catch (error) {
      console.log(error);
      return "Error fetching location";
    }
  }

  useEffect(() => {
    const intervalId = setInterval(fetchLocation, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, [lat, long]);

if (typeof window === 'undefined') {
  return null;  // Prevent rendering on the server-side
}
// Get the latest position for centering the map
const latestPosition:LatLngTuple = positions.length > 0 ? positions[0] : [19.9975, 73.7898];

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
<p style={{ color: '#4186E5', fontSize: '22px' }}>{totalDistance.toFixed(2)}KMs</p>
</div>
</div>
{/* <p style={{fontSize: "11px", margin:"3px"}}>Today's total : 104 km</p> */}
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
<p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>Current speed</p>
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
<img src={speedImage.src} alt="Image" style={{ height: "27px", marginTop:"4px"}} />
<p style={{ color: '#4186E5', fontSize: '22px' }}>{speed}</p>
</div>
</div>
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
<p style={{ color: '#4186E5', fontSize: '22px' }}>{location.slice(0,2).join(', ')}</p>
</div>
</div>
<p style={{fontSize: "11px", margin:"3px"}}>{`${lat}° N, ${long}° E`}</p>
</div>
</div>
<Map center={positions[0]} zoom={20} style={{ height: "500px", width: "100%", marginTop:"20px" }}>
<TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
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