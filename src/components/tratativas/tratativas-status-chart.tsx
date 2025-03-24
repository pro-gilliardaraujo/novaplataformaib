"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface TratativasStatusChartProps {
  enviadas: number
  devolvidas: number
  canceladas: number
  confirmar: number
}

const COLORS = {
  enviadas: "#FFA500",  // Orange for "Em Andamento"
  devolvidas: "#22C55E", // Green for "Devolvidas"
  canceladas: "#EF4444",  // Red for "Canceladas"
  confirmar: "#F97316"   // Orange for "À Confirmar"
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }: any) => {
  const radius = outerRadius * 1.2
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="black"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${name}: ${value}`}
    </text>
  )
}

export function TratativasStatusChart({ enviadas, devolvidas, canceladas, confirmar }: TratativasStatusChartProps) {
  const data = [
    { name: "Em Andamento", value: enviadas },
    { name: "Devolvidas", value: devolvidas },
    { name: "Canceladas", value: canceladas },
    { name: "À Confirmar", value: confirmar }
  ]

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={5}
            dataKey="value"
            label={renderCustomizedLabel}
            labelLine={true}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={Object.values(COLORS)[index]} 
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, "Tratativas"]} />
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