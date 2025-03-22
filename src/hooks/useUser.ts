import { useState, useEffect } from 'react'
import { createClient, User } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface UserWithEmail extends User {
  email: string
}

export function useUser() {
  const [user, setUser] = useState<UserWithEmail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Busca o usuário atual
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setUser(user as UserWithEmail)
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Inscreve para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUser(session.user as UserWithEmail)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
} 