import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { NovaUnidadeModal } from "./nova-unidade-modal"
import { useToast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useParadas } from "@/contexts/ParadasContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { unidadesService } from "@/services/unidadesService"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

interface FilterState {
  [key: string]: Set<string>
}

export function UnidadesContent() {
  const { unidades, isLoading, carregarUnidades } = useParadas()
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUnidade, setEditingUnidade] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingUnidade, setDeletingUnidade] = useState<any | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'nome', direction: 'asc' })
  const rowsPerPage = 15
  const { toast } = useToast()

  const columns = [
    { key: "nome", title: "Nome", sortable: true },
  ] as const

  const handleUnidadeUpdated = async () => {
    await carregarUnidades()
  }

  const handleDelete = async () => {
    if (!deletingUnidade) return

    try {
      await unidadesService.excluirUnidade(deletingUnidade.id)
      toast({
        title: "Sucesso",
        description: "Unidade excluída com sucesso",
      })
      await carregarUnidades()
    } catch (error) {
      console.error("Erro ao excluir unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a unidade",
        variant: "destructive",
      })
    } finally {
      setDeletingUnidade(null)
    }
  }

  // Filter options for dropdown
  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.key] = Array.from(
          new Set(
            unidades
              .map((item) => item[column.key as keyof typeof item])
              .filter((value): value is string => typeof value === "string"),
          ),
        )
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [unidades])

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
    let filtered = unidades.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const value = row[key as keyof typeof row]
        return typeof value === "string" && selectedOptions.has(value)
      }) &&
      (searchTerm === "" || 
        row.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a]
        const bValue = b[sortConfig.key as keyof typeof b]
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        return 0
      })
    }

    return filtered
  }, [unidades, filters, searchTerm, sortConfig])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Input 
          className="max-w-md" 
          placeholder="Buscar unidades..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Unidade
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  {searchTerm ? (
                    <p className="text-sm text-gray-500">Nenhuma unidade encontrada</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-sm text-gray-500">Nenhuma unidade cadastrada</p>
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => setIsModalOpen(true)}
                      >
                        Criar nova unidade
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((unidade) => (
                  <TableRow key={unidade.id} className="h-[46px] hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="py-0 border-x border-gray-100">{unidade.nome}</TableCell>
                    <TableCell className="py-0 border-x border-gray-100">
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingUnidade(unidade)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Modals */}
      <NovaUnidadeModal
        open={isModalOpen || !!editingUnidade}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setEditingUnidade(null)
        }}
        unidade={editingUnidade}
        onUnidadeUpdated={handleUnidadeUpdated}
      />

      <ConfirmDialog
        open={!!deletingUnidade}
        onOpenChange={(open) => !open && setDeletingUnidade(null)}
        title="Excluir Unidade"
        description={`Tem certeza que deseja excluir a unidade "${deletingUnidade?.nome}"?`}
        onConfirm={handleDelete}
      />
    </div>
  )
} 