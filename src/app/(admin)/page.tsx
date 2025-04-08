"use client";
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Button, Typography } from '@mui/material';
import ViewIcon from '@mui/icons-material/RemoveRedEye';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/system';
import axios from 'axios';

// Helper function to create data
function createData(
 id: number,
 tractor_name: string,
 tractor_number: string,
 registered: string,
 distance: string,
 distanceToday: number,
 status: string,
 view: string
) {
 return { id, tractor_name, tractor_number,registered, distance, distanceToday, status , view};
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

// Sample data for the table

export default function Dashboard() {
 const router = useRouter();
 const [status, setStatus] = React.useState<string>("Stopped");
 const [tableData, setTableData] = React.useState<TableData[]>([]);
 const [totalDistance, setTotalDistance] = React.useState<number>(0)
 const [allData, setAllData] = React.useState<ChartData[]>([]);

 const rows = [
 createData(1, 'FT 45', 'HR 51 TC 2004/45/25','03/04/25',`${totalDistance}`, 3.30, `${status}`,"yes"),
 createData(2, 'FT 6065', 'HR 53 TC 2004/45/311','-','0', 0, 'Stopped','no'),
 createData(3, 'FT 6065', 'HR 51 TC 2004/45/330', '-','0',0 ,'Stopped','no'),
 createData(4, 'FT 6065', 'N/A', '-','0',0 ,'Stopped','no'),
 ];
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

 React.useEffect(() => {
 const fetchDetails = async () => {
 try {
 const res = await axios.get(`https://fdcserver.escortskubota.com/tripData/getTractorHistory/414`);
 console.log(res.data.resp)
 const totalDistance = res.data.resp.reduce((sum:number, item:any) => {
 return sum + parseFloat(item.distance);
 }, 0);
 setTableData(res.data.resp)
 setTotalDistance(totalDistance)
 }
 catch(err){
 console.log(err)
 }
 }
 
 fetchDetails(); 
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
 return (
 <Box sx={{ p: 3 }}>
 <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
 <Table sx={{ minWidth: 650 }} aria-label="tractor data table">
 <TableHead>
 <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
 <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Tractor Name
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Tractor Number
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Testing Initiated On
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Distance Travelled
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Distance Travelled Today
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>
 Status
 </TableCell>
 <TableCell align="right" sx={{ fontWeight: 'bold' }}>View</TableCell>
 </TableRow>
 </TableHead>

 <TableBody>
 {rows.map((row) => (
 <TableRow
 key={row.id}
 sx={{
 '&:last-child td, &:last-child th': { border: 0 },
 backgroundColor: row.id % 2 === 0 ? '#fafafa' : 'white', // Alternate row colors
 '&:hover': { backgroundColor: '#f1f1f1' }, // Hover effect
 }}
 >
 <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
 {row.id}
 </TableCell>
 <TableCell align="right">{row.tractor_name}</TableCell>
 <TableCell align="right">{row.tractor_number}</TableCell>
 <TableCell align="right">{row.registered}</TableCell>
 <TableCell align="right">{row.distance} km</TableCell>
 <TableCell align="right">{row.distanceToday} km</TableCell>
 <TableCell align="right">
 <Box
 sx={{
 display: 'inline-block',
 padding: '4px 12px',
 borderRadius: '12px',
 opacity: 0.9,
 ...getStatusStyle(row.status), // Apply dynamic styles
 }}
 >
 {row.status}
 </Box>
 </TableCell>
 <TableCell align="right">
 {row.view==="yes"?<Button
 onClick={() => {
 router.push(`/tracking`); 
 }}
 variant="contained"
 color="primary"
 startIcon={<ViewIcon />}
 sx={{
 padding: '6px 16px',
 borderRadius: '4px',
 '&:hover': {
 backgroundColor: '#1565c0',
 },
 }}
 >
 View
 </Button>:<></>}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>
 </Box>
 );
}