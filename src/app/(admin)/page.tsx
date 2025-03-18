'use client'
import type { Metadata } from "next";
import { TractorDetails } from "@/components/ecommerce/TractorDetails";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import Select from "@/components/form/Select";
import Flatpickr from "react-flatpickr";
import 'flatpickr/dist/themes/material_blue.css';
import LiveMap from "@/components/map/LiveMap";

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      
      {/* Tractor Details (Two Cards in One Row) */}
      <div className="col-span-12 xl:col-span-6">
        <TractorDetails Heading1="Tractor Number" Heading2="Trips Done" Value1="HR51 B 5643" Value2="10" />
      </div>
      <div className="col-span-12 xl:col-span-6">
        <TractorDetails Heading1="Tractor Number" Heading2="Trips Done" Value1="HR51 B 5643" Value2="10" />
      </div>

      {/* Date Picker & Select in One Row */}
      <div className="col-span-12 xl:col-span-6">
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div>
            <Flatpickr
              options={{
                dateFormat: "Y-m-d", // Set the date format
              }}
              placeholder="Choose a date"
              className="w-full py-2 pl-3 pr-10 text-sm border border-gray-300 rounded-md h-11 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <Select
              options={[
                { value: "1", label: "Trip 1" },
                { value: "2", label: "Trip 2" },
              ]}
              placeholder="Select Trip"
              onChange={() => {}}
              defaultValue=""
            />
          </div>
        </div>
      </div>

      {/* Full-Width Statistics Chart */}
      <div className="col-span-6">
        {/* <StatisticsChart /> */}
        <LiveMap/>
      </div>

      {/* Demographics & Orders */}
      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>
      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}
