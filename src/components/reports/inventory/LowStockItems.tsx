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
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface LowStockItemsProps {
  settings: {
    showFilters: boolean
    showExport: boolean
    columns: string[]
  }
}

interface LowStockItem {
  id: string
  descricao: string
  codigo_fabricante: string
  quantidade_atual: number
  nivel_minimo: number
  nivel_critico: number
  ultima_movimentacao?: string
  categoria?: {
    nome: string
  }
}

export function LowStockItems({ settings }: LowStockItemsProps) {
  const [items, setItems] = useState<LowStockItem[]>([])
  const [filteredItems, setFilteredItems] = useState<LowStockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [categories, setCategories] = useState<{ id: string; nome: string }[]>([])

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

        // Load items with low stock
        const { data: itemsData, error: itemsError } = await supabase
          .from('items_estoque')
          .select(`
            id,
            descricao,
            codigo_fabricante,
            quantidade_atual,
            nivel_minimo,
            nivel_critico,
            categoria:category_id (
              nome
            ),
            ultima_movimentacao:historico_estoque (
              created_at
            )
          `)
          .or('quantidade_atual.lte.nivel_minimo,quantidade_atual.lte.nivel_critico')
          .not('nivel_minimo', 'is', null)
          .order('quantidade_atual')

        if (itemsError) throw itemsError

        // Process items to get the latest movement date
        const processedItems = (itemsData || []).map(item => ({
          id: item.id,
          descricao: item.descricao,
          codigo_fabricante: item.codigo_fabricante,
          quantidade_atual: item.quantidade_atual,
          nivel_minimo: item.nivel_minimo,
          nivel_critico: item.nivel_critico,
          categoria: item.categoria?.[0],
          ultima_movimentacao: item.ultima_movimentacao?.[0]?.created_at
        })) as LowStockItem[]

        setItems(processedItems)
        setFilteredItems(processedItems)
      } catch (error) {
        console.error('Erro ao carregar itens:', error)
        setError('Não foi possível carregar a lista de itens.')
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

    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(item => {
        if (levelFilter === "critico") {
          return item.quantidade_atual <= item.nivel_critico
        } else {
          return item.quantidade_atual <= item.nivel_minimo && 
                 item.quantidade_atual > item.nivel_critico
        }
      })
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.categoria?.nome === categoryFilter)
    }

    setFilteredItems(filtered)
  }, [searchTerm, levelFilter, categoryFilter, items])

  const handleExport = () => {
    const headers = {
      codigo_fabricante: 'Código do Fabricante',
      descricao: 'Descrição',
      categoria: 'Categoria',
      quantidade_atual: 'Quantidade Atual',
      nivel_minimo: 'Nível Mínimo',
      nivel_critico: 'Nível Crítico',
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
            case 'quantidade_atual':
              return item.quantidade_atual
            case 'nivel_minimo':
              return item.nivel_minimo
            case 'nivel_critico':
              return item.nivel_critico
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
    link.download = `estoque_baixo_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
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
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os níveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="minimo">Nível Mínimo</SelectItem>
                <SelectItem value="critico">Nível Crítico</SelectItem>
              </SelectContent>
            </Select>
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
              {settings.columns.includes('quantidade_atual') && (
                <TableHead className="text-right">Quantidade</TableHead>
              )}
              {settings.columns.includes('nivel_minimo') && (
                <TableHead className="text-right">Nível Mínimo</TableHead>
              )}
              {settings.columns.includes('nivel_critico') && (
                <TableHead className="text-right">Nível Crítico</TableHead>
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
                <TableRow key={item.id}>
                  {settings.columns.includes('codigo_fabricante') && (
                    <TableCell>{item.codigo_fabricante}</TableCell>
                  )}
                  {settings.columns.includes('descricao') && (
                    <TableCell>{item.descricao}</TableCell>
                  )}
                  {settings.columns.includes('categoria') && (
                    <TableCell>{item.categoria?.nome || 'Sem Categoria'}</TableCell>
                  )}
                  {settings.columns.includes('quantidade_atual') && (
                    <TableCell className="text-right">
                      <span className={
                        item.quantidade_atual <= item.nivel_critico
                          ? 'text-red-600 font-medium'
                          : 'text-yellow-600 font-medium'
                      }>
                        {item.quantidade_atual}
                      </span>
                    </TableCell>
                  )}
                  {settings.columns.includes('nivel_minimo') && (
                    <TableCell className="text-right">{item.nivel_minimo}</TableCell>
                  )}
                  {settings.columns.includes('nivel_critico') && (
                    <TableCell className="text-right">{item.nivel_critico}</TableCell>
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