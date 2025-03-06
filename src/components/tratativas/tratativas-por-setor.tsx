"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TratativasPorSetorProps {
  data: Record<string, number>
}

const COLORS = [
  "#4C51BF", // Indigo
  "#38A169", // Green
  "#D69E2E", // Yellow
  "#C53030", // Red
  "#805AD5", // Purple
  "#3182CE", // Blue
  "#DD6B20", // Orange
  "#2C7A7B"  // Teal
]

export function TratativasPorSetor({ data }: TratativasPorSetorProps) {
  const chartData = Object.entries(data)
    .map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value)

  const maxValue = Math.max(...chartData.map(item => item.value))
  const tickCount = maxValue <= 5 ? maxValue : 5

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis 
            type="number" 
            domain={[0, maxValue]}
            tickCount={tickCount + 1}
            ticks={Array.from({length: tickCount + 1}, (_, i) => Math.round(i * (maxValue / tickCount)))}
          />
          <YAxis 
            type="category" 
            dataKey="name"
            width={200}
            tick={props => (
              <text
                x={props.x - 5}
                y={props.y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill="#000"
              >
                {props.payload.value}
              </text>
            )}
          />
          <Tooltip 
            formatter={(value) => [value, 'Quantidade']}
          />
          <Bar 
            dataKey="value" 
            background={{ fill: '#f3f4f6' }}
            barSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 