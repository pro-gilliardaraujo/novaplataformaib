import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface TratativasPorSetorProps {
  data: Record<string, number>
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#a4de6c",
  "#d0ed57",
]

export function TratativasPorSetor({ data }: TratativasPorSetorProps) {
  const chartData = Object.entries(data).map(([name, value], index) => ({
    name,
    quantidade: value,
    fill: COLORS[index % COLORS.length],
  }))

  const maxValue = Math.max(...chartData.map((item) => item.quantidade))

  const generateTicks = (max: number) => {
    const tickCount = Math.min(max, 5)
    return Array.from({ length: tickCount + 1 }, (_, i) => Math.floor(i * (max / tickCount)))
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">Tratativas por Setor</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis
              type="number"
              domain={[0, maxValue]}
              ticks={generateTicks(maxValue)}
              allowDecimals={false}
              fontSize={10}
            />
            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value, name, props) => [`${value} Tratativas`, props.payload.name]}
              labelFormatter={(label) => `Setor: ${label}`}
            />
            <Bar dataKey="quantidade" name="Quantidade de Tratativas" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

