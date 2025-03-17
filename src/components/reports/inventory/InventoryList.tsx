"use client"

import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Edit, Plus, Search, Download, ChevronLeft, ChevronRight, Trash2, Filter, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ItemEstoqueModal } from "@/components/estoque/ItemEstoqueModal"
import { DetalhesItemModal } from "@/components/estoque/DetalhesItemModal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"

interface FilterState {
  [key: string]: Set<string>
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

interface InventoryItem {
  id: string
  descricao: string
  codigo_fabricante: string
  quantidade_atual: number
  observacoes?: string
  category_id: string | undefined
  nivel_minimo?: number
  nivel_critico?: number
  alertas_ativos?: boolean
  categoria?: { id: string; nome: string }
  ultima_movimentacao?: string
}

interface SupabaseItem {
  id: string
  codigo_fabricante: string
  descricao: string
  quantidade_atual: number
  observacoes: string | null
  created_at: string
  updated_at: string
  nivel_minimo: number | null
  nivel_critico: number | null
  alertas_ativos: boolean
  category_id: string | null
  destino_movimentacao: string | null
  frota_destino: string | null
  categoria: {
    id: string
    nome: string
  } | null
}

interface InventoryListProps {
  settings: {
    showFilters: boolean
    showExport: boolean
    columns: string[]
  }
}

interface ItemEstoqueModalProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  categorias: Array<{ id: string; nome: string }>
  defaultValues: InventoryItem
  onSuccess: () => void
}

