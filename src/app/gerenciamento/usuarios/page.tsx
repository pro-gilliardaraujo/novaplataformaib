"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { NovoUsuarioModal } from "@/components/novo-usuario-modal"
import { EditarUsuarioModal } from "@/components/editar-usuario-modal"
import { UsuarioDetailsModal } from "@/components/usuario-details-modal"
import { GerenciarPermissoesModal } from "@/components/gerenciar-permissoes-modal"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2, Plus, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { User, NovoUsuarioData, UpdateUsuarioData } from "@/types/user"
import { userService } from "@/services/userService"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [isNovoUsuarioModalOpen, setIsNovoUsuarioModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPermissoesModalOpen, setIsPermissoesModalOpen] = useState(false)
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

  const handleViewUsuario = (usuario: User) => {
    setSelectedUsuario(usuario)
    setIsViewModalOpen(true)
  }

  const handleEditClick = (usuario: User) => {
    setSelectedUsuario(usuario)
    setIsEditModalOpen(true)
  }

  const handleManagePermissions = (usuario: User) => {
    setSelectedUsuario(usuario)
    setIsPermissoesModalOpen(true)
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
      title: "Permissão",
      render: (value: any, item: User) => {
        const permissionType = item.profile?.base_profile || "custom";
        const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
          admin: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-700/10" },
          manager: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-700/10" },
          user: { bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-700/10" },
          custom: { bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-700/10" }
        };
        const colors = colorMap[permissionType] || colorMap.custom;
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors.bg} ${colors.text} ${colors.ring}`}>
            {permissionType.charAt(0).toUpperCase() + permissionType.slice(1)}
          </span>
        );
      }
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
    <div className="h-screen flex flex-col p-4 bg-white">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-3 bg-white">
        <Input 
          className="max-w-md" 
          placeholder="Buscar usuários..." 
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Table with fixed height */}
        <div className="flex-1">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">Carregando usuários...</div>
          ) : (
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
                    onClick={() => handleViewUsuario(usuario)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0"
                    onClick={() => handleEditClick(usuario)}
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
          )}
        </div>
      </div>

      <NovoUsuarioModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateUsuario}
      />

      {selectedUsuario && (
        <>
          <UsuarioDetailsModal
            usuario={selectedUsuario}
            open={isViewModalOpen}
            onOpenChange={setIsViewModalOpen}
          />

          <EditarUsuarioModal
            usuarioData={selectedUsuario}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onUsuarioEdited={(updates) => {
              handleEditUsuario(selectedUsuario.id, updates)
              setIsEditModalOpen(false)
            }}
          />

          <GerenciarPermissoesModal
            open={isPermissoesModalOpen}
            onOpenChange={setIsPermissoesModalOpen}
            user={selectedUsuario}
            mode="edit"
          />
        </>
      )}
    </div>
  )
} 