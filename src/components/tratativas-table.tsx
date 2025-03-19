"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Plus, Download } from "lucide-react"
import TratativaDetailsModal from "./tratativa-details-modal"
import { Tratativa, TratativaDetailsProps } from "@/types/tratativas"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface FilterState {
  [key: string]: Set<string>
}

interface TratativasTableProps {
  tratativas: Tratativa[]
  onTratativaEdited: () => void
}

export function TratativasTable({ tratativas, onTratativaEdited }: TratativasTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' | null } | null>(null)
  const [selectedTratativa, setSelectedTratativa] = useState<TratativaDetailsProps | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15

  const formatAnalista = (analista: string) => {
    if (!analista) return "";
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

  const handleExport = () => {
    // Adiciona BOM para garantir que o Excel reconheça como UTF-8
    const BOM = '\uFEFF'
    
    // Função para escapar células do CSV
    const escapeCsvCell = (cell: string | number) => {
      cell = String(cell).replace(/"/g, '""')
      return /[;\n"]/.test(cell) ? `"${cell}"` : cell
    }

    const headers = {
      numero_tratativa: 'Número',
      funcionario: 'Funcionário',
      setor: 'Setor',
      data_infracao: 'Data',
      status: 'Status',
      penalidade: 'Penalidade',
      descricao: 'Descrição',
      observacoes: 'Observações'
    }

    const csvRows = [
      // Headers
      Object.values(headers).join(';'),
      
      // Data rows
      ...filteredData.map(tratativa => [
        escapeCsvCell(tratativa.numero_tratativa),
        escapeCsvCell(tratativa.funcionario),
        escapeCsvCell(tratativa.setor),
        escapeCsvCell(format(new Date(tratativa.data_infracao), "dd/MM/yyyy", { locale: ptBR })),
        escapeCsvCell(tratativa.status === 'pendente' ? 'Pendente' : 'Concluída'),
        escapeCsvCell(tratativa.penalidade),
        escapeCsvCell(tratativa.descricao),
        escapeCsvCell(tratativa.observacoes || '')
      ].join(';'))
    ].join('\r\n')

    // Cria o blob com BOM e conteúdo
    const blob = new Blob([BOM + csvRows], { 
      type: 'text/csv;charset=utf-8' 
    })

    // Cria o link de download
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tratativas_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSort = (columnKey: string) => {
    setSorting(current => ({
      column: columnKey,
      direction: current?.column === columnKey && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const filteredAndSortedData = useMemo(() => {
    return filteredData
      .filter(item => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            item.numero_tratativa.toLowerCase().includes(searchLower) ||
            item.funcionario.toLowerCase().includes(searchLower) ||
            item.setor.toLowerCase().includes(searchLower)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (!sorting || !sorting.direction) return 0
        const column = sorting.column as keyof Tratativa
        let valueA: string | number = a[column] as string
        let valueB: string | number = b[column] as string

        if (column === 'data_infracao') {
          valueA = new Date(valueA).getTime()
          valueB = new Date(valueB).getTime()
        }

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
  }, [filteredData, searchTerm, sorting])

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[400px]">
          <Input
            placeholder="Buscar por número, funcionário ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-black hover:bg-black/90 text-white h-9"
            onClick={() => {}}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Tratativa
          </Button>
          <Button variant="outline" className="h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-black sticky top-0">
              <TableRow className="h-[47px]">
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-white font-medium px-3">
                    <div className="flex items-center gap-1">
                      <div 
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => handleSort(column.key)}
                      >
                        <span>{column.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 w-7 p-0 hover:bg-transparent ${
                            sorting?.column === column.key ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <FilterDropdown
                        title={column.title}
                        options={filterOptions[column.key] ?? []}
                        selectedOptions={filters[column.key] ?? new Set()}
                        onOptionToggle={(option) => handleFilterToggle(column.key, option)}
                        onClear={() => handleClearFilter(column.key)}
                      />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-white font-medium w-[100px] px-3">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((tratativa) => (
                <TableRow key={tratativa.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                  <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.numero_tratativa}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{formatDate(tratativa.data_infracao)}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.funcionario}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.setor}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.lider}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">{tratativa.penalidade}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">
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
                  <TableCell className="px-3 py-0 border-x border-gray-100">{formatAnalista(tratativa.analista)}</TableCell>
                  <TableCell className="px-3 py-0 border-x border-gray-100">
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          const { id, ...rest } = tratativa
                          setSelectedTratativa({ ...rest, id: id.toString() })
                        }}
                        title="Detalhes"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Fill empty rows */}
              {paginatedData.length < rowsPerPage && (
                Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                  <TableRow key={`empty-${index}`} className="h-[47px] border-b border-gray-200">
                    {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                      <TableCell key={`empty-cell-${colIndex}`} className="px-3 py-0 border-x border-gray-100">&nbsp;</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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

      {selectedTratativa && (
        <TratativaDetailsModal
          open={!!selectedTratativa}
          onOpenChange={(open) => !open && setSelectedTratativa(null)}
          tratativa={selectedTratativa}
          onTratativaEdited={onTratativaEdited}
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
