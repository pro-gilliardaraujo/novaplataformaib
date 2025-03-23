import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Configuração do cliente Supabase com armazenamento em sessão
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        getItem: (key) => {
          try {
            if (typeof window === 'undefined') return null
            const item = sessionStorage.getItem(key)
            return item ? JSON.parse(item) : null
          } catch (error) {
            console.error('Error reading from sessionStorage:', error)
            return null
          }
        },
        setItem: (key, value) => {
          try {
            if (typeof window === 'undefined') return
            sessionStorage.setItem(key, JSON.stringify(value))
          } catch (error) {
            console.error('Error writing to sessionStorage:', error)
          }
        },
        removeItem: (key) => {
          try {
            if (typeof window === 'undefined') return
            sessionStorage.removeItem(key)
          } catch (error) {
            console.error('Error removing from sessionStorage:', error)
          }
        }
      }
    }
  }
)

// Adiciona listener para limpar dados ao fechar a aba/janela
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      sessionStorage.clear()
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  })
} 