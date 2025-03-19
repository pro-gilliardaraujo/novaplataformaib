"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Download, Search } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DemandForecastProps {
  settings: {
    showFilters: boolean
    showExport: boolean
    showCharts: boolean
    columns: string[]
  }
}

interface ForecastData {
  id: string
  descricao: string
  codigo_fabricante: string
  categoria?: {
    nome: string
  }
  consumo_total: number
  consumo_medio: number
  previsao_proximos_meses: {
    mes: string
    quantidade: number
  }[]
  ultima_movimentacao?: string
}

export function DemandForecast({ settings }: DemandForecastProps) {
  const [items, setItems] = useState<ForecastData[]>([])
  const [filteredItems, setFilteredItems] = useState<ForecastData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([])
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Load categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categorias_item')
          .select('id, nome')
          .order('nome')

        if (categoriesError) throw categoriesError
        setCategories(categoriesData || [])

        // Load consumption data for the last 6 months
        const startDate = startOfMonth(subMonths(new Date(), 5))
        const { data: movimentacoesData, error: movimentacoesError } = await supabase
          .from('historico_estoque')
          .select(`
            id,
            tipo_movimentacao,
            quantidade,
            created_at,
            item:item_id (
              id,
              descricao,
              codigo_fabricante,
              categoria:category_id (
                nome
              )
            )
          `)
          .eq('tipo_movimentacao', 'saida')
          .gte('created_at', startDate.toISOString())
          .order('created_at')

        if (movimentacoesError) throw movimentacoesError

        // Process data to calculate consumption by item
        const consumptionByItem = new Map<string, {
          id: string
          descricao: string
          codigo_fabricante: string
          categoria?: { nome: string }
          consumo_mensal: Map<string, number>
          ultima_movimentacao?: string
        }>()

        movimentacoesData.forEach(mov => {
          const item = mov.item[0]
          if (!item) return

          const itemId = item.id
          const movDate = new Date(mov.created_at)
          const monthKey = format(movDate, 'yyyy-MM')

          let itemData = consumptionByItem.get(itemId)
          if (!itemData) {
            itemData = {
              id: item.id,
              descricao: item.descricao,
              codigo_fabricante: item.codigo_fabricante,
              categoria: item.categoria?.[0],
              consumo_mensal: new Map(),
              ultima_movimentacao: mov.created_at
            }
            consumptionByItem.set(itemId, itemData)
          }

          // Update monthly consumption
          const currentAmount = itemData.consumo_mensal.get(monthKey) || 0
          itemData.consumo_mensal.set(monthKey, currentAmount + mov.quantidade)

          // Update last movement date if more recent
          if (mov.created_at > itemData.ultima_movimentacao!) {
            itemData.ultima_movimentacao = mov.created_at
          }
        })

        // Calculate forecasts
        const processedItems: ForecastData[] = []

        consumptionByItem.forEach((itemData) => {
          // Convert monthly consumption to array and sort by date
          const monthlyData = Array.from(itemData.consumo_mensal.entries())
            .map(([month, quantity]) => ({
              month,
              quantity
            }))
            .sort((a, b) => a.month.localeCompare(b.month))

          // Calculate total and average consumption
          const consumo_total = monthlyData.reduce((acc, m) => acc + m.quantity, 0)
          const consumo_medio = consumo_total / monthlyData.length

          // Calculate trend
          let trend = 0
          if (monthlyData.length > 1) {
            const xMean = (monthlyData.length - 1) / 2
            const yMean = consumo_medio
            let numerator = 0
            let denominator = 0

            monthlyData.forEach((data, i) => {
              numerator += (i - xMean) * (data.quantity - yMean)
              denominator += Math.pow(i - xMean, 2)
            })

            trend = denominator !== 0 ? numerator / denominator : 0
          }

          // Generate forecast for next 3 months
          const lastMonth = new Date(monthlyData[monthlyData.length - 1].month)
          const previsao_proximos_meses = Array.from({ length: 3 }, (_, i) => {
            const forecastMonth = addMonths(lastMonth, i + 1)
            const monthKey = format(forecastMonth, 'yyyy-MM')
            const forecastValue = Math.max(0, Math.round(consumo_medio + trend * (monthlyData.length + i)))

            return {
              mes: monthKey,
              quantidade: forecastValue
            }
          })

          processedItems.push({
            ...itemData,
            consumo_total,
            consumo_medio,
            previsao_proximos_meses
          })
        })

        setItems(processedItems)
        setFilteredItems(processedItems)
      } catch (error) {
        console.error('Erro ao carregar dados de previsão:', error)
        setError('Não foi possível carregar os dados de previsão.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    let filtered = [...items]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.descricao.toLowerCase().includes(searchLower) ||
        item.codigo_fabricante.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.categoria?.nome === categoryFilter)
    }

    setFilteredItems(filtered)
  }, [searchTerm, categoryFilter, items])

  const handleExport = () => {
    const headers = {
      codigo_fabricante: 'Código do Fabricante',
      descricao: 'Descrição',
      categoria: 'Categoria',
      consumo_medio: 'Consumo Médio',
      previsao_1: 'Previsão Mês 1',
      previsao_2: 'Previsão Mês 2',
      previsao_3: 'Previsão Mês 3'
    }

    const csvContent = [
      // Headers
      settings.columns.map(col => headers[col as keyof typeof headers]).join(','),
      // Data rows
      ...filteredItems.map(item => 
        settings.columns.map(col => {
          switch (col) {
            case 'codigo_fabricante':
              return `"${item.codigo_fabricante}"`
            case 'descricao':
              return `"${item.descricao}"`
            case 'categoria':
              return `"${item.categoria?.nome || 'Sem Categoria'}"`
            case 'consumo_medio':
              return item.consumo_medio.toFixed(2)
            case 'previsao_1':
              return item.previsao_proximos_meses[0]?.quantidade || 0
            case 'previsao_2':
              return item.previsao_proximos_meses[1]?.quantidade || 0
            case 'previsao_3':
              return item.previsao_proximos_meses[2]?.quantidade || 0
            default:
              return ''
          }
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `previsao_demanda_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.csv`
    link.click()
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {settings.showFilters && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.nome}>
                    {category.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {settings.showExport && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      )}

      {settings.showCharts && selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>Previsão de Consumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={items.find(i => i.id === selectedItem)?.previsao_proximos_meses.map(m => ({
                    mes: format(new Date(m.mes), 'MMM/yy', { locale: ptBR }),
                    quantidade: m.quantidade
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="quantidade"
                    name="Quantidade Prevista"
                    stroke="#1e293b"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {settings.columns.includes('codigo_fabricante') && (
                <TableHead>Código</TableHead>
              )}
              {settings.columns.includes('descricao') && (
                <TableHead>Descrição</TableHead>
              )}
              {settings.columns.includes('categoria') && (
                <TableHead>Categoria</TableHead>
              )}
              {settings.columns.includes('consumo_medio') && (
                <TableHead className="text-right">Consumo Médio</TableHead>
              )}
              {settings.columns.includes('previsao_1') && (
                <TableHead className="text-right">Previsão Mês 1</TableHead>
              )}
              {settings.columns.includes('previsao_2') && (
                <TableHead className="text-right">Previsão Mês 2</TableHead>
              )}
              {settings.columns.includes('previsao_3') && (
                <TableHead className="text-right">Previsão Mês 3</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={settings.columns.length} 
                  className="text-center h-32"
                >
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow 
                  key={item.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedItem === item.id ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                >
                  {settings.columns.includes('codigo_fabricante') && (
                    <TableCell>{item.codigo_fabricante}</TableCell>
                  )}
                  {settings.columns.includes('descricao') && (
                    <TableCell>{item.descricao}</TableCell>
                  )}
                  {settings.columns.includes('categoria') && (
                    <TableCell>{item.categoria?.nome || 'Sem Categoria'}</TableCell>
                  )}
                  {settings.columns.includes('consumo_medio') && (
                    <TableCell className="text-right">
                      {item.consumo_medio.toFixed(2)}
                    </TableCell>
                  )}
                  {settings.columns.includes('previsao_1') && (
                    <TableCell className="text-right">
                      {item.previsao_proximos_meses[0]?.quantidade || 0}
                    </TableCell>
                  )}
                  {settings.columns.includes('previsao_2') && (
                    <TableCell className="text-right">
                      {item.previsao_proximos_meses[1]?.quantidade || 0}
                    </TableCell>
                  )}
                  {settings.columns.includes('previsao_3') && (
                    <TableCell className="text-right">
                      {item.previsao_proximos_meses[2]?.quantidade || 0}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 