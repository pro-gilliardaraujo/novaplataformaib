import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface TratativasStatusChartProps {
  enviadas: number
  devolvidas: number
  canceladas: number
}

const COLORS = ["#FFBB28", "#00C49F", "#FF8042"]

export function TratativasStatusChart({ enviadas, devolvidas, canceladas }: TratativasStatusChartProps) {
  const data = [
    { name: "Enviadas", value: enviadas },
    { name: "Devolvidas", value: devolvidas },
    { name: "Canceladas", value: canceladas },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">Status das Tratativas</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry, index) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

