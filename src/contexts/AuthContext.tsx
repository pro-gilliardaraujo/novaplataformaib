"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { User as CustomUser } from "@/types/user"

interface AuthContextType {
  user: CustomUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(false) // Iniciando como false para evitar carregamento inicial
  const router = useRouter()
  const pathname = usePathname()

  // Função para limpar todos os dados da sessão
  const clearSessionData = () => {
    setUser(null)
    sessionStorage.clear()
    localStorage.clear()
    
    // Limpar cookies específicos do Supabase
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) throw error

      const userData: CustomUser = {
        id: userId,
        email: profile.user_email,
        created_at: profile.created_at,
        last_sign_in_at: new Date().toISOString(),
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
          ultimo_acesso: profile.ultimo_acesso,
        },
      }

      setUser(userData)
      sessionStorage.setItem('user_profile', JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      clearSessionData()
      return null
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        clearSessionData()
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      clearSessionData()
    }
  }

  // Mantendo apenas o signOut simples
  const signOut = async () => {
    try {
      clearSessionData()
      await supabase.auth.signOut()
      // Remover o redirecionamento para login
      // router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      clearSessionData()
      // Remover o redirecionamento para login
      // router.push('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 