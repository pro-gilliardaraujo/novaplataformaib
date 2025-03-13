"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { Frota, FrotaStatus, Parada, Unidade } from "@/types/paradas"
import { supabase } from "@/lib/supabase"

interface ParadasContextType {
  data: string // Data atual no formato YYYY-MM-DD
  setData: (data: string) => void
  statusFrotas: Map<string, FrotaStatus>
  unidades: Unidade[]
  isLoading: boolean
  error: string | null
  atualizarCenario: () => Promise<void>
  frotasSelecionadas: Set<string>
  setFrotasSelecionadas: (frotas: Set<string>) => void
}

const ParadasContext = createContext<ParadasContextType | undefined>(undefined)

export function ParadasProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [statusFrotas, setStatusFrotas] = useState<Map<string, FrotaStatus>>(new Map())
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frotasSelecionadas, setFrotasSelecionadas] = useState<Set<string>>(new Set())

  // Carregar unidades e frotas
  useEffect(() => {
    carregarUnidades()
  }, [])

  const carregarUnidades = async () => {
    try {
      setIsLoading(true)
      // Primeiro busca as unidades
      const { data: unidadesData, error: unidadesError } = await supabase
        .from('unidades')
        .select('*')
        .order('nome')

      if (unidadesError) throw unidadesError

      // Depois busca as frotas
      const { data: frotasData, error: frotasError } = await supabase
        .from('frotas')
        .select('*')

      if (frotasError) throw frotasError

      // Organiza os dados
      const unidadesComFrotas = unidadesData.map(unidade => ({
        ...unidade,
        frotas: frotasData.filter(frota => frota.unidade_id === unidade.id)
      }))

      setUnidades(unidadesComFrotas)
      
      // Start with no frotas selected
      setFrotasSelecionadas(new Set())
      
      await atualizarCenario(unidadesComFrotas, frotasData)
    } catch (err) {
      console.error('Erro ao carregar unidades:', err)
      setError('Erro ao carregar unidades')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar o cenário
  const atualizarCenario = async (unidadesAtuais = unidades, frotas = unidades.flatMap(u => u.frotas || [])) => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Buscar todas as paradas do dia
      const { data: paradasDia, error: paradasError } = await supabase
        .from('paradas')
        .select(`
          *,
          tipo:tipo_parada_id (
            id,
            nome,
            icone
          )
        `)
        .gte('inicio', `${data}T00:00:00`)
        .lte('inicio', `${data}T23:59:59`)

      if (paradasError) throw paradasError

      // 2. Buscar contagem de histórico para cada frota
      const historicoPromises = frotas.map(async (frota) => {
        const { count } = await supabase
          .from('paradas')
          .select('*', { count: 'exact', head: true })
          .eq('frota_id', frota.id)
          .gte('inicio', `${data}T00:00:00`)
          .lte('inicio', `${data}T23:59:59`)

        return { frotaId: frota.id, count: count || 0 }
      })

      const historicoCounts = await Promise.all(historicoPromises)

      // 3. Montar o mapa de status
      const novoStatus = new Map<string, FrotaStatus>()

      frotas.forEach(frota => {
        const paradasFrota = paradasDia?.filter(p => 
          p.frota_id === frota.id && !p.fim
        ) || []

        const historicoCount = historicoCounts.find(h => 
          h.frotaId === frota.id
        )?.count || 0

        novoStatus.set(frota.id, {
          frota,
          parada_atual: paradasFrota[0] || null,
          historico_count: historicoCount
        })
      })

      setStatusFrotas(novoStatus)
    } catch (err) {
      console.error('Erro ao atualizar cenário:', err)
      setError('Erro ao atualizar cenário')
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    data,
    setData,
    statusFrotas,
    unidades,
    isLoading,
    error,
    atualizarCenario: () => atualizarCenario(),
    frotasSelecionadas,
    setFrotasSelecionadas
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