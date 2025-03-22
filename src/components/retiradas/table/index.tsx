"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Plus } from "lucide-react"
import RetiradaDetailsModal from "@/components/retirada-details-modal"
import { Retirada } from "@/types/retirada"

interface FilterState {
  [key: string]: Set<string>
}

interface RetiradaTableProps {
  retiradas: Retirada[]
  isLoading: boolean
  onViewRetirada?: (retirada: Retirada) => void
  onEditRetirada?: (retirada: Retirada) => void
  onNewRetirada?: () => void
}

interface FilterDropdownProps {
  title: string
  options: string[]
  selectedOptions: Set<string>
  onOptionToggle: (option: string) => void
  onClear: () => void
}

function FilterDropdown({
  title,
  options,
  selectedOptions,
  onOptionToggle,
  onClear,
}: FilterDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const filteredOptions = options
    .map(option => String(option))
    .filter(option => 
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

export function RetiradaTable({ 
  retiradas, 
  isLoading, 
  onViewRetirada,
  onEditRetirada,
  onNewRetirada 
}: RetiradaTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({})
  const [sorting, setSorting] = useState<{ column: string; direction: 'asc' | 'desc' | null }>({ column: "", direction: null })
  const [selectedRetirada, setSelectedRetirada] = useState<Retirada | null>(null)
  const rowsPerPage = 15

  const handleSort = (columnKey: string) => {
    setSorting(current => ({
      column: columnKey,
      direction: current.column === columnKey && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleFilterToggle = (columnKey: string, option: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const filteredAndSortedData = useMemo(() => {
    return retiradas
      .filter(retirada => {
        // Apply search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            retirada.codigo_patrimonio.toLowerCase().includes(searchLower) ||
            retirada.retirado_por.toLowerCase().includes(searchLower) ||
            (typeof retirada.frota_instalada === 'string' && retirada.frota_instalada.toLowerCase().includes(searchLower))
          )
        }

        // Apply column filters
        return Object.entries(filters).every(([key, selectedOptions]) => {
          if (selectedOptions.size === 0) return true
          if (key === "retirado") {
            const status = retirada.retirado ? "Retirado" : "Devolvido"
            return selectedOptions.has(status)
          }
          if (key === "data_retirada") {
            const formattedDate = formatDate(retirada.data_retirada)
            return selectedOptions.has(formattedDate)
          }
          const value = retirada[key as keyof Retirada]
          return selectedOptions.has(String(value))
        })
      })
      .sort((a, b) => {
        if (!sorting.column || !sorting.direction) return 0
        
        const getValue = (item: Retirada) => {
          if (sorting.column === "retirado") {
            return item.retirado ? "Retirado" : "Devolvido"
          }
          if (sorting.column === "data_retirada") {
            return item.data_retirada
          }
          return String(item[sorting.column as keyof Retirada])
        }

        const valueA = getValue(a)
        const valueB = getValue(b)

        if (valueA === valueB) return 0
        const comparison = valueA > valueB ? 1 : -1
        return sorting.direction === "asc" ? comparison : -comparison
      })
  }, [retiradas, searchTerm, filters, sorting])

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage)

  const handleEdit = async (retirada: Retirada) => {
    if (onEditRetirada) {
      // Chama o handler de edição
      await onEditRetirada(retirada)
      
      // Atualiza a retirada na lista
      const updatedRetiradas = retiradas.map(r => 
        r.id === retirada.id ? { ...retirada, ...retirada } : r
      )
      
      // Atualiza a retirada selecionada com os novos dados
      if (selectedRetirada?.id === retirada.id) {
        setSelectedRetirada({ ...selectedRetirada, ...retirada })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input 
          className="max-w-[400px]" 
          placeholder="Buscar retiradas..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {onNewRetirada && (
          <Button
            className="bg-black hover:bg-black/90 text-white"
            onClick={onNewRetirada}
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Retirada
          </Button>
        )}
      </div>
      
      <div className="flex-1 border rounded-lg flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-black sticky top-0">
              <TableRow className="h-[47px]">
                <TableHead className="text-white font-medium px-3">
                  <div className="flex items-center gap-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSort("codigo_patrimonio")}
                    >
                      <span>Código Patrimônio</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-7 w-7 p-0 hover:bg-white/20 ${
                          sorting.column === "codigo_patrimonio" ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FilterDropdown
                      title="Código Patrimônio"
                      options={Array.from(new Set(retiradas.map(r => r.codigo_patrimonio)))}
                      selectedOptions={filters.codigo_patrimonio || new Set()}
                      onOptionToggle={(option) => handleFilterToggle("codigo_patrimonio", option)}
                      onClear={() => handleClearFilter("codigo_patrimonio")}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-white font-medium px-3">
                  <div className="flex items-center gap-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSort("retirado_por")}
                    >
                      <span>Retirado por</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-7 w-7 p-0 hover:bg-white/20 ${
                          sorting.column === "retirado_por" ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FilterDropdown
                      title="Retirado por"
                      options={Array.from(new Set(retiradas.map(r => r.retirado_por)))}
                      selectedOptions={filters.retirado_por || new Set()}
                      onOptionToggle={(option) => handleFilterToggle("retirado_por", option)}
                      onClear={() => handleClearFilter("retirado_por")}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-white font-medium px-3">
                  <div className="flex items-center gap-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSort("data_retirada")}
                    >
                      <span>Data de Retirada</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-7 w-7 p-0 hover:bg-white/20 ${
                          sorting.column === "data_retirada" ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FilterDropdown
                      title="Data de Retirada"
                      options={Array.from(new Set(retiradas.map(r => formatDate(r.data_retirada))))}
                      selectedOptions={filters.data_retirada || new Set()}
                      onOptionToggle={(option) => handleFilterToggle("data_retirada", option)}
                      onClear={() => handleClearFilter("data_retirada")}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-white font-medium px-3">
                  <div className="flex items-center gap-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSort("frota_instalada")}
                    >
                      <span>Frota Instalada</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-7 w-7 p-0 hover:bg-white/20 ${
                          sorting.column === "frota_instalada" ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FilterDropdown
                      title="Frota Instalada"
                      options={Array.from(new Set(retiradas.map(r => r.frota_instalada)))}
                      selectedOptions={filters.frota_instalada || new Set()}
                      onOptionToggle={(option) => handleFilterToggle("frota_instalada", option)}
                      onClear={() => handleClearFilter("frota_instalada")}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-white font-medium px-3">
                  <div className="flex items-center gap-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSort("entregue_por")}
                    >
                      <span>Entregue por</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-7 w-7 p-0 hover:bg-white/20 ${
                          sorting.column === "entregue_por" ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FilterDropdown
                      title="Entregue por"
                      options={Array.from(new Set(retiradas.map(r => r.entregue_por)))}
                      selectedOptions={filters.entregue_por || new Set()}
                      onOptionToggle={(option) => handleFilterToggle("entregue_por", option)}
                      onClear={() => handleClearFilter("entregue_por")}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-white font-medium px-3">
                  <div className="flex items-center gap-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSort("retirado")}
                    >
                      <span>Status</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-7 w-7 p-0 hover:bg-white/20 ${
                          sorting.column === "retirado" ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <FilterDropdown
                      title="Status"
                      options={["Retirado", "Devolvido"]}
                      selectedOptions={filters.retirado || new Set()}
                      onOptionToggle={(option) => handleFilterToggle("retirado", option)}
                      onClear={() => handleClearFilter("retirado")}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-white font-medium w-[100px] px-3">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[47px] text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-[47px] text-center">
                    Nenhuma retirada encontrada
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedData.map((retirada) => (
                    <TableRow key={retirada.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="px-3 py-0 border-x border-gray-100">{retirada.codigo_patrimonio}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{retirada.retirado_por}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{formatDate(retirada.data_retirada)}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{retirada.frota_instalada}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{retirada.entregue_por}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          retirada.retirado ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                        }`}>
                          {retirada.retirado ? "Retirado" : "Devolvido"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelectedRetirada(retirada)}
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
                        {Array(8).fill(0).map((_, colIndex) => (
                          <TableCell key={`empty-cell-${colIndex}`} className="px-3 py-0 border-x border-gray-100">&nbsp;</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </>
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

      {selectedRetirada && (
        <RetiradaDetailsModal
          open={!!selectedRetirada}
          onOpenChange={(open) => !open && setSelectedRetirada(null)}
          retirada={selectedRetirada}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
} 