"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { UsuariosTable } from "@/components/usuarios-table"
import { NovoUsuarioModal } from "@/components/novo-usuario-modal"
import { EditarUsuarioModal } from "@/components/editar-usuario-modal"
import { UsuarioDetailsModal } from "@/components/usuario-details-modal"
import { User, NovoUsuarioData, UpdateUsuarioData } from "@/types/user"
import { userService } from "@/services/userService"
import { Input } from "@/components/ui/input"

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isNovoUsuarioModalOpen, setIsNovoUsuarioModalOpen] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchUsuarios = async () => {
    try {
      const data = await userService.getUsers()
      setUsuarios(data)
      setError("")
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Erro ao carregar usuários")
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const handleCreateUsuario = async (userData: NovoUsuarioData) => {
    try {
      await userService.createUser(userData)
      await fetchUsuarios()
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      })
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleEditUsuario = async (userId: string, updates: UpdateUsuarioData) => {
    try {
      await userService.updateUser(userId, updates)
      const updatedUsuarios = usuarios.map(usuario => {
        if (usuario.id === userId) {
          return {
            ...usuario,
            profile: {
              ...usuario.profile,
              ...updates
            }
          }
        }
        return usuario
      })
      setUsuarios(updatedUsuarios)
      setSelectedUsuario(null)
      setIsEditModalOpen(false)
    } catch (error) {
      console.error("Erro ao editar usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao editar usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
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
      console.error("Error deleting user:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário. Por favor, tente novamente.",
        variant: "destructive",
      })
      throw error
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchUsuarios}>Tentar Novamente</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando usuários...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <Input 
          placeholder="Buscar usuários..." 
          className="max-w-md"
        />
        <Button
          onClick={() => setIsNovoUsuarioModalOpen(true)}
          className="bg-black hover:bg-black/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
          <UsuariosTable
            usuarios={usuarios}
            onView={(usuario) => {
              setSelectedUsuario(usuario)
              setIsDetailsModalOpen(true)
            }}
            onEdit={(usuario) => {
              setSelectedUsuario(usuario)
              setIsEditModalOpen(true)
            }}
            onDelete={handleDeleteUsuario}
          />
        </div>
      </div>

      <NovoUsuarioModal
        open={isNovoUsuarioModalOpen}
        onOpenChange={setIsNovoUsuarioModalOpen}
        onUsuarioCreated={handleCreateUsuario}
      />

      {selectedUsuario && (
        <>
          <EditarUsuarioModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onUsuarioEdited={(updates) => handleEditUsuario(selectedUsuario.id, updates)}
            usuarioData={selectedUsuario}
          />

          <UsuarioDetailsModal
            open={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            usuario={selectedUsuario}
          />
        </>
      )}
    </div>
  )
} 