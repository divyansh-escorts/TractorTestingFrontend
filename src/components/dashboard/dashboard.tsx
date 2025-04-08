"use client"
import { TractorDetails } from "@/components/ecommerce/TractorDetails";
import React, { useEffect, useState } from "react";
// import Flatpickr from "react-flatpickr";
import 'flatpickr/dist/themes/material_blue.css';
// import LiveMap from "@/components/map/LiveMap";
// import PathMap from "@/components/map/pathMap";
import dynamic from "next/dynamic";
import { Box, Card, CardContent, Typography } from "@mui/material";


const LiveMap = dynamic(() => import('@/components/map/LiveMap'), { ssr: false });
const PathMap = dynamic(() => import('@/components/map/pathMap'), { ssr: false });
const Flatpickr = dynamic(() => import('react-flatpickr'), { ssr: false });

interface Data {
 TIME: string;
 DEVICE_ID: string;
 LATITUDE:string;
 LONGITUDE:string
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

export default function Tracking() {
 const [newData, setNewData] = useState<Data>(Object);
 const[ date, setDate] = useState<string>('')
 const [today, setToday] = useState(new Date().toISOString().split('T')[0]);
 const [status, setStatus] = useState<string>("Stopped");

 const getStatusStyle = (status: string) => {
 switch (status) {
 case 'Running':
 return { backgroundColor: '#4caf50', color: 'white' }; // Green for Running
 case 'Ignition On':
 return { backgroundColor: '#FFFF00', color: 'white' };
 case 'Cranked & Halted':
 return { backgroundColor: '#FFA500', color: 'white' };
 case 'Stopped':
 return { backgroundColor: '#f44336', color: 'white' }; // Red for Stopped
 default:
 return { backgroundColor: '#9e9e9e', color: 'white' }; // Grey for unknown status
 }
 };

 const handleDateChange = (date: any) => {
 const selectedDate = new Date(date[0]); // Get the selected date
 selectedDate.setDate(selectedDate.getDate() + 1); // Increase by 1 day
 
 // Format the date as YYYY-MM-DD
 const newDate = selectedDate.toISOString().split('T')[0]; 
 
 console.log(newDate);
 setDate(newDate); // Set the updated date
 };
 
 useEffect(() => {
 // You can also check and update the date if necessary
 setToday(new Date().toISOString().split('T')[0]);
 console.log(new Date().toISOString().split('T')[0])
 }, []);
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

 const timeToSeconds = (time: string): number => {
 const [hours, minutes, seconds] = time?.split(':')?.map(Number);
 return hours * 3600 + minutes * 60 + seconds;
 };
 
 let allData : ChartData[] = []

 React.useEffect(() => {
 const socket = new WebSocket("wss://fdcserver.escortskubota.com/ws/"); // Change to your WebSocket server
 socket.onopen = () => {
 console.log("Connected to WebSocket");
 };
 
 socket.onmessage = (event) => {
 try {
 console.log("Event data",event?.data)
 const data = JSON.parse(event?.data);
 if (data && 
 data.DEVICE_ID && 
 data.LATITUDE !== "0.000000" &&
 data.LONGITUDE !== "0.000000" &&
 !isNaN(parseFloat(data.ENGINE_RPM)) &&
 !isNaN(parseFloat(data.FUEL_LEVEL)) &&
 !isNaN(parseFloat(data.SPEED))) {
 
 const commingData = 
 {
 TIME: addTimeToCurrentTime(data.TIME),
 name: new Date().toLocaleTimeString(),
 DEVICE_ID: data.DEVICE_ID,
 LATITUDE: data.LATITUDE,
 LONGITUDE: data.LONGITUDE,
 ALTITUDE: data.ALTITUDE,
 FUEL_LEVEL: parseFloat(data.FUEL_LEVEL),
 SPEED: parseFloat(data.SPEED),
 ENGINE_RPM: parseFloat(data.ENGINE_RPM),
 }
 ;
 allData.push(commingData)

 
 console.log(allData)
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
 if(lastPos.ENGINE_RPM<650){
 setStatus("Ignition On")
 }
 else if(lastPos.ENGINE_RPM>=650){
 setStatus("Cranked & Halted")
 }
 if(allData.length>1){
 let lastPostion = allData[allData.length-1];
 let secondLast = allData[allData.length-2];
 
 if((lastPostion.LATITUDE!= secondLast.LATITUDE || lastPostion.LONGITUDE!= secondLast.LONGITUDE) && currentTime-lastTime<=30 && timeToSeconds(lastPostion.TIME)- timeToSeconds(secondLast.TIME) <= 30){
 setStatus("Running")
 }
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


 React.useEffect(() => {
 console.log("i m in")
 const intervalId = setInterval(checkStatus, 30000);
 return () => {
 clearInterval(intervalId);
 };
 }, []);
 


 return (
 <div className="grid grid-cols-12 gap-4 md:gap-6">
 
 <div className="col-span-12 xl:col-span-6">
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5">
 {/* Metric Item Start */}
 <Card sx={{ 
 borderRadius: 3, 
 boxShadow: 3, 
 transform: "scale(0.8)", 
 width: '100%' // Ensure the Card takes full width of its container
 }}>
 <CardContent>
 <Box sx={{ paddingTop: "6px" }} display="flex" justifyContent="space-between" alignItems="center">
 <Typography sx={{ color: "black", fontSize: "1rem" }} variant="body2" color="text.secondary">
 Tractor Number
 </Typography>
 <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: "1.2rem" }}>
 HR 51 TC 2004/45/25
 </Typography>
 </Box>
 </CardContent>
 </Card>

 {/* Status Box */}
 {
 (date === today || !date) ? (
 <Box
 sx={{
 width: '85px', // Increased width for the status box
 padding: '4px 12px',
 margin: '20px',
 borderRadius: '12px',
 opacity: 0.9,
 ...getStatusStyle(status), // Assuming this is a function that dynamically adjusts styles
 }}
 >
 {status}
 </Box>
 ) : (
 <></> // This renders nothing when the condition is false
 )
 }
 </div>
 </div>


 {/* Date Picker & Select in One Row */}
 <div className="col-span-12 xl:col-span-6">
 <div style={{padding: "18px"}} className="grid grid-cols-1 gap-4 md:gap-6">
 <div>
 <Flatpickr
 options={{
 dateFormat: "Y-m-d", // Set the date format
 }}
 placeholder="Choose a date"
 className="w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md h-11 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
 onChange={handleDateChange} // Handle date change
 />
 </div>
 </div>
 </div>

 

 <div className="col-span-12 mt-5">
 {(date === today || !date) ? <LiveMap /> : <PathMap date={date} />}
 </div>
 {/* Demographics & Orders */}
 {/* <div className="col-span-12 xl:col-span-6">
 <GraphData newData={newData}/>
 </div> */}
 <div className="col-span-12 xl:col-span-7">
 {/* <RecentOrders /> */}
 </div>
 </div>
 );
}
