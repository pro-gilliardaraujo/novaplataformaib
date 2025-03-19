"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Frota, Unidade } from "@/types/paradas"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/components/ui/use-toast"

interface ParadasContextType {
  unidades: Unidade[]
  isLoading: boolean
  error: string | null
  selectedUnidade: string
  setSelectedUnidade: (unidade: string) => void
  carregarUnidades: () => Promise<void>
  reloadUnidades: () => Promise<void>
}

const ParadasContext = createContext<ParadasContextType | undefined>(undefined)

export function ParadasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUnidade, setSelectedUnidade] = useState("todas")

  const carregarUnidades = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const { data: unidadesData, error: unidadesError } = await supabase
        .from('unidades')
        .select(`
          *,
          frotas (
            id,
            frota,
            descricao,
            unidade_id
          )
        `)
        .order('nome')

      if (unidadesError) throw unidadesError

      setUnidades(unidadesData || [])
    } catch (error) {
      console.error('Error loading unidades:', error)
      setError("Não foi possível carregar as unidades")
      toast({
        title: "Erro",
        description: "Não foi possível carregar as unidades",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      carregarUnidades()
    }
  }, [user])

  const reloadUnidades = async () => {
    await carregarUnidades()
  }

  const value = {
    unidades,
    isLoading,
    error,
    selectedUnidade,
    setSelectedUnidade,
    carregarUnidades,
    reloadUnidades
  }

  return (
    <ParadasContext.Provider value={value}>
      {children}
    </ParadasContext.Provider>
  )
}

export function useParadas() {
  const context = useContext(ParadasContext)
  if (context === undefined) {
    throw new Error('useParadas must be used within a ParadasProvider')
  }
  return context
} 