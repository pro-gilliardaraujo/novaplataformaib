"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface TratativasStatusChartProps {
  enviadas: number
  devolvidas: number
  canceladas: number
}

const COLORS = {
  enviadas: "#FFA500",  // Orange for "Em Andamento"
  devolvidas: "#22C55E", // Green for "Devolvidas"
  canceladas: "#EF4444"  // Red for "Canceladas"
}

export function TratativasStatusChart({ enviadas, devolvidas, canceladas }: TratativasStatusChartProps) {
  const data = [
    { name: "Em Andamento", value: enviadas },
    { name: "Devolvidas", value: devolvidas },
    { name: "Canceladas", value: canceladas }
  ]

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={Object.values(COLORS)[index]} 
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend 
            verticalAlign="middle" 
            align="right"
            layout="vertical"
            iconType="circle"
            wrapperStyle={{ paddingLeft: "10px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
} 