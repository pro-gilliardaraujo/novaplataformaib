"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, Eye, ChevronLeft, ChevronRight, ArrowUpDown, Download } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Equipamento } from "@/types/equipamento"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/utils/formatters"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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

interface EquipamentosTableProps {
  equipamentos: Equipamento[]
  onView: (equipamento: Equipamento) => void
}

type ColumnType = {
  key: keyof Equipamento
  title: string
  getValue?: (e: Equipamento) => string | React.ReactNode
  sortable?: boolean
}

export function EquipamentosTable({ 
  equipamentos, 
  onView
}: EquipamentosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, Set<string>>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Equipamento
    direction: 'asc' | 'desc'
  } | null>(null)
  const { toast } = useToast()
  const rowsPerPage = 15

  const columns: ColumnType[] = [
    {
      key: "codigo_patrimonio",
      title: "Código",
      getValue: (e) => e.codigo_patrimonio,
      sortable: true
    },
    {
      key: "descricao",
      title: "Descrição",
      getValue: (e) => e.descricao,
      sortable: true
    },
    {
      key: "num_serie",
      title: "Número de Série",
      getValue: (e) => e.num_serie || "—",
      sortable: true
    },
    {
      key: "created_at",
      title: "Data de Cadastro",
      getValue: (e) => formatDateTime(e.created_at),
      sortable: true
    }
  ]

  const handleSort = (key: keyof Equipamento) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' }
        }
        return null
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig) return equipamentos

    return [...equipamentos].sort((a, b) => {
      const aValue = String(a[sortConfig.key] || '')
      const bValue = String(b[sortConfig.key] || '')

      if (aValue === bValue) return 0
      
      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [equipamentos, sortConfig])

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.key] = Array.from(
          new Set(
            equipamentos.map(e => {
              const value = column.getValue ? column.getValue(e) : e[column.key]
              return typeof value === "string" ? value : String(value)
            }).filter(Boolean)
          )
        )
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [equipamentos])

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
    setFilters(current => {
      const newFilters = { ...current }
      delete newFilters[columnKey]
      return newFilters
    })
  }

  const handleExport = () => {
    // Adiciona BOM para garantir que o Excel reconheça como UTF-8
    const BOM = '\uFEFF'
    
    // Função para escapar células do CSV
    const escapeCsvCell = (cell: string | number) => {
      cell = String(cell).replace(/"/g, '""')
      return /[;\n"]/.test(cell) ? `"${cell}"` : cell
    }

    const headers = {
      codigo_patrimonio: 'Código',
      descricao: 'Descrição',
      num_serie: 'Número de Série',
      created_at: 'Data de Cadastro'
    }

    const csvRows = [
      // Headers
      Object.values(headers).join(';'),
      
      // Data rows
      ...filteredData.map(equipamento => [
        escapeCsvCell(equipamento.codigo_patrimonio),
        escapeCsvCell(equipamento.descricao),
        escapeCsvCell(equipamento.num_serie || 'N/A'),
        escapeCsvCell(format(new Date(equipamento.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }))
      ].join(';'))
    ].join('\r\n')

    // Cria o blob com BOM e conteúdo
    const blob = new Blob([BOM + csvRows], { 
      type: 'text/csv;charset=utf-8' 
    })

    // Cria o link de download
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `equipamentos_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredData = useMemo(() => {
    return sortedData
      .filter(row => {
        // Aplicar filtro de busca
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            row.codigo_patrimonio.toLowerCase().includes(searchLower) ||
            row.descricao.toLowerCase().includes(searchLower) ||
            (row.num_serie?.toLowerCase() || '').includes(searchLower)
          )
        }
        return true
      })
      .filter((row) =>
        Object.entries(filters).every(([key, selectedOptions]) => {
          if (selectedOptions.size === 0) return true
          const column = columns.find(col => col.key === key)
          if (!column) return true
          const value = column.getValue ? column.getValue(row) : row[key as keyof Equipamento]
          return typeof value === "string" && selectedOptions.has(value)
        })
      )
  }, [sortedData, filters, searchTerm])

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader className="bg-black">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className="text-white font-medium h-[49px]">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span>{column.title}</span>
                      <div className="flex items-center">
                        {column.sortable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-transparent"
                            onClick={() => handleSort(column.key)}
                          >
                            <ArrowUpDown className={`h-4 w-4 ${
                              sortConfig?.key === column.key
                                ? sortConfig.direction === 'asc'
                                  ? 'text-white'
                                  : 'text-white rotate-180'
                                : 'text-white/50'
                            }`} />
                          </Button>
                        )}
                        {filterOptions[column.key]?.length > 0 && (
                          <FilterDropdown
                            title={column.title}
                            options={filterOptions[column.key]}
                            selectedOptions={filters[column.key] || new Set()}
                            onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                            onClear={() => handleClearFilter(column.key)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TableHead>
            ))}
            <TableHead className="text-white font-medium h-[49px] text-center">Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((equipamento) => (
            <TableRow key={equipamento.id} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
              {columns.map((column) => (
                <TableCell key={column.key} className="py-0 border-x border-gray-100">
                  {column.getValue ? column.getValue(equipamento) : equipamento[column.key]}
                </TableCell>
              ))}
              <TableCell className="py-0 border-x border-gray-100">
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onView(equipamento)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {/* Fill empty rows to maintain consistent height */}
          {paginatedData.length < rowsPerPage && (
            Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
              <TableRow key={`empty-${index}`} className="h-[49px] border-b border-gray-200">
                {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                  <TableCell key={`empty-cell-${colIndex}`} className="py-0 border-x border-gray-100">&nbsp;</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="border-t flex items-center justify-between bg-white px-4 h-10">
        <div className="text-sm text-gray-500">
          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} resultados
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
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
            className="h-8 w-8 p-0"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="w-[400px]">
          <Input
            placeholder="Buscar equipamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
    </div>
  )
} 