"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import TratativaDetailsModal from "./tratativa-details-modal"
import { EditarTratativaModal } from "./editar-tratativa-modal"
import { Tratativa, TratativaDetailsProps } from "@/types/tratativas"

interface FilterState {
  [key: string]: Set<string>
}

interface TratativasTableProps {
  tratativas: Tratativa[]
  onTratativaEdited: () => void
}

export function TratativasTable({ tratativas, onTratativaEdited }: TratativasTableProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' | null } | null>(null)
  const [selectedTratativa, setSelectedTratativa] = useState<TratativaDetailsProps | null>(null)
  const [selectedTratativaForEdit, setSelectedTratativaForEdit] = useState<Tratativa | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15

  const formatAnalista = (analista: string) => {
    if (!analista) return "";
    // Retorna apenas o nome antes do parênteses
    return analista.split(" (")[0];
  }

  const columns = [
    { key: "numero_tratativa", title: "Tratativa" },
    { key: "data_infracao", title: "Data" },
    { key: "funcionario", title: "Funcionário" },
    { key: "setor", title: "Setor" },
    { key: "lider", title: "Líder" },
    { key: "penalidade", title: "Penalidade" },
    { key: "status", title: "Situação" },
    { key: "analista", title: "Analista" }
  ] as const

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data_infracao") {
          acc[column.key] = Array.from(
            new Set(
              tratativas.map((item) => {
                const [year, month, day] = item.data_infracao.split("-")
                return `${day}/${month}/${year}`
              }),
            ),
          ).filter((value): value is string => typeof value === "string")
        } else {
          acc[column.key] = Array.from(
            new Set(
              tratativas
                .map((item) => item[column.key as keyof Tratativa])
                .filter((value): value is string => typeof value === "string"),
            ),
          )
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [tratativas])

  const filteredData = useMemo(() => {
    return tratativas.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        if (key === "data_infracao") {
          const [year, month, day] = row.data_infracao.split("-")
          const formattedDate = `${day}/${month}/${year}`
          return selectedOptions.has(formattedDate)
        }
        const value = row[key as keyof Tratativa]
        return typeof value === "string" && selectedOptions.has(value)
      }),
    )
  }, [tratativas, filters])

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const handleEditClick = (tratativa: Tratativa) => {
    setSelectedTratativaForEdit(tratativa)
  }

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

  const sortData = (data: Tratativa[]) => {
    if (!sorting || !sorting.direction) return data

    return [...data].sort((a, b) => {
      const column = sorting.column as keyof Tratativa
      let valueA: string | number = a[column] as string
      let valueB: string | number = b[column] as string

      // Special handling for dates
      if (column === 'data_infracao') {
        valueA = new Date(valueA).getTime()
        valueB = new Date(valueB).getTime()
      }

      // Special handling for analista (remove email part)
      if (column === 'analista') {
        valueA = formatAnalista(String(valueA))
        valueB = formatAnalista(String(valueB))
      }

      if (valueA === valueB) return 0
      if (valueA === null || valueA === undefined) return 1
      if (valueB === null || valueB === undefined) return -1

      const result = valueA < valueB ? -1 : 1
      return sorting.direction === 'asc' ? result : -result
    })
  }

  const handleSort = (columnKey: string, direction: 'asc' | 'desc' | null) => {
    setSorting(direction ? { column: columnKey, direction } : null)
  }

  const filteredAndSortedData = useMemo(() => {
    const filtered = filteredData
    return sortData(filtered)
  }, [filteredData, sorting])

  // Update pagination to use filteredAndSortedData
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="border border-gray-200 rounded-lg">
      <Table>
        <TableHeader className="bg-black">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className="text-white font-medium h-12">
                <div className="flex items-center justify-between">
                  <span>{column.title}</span>
                  <FilterDropdown
                    title={column.title}
                    options={filterOptions[column.key] || []}
                    selectedOptions={filters[column.key] || new Set()}
                    onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                    onClear={() => handleClearFilter(column.key)}
                    sortDirection={sorting?.column === column.key ? sorting.direction : null}
                    onSort={(direction) => handleSort(column.key, direction)}
                  />
                </div>
              </TableHead>
            ))}
            <TableHead className="text-white font-medium h-12">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((tratativa) => (
            <TableRow key={tratativa.id} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
              <TableCell className="py-0">{tratativa.numero_tratativa}</TableCell>
              <TableCell className="py-0">{formatDate(tratativa.data_infracao)}</TableCell>
              <TableCell className="py-0">{tratativa.funcionario}</TableCell>
              <TableCell className="py-0">{tratativa.setor}</TableCell>
              <TableCell className="py-0">{tratativa.lider}</TableCell>
              <TableCell className="py-0">{tratativa.penalidade}</TableCell>
              <TableCell className="py-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tratativa.status === 'DEVOLVIDA' ? 'bg-green-100 text-green-800' :
                  tratativa.status === 'CANCELADA' ? 'bg-red-100 text-red-800' :
                  tratativa.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                  tratativa.status === 'ENVIADA' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tratativa.status}
                </span>
              </TableCell>
              <TableCell className="py-0">{formatAnalista(tratativa.analista)}</TableCell>
              <TableCell className="py-0">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const { id, ...rest } = tratativa
                      setSelectedTratativa({ ...rest, id: id.toString() })
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTratativaForEdit(tratativa)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {/* Fill empty rows to maintain fixed height */}
          {paginatedData.length < rowsPerPage && (
            Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
              <TableRow key={`empty-${index}`} className="h-[49px] border-b border-gray-200">
                {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                  <TableCell key={`empty-cell-${colIndex}`} className="py-0">&nbsp;</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination controls */}
      <div className="border-t py-2.5 px-4 flex items-center justify-between bg-white">
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

      {selectedTratativa && (
        <TratativaDetailsModal
          open={!!selectedTratativa}
          onOpenChange={(open) => !open && setSelectedTratativa(null)}
          tratativa={selectedTratativa}
        />
      )}

      {selectedTratativaForEdit && (
        <EditarTratativaModal
          open={!!selectedTratativaForEdit}
          onOpenChange={(open) => !open && setSelectedTratativaForEdit(null)}
          onTratativaEdited={() => {
            setSelectedTratativaForEdit(null)
            onTratativaEdited()
          }}
          tratativaData={selectedTratativaForEdit}
        />
      )}
    </div>
  )
}

function FilterDropdown({
  title,
  options,
  selectedOptions,
  onOptionToggle,
  onClear,
  sortDirection,
  onSort,
}: {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (option: string) => void
  onClear: () => void
  sortDirection: 'asc' | 'desc' | null
  onSort: (direction: 'asc' | 'desc' | null) => void
}) {
  const [searchTerm, setSearchTerm] = useState("")

  // Sort and filter options
  const sortedAndFilteredOptions = useMemo(() => {
    let filtered = options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (sortDirection) {
      filtered.sort((a, b) => {
        const comparison = a.localeCompare(b)
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return filtered
  }, [options, searchTerm, sortDirection])

  return (
    <DropdownMenu modal={true}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Filter className="h-4 w-4" />
          {sortDirection && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2">
              {sortDirection === 'asc' ? '↑' : '↓'}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4" side="bottom" sideOffset={5}>
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium">Filtrar {title.toLowerCase()}</h4>
          </div>

          {/* Sorting Options */}
          <div className="flex gap-2 border-b pb-4">
            <Button
              variant={sortDirection === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSort(sortDirection === 'asc' ? null : 'asc')}
              className="flex-1 text-xs font-normal"
            >
              ↑ Crescente
            </Button>
            <Button
              variant={sortDirection === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSort(sortDirection === 'desc' ? null : 'desc')}
              className="flex-1 text-xs font-normal"
            >
              ↓ Decrescente
            </Button>
            {(selectedOptions.size > 0 || sortDirection) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClear()
                  onSort(null)
                  setSearchTerm("")
                }}
                className="flex-1 text-xs font-normal"
              >
                Limpar tudo
              </Button>
            )}
          </div>

          {/* Search Input */}
          <Input 
            placeholder={`Buscar ${title.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Options List */}
          <div className="space-y-2 max-h-48 overflow-auto">
            {sortedAndFilteredOptions.map((option) => (
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
            {sortedAndFilteredOptions.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                Nenhum resultado encontrado
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                onClear()
                setSearchTerm("")
              }}
            >
              Limpar filtros
            </Button>
            <span className="text-sm text-muted-foreground">{selectedOptions.size} selecionados</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
