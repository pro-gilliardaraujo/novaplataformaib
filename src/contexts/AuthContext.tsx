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

  console.log('[Auth] Estado inicial:', {
    hasUser: !!user,
    loading,
    pathname
  })

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('[Auth] Buscando perfil do usuário:', userId)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) {
        console.error('[Auth] Erro ao buscar perfil:', error)
        throw error
      }

      console.log('[Auth] Perfil encontrado:', profile)
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
      console.error('[Auth] Erro ao buscar perfil do usuário:', error)
      const cachedUser = sessionStorage.getItem('user_profile')
      if (cachedUser) {
        console.log('[Auth] Usando dados do cache')
        setUser(JSON.parse(cachedUser))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        console.log('[Auth] Iniciando autenticação...')
        
        const cachedUser = sessionStorage.getItem('user_profile')
        if (cachedUser && mounted) {
          console.log('[Auth] Usando dados do cache')
          setUser(JSON.parse(cachedUser))
          setLoading(false)
        }

        console.log('[Auth] Verificando sessão...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('[Auth] Erro ao verificar sessão:', sessionError)
          throw sessionError
        }

        if (session?.user) {
          console.log('[Auth] Sessão ativa encontrada:', session.user.id)
          if (mounted) {
            await fetchUserProfile(session.user.id)
          }
        } else {
          console.log('[Auth] Nenhuma sessão ativa')
          if (mounted) {
            setUser(null)
            sessionStorage.removeItem('user_profile')
            if (pathname !== '/login') {
              router.push('/login')
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Erro na inicialização da autenticação:', error)
        if (mounted) {
          setUser(null)
          sessionStorage.removeItem('user_profile')
          setLoading(false)
          if (pathname !== '/login') {
            router.push('/login')
          }
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Mudança de estado:', event)
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
      console.log('[Auth] Iniciando logout...')
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[Auth] Erro durante logout:', error)
        throw error
      }

      console.log('[Auth] Logout realizado com sucesso')
      setUser(null)
      sessionStorage.removeItem('user_profile')
      
      // Força a limpeza do cache do React Query
      window.location.href = '/login'
    } catch (error) {
      console.error('[Auth] Erro na função de logout:', error)
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      console.log('[Auth] Atualizando usuário...')
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('[Auth] Erro ao obter sessão:', error)
        return
      }
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('[Auth] Erro ao atualizar usuário:', error)
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