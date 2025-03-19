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
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUserProfile = async (userId: string) => {
    try {
      // Usar cache do Supabase para otimizar chamadas repetidas
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
          ultimo_acesso: profile.ultimo_acesso,
        },
      }

      setUser(userData)
      // Armazenar em localStorage para acesso rápido
      localStorage.setItem('user_profile', JSON.stringify(userData))
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      // Tentar recuperar do cache em caso de erro
      const cachedUser = localStorage.getItem('user_profile')
      if (cachedUser) {
        setUser(JSON.parse(cachedUser))
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    const session = await supabase.auth.getSession()
    if (session.data.session?.user) {
      await fetchUserProfile(session.data.session.user.id)
    }
  }

  useEffect(() => {
    // Tentar recuperar do cache primeiro
    const cachedUser = localStorage.getItem('user_profile')
    if (cachedUser) {
      setUser(JSON.parse(cachedUser))
      setLoading(false)
    }

    // Verificar autenticação atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        localStorage.removeItem('user_profile')
        setLoading(false)
        if (pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    })

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        localStorage.removeItem('user_profile')
        setLoading(false)
        if (pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem('user_profile')
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
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