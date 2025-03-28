"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

interface TractorDetails {
  Heading1: string;
  Heading2: string;
  Value1: string;
  Value2: string;
}

export const TractorDetails = (props: TractorDetails) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
        <div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {props?.Heading1}
            </span>
            <h4 className="font-bold text-gray-800 text-xl dark:text-white/90">
              {props?.Value1}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
        <div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {props?.Heading2}
            </span>
            <h4 className="font-bold text-gray-800 text-xl dark:text-white/90">
              {props?.Value2}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