export default function InventoryList({ settings }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categorias, setCategorias] = useState<Array<{ id: string; nome: string }>>([])
  const [showNewItemModal, setShowNewItemModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const { toast } = useToast()
  const rowsPerPage = 15

  const columns = [
    { key: 'codigo_fabricante', title: 'Código' },
    { key: 'descricao', title: 'Descrição' },
    { key: 'categoria', title: 'Categoria' },
    { key: 'quantidade_atual', title: 'Quantidade' },
    { key: 'ultima_movimentacao', title: 'Última Movimentação' }
  ]

  const filterOptions: Record<string, string[]> = {
    categoria: categorias.map(cat => cat.nome),
    codigo_fabricante: Array.from(new Set(items.map(item => item.codigo_fabricante))),
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleFilterToggle = (columnKey: string, option: string) => {
    setFilters(current => {
      const newFilters = { ...current }
      if (!newFilters[columnKey]) {
        newFilters[columnKey] = new Set([option])
      } else {
        const newSet = new Set(newFilters[columnKey])
        if (newSet.has(option)) {
          newSet.delete(option)
        } else {
          newSet.add(option)
        }
        newFilters[columnKey] = newSet
      }
      return newFilters
    })
  }

  const handleClearFilter = (columnKey: string) => {
    setFilters(current => {
      const newFilters = { ...current }
      delete newFilters[columnKey]
      return newFilters
    })
  }

  const handleViewClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowEditModal(true)
  }

  const handleDeleteClick = async () => {
    if (!selectedItem) return
    try {
      const { error } = await supabase
        .from('itens_estoque')
        .delete()
        .eq('id', selectedItem.id)

      if (error) throw error

      setShowDeleteDialog(false)
      fetchItems()
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso.",
      })
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive"
      })
    }
  }

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            item.codigo_fabricante.toLowerCase().includes(searchLower) ||
            item.descricao.toLowerCase().includes(searchLower)
          )
        }
        return true
      })
      .filter(item => {
        return Object.entries(filters).every(([key, selectedOptions]) => {
          if (selectedOptions.size === 0) return true
          if (key === 'categoria') {
            const categoria = item.categoria?.nome || "Sem Categoria"
            return selectedOptions.has(categoria)
          }
          return selectedOptions.has(item[key as keyof InventoryItem].toString())
        })
      })
      .sort((a, b) => {
        if (!sortConfig) return 0
        const aValue = a[sortConfig.key as keyof InventoryItem]
        const bValue = b[sortConfig.key as keyof InventoryItem]
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
  }, [items, searchTerm, filters, sortConfig])

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      console.log('Fetching inventory items...')
      const { data, error } = await supabase
        .from('itens_estoque')
        .select(`
          *,
          categoria:categorias_item(id, nome)
        `)
        .order('codigo_fabricante')

      if (error) {
        console.error('Supabase error fetching items:', error)
        throw error
      }

      console.log('Received items data:', data)

      const formattedItems: InventoryItem[] = (data || []).map(item => ({
        id: item.id,
        codigo_fabricante: item.codigo_fabricante,
        descricao: item.descricao,
        quantidade_atual: item.quantidade_atual,
        observacoes: item.observacoes || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
        nivel_minimo: item.nivel_minimo || undefined,
        nivel_critico: item.nivel_critico || undefined,
        alertas_ativos: item.alertas_ativos,
        category_id: item.category_id,
        destino_movimentacao: item.destino_movimentacao || undefined,
        frota_destino: item.frota_destino || undefined,
        categoria: item.categoria,
        ultima_movimentacao: item.updated_at // Temporarily using updated_at as the last movement date
      }))

      console.log('Formatted items:', formattedItems)
      setItems(formattedItems)
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens do estoque.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      console.log('Fetching categories...')
      const { data, error } = await supabase
        .from('categorias_item')
        .select('id, nome')
        .order('nome')

      if (error) {
        console.error('Supabase error fetching categories:', error)
        throw error
      }

      console.log('Received categories:', data)
      setCategorias(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchCategorias(), fetchItems()])
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }
    
    loadData()
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[400px]">
          <Input
            placeholder="Buscar por descrição ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-black hover:bg-black/90 text-white h-9"
            onClick={() => setShowNewItemModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Item
          </Button>
          {settings.showExport && (
            <Button variant="outline" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
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
                            sortConfig?.key === column.key ? 'text-white' : 'text-gray-400'
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[47px] text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[47px] text-center">
                    Nenhum item encontrado
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id} className="h-[47px] hover:bg-gray-50 border-b border-gray-200">
                      <TableCell className="px-3 py-0 border-x border-gray-100">{item.codigo_fabricante}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{item.descricao}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">{item.categoria?.nome || "Sem Categoria"}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100 text-right">{item.quantidade_atual}</TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">
                        {item.ultima_movimentacao
                          ? format(new Date(item.ultima_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "Nunca"}
                      </TableCell>
                      <TableCell className="px-3 py-0 border-x border-gray-100">
                        <div className="flex items-center justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewClick(item)}
                            className="h-7 w-7 p-0"
                            title="Detalhes"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Fill empty rows */}
                  {paginatedItems.length < rowsPerPage && (
                    Array(rowsPerPage - paginatedItems.length).fill(0).map((_, index) => (
                      <TableRow key={`empty-${index}`} className="h-[47px] border-b border-gray-200">
                        {Array(6).fill(0).map((_, colIndex) => (
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
            Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredItems.length)} de {filteredItems.length} resultados
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

      {/* Modals */}
      <ItemEstoqueModal
        open={showNewItemModal}
        onOpenChange={setShowNewItemModal}
        categorias={categorias}
        defaultValues={selectedItem}
        onSuccess={() => {
          setShowNewItemModal(false)
          fetchItems()
          toast({
            title: "Sucesso",
            description: "Item criado com sucesso.",
          })
        }}
      />

      {selectedItem && (
        <DetalhesItemModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          item={selectedItem}
          categorias={categorias}
          onSuccess={() => {
            setShowViewModal(false)
            fetchItems()
          }}
        />
      )}

      {showEditModal && selectedItem && (
        <ItemEstoqueModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          categorias={categorias}
          defaultValues={selectedItem}
          onSuccess={() => {
            setShowEditModal(false)
            fetchItems()
          }}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 