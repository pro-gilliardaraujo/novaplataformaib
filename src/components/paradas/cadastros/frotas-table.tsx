"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, X, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { NovaFrotaModal } from "./nova-frota-modal"

interface Frota {
  id: number
  frota: string
  descricao: string
  unidade_id: number
  unidade: {
    nome: string
  }
}

interface FilterState {
  [key: string]: Set<string>
}

interface ColumnType {
  key: string
  title: string
  getValue?: (f: Frota) => string
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

export function FrotasTable() {
  const [frotas, setFrotas] = useState<Frota[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedFrota, setSelectedFrota] = useState<Frota | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [editingDescricao, setEditingDescricao] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15
  const { toast } = useToast()

  const columns: ColumnType[] = [
    { key: "frota", title: "Frota" },
    { key: "descricao", title: "Descrição" },
    { key: "unidade", title: "Unidade", getValue: (f: Frota) => f.unidade?.nome || '-' },
  ]

  async function fetchFrotas() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("frotas")
        .select("*, unidade:unidades(nome)")
        .order("frota")

      if (error) throw error

      setFrotas(data)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar frotas",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFrotas()
  }, [])

  const handleDelete = async () => {
    if (!selectedFrota) return

    try {
      const { error } = await supabase
        .from("frotas")
        .delete()
        .eq("id", selectedFrota.id)

      if (error) throw error

      toast({
        title: "Frota excluída",
        description: "A frota foi excluída com sucesso.",
      })

      fetchFrotas()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir frota",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedFrota(null)
    }
  }

  const handleUpdate = async () => {
    if (!selectedFrota) return

    try {
      const { error } = await supabase
        .from("frotas")
        .update({ descricao: editingDescricao })
        .eq("id", selectedFrota.id)

      if (error) throw error

      setFrotas(frotas.map(frota => 
        frota.id === selectedFrota.id 
          ? { ...frota, descricao: editingDescricao }
          : frota
      ))

      toast({
        title: "Frota atualizada",
        description: "A descrição da frota foi atualizada com sucesso.",
      })

      setShowEditDialog(false)
      setSelectedFrota(null)
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar frota",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (frota: Frota) => {
    setSelectedFrota(frota)
    setEditingDescricao(frota.descricao)
    setShowEditDialog(true)
  }

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        if (column.getValue) {
          acc[column.key] = Array.from(
            new Set(
              frotas.map(item => {
                const value = column.getValue?.(item)
                return value || ''
              }).filter(Boolean)
            ),
          )
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
  }, [frotas])

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

  const filteredData = useMemo(() => {
    return frotas.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const column = columns.find(c => c.key === key)
        const value = column?.getValue ? column.getValue(row) : row[key as keyof Frota]
        return typeof value === "string" && selectedOptions.has(value)
      }) &&
      (search === "" || 
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(search.toLowerCase())
        ))
    )
  }, [frotas, filters, search])

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Input 
          className="max-w-md" 
          placeholder="Buscar frotas..." 
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              <TableHead className="text-white font-medium h-12 w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando frotas...
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
                {paginatedData.map((frota) => (
                  <TableRow key={frota.id} className="h-[44px] hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="py-0 border-x border-gray-100">{frota.frota}</TableCell>
                    <TableCell className="py-0 border-x border-gray-100">{frota.descricao}</TableCell>
                    <TableCell className="py-0 border-x border-gray-100">{frota.unidade.nome}</TableCell>
                    <TableCell className="py-0 border-x border-gray-100">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(frota)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog
                          open={showDeleteDialog && selectedFrota?.id === frota.id}
                          onOpenChange={(isOpen) => {
                            setShowDeleteDialog(isOpen)
                            if (!isOpen) setSelectedFrota(null)
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedFrota(frota)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a frota {frota.frota}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fill empty rows */}
                {paginatedData.length < rowsPerPage && (
                  Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
                    <TableRow key={`empty-${index}`} className="h-[44px] border-b border-gray-200">
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
      </div>

      {/* Modals */}
      <NovaFrotaModal
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        frota={null}
        onFrotaUpdated={fetchFrotas}
      />

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="flex items-center px-4 py-2 border-b relative">
            <DialogTitle className="flex-1 text-center">
              Editar - {selectedFrota?.frota}
            </DialogTitle>
            <DialogClose className="absolute right-2 top-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={editingDescricao}
                onChange={(e) => setEditingDescricao(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditDialog(false)}
              className="bg-gray-100 hover:bg-gray-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate} 
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 