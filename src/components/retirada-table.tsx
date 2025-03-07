"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { Retirada } from "@/types/retirada"
import RetiradaDetailsModal from "./retirada-details-modal"
import { EditarRetiradaModal } from "./editar-retirada-modal"

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

interface RetiradaTableProps {
  retiradas: Retirada[]
  onRetiradaUpdated: (id: string, updates: Partial<Retirada>) => Promise<void>
}

export function RetiradaTable({ retiradas, onRetiradaUpdated }: RetiradaTableProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [selectedRetirada, setSelectedRetirada] = useState<Retirada | null>(null)
  const [selectedRetiradaForEdit, setSelectedRetiradaForEdit] = useState<Retirada | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15

  const columns = [
    { key: "codigo_patrimonio", title: "Código Patrimônio" },
    { key: "retirado_por", title: "Retirado por" },
    { key: "data_retirada", title: "Data de Retirada" },
    { key: "frota_instalada", title: "Frota Instalada" },
    { key: "entregue_por", title: "Entregue por" },
    { key: "retirado", title: "Status" },
  ] as const

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data_retirada") {
          acc[column.key] = Array.from(
            new Set(
              retiradas
                .filter(item => item.data_retirada != null)
                .map((item) => {
                  if (!item.data_retirada) return null;
                  const [year, month, day] = item.data_retirada.split("-")
                  return `${day}/${month}/${year}`
                })
                .filter((value): value is string => value !== null)
            )
          )
        } else if (column.key === "retirado") {
          acc[column.key] = ["Retirado", "Devolvido"]
        } else {
          acc[column.key] = Array.from(
            new Set(
              retiradas
                .map((item) => item[column.key as keyof Retirada])
                .filter((value): value is string => typeof value === "string")
            )
          )
        }
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [retiradas])

  const filteredData = useMemo(() => {
    return retiradas.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        
        if (key === "data_retirada") {
          if (!row.data_retirada) return false
          const [year, month, day] = row.data_retirada.split("-")
          const formattedDate = `${day}/${month}/${year}`
          return selectedOptions.has(formattedDate)
        }

        if (key === "retirado") {
          const status = row.retirado ? "Retirado" : "Devolvido"
          return selectedOptions.has(status)
        }

        const value = row[key as keyof Retirada]
        return typeof value === "string" && selectedOptions.has(value)
      })
    )
  }, [retiradas, filters])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const handleEditClick = (retirada: Retirada) => {
    setSelectedRetiradaForEdit(retirada)
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
          {paginatedData.map((retirada) => (
            <TableRow key={retirada.id} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
              <TableCell className="py-0">{retirada.codigo_patrimonio}</TableCell>
              <TableCell className="py-0">{retirada.retirado_por}</TableCell>
              <TableCell className="py-0">{formatDate(retirada.data_retirada)}</TableCell>
              <TableCell className="py-0">{retirada.frota_instalada}</TableCell>
              <TableCell className="py-0">{retirada.entregue_por}</TableCell>
              <TableCell className="py-0">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    retirada.retirado
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {retirada.retirado ? "Retirado" : "Devolvido"}
                </span>
              </TableCell>
              <TableCell className="py-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setSelectedRetirada(retirada)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditClick(retirada)}
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

      {selectedRetirada && (
        <RetiradaDetailsModal
          open={!!selectedRetirada}
          onOpenChange={(open: boolean) => !open && setSelectedRetirada(null)}
          retirada={selectedRetirada}
        />
      )}

      {selectedRetiradaForEdit && (
        <EditarRetiradaModal
          open={!!selectedRetiradaForEdit}
          onOpenChange={(open: boolean) => !open && setSelectedRetiradaForEdit(null)}
          onRetiradaEdited={(updates) => {
            onRetiradaUpdated(selectedRetiradaForEdit.id, updates)
            setSelectedRetiradaForEdit(null)
          }}
          retiradaData={selectedRetiradaForEdit}
        />
      )}
    </div>
  )
} 