"use client"

import { useState, useEffect } from "react"
import { UsuariosTable } from "@/components/usuarios-table"
import { NovoUsuarioModal } from "@/components/novo-usuario-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { User, NovoUsuarioData, UpdateUsuarioData } from "@/types/user"
import { useToast } from "@/components/ui/use-toast"
import { userService } from "@/services/users"

export default function UsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<User[]>([])
  const { toast } = useToast()

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await userService.getUsers()
      setUsuarios(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Erro ao carregar usuários. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const handleCreateUsuario = async (formData: NovoUsuarioData) => {
    try {
      await userService.createUser(formData)
      await fetchUsuarios() // Recarrega a lista após criar
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      })
      setIsModalOpen(false)
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

  const handleUpdateUsuario = async (id: string, updates: UpdateUsuarioData) => {
    try {
      await userService.updateUser(id, updates)
      toast({
        title: "Usuário Atualizado",
        description: "Usuário atualizado com sucesso!",
      })
      await fetchUsuarios()
    } catch (error) {
      console.error("Error updating user:", error)
      throw new Error("Erro ao atualizar usuário")
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

  const filteredUsuarios = usuarios.filter(u => 
    Object.values(u).some(value => 
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    Object.values(u.profile).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

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
            <UsuariosTable 
              usuarios={filteredUsuarios}
              onView={(usuario) => {/* Implementar visualização */}}
              onEdit={(usuario) => {/* Implementar edição */}}
              onDelete={handleDeleteUsuario}
            />
          )}
        </div>
      </div>

      <NovoUsuarioModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateUsuario}
      />
    </div>
  )
} 