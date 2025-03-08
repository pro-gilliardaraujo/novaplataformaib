import { supabase } from "@/lib/supabase"
import { User, NovoUsuarioData, UpdateUsuarioData } from "@/types/user"

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select()
      .order("created_at", { ascending: false })

    if (error) throw error

    return profiles.map(profile => ({
      id: profile.user_id,
      email: profile.user_email,
      created_at: profile.created_at,
      last_sign_in_at: null,
      email_confirmed_at: null,
      profile: {
        id: profile.id,
        created_at: profile.created_at,
        user_id: profile.user_id,
        nome: profile.nome,
        cargo: profile.cargo,
        adminProfile: profile.adminProfile,
        firstLogin: profile.firstLogin,
        user_email: profile.user_email,
        ultimo_acesso: profile.ultimo_acesso
      }
    }))
  },

  async createUser(userData: NovoUsuarioData): Promise<void> {
    console.log("Iniciando criação do usuário:", userData)
    try {
      // Chama a API para criar o usuário
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar usuário")
      }

      console.log("Usuário criado com sucesso")
    } catch (error) {
      console.error("Erro detalhado durante a criação:", error)
      throw new Error("Não foi possível criar o usuário. Por favor, tente novamente.")
    }
  },

  async updateUser(userId: string, updates: UpdateUsuarioData) {
    console.log("Iniciando atualização do usuário:", { userId, updates })

    try {
      const response = await fetch("/api/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, updates }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro ao atualizar usuário:", errorData)
        throw new Error(errorData.error || "Erro ao atualizar usuário")
      }

      console.log("Usuário atualizado com sucesso")
      return await response.json()
    } catch (error) {
      console.error("Erro detalhado na atualização:", error)
      throw error
    }
  },

  async deleteUser(id: string): Promise<void> {
    console.log("Iniciando exclusão do usuário com ID:", id)
    try {
      // Primeiro, remove o perfil
      console.log("Tentando remover perfil do usuário...")
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", id)

      if (profileError) {
        console.error("Erro ao deletar perfil:", profileError)
        throw profileError
      }
      console.log("Perfil do usuário removido com sucesso")

      // Em vez de tentar deletar do auth, vamos fazer uma chamada para a API
      console.log("Tentando remover usuário do auth via API...")
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: id }),
      })

      if (!response.ok) {
        throw new Error("Falha ao remover usuário do auth")
      }
      console.log("Usuário removido do auth com sucesso")
    } catch (error) {
      console.error("Erro detalhado durante a exclusão:", error)
      throw new Error("Não foi possível excluir o usuário completamente. Por favor, tente novamente.")
    }
  }
} 