"use client"

import { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Eye, Edit, Plus, Search, Download, ChevronLeft, ChevronRight, Trash2, Filter, ArrowUpDown, Check, ChevronsUpDown } from "lucide-react"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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
  categorias: CategoriaItem[]
}

interface CategoriaItem {
  id: string
  nome: string
  cor?: string
}

interface ItemEstoqueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  categorias: CategoriaItem[]
}

interface DetalhesItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
}

interface Column {
  key: keyof InventoryItem
  title: string
  getValue?: (item: InventoryItem) => string
}

interface FilterDropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

function FilterDropdown({ options, value, onChange, placeholder = "Selecione...", label }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`Pesquisar ${label?.toLowerCase() || "opção"}...`} />
          <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => {
                  onChange(option)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option ? "opacity-100" : "opacity-0"
                  )}
                />
                {option}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface FilterState {
  [key: string]: string
}

interface SortConfig {
  key: keyof InventoryItem
  direction: "asc" | "desc"
}

export function InventoryList({ categorias }: InventoryListProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "codigo_fabricante", direction: "asc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  const columns = useMemo(() => [
    { key: "codigo_fabricante", label: "Código" },
    { key: "descricao", label: "Descrição" },
    { key: "categoria", label: "Categoria" },
    { key: "quantidade_atual", label: "Quantidade" },
    { key: "nivel_minimo", label: "Nível Mínimo" },
    { key: "nivel_critico", label: "Nível Crítico" },
    { key: "ultima_movimentacao", label: "Última Movimentação" }
  ], [])

  const filterOptions = useMemo(() => {
    return columns.reduce((acc, column) => {
      if (column.key === "categoria") {
        acc[column.key] = categorias.map(cat => cat.nome)
      } else {
        const uniqueValues = new Set(items.map(item => String(item[column.key as keyof InventoryItem])))
        acc[column.key] = Array.from(uniqueValues).filter(Boolean)
      }
      return acc
    }, {} as Record<string, string[]>)
  }, [columns, items, categorias])

  const filteredAndSortedData = useMemo(() => {
    let filtered = items

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => String(item[key as keyof InventoryItem]) === value)
      }
    })

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const aValue = String(a[sortConfig.key])
      const bValue = String(b[sortConfig.key])
      return sortConfig.direction === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    })
  }, [items, searchTerm, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredAndSortedData.slice(startIndex, endIndex)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("estoque")
        .select("*")
        .order("codigo_fabricante", { ascending: true })

      if (error) throw error

      setItems(data || [])
    } catch (error) {
      console.error("Error fetching items:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens do estoque",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSort = (key: keyof InventoryItem) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }))
  }

  const handleFilter = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === prev[key] ? "" : value
    }))
    setCurrentPage(1)
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleExport = () => {
    const BOM = "\uFEFF"
    const escapeCsvCell = (cell: any) => {
      cell = cell ?? ""
      const stringCell = String(cell)
      if (stringCell.includes(",") || stringCell.includes("\n") || stringCell.includes('"')) {
        return `"${stringCell.replace(/"/g, '""')}"`
      }
      return stringCell
    }

    const headers = [
      "Código",
      "Descrição",
      "Categoria",
      "Quantidade",
      "Nível Mínimo",
      "Nível Crítico",
      "Última Movimentação"
    ]

    const rows = [
      headers.join(","),
      ...filteredAndSortedData.map(item => [
        escapeCsvCell(item.codigo_fabricante),
        escapeCsvCell(item.descricao),
        escapeCsvCell(item.categoria),
        escapeCsvCell(item.quantidade_atual),
        escapeCsvCell(item.nivel_minimo),
        escapeCsvCell(item.nivel_critico),
        escapeCsvCell(item.ultima_movimentacao ? format(new Date(item.ultima_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "")
      ].join(","))
    ]

    const csvContent = BOM + rows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `inventario_${format(new Date(), "dd-MM-yyyy_HH-mm")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Pesquisar..."
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-sm"
        />
        <Button onClick={handleExport}>Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {columns.map(column => (
          <div key={column.key} className="flex flex-col space-y-1">
            <label className="text-sm font-medium">{column.label}</label>
            <FilterDropdown
              options={filterOptions[column.key] || []}
              value={filters[column.key] || ""}
              onChange={(value) => handleFilter(column.key, value)}
              placeholder={`Filtrar por ${column.label.toLowerCase()}`}
              label={column.label}
            />
          </div>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column.key}>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.key as keyof InventoryItem)}
                    className="flex items-center space-x-1"
                  >
                    {column.label}
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.codigo_fabricante}</TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell>{item.categoria}</TableCell>
                <TableCell>{item.quantidade_atual}</TableCell>
                <TableCell>{item.nivel_minimo}</TableCell>
                <TableCell>{item.nivel_critico}</TableCell>
                <TableCell>
                  {item.ultima_movimentacao
                    ? format(new Date(item.ultima_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedItem(item)
                      setIsDetailsModalOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} até {Math.min(endIndex, filteredAndSortedData.length)} de {filteredAndSortedData.length} registros
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ItemEstoqueModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchItems}
        categorias={categorias}
      />

      <DetalhesItemModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        item={selectedItem}
      />
    </div>
  )
} 