"use client"
import { TractorDetails } from "@/components/ecommerce/TractorDetails";
import React, { useEffect, useState } from "react";
// import Flatpickr from "react-flatpickr";
import 'flatpickr/dist/themes/material_blue.css';
// import LiveMap from "@/components/map/LiveMap";
// import PathMap from "@/components/map/pathMap";
import dynamic from "next/dynamic";


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
export default function Ecommerce() {
  const [newData, setNewData] = useState<Data>(Object);
  const[ date, setDate] = useState<string>('')
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  const handleDateChange = (date: any) => {
    const selectedDate = new Date(date[0]);  // Get the selected date
    selectedDate.setDate(selectedDate.getDate() + 1);  // Increase by 1 day
  
    // Format the date as YYYY-MM-DD
    const newDate = selectedDate.toISOString().split('T')[0]; 
    
    console.log(newDate);
    setDate(newDate);  // Set the updated date
  };
  
  useEffect(() => {
    // You can also check and update the date if necessary
    setToday(new Date().toISOString().split('T')[0]);
    console.log(new Date().toISOString().split('T')[0])
  }, []);

  useEffect(() => {
    if(typeof window!=='undefined'){
    const socket = new WebSocket("ws://localhost:8080"); // Change to your WebSocket server

    socket.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.onmessage = (event) => {
      try {
        console.log(event)
        const res = JSON.parse(event?.data);
        console.log(res)
        setNewData(res)
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
  }
  }, []);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      
      <div className="col-span-12 xl:col-span-6">
            <TractorDetails 
              Heading1="Tractor Number" 
              Heading2="Trips Done" 
              Value1="HR51 B 5643" 
              Value2="10" 
            />
          </div>

          {/* Date Picker & Select in One Row */}
          <div className="col-span-12 xl:col-span-6">
            <div className="grid grid-cols-1 gap-4 md:gap-6">
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

      

      <div className="col-span-12  mt-5">
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
