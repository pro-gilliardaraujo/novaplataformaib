"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/types/user"
import { userService } from "@/services/userService"
import { GerenciarPermissoesModal } from "@/components/gerenciar-permissoes-modal"

export default function PermissoesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalMode, setModalMode] = useState<"view" | "edit">("view")
  const { toast } = useToast()
  const rowsPerPage = 15

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await userService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      setError("Não foi possível carregar os usuários.")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const searchFields = [
      user.profile.nome,
      user.email,
      user.profile.cargo,
      user.profile.adminProfile ? "Administrador" : "Usuário"
    ].join(" ").toLowerCase()

    return searchFields.includes(searchTerm.toLowerCase())
  })

  const columns = [
    { 
      key: "profile" as keyof User,
      title: "Nome",
      render: (value: any, item: User) => item.profile?.nome || ""
    },
    { key: "email" as keyof User, title: "Email" },
    { 
      key: "profile" as keyof User,
      title: "Perfil Base",
      render: (value: any, item: User) => {
        const baseProfile = item.profile?.base_profile || "custom"
        const profileLabels: { [key: string]: string } = {
          global_admin: "Administrador Global",
          global_viewer: "Visualizador Global",
          regional_admin: "Administrador Regional",
          regional_viewer: "Visualizador Regional",
          custom: "Customizado"
        }
        return profileLabels[baseProfile] || baseProfile
      }
    },
    { 
      key: "profile" as keyof User,
      title: "Unidade",
      render: (value: any, item: User) => item.profile?.unit_id || "—"
    }
  ]

  const actions = (user: User) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleViewPermissions(user)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleEditPermissions(user)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  )

  const handleViewPermissions = (user: User) => {
    setSelectedUser(user)
    setModalMode("view")
  }

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user)
    setModalMode("edit")
  }

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  return (
    <>
      <PageLayout
        title="Nova Permissão"
        searchPlaceholder="Buscar por nome, email..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onNewClick={() => {}}
        isLoading={isLoading}
        error={error}
      >
        <DataTable
          data={paginatedUsers}
          columns={columns}
          actions={actions}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          rowsPerPage={rowsPerPage}
        />
      </PageLayout>

      {selectedUser && (
        <GerenciarPermissoesModal
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          user={selectedUser}
          mode={modalMode}
        />
      )}
    </>
  )
} 