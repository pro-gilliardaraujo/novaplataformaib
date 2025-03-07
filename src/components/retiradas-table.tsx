"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, Pencil, ChevronLeft, ChevronRight } from "lucide-react"
import { type Retirada } from "@/app/gerenciamento/painel/retiradas/columns"
import { NovaRetiradaModal } from "./nova-retirada-modal"
import { EditarRetiradaModal } from "./editar-retirada-modal"
import RetiradaDetailsModal from "./retirada-details-modal"

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
}

export function RetiradaTable({ retiradas }: RetiradaTableProps) {
  const [filters, setFilters] = useState<FilterState>({})
  const [selectedRetirada, setSelectedRetirada] = useState<Retirada | null>(null)
  const [selectedRetiradaForEdit, setSelectedRetiradaForEdit] = useState<Retirada | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 13

  const columns = [
    { key: "codigo_patrimonio", title: "Código Patrimônio" },
    { key: "retirado_por", title: "Retirado por" },
    { key: "data_retirada", title: "Data de Retirada" },
    { key: "frota_instalada", title: "Frota Instalada" },
    { key: "entregue_por", title: "Entregue por" },
    { key: "observacoes", title: "Observações" },
    { key: "status", title: "Status" },
    { key: "data_devolucao", title: "Data de Devolução" },
    { key: "devolvido_por", title: "Devolvido por" },
    { key: "recebido_por", title: "Recebido por" },
  ] as const

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.key === "data_retirada" || column.key === "data_devolucao") {
          acc[column.key] = Array.from(
            new Set(
              retiradas.map((item) => {
                const date = item[column.key]
                if (!date) return null
                const [year, month, day] = (date as string).split("-")
                return `${day}/${month}/${year}`
              }).filter(Boolean),
            ),
          ).filter((value): value is string => typeof value === "string")
        } else {
          acc[column.key] = Array.from(
            new Set(
              retiradas
                .map((item) => item[column.key as keyof Retirada])
                .filter((value): value is string => typeof value === "string"),
            ),
          )
        }
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [retiradas])

  const filteredData = useMemo(() => {
    return retiradas.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        if (key === "data_retirada" || key === "data_devolucao") {
          const date = row[key as keyof Retirada]
          if (!date) return false
          const [year, month, day] = (date as string).split("-")
          const formattedDate = `${day}/${month}/${year}`
          return selectedOptions.has(formattedDate)
        }
        const value = row[key as keyof Retirada]
        return typeof value === "string" && selectedOptions.has(value)
      }),
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
    <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden pb-4">
      <div className="flex-1">
        <Table>
          <TableHeader className="bg-black sticky top-0">
            <TableRow className="border-b-0">
              {columns.map((column) => (
                <TableHead key={column.key} className="text-white font-medium h-10 border-b-0">
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
              <TableHead className="text-white font-medium h-10 border-b-0">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((retirada) => (
              <TableRow key={retirada.id} className="hover:bg-gray-50 h-[calc((100vh-20rem)/13)]">
                <TableCell className="border-x border-gray-100">{retirada.codigo_patrimonio}</TableCell>
                <TableCell className="border-x border-gray-100">{retirada.retirado_por}</TableCell>
                <TableCell className="border-x border-gray-100">{formatDate(retirada.data_retirada)}</TableCell>
                <TableCell className="border-x border-gray-100">{retirada.frota_instalada}</TableCell>
                <TableCell className="border-x border-gray-100">{retirada.entregue_por}</TableCell>
                <TableCell className="border-x border-gray-100">{retirada.observacoes || "-"}</TableCell>
                <TableCell className="border-x border-gray-100">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block
                      ${retirada.status === "Pendente" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
                  >
                    {retirada.status}
                  </span>
                </TableCell>
                <TableCell className="border-x border-gray-100">{formatDate(retirada.data_devolucao)}</TableCell>
                <TableCell className="border-x border-gray-100">{retirada.devolvido_por || "-"}</TableCell>
                <TableCell className="border-x border-gray-100">{retirada.recebido_por || "-"}</TableCell>
                <TableCell className="border-x border-gray-100">
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
                <TableRow key={`empty-${index}`} className="bg-gray-50 h-[calc((100vh-20rem)/13)]">
                  {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                    <TableCell key={`empty-cell-${colIndex}`} className="border-x border-gray-100">&nbsp;</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
          onOpenChange={(open) => !open && setSelectedRetirada(null)}
          retirada={selectedRetirada}
        />
      )}

      {selectedRetiradaForEdit && (
        <EditarRetiradaModal
          isOpen={!!selectedRetiradaForEdit}
          onClose={() => setSelectedRetiradaForEdit(null)}
          onSubmit={() => {
            setSelectedRetiradaForEdit(null)
          }}
          retiradaData={selectedRetiradaForEdit}
        />
      )}
    </div>
  )
} 