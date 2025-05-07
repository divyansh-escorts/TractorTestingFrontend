"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import tractorImg from "../tractorImg.svg"
// Import Leaflet styles
import dis from "../../../public/images/icons8-route-64.png"
import loc from "../../../public/images/icons8-navigation-64.png"
import speedImage from "../../../public/images/icons8-speed-24.png"
import L, { LatLngExpression, LatLngTuple } from 'leaflet';
import "leaflet/dist/leaflet.css";
import {
LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Brush, AreaChart, Area, ResponsiveContainer
} from 'recharts';
import axios from "axios";
import { Box, Card, Divider, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

interface WebSocketData {
DEVICE_ID: string;
TIME: string;
FUEL_LEVEL: string;
SPEED: string;
ENGINE_RPM: string;
}

interface ChartData {
name: string;
TIME: string;
LATITUDE:string;
LONGITUDE:string;
ALTITUDE: string;
DEVICE_ID: string;
FUEL_LEVEL: number;
SPEED: number;
ENGINE_RPM: number;
}

interface TableData {
 date: string;
 hmr: string;
 distance:string;
 location:string;
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

interface AssetTrackerMessage {
 TIME: string;
 DEVICE_ID: string;
 LATITUDE: string;
 LONGITUDE: string;
 ALTITUDE: string;
 SPEED: string;
 FUEL_LEVEL: string;
 ENGINE_RPM: string;
 }
 
 interface AssetTrackerData {
 timestamp: string;
 topic: string;
 message: AssetTrackerMessage;
 }



const customIcon = L.icon({
iconUrl: 'images/loaction.png', // put your image path here
iconSize: [16, 16], // size of the icon
iconAnchor: [8, 18], // point of the icon which will correspond to marker's location
popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
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

const LiveMap = () => {
const [positions, setPositions] = useState<LatLngTuple[]>([]); // Default: Nashik
const [center, setCenter] = useState<LatLngExpression>(); 
const [Data, setData] = useState<ChartData[]>([]);
const [brushIndices, setBrushIndices] = useState<{ startIndex: number, endIndex: number }>({ startIndex: 0, endIndex: 20 });
const [disPositions, setDisPositions] = useState<number[][]>([]);
const [totalDistance, setTotalDistance] = useState<number>(0);
const [location, setLocation] = useState<string[]>([]); 
const [time, setTime] = useState<string>(); 
const [speed, setSpeed] = useState<number>(0); 
const [lat, setLat] = useState<number>(0);
const [long, setLong] = useState<number>(0);
const [HMR, setHMR] = useState<string>("0"); 
const [status, setStatus] = useState<string>("Stopped");
const [tableData, setTableData] = useState<TableData[]>([]);

const latRef = useRef(lat);
const longRef = useRef(long);



// Update latRef and longRef on state change
useEffect(() => {
 latRef.current = lat;
 longRef.current = long;
}, [lat, long]);

// Handle Brush changes with optional startIndex and endIndex
const handleBrushChange = (newIndex: { startIndex?: number; endIndex?: number }) => {
setBrushIndices({
startIndex: newIndex.startIndex ?? 0, // Use fallback if undefined
endIndex: newIndex.endIndex ?? 20, // Use fallback if undefined
});
};


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

function calculateDecimal(number: number): string {
 const [integerPart, decimalPart] = number.toString().split(".")
 const result = (parseInt(decimalPart) / 60); 
 const res = result.toString().replace('.', '');
 const firstSixDigits = res.slice(0, 6);
 const afterDecimal = parseInt(firstSixDigits)
 return `${Math.floor(number)}.${afterDecimal}`;
}

const timeToSeconds = (time: string): number => {
 const [hours, minutes, seconds] = time.split(':').map(Number);
 return hours * 3600 + minutes * 60 + seconds;
};

const secondsToTime = (seconds: number): string => {
 const hours = Math.floor(seconds / 3600);
 const minutes = Math.floor((seconds % 3600) / 60);
 const secs = seconds % 60;

 return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};


useEffect(() => {
 setData([])
 let HMR = 0
 const fetchDetails = async () => {
 try {
 
 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/live`);
 console.log(res?.data)

 if(res.status==200){
 let lastTimestamp: string | null = null; 
 console.log(lastTimestamp)

 const newData = res.data
 .filter((item: any) => {
 const latitude = item.message.LATITUDE;
 const longitude = item.message.LONGITUDE;
 
 return (
 latitude !== '0.0000' && latitude !== '0.000000' &&
 longitude !== '0.0000' && longitude !== '0.000000' &&
 latitude !== '0' && longitude !== '0' &&
 latitude !== null && longitude !== null
 );
 })
 .map((item: any) => {
 const updatedEngineRpm = item.message.ENGINE_RPM < 649 ? 0 : item.message.ENGINE_RPM;
 
 return {
 "TIME": addTimeToCurrentTime(item.message.TIME),
 "DEVICE_ID": item.message.DEVICE_ID,
 "LATITUDE": calculateDecimal(item.message.LATITUDE),
 "LONGITUDE": calculateDecimal(item.message.LONGITUDE),
 "ALTITUDE": item.message.ALTITUDE,
 "SPEED": item.message.SPEED,
 "FUEL_LEVEL": item.message.FUEL_LEVEL,
 "ENGINE_RPM": updatedEngineRpm 
 };
 })
 .filter((value: any, index: any, self: any) => {
 return index === self.findIndex((t: any) => t.TIME === value.TIME);
 });
 

 console.log(newData)
 setData(newData)
 let totalDistance = 0
 let allDataLenght = newData.length
 // console.log(allDataLenght)
 let lastPostion = newData[allDataLenght-1]
 console.log(lastPostion)
 setTime(lastPostion.TIME)
 const latitude = parseFloat(lastPostion?.LATITUDE); 
 const longitude = parseFloat(lastPostion?.LONGITUDE);
 setLat(latitude)
 setLong(longitude)
 const location = await getLocationFromCoordinates(latitude, longitude);
 const locationArray = location.split(", ")
 setLocation(locationArray)
 // Loop through the coordinates and calculate distance between consecutive points
 for (let i = 0; i < newData.length - 1; i++) {
 const current = newData[i];
 const next = newData[i + 1];
 
 const lat1 = parseFloat(current.LATITUDE);
 const lon1 = parseFloat(current.LONGITUDE);
 const lat2 = parseFloat(next.LATITUDE);
 const lon2 = parseFloat(next.LONGITUDE);
 if(next.TIME != "Error: Invalid time format" && current.TIME != "Error: Invalid time format"){
 const dif = timeToSeconds(next.TIME) - timeToSeconds(current.TIME)
 if(lat1 != lat2 || lon1 != lon2){
 if(dif<=1200 && dif >0){
 HMR += dif
 }
 }
 }
 totalDistance += haversine(lat1, lon1, lat2, lon2);

 
 }
 console.log(secondsToTime(HMR))
 setHMR(secondsToTime(HMR))
 setTotalDistance(totalDistance)

 if (newData?.length > 0) {
 console.log(newData)
 const positions:LatLngTuple[] = newData.map((point:any) => [parseFloat(point.LATITUDE), parseFloat(point.LONGITUDE)]);
 console.log(positions)
 setPositions(positions)
 }
 }
 else{
 console.log("failed to load data")
 }

 } catch (err) {
 console.log(err)
 } 
 };

 fetchDetails(); 
 }, []);

 useEffect(() => {
 const fetchDetails = async () => {
 try {
 const res = await axios.get(`https://fdcserver.escortskubota.com/fdc/tripData/getTractorHistory/EKL_02`);
 console.log(res.data.resp)
 setTableData(res.data.resp)
 }
 catch(err){
 console.log(err)
 }
 }

 fetchDetails(); 
 }, []);


 let allData : ChartData[] = []
useEffect(() => {
const socket = new WebSocket("wss://fdcserver.escortskubota.com/ws/"); // Change to your WebSocket server
socket.onopen = () => {
console.log("Connected to WebSocket");
};

socket.onmessage = (event) => {
try {
 console.log("Event data",event?.data)
 const data = JSON.parse(event?.data);
 if(Data.length == 0 || Data[Data.length-1].TIME != data.TIME)
 if (data && 
 data.DEVICE_ID && 
 data.LATITUDE!=="0.0000"&&
 data.LONGITUDE!=="0.0000" &&
 data.LATITUDE!=="0.000000"&&
 data.LONGITUDE!=="0.000000" &&
 !isNaN(parseFloat(data.ENGINE_RPM)) &&
 !isNaN(parseFloat(data.FUEL_LEVEL)) &&
 !isNaN(parseFloat(data.SPEED))) {
 
 setData((prevData) => {
 const updatedData = [
 ...prevData,
 {
 TIME: addTimeToCurrentTime(data.TIME),
 name: new Date().toLocaleTimeString(),
 DEVICE_ID: data.DEVICE_ID,
 LATITUDE: calculateDecimal(data.LATITUDE),
 LONGITUDE: calculateDecimal(data.LONGITUDE),
 ALTITUDE: data.ALTITUDE,
 FUEL_LEVEL: parseFloat(data.FUEL_LEVEL),
 SPEED: parseFloat(data.SPEED),
 ENGINE_RPM: parseFloat(data.ENGINE_RPM) < 649 ? 0 : parseFloat(data.ENGINE_RPM),
 },
 ];

 allData.push(...updatedData)
 setLat(parseFloat(data.LATITUDE))
 setLong(parseFloat(data.LONGITUDE))
 console.log(data.SPEED)
 console.log(typeof data.SPEED)
 setSpeed(parseFloat(data.SPEED))
 return updatedData;
 }); 
 }
console.log(data);


if (data.LATITUDE && data.LONGITUDE && data.LATITUDE!=="0.000000"&& data.LONGITUDE!=="0.000000" && data.LATITUDE!=="0.0000" && data.LONGITUDE!=="0.0000") {
console.log("New Position:", data.LATITUDE, data.LONGITUDE);

setDisPositions((prevPositions) => {
 if (prevPositions.length > 0) {
 const lastPos = prevPositions[prevPositions.length - 1];
 const distance = haversine(lastPos[0], lastPos[1], parseInt(calculateDecimal(data.LATITUDE)), parseInt(calculateDecimal(data.LONGITUDE)));
 setTotalDistance((prevDistance) => prevDistance + distance);
 }

 return [...prevPositions, [parseInt(calculateDecimal(data.LATITUDE)), parseInt(calculateDecimal(data.LONGITUDE))]]; // Add new position to the list
 });

// Append new position to the list without refreshing the map
setPositions((prevPositions) => [
 ...prevPositions,
 [parseFloat(calculateDecimal(data.LATITUDE)), parseFloat(calculateDecimal(data.LONGITUDE))]
 ]);
 setCenter([parseFloat(calculateDecimal(data.LATITUDE)), parseFloat(calculateDecimal(data.LONGITUDE))])
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



function checkStatus() {
 console.log(allData.length)
 if(allData.length>0){
 let allDataLength = allData.length;
 console.log(allDataLength)
 let lastPos = allData[allDataLength-1];
 let lastTime = timeToSeconds(lastPos?.TIME);
 const currentDate = new Date();
 const currentTime = timeToSeconds(currentDate.toTimeString().slice(0,8))
 console.log(currentTime); 
 if(currentTime-lastTime<=30){
 setStatus("Running")
 console.log("running")
 }
 else{
 setStatus("Stopped")
 console.log("stopped")
 }
 }
 else{
 setStatus("Stopped")
 console.log("Stopped 1")
 }
}

 useEffect(() => {
 console.log("i m in")
 const intervalId = setInterval(checkStatus, 30000);
 return () => {
 clearInterval(intervalId);
 };
 }, []);


useEffect(()=>{
 try{
 if(Data){
 let distance = totalDistance
 let newHMR = timeToSeconds(HMR)
 let allDataLenght = Data.length
 let last = Data[allDataLenght-1]
 let secondLast = Data[allDataLenght-2]
 
 const lat1 = parseFloat(last?.LATITUDE);
 const lon1 = parseFloat(last?.LONGITUDE);
 const lat2 = parseFloat(secondLast?.LATITUDE);
 const lon2 = parseFloat(secondLast?.LONGITUDE);
 if(last?.TIME != "Error: Invalid time format" && secondLast?.TIME != "Error: Invalid time format"){
 const dif = timeToSeconds(last?.TIME) - timeToSeconds(secondLast?.TIME)
 if(lat1 != lat2 || lon1 != lon2){
 if(dif<=1200 && dif >0){
 newHMR += dif
 }
 }
 distance += haversine(lat1, lon1, lat2, lon2);
 setTotalDistance(distance)
 setHMR(secondsToTime(newHMR))
 }
 }
 
 }
 catch(err){
 console.log(err)
 }
},[Data])

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
 const R = 6371; // Radius of Earth in km
 const dLat = (lat2 - lat1) * (Math.PI / 180); // Convert degrees to radians
 const dLon = (lon2 - lon1) * (Math.PI / 180); // Convert degrees to radians
 
 const a =
 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
 Math.sin(dLon / 2) * Math.sin(dLon / 2);
 
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 
 return R * c; // Returns distance in km
 };

if (typeof window === 'undefined') {
 return null; // Prevent rendering on the server-side
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
 throw new Error(`Error with the request: ${response.statusText}`);
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
// Get the latest position for centering the map
const latestPosition:LatLngTuple = positions.length > 0 ? positions[0] : [19.9975, 73.7898];

return (
<div>

 
<div style={{ display: 'flex', width: '100%' }}>


{/* Left side: Stats Section */}
<div style={{
 flex: 1, // Keep flex as is
 display: 'flex',
 flexDirection: 'column',
 margin: '16.8px' // 5% increase of 16px
}}>



 <div style={{ display: 'flex' }}>
 {/* Distance Travelled */}
 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px',
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
 maxWidth: '160px', // 5% increase of 152px
 margin: '0 auto',
 flex: '1 1 calc(33% - 16.8px)', // Adjust for 3 items in a row
 minWidth: '100px' // 5% increase of 96px
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '8.4px', fontSize: '13px', width: '100%' }}>Distance travelled</p> {/* 5% increase of 8px */}
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '25.2px', // 5% increase of 24px
 justifyContent: 'center',
 alignItems: 'center'
 }}>
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '4.2px' // 5% increase of 4px
 }}>
 <img src={dis.src} alt="Image" style={{ height: "25.2px" }} /> {/* 5% increase of 24px */}
 <p style={{ color: '#4186E5', fontSize: '18px' }}>{totalDistance.toFixed(2)} km</p> {/* 5% increase of 16px */}
 </div>
 </div>
 </div>

 {/* Current Speed */}
 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px',
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
 maxWidth: '160px', // 5% increase of 152px
 margin: '0 auto',
 flex: '1 1 calc(33% - 16.8px)', // Adjust for 3 items in a row
 minWidth: '126px' // 5% increase of 120px
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '8.4px', fontSize: '13px', width: '100%' }}>Current speed</p> {/* 5% increase of 8px */}
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '25.2px', // 5% increase of 24px
 justifyContent: 'center',
 alignItems: 'center'
 }}>
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '4.2px' // 5% increase of 4px
 }}>
 <img src={speedImage.src} alt="Image" style={{ height: "23.1px", marginTop: "4px" }} /> {/* 5% increase of 22px */}
 <p style={{ color: '#4186E5', fontSize: '18px' }}>{speed.toFixed(2)} kmph</p> {/* 5% increase of 16px */}
 </div>
 </div>
 </div>

 {/* HMR */}
 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px',
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
 maxWidth: '160px', // 5% increase of 152px
 margin: '0 auto',
 flex: '1 1 calc(33% - 16.8px)', // Adjust for 3 items in a row
 minWidth: '126px' // 5% increase of 120px
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '8.4px', fontSize: '13px', width: '100%' }}>HMR</p> {/* 5% increase of 8px */}
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '25.2px', // 5% increase of 24px
 justifyContent: 'center',
 alignItems: 'center'
 }}>
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '4.2px' // 5% increase of 4px
 }}>
 <img src={speedImage.src} alt="Image" style={{ height: "23.1px", marginTop: "4px" }} /> {/* 5% increase of 22px */}
 <p style={{ color: '#4186E5', fontSize: '18px' }}>{HMR}</p> {/* 5% increase of 16px */}
 </div>
 </div>
 </div>

 {/* Live Location */}
 <div style={{
 backgroundColor: '#E3F5FF',
 borderRadius: '8px',
 boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
 maxWidth: '160px', // 5% increase of 152px
 margin: '0 auto',
 flex: '1 1 calc(33% - 16.8px)', // Adjust for 3 items in a row
 minWidth: '126px' // 5% increase of 120px
 }}>
 <p style={{ fontWeight: 'bold', borderRadius: '8px', color: 'Black', padding: '8.4px', fontSize: '13px', width: '100%' }}>Live location</p> {/* 5% increase of 8px */}
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '25.2px', // 5% increase of 24px
 justifyContent: 'center',
 alignItems: 'center'
 }}>
 <div style={{
 display: 'flex',
 flexDirection: 'row',
 gap: '4.2px' // 5% increase of 4px
 }}>
 <img src={loc.src} alt="Image" style={{ height: "23.1px", marginTop: "4px" }} /> {/* 5% increase of 22px */}
 <p style={{ color: '#4186E5', fontSize: '18px' }}>{location.slice(0, 2).join(', ')}</p> {/* 5% increase of 16px */}
 </div>
 </div>
 </div>
 </div>


