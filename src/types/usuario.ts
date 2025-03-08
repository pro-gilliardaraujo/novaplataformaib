export interface Usuario {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  profile: {
    id: string
    created_at: string
    user_id: string
    nome: string
    cargo: string
    adminProfile: boolean
    firstLogin: boolean
    user_email: string
    ultimo_acesso: string | null
  }
} 