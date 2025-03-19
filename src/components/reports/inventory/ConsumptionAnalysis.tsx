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
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ConsumptionAnalysisProps {
  settings: {
    showFilters: boolean
    showExport: boolean
    showCharts: boolean
    columns: string[]
  }
}

interface ConsumptionData {
  id: string
  descricao: string
  codigo_fabricante: string
  categoria?: {
    nome: string
  }
  consumo_total: number
  consumo_medio: number
  consumo_mensal: {
    mes: string
    quantidade: number
  }[]
  ultima_movimentacao?: string
}

export function ConsumptionAnalysis({ settings }: ConsumptionAnalysisProps) {
  const [items, setItems] = useState<ConsumptionData[]>([])
  const [filteredItems, setFilteredItems] = useState<ConsumptionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([])
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date())
  })
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

        // Load consumption data
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
          .gte('created_at', dateRange.from?.toISOString())
          .lte('created_at', (dateRange.to || new Date()).toISOString())
          .order('created_at')

        if (movimentacoesError) throw movimentacoesError

        // Process data to calculate consumption by item
        const consumptionByItem = new Map<string, ConsumptionData>()

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
              consumo_total: 0,
              consumo_medio: 0,
              consumo_mensal: [],
              ultima_movimentacao: mov.created_at
            }
            consumptionByItem.set(itemId, itemData)
          }

          // Update total consumption
          itemData.consumo_total += mov.quantidade

          // Update monthly consumption
          const monthData = itemData.consumo_mensal.find(m => m.mes === monthKey)
          if (monthData) {
            monthData.quantidade += mov.quantidade
          } else {
            itemData.consumo_mensal.push({
              mes: monthKey,
              quantidade: mov.quantidade
            })
          }

          // Update last movement date if more recent
          if (mov.created_at > itemData.ultima_movimentacao!) {
            itemData.ultima_movimentacao = mov.created_at
          }
        })

        // Calculate average consumption
        const months = dateRange.from && dateRange.to
          ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24 * 30))
          : 1

        const processedItems = Array.from(consumptionByItem.values()).map(item => ({
          ...item,
          consumo_medio: Number((item.consumo_total / months).toFixed(2))
        }))

        setItems(processedItems)
        setFilteredItems(processedItems)
      } catch (error) {
        console.error('Erro ao carregar dados de consumo:', error)
        setError('Não foi possível carregar os dados de consumo.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [dateRange])

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
      consumo_total: 'Consumo Total',
      consumo_medio: 'Consumo Médio Mensal',
      ultima_movimentacao: 'Última Movimentação'
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
            case 'consumo_total':
              return item.consumo_total
            case 'consumo_medio':
              return item.consumo_medio
            case 'ultima_movimentacao':
              return item.ultima_movimentacao 
                ? format(new Date(item.ultima_movimentacao), "dd/MM/yyyy HH:mm")
                : 'Nunca'
            default:
              return ''
          }
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analise_consumo_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.csv`
    link.click()
  }

  const handleDateRangeChange = (value: DateRange | undefined) => {
    if (value) {
      setDateRange(value)
    }
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
          <div className="w-full sm:w-[300px]">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consumo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredItems.reduce((acc, item) => acc + item.consumo_total, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média de Consumo Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(filteredItems.reduce((acc, item) => acc + item.consumo_medio, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {settings.showCharts && selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle>Consumo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={items.find(i => i.id === selectedItem)?.consumo_mensal.map(m => ({
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
                    name="Quantidade"
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
              {settings.columns.includes('consumo_total') && (
                <TableHead className="text-right">Consumo Total</TableHead>
              )}
              {settings.columns.includes('consumo_medio') && (
                <TableHead className="text-right">Consumo Médio</TableHead>
              )}
              {settings.columns.includes('ultima_movimentacao') && (
                <TableHead>Última Movimentação</TableHead>
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
                  {settings.columns.includes('consumo_total') && (
                    <TableCell className="text-right font-medium">
                      {item.consumo_total}
                    </TableCell>
                  )}
                  {settings.columns.includes('consumo_medio') && (
                    <TableCell className="text-right">
                      {item.consumo_medio}
                    </TableCell>
                  )}
                  {settings.columns.includes('ultima_movimentacao') && (
                    <TableCell>
                      {item.ultima_movimentacao
                        ? format(new Date(item.ultima_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : 'Nunca'}
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