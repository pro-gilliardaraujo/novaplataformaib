"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Frota, FrotaStatus, Parada, Unidade } from "@/types/paradas"
import { supabase } from "@/lib/supabase"
import { scenarioConfigService } from "@/services/scenarioConfigService"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/components/ui/use-toast"
import { unidadesService } from "@/services/unidadesService"

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
  selectedUnidade: string
  setSelectedUnidade: (unidade: string) => void
  setUnidades: (unidades: Unidade[]) => void
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

export function ParadasProvider({ children }: { children: ReactNode }) {
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
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize with empty states - will be populated after loading from Supabase
  const [frotasSelecionadas, setFrotasSelecionadas] = useState<Set<string>>(new Set())
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [unidadeColors, setUnidadeColors] = useState<Record<string, string>>({})
  const [minimizedColumns, setMinimizedColumns] = useState<Set<string>>(new Set())
  const [allDateColors, setAllDateColors] = useState<Record<string, Record<string, string>>>({})
  const [selectedUnidade, setSelectedUnidade] = useState("todas")

  // Function declarations
  const carregarUnidades = async () => {
    // Don't load if we already have data
    if (!user || unidades.length > 0) {
      return
    }

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
            unidade_id,
            created_at,
            updated_at
          )
        `)
        .order('nome')

      if (unidadesError) throw unidadesError

      setUnidades(unidadesData)
      
      // Se não houver frotas selecionadas, seleciona todas por padrão
      if (frotasSelecionadas.size === 0) {
        const todasFrotas = new Set(unidadesData.flatMap(u => u.frotas?.map((f: Frota) => f.id) || []))
        setFrotasSelecionadas(todasFrotas)
      }
    } catch (error) {
      console.error("Erro ao carregar unidades:", error)
      setError("Erro ao carregar unidades")
    } finally {
      setIsLoading(false)
    }
  }

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

  // Load initial data only once when the component mounts and user is available
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user?.id || isInitialized) return

      try {
        setIsConfigLoading(true)
        setIsLoading(true)
        
        // Load config first
        const config = await scenarioConfigService.loadConfig(user.id)
        if (config) {
          setColumnOrder(config.column_order || [])
          setAllDateColors(config.column_colors || {})
          setUnidadeColors(config.column_colors?.[data] || {})
          setMinimizedColumns(new Set(config.minimized_columns || []))
          setFrotasSelecionadas(new Set(config.selected_frotas || []))
        }

        // Then load unidades if we don't have them yet
        if (unidades.length === 0) {
          await carregarUnidades()
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Error loading initial data:', error)
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
        
        setIsInitialized(true)
      } finally {
        setIsConfigLoading(false)
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [user?.id]) // Only depend on user.id

  // Debounced save to localStorage and Supabase with proper dependencies
  useEffect(() => {
    if (!isInitialized || isConfigLoading || !user?.id) return

    const debouncedSave = async () => {
      // Update allDateColors with current date's colors
      const newAllDateColors = {
        ...allDateColors,
        [data]: unidadeColors
      }

      // Save to localStorage
      localStorage.setItem('columnOrder', JSON.stringify(columnOrder))
      localStorage.setItem('unidadeColors', JSON.stringify(unidadeColors))
      localStorage.setItem('minimizedColumns', JSON.stringify(Array.from(minimizedColumns)))
      localStorage.setItem('frotasSelecionadas', JSON.stringify(Array.from(frotasSelecionadas)))

      // Save to Supabase
      try {
        await scenarioConfigService.saveConfig({
          user_id: user.id,
          column_order: columnOrder,
          column_colors: newAllDateColors,
          minimized_columns: Array.from(minimizedColumns),
          selected_frotas: Array.from(frotasSelecionadas)
        })
      } catch (error) {
        console.error('Error saving to Supabase:', error)
      }
    }
    
    const timeoutId = setTimeout(debouncedSave, 2000) // 2 second debounce
    return () => clearTimeout(timeoutId)
  }, [
    isInitialized,
    columnOrder,
    unidadeColors,
    minimizedColumns,
    frotasSelecionadas,
    data,
    user?.id
  ])

  // Update colors when date changes
  useEffect(() => {
    if (!isInitialized || !user?.id || isConfigLoading) return

    const dateColors = allDateColors[data]
    if (dateColors) {
      setUnidadeColors(dateColors)
    } else {
      const newColors = columnOrder.reduce((acc, columnId, index) => {
        acc[columnId] = availableColors[index % availableColors.length]
        return acc
      }, {} as Record<string, string>)
      
      setUnidadeColors(newColors)
      setAllDateColors(prev => ({ ...prev, [data]: newColors }))
    }
  }, [data, isInitialized])

  // Update scenario only when data changes and not loading
  useEffect(() => {
    if (!isInitialized || !user?.id || isConfigLoading || isLoading || unidades.length === 0) return

    const updateScenario = async () => {
      try {
        setIsLoading(true)
        await atualizarCenario()
      } finally {
        setIsLoading(false)
      }
    }

    updateScenario()
  }, [data, isInitialized])

  // Função para atualizar o cenário
  const atualizarCenario = async () => {
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
          ),
          frota:frota_id (
            id,
            frota,
            descricao,
            unidade_id
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
          ),
          frota:frota_id (
            id,
            frota,
            descricao,
            unidade_id
          )
        `)
        .lt('inicio', startOfDay.toISOString())
        .is('fim', null)

      if (paradasAtivasError) throw paradasAtivasError

      // Combinar paradas do dia com paradas ativas anteriores
      const todasParadas = [...(paradasDia || []), ...(paradasAtivasAnteriores || [])]

      // 3. Buscar contagem de histórico para cada frota
      const historicoPromises = Array.from(frotasSelecionadas).map(async (frotaId: string) => {
        const { count } = await supabase
          .from('paradas')
          .select('*', { count: 'exact', head: true })
          .eq('frota_id', frotaId)
          .gte('inicio', startOfDay.toISOString())
          .lte('inicio', endOfDay.toISOString())

        return { frotaId, count: count || 0 }
      })

      const historicoCounts = await Promise.all(historicoPromises)

      // 4. Montar o mapa de status
      const novoStatus = new Map<string, FrotaStatus>()

      Array.from(frotasSelecionadas).forEach((frotaId: string) => {
        // For historical data (not today), all paradas should be considered finished
        const hoje = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0]
        const isHistoricalData = data !== hoje
        
        // Get active parada (without fim) - only for today
        const paradasFrota = todasParadas.filter(p => 
          p.frota_id === frotaId && (!p.fim || isHistoricalData)
        ) || []

        // Sort paradas by inicio to get the most recent one first
        paradasFrota.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())

        // Get history count including both active and completed paradas
        const historicoCount = historicoCounts.find((h: { frotaId: string; count: number }) => 
          h.frotaId === frotaId
        )?.count || 0

        const frota = unidades
          .flatMap(u => u.frotas || [])
          .find(f => f.id === frotaId)

        if (frota) {
          novoStatus.set(frotaId, {
            frota,
            parada_atual: paradasFrota[0] || null,
            historico_count: historicoCount
          })
        }
      })

      setStatusFrotas(novoStatus)
    } catch (error) {
      console.error('Error updating scenario:', error)
      setError('Erro ao atualizar cenário')
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
    carregarUnidades,
    selectedUnidade,
    setSelectedUnidade,
    setUnidades
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