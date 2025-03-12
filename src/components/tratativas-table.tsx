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

interface Tratativa {
  id: string
  numero_tratativa: string
  funcionario: string
  data_infracao: string
  hora_infracao: string
  codigo_infracao: string
  descricao_infracao: string
  penalidade: string
  lider: string
  status: string
  created_at: string
  texto_infracao: string
  texto_limite: string
  url_documento_enviado: string
  url_documento_devolvido: string | null
  data_devolvida: string | null
  funcao: string
  setor: string
  medida: string
  valor_praticado: string
  mock: boolean
  texto_advertencia: string
  metrica: string
  analista: string
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
  )
}

interface TratativasTableProps {
  tratativas: Tratativa[]
  onTratativaEdited: () => void
}

export function TratativasTable({ tratativas, onTratativaEdited }: TratativasTableProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [selectedTratativa, setSelectedTratativa] = useState<Tratativa | null>(null)
  const [selectedTratativaForEdit, setSelectedTratativaForEdit] = useState<Tratativa | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15  // Updated to match retiradas table

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

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

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
                      setSelectedTratativa(tratativa)
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
          Mostrando {startIndex + 1} a {Math.min(startIndex + rowsPerPage, filteredData.length)} de {filteredData.length} resultados
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
