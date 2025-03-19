"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { frotasService } from "@/services/frotasService"
import { Frota } from "@/types/paradas"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { NovaFrotaModal } from "./nova-frota-modal"
import { useParadas } from "@/contexts/ParadasContext"

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
          <Input placeholder={`Buscar ${title.toLowerCase()}...`} />
          <div className="space-y-2 max-h-48 overflow-auto">
            {options.map((option) => (
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
  );
}

export function FrotasContent() {
  const { unidades } = useParadas()
  const [frotas, setFrotas] = useState<Frota[]>(() => {
    try {
      const cached = localStorage.getItem('cached_frotas')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedFrota, setSelectedFrota] = useState<Frota | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [filters, setFilters] = useState<FilterState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'frota', direction: 'asc' })
  const initialLoadDone = useRef(false)
  const rowsPerPage = 15
  const { toast } = useToast()

  const columns = [
    { key: "frota", title: "Frota", sortable: true },
    { key: "descricao", title: "Descrição", sortable: true },
    { key: "unidade", title: "Unidade", sortable: true },
  ] as const

  const memoizedUnidades = useMemo(() => unidades, [unidades])

  const carregarFrotas = async (forceRefresh = false) => {
    // Se temos dados em cache e não é forçado, não recarrega
    if (!forceRefresh && frotas.length > 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const novasFrotas = await frotasService.buscarFrotas()
      setFrotas(novasFrotas)
      // Atualiza o cache
      localStorage.setItem('cached_frotas', JSON.stringify(novasFrotas))
    } catch (error) {
      console.error("Erro ao carregar frotas:", error)
      toast({
        title: "Erro ao carregar frotas",
        description: error instanceof Error ? error.message : "Não foi possível carregar as frotas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Carrega dados apenas uma vez quando o componente montar
  useEffect(() => {
    if (!initialLoadDone.current) {
      carregarFrotas()
      initialLoadDone.current = true
    }
  }, [])

  const handleFrotaUpdated = useCallback(() => {
    carregarFrotas(true)
  }, [])

  const handleRefresh = useCallback(() => {
    carregarFrotas(true)
  }, [])

  // Filter options for dropdown
  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "unidade") {
          acc[column.key] = memoizedUnidades.map(u => u.nome)
        } else {
          acc[column.key] = Array.from(
            new Set(
              frotas
                .map((item) => item[column.key as keyof Frota])
                .filter((value): value is string => typeof value === "string"),
            ),
          )
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [frotas, memoizedUnidades])

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
    let filtered = frotas.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        if (key === "unidade") {
          const unidade = memoizedUnidades.find(u => u.id === row.unidade_id)
          return unidade && selectedOptions.has(unidade.nome)
        }
        const value = row[key as keyof Frota]
        return typeof value === "string" && selectedOptions.has(value)
      }) &&
      (search === "" || 
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(search.toLowerCase())
        ))
    )

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        if (sortConfig.key === "unidade") {
          const aUnidade = memoizedUnidades.find(u => u.id === a.unidade_id)?.nome || ""
          const bUnidade = memoizedUnidades.find(u => u.id === b.unidade_id)?.nome || ""
          return sortConfig.direction === 'asc' 
            ? aUnidade.localeCompare(bUnidade)
            : bUnidade.localeCompare(aUnidade)
        }
        const aValue = a[sortConfig.key as keyof Frota]
        const bValue = b[sortConfig.key as keyof Frota]
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        return 0;
      })
    }

    return filtered;
  }, [frotas, filters, search, sortConfig, memoizedUnidades])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Input 
            className="max-w-md" 
            placeholder="Buscar frotas..." 
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Frota
        </Button>
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
                      {column.sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-white hover:text-white"
                          onClick={() => handleSort(column.key)}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      )}
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
            {(loading) ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando dados...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Nenhuma frota encontrada
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((frota) => {
                  const unidade = memoizedUnidades.find(u => u.id === frota.unidade_id)
                  return (
                    <TableRow key={frota.id} className="h-[46px] hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="py-0 border-x border-gray-100">{frota.frota}</TableCell>
                      <TableCell className="py-0 border-x border-gray-100">{frota.descricao}</TableCell>
                      <TableCell className="py-0 border-x border-gray-100">{unidade?.nome}</TableCell>
                      <TableCell className="py-0 border-x border-gray-100">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedFrota(frota)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
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

      {/* Modal */}
      <NovaFrotaModal
        open={showNewDialog || !!selectedFrota}
        onOpenChange={(open) => {
          setShowNewDialog(open)
          if (!open) setSelectedFrota(null)
        }}
        frota={selectedFrota}
        onFrotaUpdated={handleFrotaUpdated}
      />
    </div>
  )
} 