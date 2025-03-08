"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { NovoUsuarioModal } from "@/components/novo-usuario-modal"
import { EditarUsuarioModal } from "@/components/editar-usuario-modal"
import { UsuarioDetailsModal } from "@/components/usuario-details-modal"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { User, NovoUsuarioData, UpdateUsuarioData } from "@/types/user"
import { userService } from "@/services/userService"

interface FilterState {
  [key: string]: Set<string>
}

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
  const [selectedUsuarioForEdit, setSelectedUsuarioForEdit] = useState<User | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const { toast } = useToast()

  const rowsPerPage = 15

  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await userService.getUsers()
      setUsuarios(data)
    } catch (err) {
      console.error("Error fetching usuarios:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários")
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  const handleCreateUsuario = async (formData: NovoUsuarioData) => {
    try {
      await userService.createUser(formData)
      await fetchUsuarios()
      setIsModalOpen(false)
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      })
    } catch (error) {
      console.error("Error creating usuario:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleEditUsuario = async (id: string, updates: UpdateUsuarioData) => {
    try {
      await userService.updateUser(id, updates)
      await fetchUsuarios()
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao editar usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao editar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleDeleteUsuario = async (id: string) => {
    try {
      await userService.deleteUser(id)
      await fetchUsuarios()
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      })
    } catch (error) {
      console.error("Error deleting usuario:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    // Primeiro aplica o filtro de busca
    const matchesSearch = Object.values(usuario).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ) || 
    Object.values(usuario.profile).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Depois aplica os filtros de coluna
    const matchesFilters = Object.entries(filters).every(([columnKey, selectedOptions]) => {
      if (selectedOptions.size === 0) return true
      
      let value = ""
      if (columnKey === "nome") value = usuario.profile.nome
      else if (columnKey === "email") value = usuario.email
      else if (columnKey === "cargo") value = usuario.profile.cargo || ""
      else if (columnKey === "tipo") value = usuario.profile.adminProfile ? "Administrador" : "Usuário"
      
      return selectedOptions.has(value)
    })

    return matchesSearch && matchesFilters
  })

  const filterOptions = {
    nome: Array.from(new Set(usuarios.map(u => u.profile.nome))),
    email: Array.from(new Set(usuarios.map(u => u.email))),
    cargo: Array.from(new Set(usuarios.map(u => u.profile.cargo || "").filter(Boolean))),
    tipo: ["Administrador", "Usuário"]
  }

  const handleFilterToggle = (columnKey: string, option: string) => {
    setFilters(prev => {
      const newFilters = { ...prev }
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
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[columnKey]
      return newFilters
    })
  }

  const columns = [
    { 
      key: "profile" as keyof User,
      title: "Nome",
      render: (value: any, item: User) => item.profile?.nome || ""
    },
    { key: "email" as keyof User, title: "Email" },
    { 
      key: "profile" as keyof User,
      title: "Cargo",
      render: (value: any, item: User) => item.profile?.cargo || ""
    },
    { 
      key: "profile" as keyof User,
      title: "Perfil",
      render: (value: any, item: User) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
          {item.profile?.adminProfile ? "Administrador" : "Usuário"}
        </span>
      )
    },
    {
      key: "profile" as keyof User,
      title: "Último Acesso",
      render: (value: any, item: User) => {
        if (!item.profile?.ultimo_acesso) return "—"
        const date = new Date(item.profile.ultimo_acesso)
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
  ]

  const totalPages = Math.ceil(filteredUsuarios.length / rowsPerPage)

  return (
    <PageLayout
      title="Novo Usuário"
      searchPlaceholder="Buscar usuários..."
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      onNewClick={() => setIsModalOpen(true)}
      isLoading={isLoading}
      error={error}
    >
      <div className="-mx-4">
        <DataTable
          data={filteredUsuarios}
          columns={columns}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
          filters={filters}
          filterOptions={filterOptions}
          onFilterToggle={handleFilterToggle}
          onFilterClear={handleClearFilter}
          actions={(usuario) => (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedUsuario(usuario)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={() => setSelectedUsuarioForEdit(usuario)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={() => handleDeleteUsuario(usuario.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </div>

      <NovoUsuarioModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateUsuario}
      />

      {selectedUsuario && (
        <UsuarioDetailsModal
          open={!!selectedUsuario}
          onOpenChange={(open) => !open && setSelectedUsuario(null)}
          usuario={selectedUsuario}
        />
      )}

      {selectedUsuarioForEdit && (
        <EditarUsuarioModal
          open={!!selectedUsuarioForEdit}
          onOpenChange={(open) => !open && setSelectedUsuarioForEdit(null)}
          onUsuarioEdited={(updates) => {
            handleEditUsuario(selectedUsuarioForEdit.id, updates)
            setSelectedUsuarioForEdit(null)
          }}
          usuarioData={selectedUsuarioForEdit}
        />
      )}
    </PageLayout>
  )
} 