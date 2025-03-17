"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TratativasPorSetorProps {
  data: Record<string, number>
}

export function TratativasPorSetor({ data }: TratativasPorSetorProps) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 140, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number"
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={130}
            style={{ fontSize: '12px' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Bar 
            dataKey="value" 
            fill="#8884d8"
            radius={[4, 4, 4, 4]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 