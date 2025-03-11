"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { User, NovoUsuarioData } from "@/types/user"
import { UsuariosTable } from "@/components/usuarios-table"
import { NovoUsuarioModal } from "@/components/novo-usuario-modal"
import { EditarUsuarioModal } from "@/components/editar-usuario-modal"
import { UsuarioDetailsModal } from "@/components/usuario-details-modal"
import { userService } from "@/services/userService"
import { useAuth } from "@/hooks/useAuth"

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNovoUsuarioModal, setShowNovoUsuarioModal] = useState(false)
  const [showEditarUsuarioModal, setShowEditarUsuarioModal] = useState(false)
  const [showUsuarioDetailsModal, setShowUsuarioDetailsModal] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      setIsLoading(true)
      const data = await userService.getUsers()
      setUsuarios(data)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = (usuario: User) => {
    setSelectedUsuario(usuario)
    setShowUsuarioDetailsModal(true)
  }

  const handleEdit = (usuario: User) => {
    setSelectedUsuario(usuario)
    setShowEditarUsuarioModal(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await userService.deleteUser(id)
      await loadUsuarios()
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleCreateUser = async (data: NovoUsuarioData) => {
    try {
      await userService.createUser(data)
      await loadUsuarios()
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      throw error
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowNovoUsuarioModal(true)}>
            Novo Usuário
          </Button>
        </div>
      </div>

      <UsuariosTable
        usuarios={usuarios}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showNovoUsuarioModal && (
        <NovoUsuarioModal
          open={showNovoUsuarioModal}
          onOpenChange={setShowNovoUsuarioModal}
          onSubmit={handleCreateUser}
        />
      )}

      {showEditarUsuarioModal && selectedUsuario && (
        <EditarUsuarioModal
          open={showEditarUsuarioModal}
          onOpenChange={setShowEditarUsuarioModal}
          usuario={selectedUsuario}
          onSuccess={loadUsuarios}
        />
      )}

      {showUsuarioDetailsModal && selectedUsuario && (
        <UsuarioDetailsModal
          open={showUsuarioDetailsModal}
          onOpenChange={setShowUsuarioDetailsModal}
          usuario={selectedUsuario}
        />
      )}
    </div>
  )
} 