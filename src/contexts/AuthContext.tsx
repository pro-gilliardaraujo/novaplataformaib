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
    console.log('Fetching user profile for:', userId)
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        throw error
      }

      console.log('Profile fetched:', profile)

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
      sessionStorage.setItem('user_profile', JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      const cachedUser = sessionStorage.getItem('user_profile')
      if (cachedUser) {
        console.log('Using cached user profile')
        const parsedUser = JSON.parse(cachedUser)
        setUser(parsedUser)
        return parsedUser
      }
      return null
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
      return await fetchUserProfile(session.user.id)
    }
    return null
  }

  useEffect(() => {
    let mounted = true
    console.log('AuthProvider mounted, pathname:', pathname)

    const initAuth = async () => {
      try {
        // Primeiro, tenta usar o cache
        const cachedUser = sessionStorage.getItem('user_profile')
        if (cachedUser && mounted) {
          console.log('Using cached user profile')
          setUser(JSON.parse(cachedUser))
          setLoading(false) // Reduz o tempo de loading inicial
        }

        // Então verifica a sessão
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Session check result:', { session, error })

        if (error) {
          console.error('Session error:', error)
          throw error
        }

        if (session?.user && mounted) {
          console.log('Valid session found, fetching profile...')
          if (!user) { // Só busca o perfil se não tivermos um usuário
            await fetchUserProfile(session.user.id)
          }
        } else {
          if (mounted) {
            console.log('No valid session')
            setUser(null)
            sessionStorage.removeItem('user_profile')
            if (pathname !== '/login') {
              router.push('/login')
            }
          }
        }
      } catch (error) {
        console.error('Error in initAuth:', error)
        if (mounted) {
          setUser(null)
          sessionStorage.removeItem('user_profile')
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
      console.log('Auth state changed:', event, session?.user?.id)
      if (!mounted) return

      if (session?.user) {
        const userData = await fetchUserProfile(session.user.id)
        if (userData && pathname === '/login') {
          router.push('/')
        }
      } else {
        setUser(null)
        sessionStorage.removeItem('user_profile')
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
      setUser(null)
      
      // Primeiro faz o signOut do Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Depois limpa o storage
      sessionStorage.clear()
      localStorage.clear()
      
      // Por último limpa o cache
      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys()
          await Promise.all(cacheKeys.map(key => caches.delete(key)))
        } catch (error) {
          console.error('Erro ao limpar cache:', error)
        }
      }

      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Força o logout mesmo em caso de erro
      sessionStorage.clear()
      localStorage.clear()
      router.push('/login')
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