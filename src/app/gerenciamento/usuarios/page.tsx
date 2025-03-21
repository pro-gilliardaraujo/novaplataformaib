"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { NovoUsuarioModal } from "@/components/novo-usuario-modal"
import { EditarUsuarioModal } from "@/components/editar-usuario-modal"
import { UsuarioDetailsModal } from "@/components/usuario-details-modal"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2, Plus, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { User, NovoUsuarioData, UpdateUsuarioData } from "@/types/user"
import { userService } from "@/services/userService"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UsuariosTable } from "@/components/usuarios-table"

interface FilterState {
  [key: string]: Set<string>
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
  const [isNovoUsuarioModalOpen, setIsNovoUsuarioModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { toast } = useToast()

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
      setIsNovoUsuarioModalOpen(false)
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

  const filteredUsuarios = usuarios.filter(usuario => {
    const searchFields = [
      usuario.profile.nome,
      usuario.email,
      usuario.profile.cargo,
      usuario.profile.adminProfile ? "Administrador" : "Usuário"
    ].join(" ").toLowerCase()

    return searchFields.includes(searchTerm.toLowerCase())
  })

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
          onClick={() => setIsNovoUsuarioModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1">
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
            <UsuariosTable
              usuarios={filteredUsuarios}
              onView={handleViewUsuario}
              onEdit={handleEditClick}
              onDelete={handleDeleteUsuario}
              onManagePermissions={(usuario) => {
                setSelectedUsuario(usuario)
                // You can add state management for permissions modal here if needed
              }}
            />
          )}
        </div>
      </div>

      <NovoUsuarioModal
        open={isNovoUsuarioModalOpen}
        onOpenChange={setIsNovoUsuarioModalOpen}
        onSubmit={handleCreateUsuario}
      />

      {selectedUsuario && (
        <>
          <UsuarioDetailsModal
            usuario={selectedUsuario}
            open={isViewModalOpen}
            onOpenChange={setIsViewModalOpen}
            onEdit={handleEditClick}
            onDelete={handleDeleteUsuario}
            onManagePermissions={(usuario) => {
              setSelectedUsuario(usuario)
              // You can add state management for permissions modal here if needed
            }}
          />

          <EditarUsuarioModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            usuario={selectedUsuario}
            onSuccess={fetchUsuarios}
          />
        </>
      )}
    </div>
  )
} 