<Map center={positions[0]} zoom={20} style={{ height: "500px", width: "100%", marginTop:"20px" }}>
<TileLayer
    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    zIndex={1}
  />
  
  {/* Transparent labels overlay */}
  <TileLayer
    url="https://services.arcgisonline.com/arcgis/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
    zIndex={2}
  />
<UpdateMapView position={latestPosition} />

{/* Render all markers */}
{positions.map((pos, index) => {
 const isLast = index === positions.length - 1;

 const icon = isLast
 ? L.icon({
 iconUrl: 'images/tractor.svg', // icon for the last point
 iconSize: [32, 32],
 iconAnchor: [16, 16],
 popupAnchor: [0, -16],
 })
 : customIcon; // default icon for other points

 return (
 <MarkerComp key={index} position={pos} icon={icon}>
 <PopupComp>Point {index + 1}: {pos[0]}, {pos[1]}</PopupComp>
 </MarkerComp>
 );
})}
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
<LineChart data={Data} syncId="fuelChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="TIME" />
<YAxis label={{ value: 'Fuel (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} tickCount={6} />
<Tooltip />
<Brush height={20} startIndex={brushIndices.startIndex} onChange={handleBrushChange} />
<Line type="monotone" dataKey="FUEL_LEVEL" stroke="#8884d8" fill="#8884d8" isAnimationActive={false} animationDuration={0} />
</LineChart>
</ResponsiveContainer>

<h2 style={{ fontSize: '25px', color: 'gray' }}>Speed</h2>
<ResponsiveContainer width="100%" height={200}>
<LineChart data={Data} syncId="speedChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="TIME" />
<YAxis label={{ value: 'km/h', angle: -90, position: 'insideLeft' }} domain={[0, 60]} tickCount={6} />
<Tooltip />
<Brush height={20} startIndex={brushIndices.startIndex} onChange={handleBrushChange} />
<Line type="monotone" dataKey="SPEED" stroke="#82ca9d" fill="#82ca9d" isAnimationActive={false} animationDuration={0} />
</LineChart>
</ResponsiveContainer>

<h2 style={{ fontSize: '25px', color: 'gray' }}>RPM</h2>
<ResponsiveContainer width="100%" height={200}>
<AreaChart data={Data} syncId="rpmChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
<Box sx={{ padding: 2 }}>
 <Card sx={{ overflow: 'scroll', height: '40vh' }}>
 <Divider />
 <Table stickyHeader>
 {!tableData.length ? <caption>No Previous Data</caption> : <></>}
 <TableHead sx={{ position: 'sticky', top: 0 }}>
 <TableRow>
 <TableCell sx={{ fontWeight: 'bold', color: '#000000 !important' }} align="center" colSpan={5}>
 Previous Trips
 </TableCell>
 </TableRow>
 <TableRow>
 <TableCell sx={{ color: '#000000 !important' }}>Date</TableCell>
 <TableCell sx={{ color: '#000000 !important' }}>HMR</TableCell>
 <TableCell sx={{ color: '#000000 !important' }}>Distance</TableCell>
 <TableCell sx={{ color: '#000000 !important' }}>Location</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {tableData
 // Sort by date in descending order (newest first)
 // .sort((a, b) => new Date(b.date) - new Date(a.date))
 .map((e) => {
 return (
 <TableRow key={e.date}>
 <TableCell>{e.date}</TableCell>
 <TableCell>{e.hmr}</TableCell>
 <TableCell>{e.distance} km</TableCell>
 <TableCell>{e.location}</TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </Card>
</Box>

</div>

);
};

export default LiveMap;
