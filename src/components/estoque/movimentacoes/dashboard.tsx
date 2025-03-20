import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Movimentacao } from "@/types/movimentacoes"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate } from "@/lib/utils"

interface MovimentacoesDashboardProps {
  movimentacoes: Movimentacao[]
}

export function MovimentacoesDashboard({ movimentacoes }: MovimentacoesDashboardProps) {
  // Calcular estatísticas
  const totalEntradas = movimentacoes.filter(m => m.tipo_movimentacao === 'entrada').length
  const totalSaidas = movimentacoes.filter(m => m.tipo_movimentacao === 'saida').length
  
  // Preparar dados para o gráfico
  const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  const dadosGrafico = ultimos7Dias.map(data => {
    const movimentacoesDoDia = movimentacoes.filter(m => 
      formatDate(m.created_at).split(' ')[0] === formatDate(data).split(' ')[0]
    )
    
    return {
      data: formatDate(data).split(' ')[0],
      entradas: movimentacoesDoDia.filter(m => m.tipo_movimentacao === 'entrada').length,
      saidas: movimentacoesDoDia.filter(m => m.tipo_movimentacao === 'saida').length
    }
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{movimentacoes.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEntradas}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSaidas}</div>
        </CardContent>
      </Card>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Movimentações nos Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="entradas" name="Entradas" fill="#4ade80" />
              <Bar dataKey="saidas" name="Saídas" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
} 