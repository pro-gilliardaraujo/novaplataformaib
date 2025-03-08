"use client"

import { useMemo, useState } from "react"
import { Table } from "@/components/ui/table"
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

export function UsuariosTable({ usuarios, onView, onEdit, onDelete }: UsuariosTableProps) {
  const [filters, setFilters] = useState<Record<string, Set<string>>>({})
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15
  const { toast } = useToast()

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const columns = [
    { key: "nome", title: "Nome", getValue: (u: User) => u.profile.nome },
    { key: "email", title: "Email", getValue: (u: User) => u.email },
    { key: "cargo", title: "Cargo", getValue: (u: User) => u.profile.cargo },
    { key: "perfil", title: "Perfil", getValue: (u: User) => u.profile.adminProfile },
    { key: "ultimo_acesso", title: "Último Acesso", getValue: (u: User) => formatDate(u.profile.ultimo_acesso) },
  ] as const

  const filterOptions = useMemo(() => {
    return columns.reduce(
      (acc, column) => {
        acc[column.key] = Array.from(
          new Set(
            usuarios.map(column.getValue).filter((value): value is string => typeof value === "string")
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
    setIsDeleteDialogOpen(true)
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
      setIsDeleteDialogOpen(false)
      setSelectedUsuario(null)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage)

  return (
    <div className="border border-gray-200 rounded-lg">
      <Table>
        <thead className="bg-black">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="text-white font-medium h-12 px-4">
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
              </th>
            ))}
            <th className="text-white font-medium h-12 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((usuario) => (
            <tr key={usuario.id} className="h-[49px] hover:bg-gray-50 border-b border-gray-200">
              <td className="px-4">{usuario.profile.nome}</td>
              <td className="px-4">{usuario.email}</td>
              <td className="px-4">{usuario.profile.cargo}</td>
              <td className="px-4">
                <Badge
                  className={`${
                    usuario.profile.adminProfile
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {usuario.profile.adminProfile ? "Administrador" : "Usuário"}
                </Badge>
              </td>
              <td className="px-4">{formatDate(usuario.profile.ultimo_acesso)}</td>
              <td className="px-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onView(usuario)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(usuario)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDeleteClick(usuario)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {/* Fill empty rows to maintain fixed height */}
          {paginatedData.length < rowsPerPage && (
            Array(rowsPerPage - paginatedData.length).fill(0).map((_, index) => (
              <tr key={`empty-${index}`} className="h-[49px] border-b border-gray-200">
                {Array(columns.length + 1).fill(0).map((_, colIndex) => (
                  <td key={`empty-cell-${colIndex}`} className="px-4">&nbsp;</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </Table>

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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {selectedUsuario?.profile.nome}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 