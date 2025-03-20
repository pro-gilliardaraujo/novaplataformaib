"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Unidade, FrotaStatus, Parada } from "@/types/paradas"
import { Frota } from "@/types/frotas"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/components/ui/use-toast"
import { paradasService } from "@/services/paradasService"

interface ParadasContextType {
  unidades: Unidade[]
  isLoading: boolean
  error: string | null
  selectedUnidade: string
  data: string
  statusFrotas: Record<string, FrotaStatus>
  setSelectedUnidade: (unidade: string) => void
  carregarUnidades: () => Promise<void>
  reloadUnidades: () => Promise<void>
  atualizarCenario: () => Promise<void>
}

const ParadasContext = createContext<ParadasContextType | undefined>(undefined)

export function ParadasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUnidade, setSelectedUnidade] = useState("todas")
  const [data, setData] = useState("")
  const [statusFrotas, setStatusFrotas] = useState<Record<string, FrotaStatus>>({})

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

  const atualizarCenario = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Get today's date in America/Sao_Paulo timezone
      const hoje = new Date()
      hoje.setHours(hoje.getHours() - 3)
      const hojeISO = hoje.toISOString().split('T')[0]
      setData(hojeISO)

      // Get all paradas for today
      const paradas = await paradasService.buscarParadasDia(hojeISO)

      // Update status for each frota
      const newStatusFrotas: Record<string, FrotaStatus> = {}
      unidades.forEach(unidade => {
        unidade.frotas?.forEach(frota => {
          const frotaParadas = paradas.filter((p: Parada) => p.frota_id === frota.id)
          const parada_atual = frotaParadas.find((p: Parada) => !p.fim)
          newStatusFrotas[frota.id] = {
            frota,
            parada_atual: parada_atual || null,
            historico_count: frotaParadas.length
          }
        })
      })

      setStatusFrotas(newStatusFrotas)
    } catch (error) {
      console.error('Error updating scenario:', error)
      setError("Não foi possível atualizar o cenário")
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cenário",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      carregarUnidades()
      atualizarCenario()
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
    data,
    statusFrotas,
    setSelectedUnidade,
    carregarUnidades,
    reloadUnidades,
    atualizarCenario
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