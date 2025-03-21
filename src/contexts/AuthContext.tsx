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
          ultimo_acesso: profile.ultimo_acesso
        },
      }

      setUser(userData)
      sessionStorage.setItem('user_profile', JSON.stringify(userData))
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      const cachedUser = sessionStorage.getItem('user_profile')
      if (cachedUser) {
        setUser(JSON.parse(cachedUser))
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Erro ao obter sessão:', error)
      return
    }
    if (session?.user) {
      await fetchUserProfile(session.user.id)
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const cachedUser = sessionStorage.getItem('user_profile')
        if (cachedUser && mounted) {
          setUser(JSON.parse(cachedUser))
          setLoading(false)
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (session?.user && mounted) {
          await fetchUserProfile(session.user.id)
        } else {
          if (mounted) {
            setUser(null)
            sessionStorage.removeItem('user_profile')
            setLoading(false)
            if (pathname !== '/login') {
              router.push('/login')
            }
          }
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
        sessionStorage.removeItem('user_profile')
        setLoading(false)
        if (pathname !== '/login') {
          router.push('/login')
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      sessionStorage.removeItem('user_profile')
      router.push('/login')
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