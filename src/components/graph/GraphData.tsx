import React, { PureComponent } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';

const data = [
  {
    name: 'Page A',
    fuel: 4000,
    speed: 2400,
    RPM: 2400,
  },
  {
    name: 'Page B',
    fuel: 3000,
    speed: 1398,
    RPM: 2210,
  },
  {
    name: 'Page C',
    fuel: 2000,
    speed: 9800,
    RPM: 2290,
  },
  {
    name: 'Page D',
    fuel: 2780,
    speed: 3908,
    RPM: 2000,
  },
  {
    name: 'Page E',
    fuel: 1890,
    speed: 4800,
    RPM: 2181,
  },
  {
    name: 'Page F',
    fuel: 2390,
    speed: 3800,
    RPM: 2500,
  },
  {
    name: 'Page G',
    fuel: 3490,
    speed: 4300,
    RPM: 2100,
  },
];

export default class GraphData extends PureComponent {
//   static demoUrl = 'https://codesandbox.io/p/sandbox/synchronized-line-charts-37rhmf';

  render() {
    return (
      <div style={{ width: '100%' }}>

        <h2 style={{fontSize:'25px', color:'gray'}}>Fuel Level-79%</h2>

        <ResponsiveContainer width="100%" height={200} style={{marginBottom:'20px'}}>
          <LineChart
            width={500}
            height={200}
            data={data}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="fuel" stroke="#8884d8" fill="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
        <h2 style={{fontSize:'25px', color:'gray'}}>Speed-38km/h</h2>
        <ResponsiveContainer width="100%" height={200} style={{marginBottom:'20px'}}>
          <LineChart
            width={500}
            height={200}
            data={data}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="speed" stroke="#82ca9d" fill="#82ca9d" />
            
          </LineChart>
        </ResponsiveContainer>

        <h2 style={{fontSize:'25px', color:'gray'}}>RPM-2200</h2>
        <ResponsiveContainer width="100%" height={200} style={{marginBottom:'20px'}}>
          <AreaChart
            width={500}
            height={200}
            data={data}
            syncId="anyId"
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="speed" stroke="#82ca9d" fill="#82ca9d" />
            <Brush 
             height={20}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
