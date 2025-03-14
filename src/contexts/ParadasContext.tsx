"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { Frota, FrotaStatus, Parada, Unidade } from "@/types/paradas"
import { supabase } from "@/lib/supabase"
import { scenarioConfigService } from "@/services/scenarioConfigService"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/components/ui/use-toast"

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
  saveScenarioConfig: () => Promise<void>
  columnOrder: string[]
  setColumnOrder: (order: string[]) => void
  unidadeColors: Record<string, string>
  setUnidadeColors: (colors: Record<string, string>) => void
  minimizedColumns: Set<string>
  setMinimizedColumns: (columns: Set<string>) => void
  carregarUnidades: () => Promise<void>
}

const ParadasContext = createContext<ParadasContextType | undefined>(undefined)

const availableColors = [
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-pink-100',
  'bg-orange-100',
  'bg-teal-100',
  'bg-red-100',
  'bg-indigo-100',
  'bg-cyan-100'
]

export function ParadasProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isConfigLoading, setIsConfigLoading] = useState(true)
  const [data, setData] = useState<string>(() => {
    const hoje = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0]
    return hoje
  })
  const [statusFrotas, setStatusFrotas] = useState<Map<string, FrotaStatus>>(new Map())
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Initialize with empty states - will be populated after loading from Supabase
  const [frotasSelecionadas, setFrotasSelecionadas] = useState<Set<string>>(new Set())
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [unidadeColors, setUnidadeColors] = useState<Record<string, string>>({})
  const [minimizedColumns, setMinimizedColumns] = useState<Set<string>>(new Set())
  const [allDateColors, setAllDateColors] = useState<Record<string, Record<string, string>>>({})

  // Load configuration from Supabase
  useEffect(() => {
    const loadConfig = async () => {
      if (!user?.id) {
        setIsConfigLoading(false)
        return
      }

      try {
        const config = await scenarioConfigService.loadConfig(user.id)
        if (config) {
          setColumnOrder(config.column_order)
          setAllDateColors(config.column_colors || {})
          setUnidadeColors(config.column_colors?.[data] || {})
          setMinimizedColumns(new Set(config.minimized_columns))
          setFrotasSelecionadas(new Set(config.selected_frotas))
        }
      } catch (error) {
        console.error('Error loading config:', error)
        // Load from localStorage as fallback
        const savedFrotas = localStorage.getItem('frotasSelecionadas')
        if (savedFrotas) setFrotasSelecionadas(new Set(JSON.parse(savedFrotas)))
        
        const savedOrder = localStorage.getItem('columnOrder')
        if (savedOrder) setColumnOrder(JSON.parse(savedOrder))
        
        const savedColors = localStorage.getItem('unidadeColors')
        if (savedColors) {
          const colors = JSON.parse(savedColors)
          setUnidadeColors(colors)
          setAllDateColors({ [data]: colors })
        }
        
        const savedMinimized = localStorage.getItem('minimizedColumns')
        if (savedMinimized) setMinimizedColumns(new Set(JSON.parse(savedMinimized)))
      } finally {
        setIsConfigLoading(false)
      }
    }

    loadConfig()
  }, [user?.id, data])

  // Load initial data
  useEffect(() => {
    if (!isConfigLoading) {
      carregarUnidades()
    }
  }, [isConfigLoading, data])

  // Update colors when date changes
  useEffect(() => {
    const loadColorsForDate = async () => {
      if (!isConfigLoading && user?.id) {
        try {
          // Reload the latest config from Supabase
          const config = await scenarioConfigService.loadConfig(user.id)
          if (config && config.column_colors) {
            setAllDateColors(config.column_colors)
            const dateColors = config.column_colors[data]
            if (dateColors) {
              setUnidadeColors(dateColors)
            } else {
              // Assign sequential colors for new date
              const newColors = columnOrder.reduce((acc, columnId, index) => {
                acc[columnId] = availableColors[index % availableColors.length]
                return acc
              }, {} as Record<string, string>)
              
              setUnidadeColors(newColors)
              setAllDateColors(prev => ({ ...prev, [data]: newColors }))
            }
          }
        } catch (error) {
          console.error('Error loading colors for date:', error)
        }
      }
    }

    loadColorsForDate()
  }, [data, isConfigLoading, user?.id, columnOrder])

  // Save colors when they change
  const updateUnidadeColor = (unidadeId: string, color: string) => {
    const newColors = { ...unidadeColors, [unidadeId]: color }
    setUnidadeColors(newColors)
    setAllDateColors(prev => ({ ...prev, [data]: newColors }))
  }

  // Save to localStorage when settings change
  useEffect(() => {
    if (!isConfigLoading) {
      localStorage.setItem('columnOrder', JSON.stringify(columnOrder))
    }
  }, [columnOrder, isConfigLoading])

  useEffect(() => {
    if (!isConfigLoading) {
      localStorage.setItem('unidadeColors', JSON.stringify(unidadeColors))
    }
  }, [unidadeColors, isConfigLoading])

  useEffect(() => {
    if (!isConfigLoading) {
      localStorage.setItem('minimizedColumns', JSON.stringify(Array.from(minimizedColumns)))
    }
  }, [minimizedColumns, isConfigLoading])

  useEffect(() => {
    if (!isConfigLoading) {
      localStorage.setItem('frotasSelecionadas', JSON.stringify(Array.from(frotasSelecionadas)))
    }
  }, [frotasSelecionadas, isConfigLoading])

  // Save to Supabase when any settings change
  useEffect(() => {
    if (isConfigLoading || !user?.id) return

    const saveConfig = async () => {
      await saveScenarioConfig()
    }
    
    const timeoutId = setTimeout(saveConfig, 1000)
    return () => clearTimeout(timeoutId)
  }, [columnOrder, allDateColors, minimizedColumns, frotasSelecionadas, user?.id, isConfigLoading])

  // Save scenario config to Supabase
  const saveScenarioConfig = async () => {
    if (!user?.id) return

    try {
      await scenarioConfigService.saveConfig({
        user_id: user.id,
        column_order: columnOrder,
        column_colors: allDateColors,
        minimized_columns: Array.from(minimizedColumns),
        selected_frotas: Array.from(frotasSelecionadas)
      })
    } catch (error) {
      console.error('Error saving scenario config:', error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração do cenário",
        variant: "destructive",
      })
    }
  }

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
      
      // Se não houver frotas selecionadas, seleciona todas por padrão
      if (frotasSelecionadas.size === 0) {
        const todasFrotas = new Set(frotasData.map(frota => frota.id))
        setFrotasSelecionadas(todasFrotas)
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
    setIsLoading(true)
    setError(null)

    try {
      // Convert date to start/end of day in America/Sao_Paulo timezone
      const selectedDate = new Date(data)
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      // 1. Buscar todas as paradas do dia selecionado
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
        .gte('inicio', startOfDay.toISOString())
        .lte('inicio', endOfDay.toISOString())

      if (paradasError) throw paradasError

      // 2. Buscar paradas ativas de dias anteriores (que ainda não foram finalizadas)
      const { data: paradasAtivasAnteriores, error: paradasAtivasError } = await supabase
        .from('paradas')
        .select(`
          *,
          tipo:tipo_parada_id (
            id,
            nome,
            icone
          )
        `)
        .lt('inicio', startOfDay.toISOString())
        .is('fim', null)

      if (paradasAtivasError) throw paradasAtivasError

      // Combinar paradas do dia com paradas ativas anteriores
      const todasParadas = [...(paradasDia || []), ...(paradasAtivasAnteriores || [])]

      // 3. Buscar contagem de histórico para cada frota
      const historicoPromises = frotas.map(async (frota) => {
        const { count } = await supabase
          .from('paradas')
          .select('*', { count: 'exact', head: true })
          .eq('frota_id', frota.id)
          .gte('inicio', startOfDay.toISOString())
          .lte('inicio', endOfDay.toISOString())

        return { frotaId: frota.id, count: count || 0 }
      })

      const historicoCounts = await Promise.all(historicoPromises)

      // 4. Montar o mapa de status
      const novoStatus = new Map<string, FrotaStatus>()

      frotas.forEach(frota => {
        // For historical data (not today), all paradas should be considered finished
        const hoje = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0]
        const isHistoricalData = data !== hoje
        
        // Get active parada (without fim) - only for today
        const paradasFrota = todasParadas.filter(p => 
          p.frota_id === frota.id && (!p.fim || isHistoricalData)
        ) || []

        // Sort paradas by inicio to get the most recent one first
        paradasFrota.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())

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
    isLoading: isLoading || isConfigLoading,
    error,
    atualizarCenario: () => atualizarCenario(),
    frotasSelecionadas,
    setFrotasSelecionadas,
    saveScenarioConfig,
    columnOrder,
    setColumnOrder,
    unidadeColors,
    setUnidadeColors,
    minimizedColumns,
    setMinimizedColumns,
    carregarUnidades
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