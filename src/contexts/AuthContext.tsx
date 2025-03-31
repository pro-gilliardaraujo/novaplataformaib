"use client"

import { createContext, useContext, useState } from "react"
import { supabase } from "@/lib/supabase"
import { User as CustomUser } from "@/types/user"

interface AuthContextType {
  user: CustomUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estado inicializado como não carregando e sem usuário
  const [user, setUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Função simplificada de logout
  const signOut = async () => {
    console.log("Sign out chamado, mas sem efeito no modo de desenvolvimento atual")
  }

  // Função simplificada de atualização de usuário
  const refreshUser = async () => {
    console.log("Refresh user chamado, mas sem efeito no modo de desenvolvimento atual")
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