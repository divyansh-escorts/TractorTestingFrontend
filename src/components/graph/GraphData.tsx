  import React, { useState, useEffect } from 'react';
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

  const GraphData: React.FC<GraphDataProps> = ({ newData }) => {
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

    return (
      <div style={{ width: '100%' }}>
        <h2 style={{ fontSize: '25px', color: 'gray' }}>Fuel Level</h2>
        <ResponsiveContainer width="100%" height={200} style={{ marginBottom: '20px' }}>
          <LineChart data={data} syncId="fuelChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="TIME" />
            <YAxis
              label={{ value: 'Fuel (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
              tickCount={6}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="FUEL_LEVEL"
              stroke="#8884d8"
              fill="#8884d8"
              isAnimationActive={false}
              animationDuration={0}
            />
          </LineChart>
        </ResponsiveContainer>

        <h2 style={{ fontSize: '25px', color: 'gray' }}>Speed</h2>
        <ResponsiveContainer width="100%" height={200} style={{ marginBottom: '20px' }}>
          <LineChart data={data} syncId="speedChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="TIME" />
            <YAxis
              label={{ value: 'km/h', angle: -90, position: 'insideLeft' }}
              domain={[0, 60]}
              tickCount={6}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="SPEED"
              stroke="#82ca9d"
              fill="#82ca9d"
              isAnimationActive={false}
              animationDuration={0}
            />
          </LineChart>
        </ResponsiveContainer>

        <h2 style={{ fontSize: '25px', color: 'gray' }}>RPM</h2>
        <ResponsiveContainer width="100%" height={200} style={{ marginBottom: '20px' }}>
          <AreaChart data={data} syncId="rpmChart" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="TIME" />
            <YAxis
              label={{ value: 'RPM', angle: -90, position: 'insideLeft' }}
              domain={[0, 3000]}
              tickCount={6}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="ENGINE_RPM"
              stroke="#82ca9d"
              fill="#82ca9d"
              isAnimationActive={false}
              animationDuration={0}
            />
            <Brush
              height={20}
              startIndex={brushIndices.startIndex} // Set the initial start index for the Brush
              onChange={handleBrushChange} // Handle change in Brush position
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  export default GraphData;
