"use client"

import { useState, useMemo, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Eye, Plus, Search, ArrowUpDown } from "lucide-react"
import { FilterDropdown } from "@/components/filter-dropdown"
import { ConferenciaDetailsModal } from "./conferencia-details-modal"
import { NovaConferenciaModal } from "./nova-conferencia-modal"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { Conferencia } from "@/types/conferencias"

interface FilterState {
  [key: string]: Set<string>
}

const columns = [
  {
    key: "data_conferencia",
    title: "Data",
    sortable: true,
    getValue: (conferencia: Conferencia) => {
      const date = new Date(conferencia.data_conferencia)
      return date.toLocaleDateString("pt-BR")
    }
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
    getValue: (conferencia: Conferencia) => {
      const statusMap = {
        em_andamento: "Em Andamento",
        concluida: "Concluída",
        cancelada: "Cancelada"
      }
      return statusMap[conferencia.status]
    }
  },
  {
    key: "total_itens",
    title: "Total de Itens",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.total_itens.toString()
  },
  {
    key: "itens_conferidos",
    title: "Itens Conferidos",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.itens_conferidos.toString()
  },
  {
    key: "itens_divergentes",
    title: "Divergências",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.itens_divergentes.toString()
  },
  {
    key: "responsaveis",
    title: "Responsáveis",
    sortable: true,
    getValue: (conferencia: Conferencia) => conferencia.responsaveis
  }
]

export function ConferenciasTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({})
  const [selectedConferencia, setSelectedConferencia] = useState<Conferencia | null>(null)
  const [conferencias, setConferencias] = useState<Conferencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewConferenciaModalOpen, setIsNewConferenciaModalOpen] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'data_conferencia', 
    direction: 'desc' 
  })
  const rowsPerPage = 15
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadConferencias()
  }, [])

  const loadConferencias = async () => {
    try {
      const { data: conferenciasData, error } = await supabase
        .from("conferencias_estoque")
        .select("*")
        .order("data_conferencia", { ascending: false })

      if (error) throw error

      setConferencias(conferenciasData)
    } catch (error) {
      console.error("Erro ao carregar conferências:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar conferências",
        description: "Não foi possível carregar as conferências."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadConferenciaDetails = async (conferencia: Conferencia) => {
    try {
      const { data: itensData, error } = await supabase
        .from("itens_conferencia")
        .select(`
          id,
          item_id,
          quantidade_sistema,
          quantidade_conferida,
          diferenca,
          item:item_id (
            codigo_fabricante,
            descricao
          )
        `)
        .eq("conferencia_id", conferencia.id)

      if (error) throw error

      interface ItemConferenciaResponse {
        id: string
        item_id: string
        quantidade_sistema: number
        quantidade_conferida: number
        diferenca: number
        item: {
          codigo_fabricante: string
          descricao: string
        }
      }

      const itens = (itensData as unknown as ItemConferenciaResponse[]).map(item => ({
        id: item.id,
        item_id: item.item_id,
        codigo_patrimonio: item.item.codigo_fabricante,
        descricao: item.item.descricao,
        quantidade_sistema: item.quantidade_sistema,
        quantidade_conferida: item.quantidade_conferida,
        diferenca: item.diferenca
      }))

      setSelectedConferencia({
        ...conferencia,
        itens
      })
    } catch (error) {
      console.error("Erro ao carregar detalhes da conferência:", error)
      toast({
        variant: "destructive",
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes da conferência."
      })
    }
  }

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.key] = Array.from(
          new Set(
            conferencias
              .map((item) => column.getValue(item))
              .filter((value): value is string => typeof value === "string")
          )
        )
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [conferencias])

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

  const filteredAndSortedData = useMemo(() => {
    let filtered = conferencias.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const column = columns.find(col => col.key === key)
        if (!column) return true
        const value = column.getValue(row)
        return typeof value === "string" && selectedOptions.has(value)
      })
    )

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(conferencia =>
        conferencia.responsaveis.toLowerCase().includes(searchLower) ||
        columns.some(column => column.getValue(conferencia).toLowerCase().includes(searchLower))
      )
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const column = columns.find(col => col.key === sortConfig.key)
        if (!column) return 0

        let aValue = column.getValue(a)
        let bValue = column.getValue(b)

        // Special handling for dates
        if (sortConfig.key === 'data_conferencia') {
          aValue = new Date(a.data_conferencia).getTime().toString()
          bValue = new Date(b.data_conferencia).getTime().toString()
        }

        // Special handling for numbers
        if (['total_itens', 'itens_conferidos', 'itens_divergentes'].includes(sortConfig.key)) {
          aValue = parseInt(aValue).toString()
          bValue = parseInt(bValue).toString()
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [conferencias, filters, searchTerm, sortConfig])

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)

  const handleConferenciaCreated = () => {
    loadConferencias()
  }

  const handleViewConferencia = (conferencia: Conferencia) => {
    loadConferenciaDetails(conferencia)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conferências..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-[400px]"
            />
          </div>
        </div>
        <Button 
          onClick={() => setIsNewConferenciaModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Conferência
        </Button>
      </div>

      {/* Table */}
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
                        <FilterDropdown
                          title={column.title}
                          options={filterOptions[column.key] || []}
                          selectedOptions={filters[column.key] || new Set()}
                          onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                          onClear={() => handleClearFilter(column.key)}
                        />
                      </div>
                    </div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-white font-medium h-[49px]">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-[49px] text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-[49px] text-center">
                  Nenhuma conferência encontrada
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((conferencia) => (
                  <TableRow key={conferencia.id} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
                    {columns.map((column) => (
                      <TableCell key={column.key} className="py-0">
                        {column.getValue(conferencia)}
                      </TableCell>
                    ))}
                    <TableCell className="py-0">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewConferencia(conferencia)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedData.length < rowsPerPage && (
                  Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-[49px] border-b border-gray-200">
                      {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                        <TableCell key={`empty-cell-${colIndex}`} className="py-0">&nbsp;</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="border-t flex items-center justify-between bg-white px-4 h-10">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + rowsPerPage, filteredAndSortedData.length)} de {filteredAndSortedData.length} resultados
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
      </div>

      {/* Modals */}
      <NovaConferenciaModal
        open={isNewConferenciaModalOpen}
        onOpenChange={setIsNewConferenciaModalOpen}
        onConferenciaCreated={handleConferenciaCreated}
      />

      {selectedConferencia && (
        <ConferenciaDetailsModal
          open={!!selectedConferencia}
          onOpenChange={(open) => !open && setSelectedConferencia(null)}
          conferencia={selectedConferencia}
          onEdit={() => {}}
          onMovimentacao={() => {}}
        />
      )}
    </div>
  )
} 