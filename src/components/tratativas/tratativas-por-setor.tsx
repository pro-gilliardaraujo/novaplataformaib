"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface TratativasPorSetorProps {
  data: Record<string, number>
}

// Array de cores para os setores
const COLORS = [
  "#8884d8", // Roxo
  "#82ca9d", // Verde
  "#ffc658", // Amarelo
  "#ff7300", // Laranja
  "#0088fe", // Azul
  "#00C49F", // Verde água
  "#FFBB28", // Amarelo escuro
  "#FF8042", // Laranja escuro
  "#a4de6c", // Verde claro
  "#d0ed57"  // Verde limão
]

export function TratativasPorSetor({ data }: TratativasPorSetorProps) {
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Encontra o maior valor para definir o domínio do eixo X
  const maxValue = Math.max(...chartData.map(item => item.value))
  // Calcula o número de ticks necessários (sempre inteiros)
  const tickCount = maxValue + 1

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
            domain={[0, maxValue]}
            ticks={Array.from({ length: tickCount }, (_, i) => i)} // Força ticks inteiros
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            width={130}
            style={{ fontSize: '12px' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip formatter={(value) => [value, "Tratativas"]} />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 4, 4]}
            barSize={20}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
} 