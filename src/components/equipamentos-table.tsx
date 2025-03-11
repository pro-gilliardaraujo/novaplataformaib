"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Equipamento } from "@/types/equipamento"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/utils/formatters"

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
  onEdit: (equipamento: Equipamento) => void
  onDelete: (codigoPatrimonio: string) => void
}

type ColumnType = {
  key: keyof Equipamento
  title: string
  getValue?: (e: Equipamento) => string | React.ReactNode
}

export function EquipamentosTable({ 
  equipamentos, 
  onView, 
  onEdit, 
  onDelete
}: EquipamentosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, Set<string>>>({})
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const rowsPerPage = 15

  const columns: ColumnType[] = [
    {
      key: "codigo_patrimonio",
      title: "Código",
      getValue: (e) => e.codigo_patrimonio
    },
    {
      key: "descricao",
      title: "Descrição",
      getValue: (e) => e.descricao
    },
    {
      key: "num_serie",
      title: "Número de Série",
      getValue: (e) => e.num_serie || "—"
    },
    {
      key: "created_at",
      title: "Data de Cadastro",
      getValue: (e) => formatDateTime(e.created_at)
    }
  ]

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
    setFilters((prevFilters) => ({
      ...prevFilters,
      [columnKey]: new Set<string>(),
    }))
  }

  const handleDeleteClick = (equipamento: Equipamento) => {
    setSelectedEquipamento(equipamento)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedEquipamento) return

    setIsLoading(true)
    try {
      await onDelete(selectedEquipamento.codigo_patrimonio)
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
      setSelectedEquipamento(null)
    }
  }

  const filteredData = useMemo(() => {
    return equipamentos.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const column = columns.find(col => col.key === key)
        if (!column) return true
        const value = column.getValue ? column.getValue(row) : row[key as keyof Equipamento]
        return typeof value === "string" && selectedOptions.has(value)
      })
    )
  }, [equipamentos, filters])

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  return (
    <>
      <div className="border border-gray-200 rounded-lg">
        <Table>
          <TableHeader className="bg-black">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="text-white font-medium h-12">
                  <div className="flex items-center justify-between">
                    <span>{column.title}</span>
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
                </TableHead>
              ))}
              <TableHead className="text-white font-medium h-12">Ações</TableHead>
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
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onView(equipamento)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(equipamento)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteClick(equipamento)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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
                    <TableCell key={`empty-cell-${colIndex}`} className="py-0 border-x border-gray-100">&nbsp;</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination controls */}
        <div className="border-t py-2.5 px-4 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} resultados
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o equipamento {selectedEquipamento?.codigo_patrimonio}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="bg-[#020817] hover:bg-[#020817]/90"
            >
              {isLoading ? "Excluindo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 