"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
import L, { LatLng, LatLngBounds, LatLngBoundsExpression, LatLngExpression, LatLngTuple } from 'leaflet';
import "leaflet/dist/leaflet.css";
import {
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush, AreaChart, Area, ResponsiveContainer
} from 'recharts';
import axios from "axios";

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
 LATITUDE:string;
 LONGITUDE:string
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

interface dateProps{
 date:string
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

const PathMap: React.FC<dateProps> = ({ date }) => {
 const [data, setData] = useState<ChartData[]>([]);
 const [centerPosition, setCenterPosition] = useState<LatLngTuple>();
 const [position, setPosition] = useState<LatLngTuple[]>([]);
 const [distance, setDistance] = useState<number>();
 const [location, setLocation] = useState<string[]>([]); 

 // Convert degrees to radians
const toRadians = (degree: number) => {
 return degree * (Math.PI / 180);
};

// Haversine formula to calculate the distance between two points in kilometers
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
 const R = 6371; // Earth radius in km
 const dLat = toRadians(lat2 - lat1);
 const dLon = toRadians(lon2 - lon1);
 const a =
 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
 Math.sin(dLon / 2) * Math.sin(dLon / 2);
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 return R * c; // Distance in km
};


async function getLocationFromCoordinates(
 lat: number,
 lng: number
): Promise<string> {
 const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
 try {
 const response = await fetch(url);
 if (!response.ok) {
 throw new Error(`Error with the request: ${response.statusText}`);
 }
 const data: {
 display_name: string;
 } = await response.json();

 if (data && data.display_name) {
 return data.display_name;
 } else {
 return 'Location not found';
 }
 } catch (error) {
 console.log(error);
 return 'Error fetching location';
 }
}


useEffect(() => {
  setData([])
  const fetchDetails = async () => {
  try {
  
  const res = await axios.get(`https://fdcserver.escortskubota.com/tripData/historic?date=${date}`);
  console.log(res)
  if(res.status==200){
  function addTimeToCurrentTime(currentTime:string) {
  const additionalTime = "5:30"
  const time = currentTime.match(/(\d{2}:\d{2}:\d{2})/)?.[0];
  if (!time) {
  return "Error: Invalid time format";
  }
  const [hours, minutes, seconds] = time.split(":").map(Number);
  const [addHours, addMinutes] = additionalTime.split(":").map(Number);
  let newMinutes = minutes + addMinutes;
  let newHours = hours + addHours + Math.floor(newMinutes / 60); 
  newMinutes = newMinutes % 60; 
  newHours = newHours % 24;
  let newSeconds = seconds;
  const formattedTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${String(newSeconds).padStart(2, '0')}`;
  
  return formattedTime;
  } 
  const newData = res.data.result[0]?.data.map((item:any) => ({
  "TIME": addTimeToCurrentTime(item.TIME),
  "DEVICE_ID": item.DEVICE_ID,
  "LATITUDE": item.LATITUDE,
  "LONGITUDE": item.LONGITUDE,
  "ALTITUDE": item.LALTITUDE,
  "SPEED": item.SPEED,
  "FUEL_LEVEL": item.FUEL_LEVEL,
  "ENGINE_RPM": item.ENGINE_RPM
  }));
 
  setData(newData)
  const allData = res?.data?.result[0]?.data
  let totalDistance = 0
  let allDataLenght = allData.lenght
  let lastPostion = allData[99]
  console.log(lastPostion)
  const latitude = parseFloat(lastPostion?.LATITUDE); 
  const longitude = parseFloat(lastPostion?.LONGITUDE);
  const location = await getLocationFromCoordinates(latitude, longitude);
  const locationArray = location.split(",")
  setLocation(locationArray)
  // Loop through the coordinates and calculate distance between consecutive points
  for (let i = 0; i < allData.length - 1; i++) {
  const current = allData[i];
  const next = allData[i + 1];
  
  const lat1 = parseFloat(current.LATITUDE);
  const lon1 = parseFloat(current.LONGITUDE);
  const lat2 = parseFloat(next.LATITUDE);
  const lon2 = parseFloat(next.LONGITUDE);
  
  totalDistance += haversineDistance(lat1, lon1, lat2, lon2);
  }
  setDistance(totalDistance)
  }
  else{
  console.log("failed to load data")
  }
 
  } catch (err) {
  console.log(err)
  } 
  };
 
  fetchDetails(); 
  }, [date]);

  
 useEffect(() => {
 // Only set center position when positions array is updated
 if (data?.length > 0) {
 const positions:LatLngTuple[] = data.map(point => [parseFloat(point.LATITUDE), parseFloat(point.LONGITUDE)]);
 console.log(positions)
 setPosition(positions)
 // if (positions?.length > 0) {
 // const latestPosition: LatLngTuple = [positions[0][0],positions[0][1]]; // Get the latest position from the array
 // setCenterPosition(latestPosition); // Only update center position if it changes
 // }
 }
 }, [data]);

 useEffect(() => {
 // Only set center position when positions array is updated
 console.log(position)
 console.log("Yes sir i am running")
 if (position?.length > 0) {
 console.log("Yes sir i am running inside loop")
 const latestPosition: LatLngTuple = [position[0][0],position[0][1]]; // Get the latest position from the array
 console.log(latestPosition)
 setCenterPosition(latestPosition); // Only update center position if it changes
 }
 }, [position]);

 return (
<>
{data?<div style={{ display: 'flex', width: '100%' }}>
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
 <p style={{ color: '#4186E5', fontSize: '22px' }}>{distance?.toFixed(2)} KM</p>
 </div>
 </div>

 </div>

 {/* <div style={{
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
 </div> */}

 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px', 
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', 
 maxWidth: '220px', 
 margin: '0 auto',
 flex: '1 1 calc(33% - 20px)',
 minWidth: '150px'
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '10px', fontSize: '13px', width: '100%' }}>Location</p>
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
 <p style={{ color: '#4186E5', fontSize: '22px' }}>{location.slice(0, 2).join(', ')}</p>
 </div>
 </div>
 <p style={{ fontSize: "11px", margin: "3px" }}>
 {`${data[99]?.LATITUDE}`}° N, {`${data[99]?.LONGITUDE}`}° E
 </p>
 </div>
 </div>
 

 {centerPosition?<Map center={centerPosition} zoom={15} style={{ height: "500px", width: "100%", marginTop:"20px" }}>
 <TileLayer
 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
 url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
 />

 {position?.length > 1 && (
 <PolylineComp positions={position} color="blue" weight={3} />
 )}
 </Map>:<>Map is loading .......</>}
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
 <Brush height={20} />
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
 <Brush height={20} />
 </LineChart>
 </ResponsiveContainer>

 <h2 style={{ fontSize: '25px', color: 'gray' }}>RPM</h2>
 <ResponsiveContainer width="100%" height={200}>
 <AreaChart data={data} syncId="rpmChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" />
 <XAxis dataKey="TIME" />
 <YAxis label={{ value: 'RPM', angle: -90, position: 'insideLeft' }} domain={[0, 3500]} tickCount={6} />
 <Tooltip />
 <Area type="monotone" dataKey="ENGINE_RPM" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
 <Brush height={20} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>:<div>No data avilable</div>}
</>


 );
};

export default PathMap;
