"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Filter, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/types/user"
import { Badge } from "@/components/ui/badge"

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
  onDelete
}: UsuariosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, Set<string>>>({})
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const rowsPerPage = 15

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    // Ajusta para o fuso horário local
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

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
      getValue: (u) => formatDate(u.profile.ultimo_acesso)
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

  const filteredData = useMemo(() => {
    return usuarios.filter((row) =>
      Object.entries(filters).every(([key, selectedOptions]) => {
        if (selectedOptions.size === 0) return true
        const column = columns.find(col => col.key === key)
        if (!column) return true
        const value = column.getValue(row)
        return typeof value === "string" && selectedOptions.has(value)
      })
    )
  }, [usuarios, filters])

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
    console.log("Iniciando processo de exclusão para:", usuario)
    setSelectedUsuario(usuario)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUsuario) {
      console.log("Nenhum usuário selecionado para exclusão")
      return
    }

    console.log("Confirmada exclusão do usuário:", selectedUsuario)
    setIsLoading(true)
    try {
      console.log("Chamando função onDelete com id:", selectedUsuario.id)
      await onDelete(selectedUsuario.id)
      console.log("Usuário excluído com sucesso")
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      })
    } catch (error) {
      console.error("Erro detalhado ao excluir usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
      setSelectedUsuario(null)
    }
  }

  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-black hover:bg-black">
            {columns.map((column) => (
              <TableHead key={column.key} className="text-white h-9">
                <div className="flex items-center gap-2">
                  {column.title}
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
            <TableHead className="text-white text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((usuario) => (
            <TableRow key={usuario.id}>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.getValue(usuario)}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(usuario)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(usuario)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(usuario)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 