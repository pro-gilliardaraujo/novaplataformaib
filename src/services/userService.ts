import { supabase } from "@/lib/supabase"
import { NovoUsuarioData, UpdateUsuarioData, User } from "@/types/user"
import { normalizeText } from "@/utils/formatters"

function generateEmail(nome: string): string {
  const normalizedName = normalizeText(nome)
  const [firstName, ...rest] = normalizedName.split(" ")
  const lastName = rest.length > 0 ? rest[rest.length - 1] : ""
  return `${firstName}${lastName ? "." + lastName : ""}@ib.logistica`
}

interface SupabaseUser {
  id: string
  email: string
  created_at: string
  profile: {
    nome: string
    cargo: string | null
    adminProfile: boolean
    firstLogin: boolean
    ultimo_acesso: string | null
  }
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return profiles.map(profile => ({
      id: profile.user_id,
      email: profile.user_email,
      created_at: profile.created_at,
      profile: {
        nome: profile.nome,
        cargo: profile.cargo || undefined,
        adminProfile: profile.adminProfile,
        firstLogin: profile.firstLogin,
        ultimo_acesso: profile.ultimo_acesso || undefined
      }
    }))
  },

  async createUser(userData: NovoUsuarioData): Promise<void> {
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
  },

  async updateUser(id: string, updates: UpdateUsuarioData) {
    const response = await fetch("/api/users/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id, updates }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erro ao atualizar usuário")
    }
  },

  async deleteUser(id: string) {
    const response = await fetch("/api/users/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erro ao excluir usuário")
    }
  }
} 