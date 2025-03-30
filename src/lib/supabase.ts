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
            const item = sessionStorage.getItem(key)
            return item ? JSON.parse(item) : null
          } catch (error) {
            console.error('Error reading from sessionStorage:', error)
            return null
          }
        },
        setItem: (key, value) => {
          try {
            sessionStorage.setItem(key, JSON.stringify(value))
          } catch (error) {
            console.error('Error writing to sessionStorage:', error)
          }
        },
        removeItem: (key) => {
          try {
            sessionStorage.removeItem(key)
          } catch (error) {
            console.error('Error removing from sessionStorage:', error)
          }
        }
      }
    },
    global: {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    }
  }
) 