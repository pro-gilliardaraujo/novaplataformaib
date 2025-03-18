"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/types/user"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/utils/formatters"
import { GerenciarPermissoesModal } from "@/components/gerenciar-permissoes-modal"
import { UsuarioDetailsModal } from "@/components/usuario-details-modal"

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

interface UsuariosTableProps {
  usuarios: User[]
  onView: (usuario: User) => void
  onEdit: (usuario: User) => void
  onDelete: (id: string) => void
  onManagePermissions: (usuario: User) => void
}

type ColumnType = {
  key: string
  title: string
  getValue: (u: User) => string | boolean | React.ReactNode
}

export function UsuariosTable({ 
  usuarios, 
  onView, 
  onEdit, 
  onDelete,
  onManagePermissions
}: UsuariosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, Set<string>>>({})
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const rowsPerPage = 15
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const getPermissionBadge = (user: User) => {
    const profileLabels: { [key: string]: { label: string; variant: "default" | "secondary" | "outline" | "destructive" } } = {
      global_admin: { label: "Administrador Global", variant: "default" },
      global_viewer: { label: "Visualizador Global", variant: "secondary" },
      regional_admin: { label: "Administrador Regional", variant: "outline" },
      regional_viewer: { label: "Visualizador Regional", variant: "destructive" },
      custom: { label: "Personalizado", variant: "outline" }
    }

    const profile = user.profile.base_profile || "custom"
    const { label, variant } = profileLabels[profile]

    return <Badge variant={variant}>{label}</Badge>
  }

  const columns: ColumnType[] = [
    {
      key: "nome",
      title: "Nome",
      getValue: (u) => u.profile.nome
    },
    {
      key: "email",
      title: "Email",
      getValue: (u) => u.email
    },
    {
      key: "cargo",
      title: "Cargo",
      getValue: (u) => u.profile.cargo || "—"
    },
    {
      key: "permissao",
      title: "Permissão",
      getValue: (u) => getPermissionBadge(u)
    },
    {
      key: "ultimo_acesso",
      title: "Último Acesso",
      getValue: (u) => formatDateTime(u.profile.ultimo_acesso)
    }
  ]

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.key] = Array.from(
          new Set(
            usuarios.map(u => {
              const value = column.getValue(u)
              return typeof value === "boolean" ? (value ? "Administrador" : "Usuário") : String(value)
            }).filter(Boolean)
          )
        )
        return acc
      },
      {} as Record<string, string[]>
    )
  }, [usuarios])

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' }
        }
        return null
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedData = useMemo(() => {
    if (!sortConfig) return usuarios

    return [...usuarios].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key)
      if (!column) return 0

      const aValue = String(column.getValue(a) || '')
      const bValue = String(column.getValue(b) || '')

      if (aValue === bValue) return 0
      
      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [usuarios, sortConfig])

  const filteredData = useMemo(() => {
    return sortedData.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const column = columns.find(col => col.key === key)
        if (!column) return true
        const value = column.getValue(row)
        return typeof value === "string" && selectedOptions.has(value)
      })
    )
  }, [sortedData, filters])

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

  const handleDeleteClick = (usuario: User) => {
    setSelectedUsuario(usuario)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUsuario) return

    setIsLoading(true)
    try {
      await onDelete(selectedUsuario.id)
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
      setSelectedUsuario(null)
    }
  }

  const handlePermissionsClick = (user: User) => {
    setSelectedUsuario(user)
    setShowDetailsModal(true)
  }

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  return (
    <>
      <div className="flex-1 border rounded-lg flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-black sticky top-0">
              <TableRow className="h-[49px]">
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
                      {filterOptions[column.key].length > 0 && (
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
                <TableHead className="text-white font-medium w-[100px] px-3">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((usuario) => (
                <TableRow key={usuario.id} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="px-3 py-0 border-x border-gray-100">
                      {column.getValue(usuario)}
                    </TableCell>
                  ))}
                  <TableCell className="px-3 py-0 border-x border-gray-100">
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setSelectedUsuario(usuario)
                          setShowDetailsModal(true)
                        }}
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
                  <TableRow key={`empty-${index}`} className="h-[49px] border-b border-gray-200">
                    {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                      <TableCell key={`empty-cell-${colIndex}`} className="px-3 py-0 border-x border-gray-100">&nbsp;</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="border-t py-2.5 px-4 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1} a {Math.min(startIndex + rowsPerPage, filteredData.length)} de {filteredData.length} resultados
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

      {selectedUsuario && (
        <UsuarioDetailsModal
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          usuario={selectedUsuario}
          onEdit={onEdit}
          onDelete={onDelete}
          onManagePermissions={onManagePermissions}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário {selectedUsuario?.profile.nome}.
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