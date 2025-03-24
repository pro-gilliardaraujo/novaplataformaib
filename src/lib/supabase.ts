import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Configuração do cliente Supabase com opções otimizadas
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sb-auth-token',
      storage: {
        getItem: (key) => {
          try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) : null
          } catch (error) {
            console.error('Error reading from localStorage:', error)
            return null
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, JSON.stringify(value))
          } catch (error) {
            console.error('Error writing to localStorage:', error)
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key)
          } catch (error) {
            console.error('Error removing from localStorage:', error)
          }
        }
      }
    }
  }
) 