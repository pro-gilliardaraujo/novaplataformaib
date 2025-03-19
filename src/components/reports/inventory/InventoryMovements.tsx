"use client"

import { useState, useEffect, useMemo } from "react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Download, Search, ArrowLeftRight, Filter, ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw, Eye, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { addDays } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/useAuth"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface InventoryMovementsProps {
  settings: {
    showFilters: boolean
    showExport: boolean
    showDateRange: boolean
    columns: string[]
  }
}

interface Movement {
  id: string
  created_at: string
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste'
  motivo: string
  quantidade: number
  observacoes?: string
  item: {
    descricao: string
    codigo_fabricante: string
  }
  responsavel: string
  destino_movimentacao?: string | null
  frota_destino?: string | null
  nota_fiscal?: string | null
}

interface FilterState {
  [key: string]: Set<string>
}

const MOTIVOS = {
  compra: 'Compra',
  devolucao: 'Devolução',
  uso: 'Uso em Operação',
  perda: 'Perda/Avaria',
  inventario: 'Ajuste de Inventário',
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
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Filter className="h-3.5 w-3.5" />
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

export function InventoryMovements({ settings }: InventoryMovementsProps) {
  const { user } = useAuth()
  const [movements, setMovements] = useState<Movement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' })
  const rowsPerPage = 15
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null)

  const columns = [
    { key: "data", title: "Data", sortable: true, className: "text-center" },
    { key: "item", title: "Item", sortable: true },
    { key: "codigo", title: "Código", sortable: true },
    { key: "tipo", title: "Tipo", sortable: true, className: "text-center" },
    { key: "motivo", title: "Motivo", sortable: true, className: "text-center" },
    { key: "origem", title: "Origem", sortable: false, className: "text-center" },
    { key: "quantidade", title: "Quantidade", sortable: true, className: "text-right", headerClassName: "text-center" },
    { key: "responsavel", title: "Responsável", sortable: true, className: "text-center" },
    { key: "acoes", title: "Ações", sortable: false, className: "text-center w-[100px]" }
  ].filter(col => settings.columns.includes(col.key) || col.key === 'acoes')

  const loadMovements = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('movimentacoes_estoque')
        .select(`
          id,
          created_at,
          tipo_movimentacao,
          motivo,
          quantidade,
          observacoes,
          responsavel,
          destino_movimentacao,
          frota_destino,
          nota_fiscal,
          item:itens_estoque!inner (
            descricao,
            codigo_fabricante
          )
        `)

      if (selectedDate) {
        const startOfDay = new Date(selectedDate + 'T00:00:00-03:00')
        const endOfDay = new Date(selectedDate + 'T23:59:59.999-03:00')

        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString())
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      const transformedData = (data || []).map(item => {
        const itemData = Array.isArray(item.item) ? item.item[0] : item.item
        return {
          ...item,
          item: {
            descricao: itemData.descricao,
            codigo_fabricante: itemData.codigo_fabricante
          }
        }
      }) as Movement[]

      setMovements(transformedData)
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
      setError('Não foi possível carregar as movimentações.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [selectedDate])

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
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnKey]: new Set<string>(),
    }))
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque')
        .select(`
          id,
          created_at,
          tipo_movimentacao,
          motivo,
          quantidade,
          observacoes,
          responsavel,
          destino_movimentacao,
          frota_destino,
          nota_fiscal,
          item:itens_estoque!inner (
            descricao,
            codigo_fabricante
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to match the Movement interface
      const transformedData = (data || []).map(item => {
        const itemData = Array.isArray(item.item) ? item.item[0] : item.item
        return {
          ...item,
          item: {
            descricao: itemData.descricao,
            codigo_fabricante: itemData.codigo_fabricante
          }
        }
      }) as Movement[]

      setMovements(transformedData)
    } catch (error) {
      console.error('Erro ao atualizar movimentações:', error)
      setError('Não foi possível atualizar as movimentações.')
    } finally {
      setIsLoading(false)
    }
  }

  const filterOptions = useMemo(() => {
    return {
      tipo: ['Entrada', 'Saída', 'Ajuste'],
      motivo: Object.values(MOTIVOS),
      responsavel: Array.from(new Set(movements.map(m => m.responsavel))),
      item: Array.from(new Set(movements.map(m => m.item.descricao))),
      codigo: Array.from(new Set(movements.map(m => m.item.codigo_fabricante))),
    }
  }, [movements])

  const filteredAndSortedData = useMemo(() => {
    let filtered = movements

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(mov =>
        mov.item.descricao.toLowerCase().includes(searchLower) ||
        mov.item.codigo_fabricante.toLowerCase().includes(searchLower) ||
        mov.responsavel.toLowerCase().includes(searchLower)
      )
    }

    // Apply column filters
    filtered = filtered.filter(mov =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        switch (key) {
          case 'tipo':
            const tipo = mov.tipo_movimentacao === 'entrada' ? 'Entrada' :
                        mov.tipo_movimentacao === 'saida' ? 'Saída' : 'Ajuste'
            return selectedOptions.has(tipo)
          case 'motivo':
            return selectedOptions.has(MOTIVOS[mov.motivo as keyof typeof MOTIVOS])
          case 'responsavel':
            return selectedOptions.has(mov.responsavel)
          case 'item':
            return selectedOptions.has(mov.item.descricao)
          case 'codigo':
            return selectedOptions.has(mov.item.codigo_fabricante)
          default:
            return true
        }
      })
    )

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue
        switch (sortConfig.key) {
          case 'data':
            aValue = new Date(a.created_at).getTime()
            bValue = new Date(b.created_at).getTime()
            break
          case 'tipo':
            aValue = a.tipo_movimentacao
            bValue = b.tipo_movimentacao
            break
          case 'motivo':
            aValue = MOTIVOS[a.motivo as keyof typeof MOTIVOS]
            bValue = MOTIVOS[b.motivo as keyof typeof MOTIVOS]
            break
          case 'quantidade':
            aValue = a.quantidade
            bValue = b.quantidade
            break
          case 'item':
            aValue = a.item.descricao
            bValue = b.item.descricao
            break
          case 'codigo':
            aValue = a.item.codigo_fabricante
            bValue = b.item.codigo_fabricante
            break
          case 'responsavel':
            aValue = a.responsavel
            bValue = b.responsavel
            break
          default:
            return 0
        }
        
        if (aValue === bValue) return 0
        const comparison = aValue > bValue ? 1 : -1
        return sortConfig.direction === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [movements, searchTerm, filters, sortConfig])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

  const handleExport = () => {
    // Adiciona BOM para garantir que o Excel reconheça como UTF-8
    const BOM = '\uFEFF'
    
    const headers = {
      data: 'Data',
      item: 'Item',
      codigo: 'Código',
      tipo: 'Tipo',
      motivo: 'Motivo',
      origem: 'Origem',
      quantidade: 'Quantidade',
      responsavel: 'Responsável'
    }

    // Função para escapar células do CSV
    const escapeCsvCell = (cell: string | number) => {
      cell = String(cell).replace(/"/g, '""')
      return /[,;\n"]/.test(cell) ? `"${cell}"` : cell
    }

    // Cria as linhas do CSV
    const csvRows = [
      // Headers
      settings.columns.map(col => escapeCsvCell(headers[col as keyof typeof headers])).join(';'),
      
      // Data rows
      ...filteredAndSortedData.map(mov => 
        settings.columns.map(col => {
          let value: string | number = ''
          
          switch (col) {
            case 'data':
              value = format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
              break
            case 'item':
              value = mov.item.descricao
              break
            case 'codigo':
              value = mov.item.codigo_fabricante
              break
            case 'tipo':
              value = mov.tipo_movimentacao === 'entrada' ? 'Entrada' :
                     mov.tipo_movimentacao === 'saida' ? 'Saída' : 'Ajuste'
              break
            case 'motivo':
              value = MOTIVOS[mov.motivo as keyof typeof MOTIVOS]
              break
            case 'quantidade':
              value = mov.tipo_movimentacao === 'entrada' ? `+${mov.quantidade}` :
                     mov.tipo_movimentacao === 'saida' ? `-${mov.quantidade}` :
                     mov.quantidade
              break
            case 'origem':
              if (mov.tipo_movimentacao === 'entrada') {
                value = mov.nota_fiscal ? `NF ${mov.nota_fiscal}` : 'Entrada Manual'
              } else if (mov.tipo_movimentacao === 'saida') {
                value = mov.destino_movimentacao || ''
                if (mov.frota_destino) {
                  value += ` (Frota ${mov.frota_destino})`
                }
              } else {
                value = 'Estoque'
              }
              break
            case 'responsavel':
              value = mov.responsavel || 'N/A'
              break
          }
          
          return escapeCsvCell(value)
        }).join(';')
      )
    ].join('\r\n')

    // Cria o blob com BOM e conteúdo
    const blob = new Blob([BOM + csvRows], { 
      type: 'text/csv;charset=utf-8' 
    })

    // Cria o link de download
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `movimentacoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar movimentações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[400px]"
            />
          </div>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px]"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {settings.showExport && (
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key} 
                  className={cn(
                    "text-white font-medium h-12",
                    column.headerClassName || column.className
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 hover:bg-white/20 ${
                            sortConfig.key === column.key ? 'text-white' : 'text-white/70'
                          }`}
                          onClick={() => handleSort(column.key)}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {column.key !== 'origem' && column.key !== 'acoes' && (
                      <FilterDropdown
                        title={column.title}
                        options={filterOptions[column.key as keyof typeof filterOptions] || []}
                        selectedOptions={filters[column.key] || new Set()}
                        onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                        onClear={() => handleClearFilter(column.key)}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[47px] text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[47px] text-center">
                  Nenhuma movimentação encontrada
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((mov) => (
                  <TableRow key={mov.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                    {columns.map((column) => (
                      <TableCell 
                        key={column.key} 
                        className={cn(
                          "py-0 border-x border-gray-100",
                          column.className
                        )}
                      >
                        {column.key === 'data' && (
                          format(new Date(mov.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        )}
                        {column.key === 'tipo' && (
                          <span className={
                            mov.tipo_movimentacao === 'entrada' ? 'text-green-600' :
                            mov.tipo_movimentacao === 'saida' ? 'text-red-600' :
                            'text-yellow-600'
                          }>
                            {mov.tipo_movimentacao === 'entrada' ? 'Entrada' :
                             mov.tipo_movimentacao === 'saida' ? 'Saída' : 'Ajuste'}
                          </span>
                        )}
                        {column.key === 'motivo' && (
                          MOTIVOS[mov.motivo as keyof typeof MOTIVOS]
                        )}
                        {column.key === 'quantidade' && (
                          <span className={
                            mov.tipo_movimentacao === 'entrada' ? 'text-green-600' :
                            mov.tipo_movimentacao === 'saida' ? 'text-red-600' :
                            'text-yellow-600'
                          }>
                            {mov.tipo_movimentacao === 'entrada' ? '+' :
                             mov.tipo_movimentacao === 'saida' ? '-' : ''}
                            {mov.quantidade}
                          </span>
                        )}
                        {column.key === 'item' && (
                          mov.item.descricao
                        )}
                        {column.key === 'codigo' && (
                          mov.item.codigo_fabricante
                        )}
                        {column.key === 'origem' && (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-gray-600">
                              {mov.tipo_movimentacao === 'entrada' ? 
                                (mov.nota_fiscal ? `NF ${mov.nota_fiscal}` : 'Entrada Manual') : 
                                'Estoque'}
                            </span>
                            <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {mov.tipo_movimentacao === 'saida' ? 
                                `${mov.destino_movimentacao}${mov.frota_destino ? ` (Frota ${mov.frota_destino})` : ''}` : 
                                'Estoque'}
                            </span>
                          </div>
                        )}
                        {column.key === 'responsavel' && (
                          mov.responsavel || 'N/A'
                        )}
                        {column.key === 'acoes' && (
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedMovement(mov)}
                              title="Detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {/* Fill empty rows */}
                {paginatedData.length < rowsPerPage && (
                  Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-[47px] border-b border-gray-200">
                      {Array(columns.length).fill(0).map((_, colIndex) => (
                        <TableCell 
                          key={`empty-cell-${colIndex}`} 
                          className={cn(
                            "py-0 border-x border-gray-100",
                            columns[colIndex].className
                          )}
                        >
                          &nbsp;
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t py-2.5 px-4 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + rowsPerPage, filteredAndSortedData.length)} de {filteredAndSortedData.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedMovement} onOpenChange={(open) => !open && setSelectedMovement(null)}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="w-8" /> {/* Spacer */}
              <DialogTitle className="text-xl font-semibold text-center flex-1">
                Detalhes da Movimentação
              </DialogTitle>
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          {selectedMovement && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data</Label>
                  <p className="mt-1">{format(new Date(selectedMovement.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <p className={cn("mt-1", {
                    "text-green-600": selectedMovement.tipo_movimentacao === 'entrada',
                    "text-red-600": selectedMovement.tipo_movimentacao === 'saida',
                    "text-yellow-600": selectedMovement.tipo_movimentacao === 'ajuste'
                  })}>
                    {selectedMovement.tipo_movimentacao === 'entrada' ? 'Entrada' :
                     selectedMovement.tipo_movimentacao === 'saida' ? 'Saída' : 'Ajuste'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Item</Label>
                  <p className="mt-1">{selectedMovement.item.descricao}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Código</Label>
                  <p className="mt-1">{selectedMovement.item.codigo_fabricante}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Motivo</Label>
                  <p className="mt-1">{MOTIVOS[selectedMovement.motivo as keyof typeof MOTIVOS]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Quantidade</Label>
                  <p className={cn("mt-1", {
                    "text-green-600": selectedMovement.tipo_movimentacao === 'entrada',
                    "text-red-600": selectedMovement.tipo_movimentacao === 'saida',
                    "text-yellow-600": selectedMovement.tipo_movimentacao === 'ajuste'
                  })}>
                    {selectedMovement.tipo_movimentacao === 'entrada' ? '+' :
                     selectedMovement.tipo_movimentacao === 'saida' ? '-' : ''}
                    {selectedMovement.quantidade}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                  <p className="mt-1">{selectedMovement.responsavel || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Origem/Destino</Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-gray-600">
                    {selectedMovement.tipo_movimentacao === 'entrada' ? 
                      (selectedMovement.nota_fiscal ? `NF ${selectedMovement.nota_fiscal}` : 'Entrada Manual') : 
                      'Estoque'}
                  </span>
                  <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {selectedMovement.tipo_movimentacao === 'saida' ? 
                      `${selectedMovement.destino_movimentacao}${selectedMovement.frota_destino ? ` (Frota ${selectedMovement.frota_destino})` : ''}` : 
                      'Estoque'}
                  </span>
                </div>
              </div>

              {selectedMovement.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedMovement.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 