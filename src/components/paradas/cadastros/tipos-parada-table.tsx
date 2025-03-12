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
import { IconSelectorDialog } from "@/components/icon-selector-dialog"
import { renderIcon } from "@/utils/icons"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { NovoTipoParadaModal } from "./novo-tipo-parada-modal"

interface TipoParada {
  id: number
  nome: string
  icone: string
  created_at: string
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

export function TiposParadaTable() {
  const [tipos, setTipos] = useState<TipoParada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedTipo, setSelectedTipo] = useState<TipoParada | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showIconSelector, setShowIconSelector] = useState(false)
  const [editingNome, setEditingNome] = useState("")
  const [editingIcone, setEditingIcone] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15
  const { toast } = useToast()

  const columns = [
    { key: "nome", title: "Nome" },
    { key: "icone", title: "Ícone" },
  ] as const

  async function fetchTipos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tipos_parada")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setTipos(data)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tipos de parada",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTipos()
  }, [])

  const handleDelete = async () => {
    if (!selectedTipo) return

    try {
      const { error } = await supabase
        .from("tipos_parada")
        .delete()
        .eq("id", selectedTipo.id)

      if (error) throw error

      toast({
        title: "Tipo de parada excluído",
        description: "O tipo de parada foi excluído com sucesso.",
      })

      fetchTipos()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir tipo de parada",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedTipo(null)
    }
  }

  const handleUpdate = async () => {
    if (!selectedTipo) return

    try {
      const { error } = await supabase
        .from("tipos_parada")
        .update({ 
          nome: editingNome,
          icone: editingIcone 
        })
        .eq("id", selectedTipo.id)

      if (error) throw error

      setTipos(tipos.map(tipo => 
        tipo.id === selectedTipo.id 
          ? { ...tipo, nome: editingNome, icone: editingIcone }
          : tipo
      ))

      toast({
        title: "Tipo de parada atualizado",
        description: "O tipo de parada foi atualizado com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar tipo de parada",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setShowEditDialog(false)
      setSelectedTipo(null)
    }
  }

  const handleEditClick = (tipo: TipoParada) => {
    setSelectedTipo(tipo)
    setEditingNome(tipo.nome)
    setEditingIcone(tipo.icone)
    setShowEditDialog(true)
  }

  const handleIconSelect = (iconName: string) => {
    setEditingIcone(iconName)
    setShowIconSelector(false)
  }

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.key] = Array.from(
          new Set(
            tipos
              .map((item) => item[column.key as keyof TipoParada])
              .filter((value): value is string => typeof value === "string"),
          ),
        )
        return acc
      },
      {} as Record<string, string[]>,
    )
  }, [tipos])

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
    return tipos.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const value = row[key as keyof TipoParada]
        return typeof value === "string" && selectedOptions.has(value)
      }) &&
      (search === "" || 
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(search.toLowerCase())
        ))
    )
  }, [tipos, filters, search])

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Input 
          className="max-w-md" 
          placeholder="Buscar tipos de parada..." 
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Tipo
        </Button>
      </div>

      {/* Table Container */}
      <div className="flex-1 border rounded-lg flex flex-col min-h-0">
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
                <TableCell colSpan={3} className="text-center py-8">
                  Carregando tipos de parada...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Nenhum tipo de parada encontrado
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedData.map((tipo) => (
                  <TableRow key={tipo.id} className="h-[44px] hover:bg-gray-50 border-b border-gray-200">
                    <TableCell className="py-0 border-x border-gray-100">{tipo.nome}</TableCell>
                    <TableCell className="py-0 border-x border-gray-100">{renderIcon(tipo.icone)}</TableCell>
                    <TableCell className="py-0 border-x border-gray-100">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClick(tipo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog
                          open={showDeleteDialog && selectedTipo?.id === tipo.id}
                          onOpenChange={(isOpen) => {
                            setShowDeleteDialog(isOpen)
                            if (!isOpen) setSelectedTipo(null)
                          }}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedTipo(tipo)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o tipo de parada {tipo.nome}.
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
        <div className="border-t py-2.5 px-4 flex items-center justify-between bg-white mt-auto">
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
      <NovoTipoParadaModal
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onSuccess={fetchTipos}
      />

      {selectedTipo && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="flex items-center px-4 py-2 border-b relative">
              <DialogTitle className="flex-1 text-center">
                Editar tipo de parada - {selectedTipo.nome}
              </DialogTitle>
              <DialogClose className="absolute right-2 top-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={editingNome}
                  onChange={(e) => setEditingNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border rounded-md flex items-center justify-center">
                    {editingIcone ? renderIcon(editingIcone) : "—"}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowIconSelector(true)}
                  >
                    Alterar Ícone
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} className="bg-black hover:bg-black/90">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <IconSelectorDialog
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        onSelectIcon={handleIconSelect}
        itemName={selectedTipo?.nome || ""}
        itemType="tipo"
      />
    </div>
  )
} 