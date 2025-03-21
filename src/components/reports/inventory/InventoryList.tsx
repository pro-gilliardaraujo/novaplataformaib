"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Plus, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ItemEstoqueModal } from "@/components/estoque/ItemEstoqueModal"
import { DetalhesItemModal } from "@/components/estoque/DetalhesItemModal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

interface InventoryItem {
  id: string
  descricao: string
  codigo_fabricante: string
  quantidade_atual: number
  observacoes?: string
  category_id: string | undefined
  nivel_minimo?: number
  nivel_critico?: number
  alertas_ativos?: boolean
  categoria?: { id: string; nome: string }
  ultima_movimentacao?: string
  ultima_movimentacao_detalhes?: any
}

interface InventoryListProps {
  categorias: CategoriaItem[]
  settings: {
    showFilters: boolean
    showExport: boolean
    columns: string[]
  }
  onCategoriaCreated?: () => void
}

interface CategoriaItem {
  id: string
  nome: string
  cor?: string
}

interface FilterState {
  [key: string]: Set<string>
}

function FilterDropdown({
  title,
  options,
  selectedOptions,
  onOptionToggle,
  onClear,
}: {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (option: string) => void
  onClear: () => void
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4" side="bottom" sideOffset={5}>
        <div className="space-y-4">
          <h4 className="font-medium">Filtrar {title.toLowerCase()}</h4>
          <Input 
            placeholder={`Buscar ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="space-y-2 max-h-48 overflow-auto">
            {filteredOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedOptions.has(option)}
                  onCheckedChange={() => onOptionToggle(option)}
                />
                <label htmlFor={option} className="text-sm">
                  {option}
                </label>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={onClear}>
              Limpar
            </Button>
            <span className="text-sm text-muted-foreground">{selectedOptions.size} selecionados</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function InventoryList({ categorias, settings, onCategoriaCreated }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'codigo_fabricante', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const rowsPerPage = 15
  const { toast } = useToast()

  const columns = [
    { key: "codigo_fabricante", title: "Código" },
    { key: "descricao", title: "Descrição" },
    { key: "categoria", title: "Categoria" },
    { key: "quantidade_atual", title: "Quantidade" },
    { key: "nivel_minimo", title: "Nível Mínimo" },
    { key: "nivel_critico", title: "Nível Crítico" },
    { key: "ultima_movimentacao", title: "Última Movimentação" }
  ] as const

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "categoria") {
          acc[column.key] = categorias.map(cat => cat.nome)
        } else {
          acc[column.key] = Array.from(
            new Set(
              items
                .map((item) => {
                  if (column.key === "ultima_movimentacao" && item[column.key]) {
                    return format(new Date(item[column.key]!), "dd/MM/yyyy", { locale: ptBR })
                  }
                  return String(item[column.key as keyof InventoryItem])
                })
                .filter(Boolean)
            ),
          )
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [items, categorias])

  const fetchItems = async () => {
    try {
      setLoading(true)

      // Primeiro, buscar a última movimentação para cada item
      const { data: ultimasMovimentacoes, error: movError } = await supabase
        .from('movimentacoes_estoque')
        .select('*')
        .order('created_at', { ascending: false })

      if (movError) throw movError

      // Criar um mapa das últimas movimentações por item_id
      const ultimasMovimentacoesPorItem = ultimasMovimentacoes.reduce((acc, mov) => {
        if (!acc[mov.item_id]) {
          acc[mov.item_id] = mov
        }
        return acc
      }, {})

      // Buscar os itens
      const { data: items, error } = await supabase
        .from('itens_estoque')
        .select(`
          *,
          categoria:category_id (
            id,
            nome
          )
        `)
        .order('codigo_fabricante', { ascending: true })

      if (error) throw error

      // Combinar os dados
      const processedItems = items?.map(item => {
        const ultimaMovimentacao = ultimasMovimentacoesPorItem[item.id]
        return {
          ...item,
          ultima_movimentacao: ultimaMovimentacao?.created_at,
          ultima_movimentacao_detalhes: ultimaMovimentacao ? {
            data: ultimaMovimentacao.created_at,
            tipo: ultimaMovimentacao.tipo_movimentacao,
            quantidade: ultimaMovimentacao.quantidade,
            motivo: ultimaMovimentacao.motivo,
            responsavel: ultimaMovimentacao.responsavel,
            destino: ultimaMovimentacao.destino_movimentacao,
            frota: ultimaMovimentacao.frota_destino,
            nota_fiscal: ultimaMovimentacao.nota_fiscal
          } : undefined
        }
      })

      setItems(processedItems || [])
    } catch (error) {
      console.error('Error fetching items:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens do estoque",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleFilterToggle = (columnKey: string, option: string) => {
    setFilters((prevFilters) => {
      const newFilters = { ...prevFilters }
      const columnFilters = newFilters[columnKey] ? new Set(newFilters[columnKey]) : new Set<string>()

      if (columnFilters.has(option)) {
        columnFilters.delete(option)
      } else {
        columnFilters.add(option)
      }

      newFilters[columnKey] = columnFilters
      return newFilters
    })
  }

  const handleClearFilter = (columnKey: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: new Set<string>(),
    }))
  }

  const handleSort = (columnKey: string) => {
    setSortConfig(current => ({
      key: columnKey,
      direction: current.key === columnKey && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleExport = () => {
    const BOM = "\uFEFF"
    
    const escapeCsvCell = (cell: string | number) => {
      cell = String(cell).replace(/"/g, '""')
      return /[;\n"]/.test(cell) ? `"${cell}"` : cell
    }

    const headers = {
      codigo_fabricante: 'Código',
      descricao: 'Descrição',
      categoria: 'Categoria',
      quantidade_atual: 'Quantidade',
      nivel_minimo: 'Nível Mínimo',
      nivel_critico: 'Nível Crítico',
      ultima_movimentacao: 'Última Movimentação'
    }

    const csvRows = [
      // Headers
      Object.values(headers).join(';'),
      
      // Data rows
      ...filteredAndSortedData.map(item => [
        escapeCsvCell(item.codigo_fabricante),
        escapeCsvCell(item.descricao),
        escapeCsvCell(item.categoria?.nome || 'Sem Categoria'),
        escapeCsvCell(item.quantidade_atual),
        escapeCsvCell(item.nivel_minimo || ''),
        escapeCsvCell(item.nivel_critico || ''),
        escapeCsvCell(item.ultima_movimentacao 
          ? format(new Date(item.ultima_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })
          : '')
      ].join(';'))
    ].join('\r\n')

    const blob = new Blob([BOM + csvRows], { 
      type: 'text/csv;charset=utf-8' 
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `estoque_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredAndSortedData = useMemo(() => {
    let filtered = items.filter(row => {
      // Aplicar filtro de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          row.codigo_fabricante.toLowerCase().includes(searchLower) ||
          row.descricao.toLowerCase().includes(searchLower) ||
          row.categoria?.nome.toLowerCase().includes(searchLower)
        )
      }
      return true
    })

    // Aplicar filtros de coluna
    filtered = filtered.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        
        if (key === "categoria") {
          return row.categoria && selectedOptions.has(row.categoria.nome)
        }
        
        if (key === "ultima_movimentacao") {
          if (!row[key]) return selectedOptions.has("-")
          return selectedOptions.has(format(new Date(row[key]), "dd/MM/yyyy", { locale: ptBR }))
        }

        const value = row[key as keyof InventoryItem]
        return typeof value === "string" && selectedOptions.has(value)
      })
    )

    // Aplicar ordenação
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof InventoryItem]
        let bValue = b[sortConfig.key as keyof InventoryItem]

        if (sortConfig.key === "categoria") {
          aValue = a.categoria?.nome || ""
          bValue = b.categoria?.nome || ""
        }

        if (sortConfig.key === "ultima_movimentacao") {
          if (!aValue) return sortConfig.direction === "asc" ? -1 : 1
          if (!bValue) return sortConfig.direction === "asc" ? 1 : -1
          return sortConfig.direction === "asc"
            ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
            : new Date(bValue as string).getTime() - new Date(aValue as string).getTime()
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        }

        return 0
      })
    }

    return filtered
  }, [items, searchTerm, filters, sortConfig])

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="w-[400px]">
          <Input
            placeholder="Buscar por código, descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-black hover:bg-black/90 text-white h-9"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Item
          </Button>
          <Button variant="outline" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="text-white font-medium h-12">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span>{column.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-white hover:text-white"
                        onClick={() => handleSort(column.key)}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <FilterDropdown
                      title={column.title}
                      options={filterOptions[column.key] || []}
                      selectedOptions={filters[column.key] || new Set()}
                      onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                      onClear={() => handleClearFilter(column.key)}
                    />
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-white font-medium h-12 w-[100px] text-center">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8">
                  Carregando itens...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((item) => (
                  <TableRow key={item.id} className="h-[46px] hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="py-0">{item.codigo_fabricante}</TableCell>
                    <TableCell className="py-0">{item.descricao}</TableCell>
                    <TableCell className="py-0">{item.categoria?.nome || 'Sem Categoria'}</TableCell>
                    <TableCell className="py-0 text-right">{item.quantidade_atual}</TableCell>
                    <TableCell className="py-0">{item.nivel_minimo || '-'}</TableCell>
                    <TableCell className="py-0">{item.nivel_critico || '-'}</TableCell>
                    <TableCell className="py-0">
                      {item.ultima_movimentacao
                        ? format(new Date(item.ultima_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell className="py-0">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedItem(item)
                            setIsDetailsModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fill empty rows */}
                {paginatedData.length < rowsPerPage && (
                  Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-[46px] border-b border-gray-200">
                      {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                        <TableCell key={`empty-cell-${colIndex}`} className="py-0 border-x border-gray-100">&nbsp;</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t py-2 px-3 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + rowsPerPage, filteredAndSortedData.length)} de {filteredAndSortedData.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ItemEstoqueModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchItems}
        categorias={categorias}
      />

      {selectedItem && (
        <DetalhesItemModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          item={selectedItem}
          onSuccess={fetchItems}
          categorias={categorias}
        />
      )}
    </div>
  )
} 