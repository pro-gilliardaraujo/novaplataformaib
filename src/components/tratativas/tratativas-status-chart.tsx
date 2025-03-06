"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface TratativasStatusChartProps {
  enviadas: number
  devolvidas: number
  canceladas: number
}

const COLORS = ["#FFBB28", "#00C49F", "#FF8042"]

export function TratativasStatusChart({
  enviadas,
  devolvidas,
  canceladas,
}: TratativasStatusChartProps) {
  const data = [
    { name: "Enviadas", value: enviadas },
    { name: "Devolvidas", value: devolvidas },
    { name: "Canceladas", value: canceladas },
  ].filter(item => item.value > 0)

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value, percent }) => 
              `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 