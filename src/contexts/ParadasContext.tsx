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
  const [frotasSelecionadas, setFrotasSelecionadas] = useState<Set<string>>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('frotasSelecionadas')
    if (!saved) return new Set<string>()
    try {
      const parsedData = JSON.parse(saved) as string[]
      return new Set<string>(parsedData)
    } catch {
      return new Set<string>()
    }
  })

  // Save to localStorage whenever frotasSelecionadas changes
  useEffect(() => {
    const arrayFromSet = Array.from(frotasSelecionadas)
    localStorage.setItem('frotasSelecionadas', JSON.stringify(arrayFromSet))
  }, [frotasSelecionadas])

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
      
      // Load saved frotas or start with none selected
      const savedFrotas = localStorage.getItem('frotasSelecionadas')
      if (savedFrotas) {
        try {
          const parsedData = JSON.parse(savedFrotas) as string[]
          setFrotasSelecionadas(new Set<string>(parsedData))
        } catch {
          setFrotasSelecionadas(new Set<string>())
        }
      }
      
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
    console.log('Updating scenario...');
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
      
      console.log('Found paradas:', paradasDia);

      // 2. Buscar contagem de histórico para cada frota (incluindo paradas finalizadas)
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
      console.log('History counts:', historicoCounts);

      // 3. Montar o mapa de status
      const novoStatus = new Map<string, FrotaStatus>()

      frotas.forEach(frota => {
        // Get active parada (without fim)
        const paradasFrota = paradasDia?.filter(p => 
          p.frota_id === frota.id && !p.fim
        ) || []

        // Get history count including both active and completed paradas
        const historicoCount = historicoCounts.find(h => 
          h.frotaId === frota.id
        )?.count || 0

        novoStatus.set(frota.id, {
          frota,
          parada_atual: paradasFrota[0] || null,
          historico_count: historicoCount
        })
      })

      console.log('New status map:', Object.fromEntries(novoStatus));
      setStatusFrotas(novoStatus)
    } catch (error) {
      console.error('Error updating scenario:', error)
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