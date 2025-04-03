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

// Helper function to create data
function createData(
 id: number,
 tractor_name: string,
 tractor_number: string,
 distance: number,
 status: string,
) {
 return { id, tractor_name, tractor_number, distance, status };
}

// Sample data for the table
const rows = [
 createData(1, '35 Champion', 'HR51 B 5643', 98, 'Running'),
 createData(2, 'Steeltrac 15', 'HR 51 A 0002', 103, 'Stopped'),
 createData(3, 'Euro 24G', 'HR 51 A 0003', 88, 'Stopped'),
 createData(4, '439 RDX', 'HR 51 A 0004', 72, 'Stopped'),
];

export default function Dashboard() {
 const router = useRouter();

 const getStatusStyle = (status: string) => {
 switch (status) {
 case 'Running':
 return { backgroundColor: '#4caf50', color: 'white' }; // Green for Running
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
 Distance Covered
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
 <TableCell align="right">{row.distance}</TableCell>
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
 {row.status==="Running"?<Button
 onClick={() => {
 router.push(`/`); 
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