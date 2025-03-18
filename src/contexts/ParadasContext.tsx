"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { Frota, Parada, Unidade } from "@/types/paradas"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/components/ui/use-toast"

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

interface ScenarioConfig {
  user_id: string
  column_order: string[]
  column_colors: { current: Record<string, string> }
  minimized_columns: string[]
  selected_frotas: string[]
}

export interface FrotaStatus {
  frota: Frota;
  parada_atual: Parada | null;
  historico_count: number;
}

interface ParadasContextType {
  data: string
  setData: (data: string) => void
  statusFrotas: Map<string, FrotaStatus>
  unidades: Unidade[]
  isLoading: boolean
  error: string | null
  atualizarCenario: () => Promise<void>
  selectedUnidade: string
  setSelectedUnidade: (unidade: string) => void
  columnOrder: string[]
  setColumnOrder: (order: string[]) => void
  carregarUnidades: () => Promise<void>
  frotasSelecionadas: Set<string>
  setFrotasSelecionadas: (frotas: Set<string>) => void
  unidadeColors: Record<string, string>
  setUnidadeColors: (colors: Record<string, string>) => void
  minimizedColumns: Set<string>
  setMinimizedColumns: (columns: Set<string>) => void
  saveScenarioConfig: () => Promise<void>
  reloadUnidades: () => void
}

const ParadasContext = createContext<ParadasContextType | undefined>(undefined)

export function ParadasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<string>(() => {
    const hoje = new Date()
    hoje.setHours(hoje.getHours() - 3)
    return hoje.toISOString().split('T')[0]
  })
  const [statusFrotas, setStatusFrotas] = useState<Map<string, FrotaStatus>>(new Map())
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUnidade, setSelectedUnidade] = useState("todas")
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [frotasSelecionadas, setFrotasSelecionadas] = useState<Set<string>>(new Set())
  const [unidadeColors, setUnidadeColors] = useState<Record<string, string>>({})
  const [minimizedColumns, setMinimizedColumns] = useState<Set<string>>(new Set())
  const [configLoaded, setConfigLoaded] = useState(false)
  const [unidadesLoaded, setUnidadesLoaded] = useState(false)

  // Helper function to generate default colors
  const generateDefaultColors = (unidadesData: Unidade[]) => {
    return unidadesData.reduce((acc, unidade, index) => {
      acc[unidade.id] = availableColors[index % availableColors.length]
      return acc
    }, {} as Record<string, string>)
  }

  // Load saved scenario config
  const loadScenarioConfig = async (userId: string) => {
    try {
      const { data: config, error } = await supabase
        .from('scenario_config')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error loading scenario config:', error)
        }
        return null
      }

      return config as ScenarioConfig
    } catch (error) {
      console.error('Error loading scenario config:', error)
      return null
    }
  }

  // Save scenario config
  const saveScenarioConfig = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping save')
      return
    }

    const config = {
      user_id: user.id,
      column_order: columnOrder,
      column_colors: { current: unidadeColors },
      minimized_columns: Array.from(minimizedColumns),
      selected_frotas: Array.from(frotasSelecionadas),
      updated_at: new Date().toISOString()
    }

    console.log('Saving config:', config)

    try {
      const { data, error } = await supabase
        .from('scenario_config')
        .upsert(config, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()

      if (error) {
        console.error('Supabase error saving config:', error)
        toast({
          title: "Erro",
          description: "Não foi possível salvar a configuração do cenário",
          variant: "destructive",
        })
      } else {
        console.log('Config saved successfully:', data)
        toast({
          title: "Sucesso",
          description: "Configuração do cenário salva com sucesso",
        })
      }

      // Always save to localStorage as backup
      localStorage.setItem('columnOrder', JSON.stringify(columnOrder))
      localStorage.setItem('unidadeColors', JSON.stringify(unidadeColors))
      localStorage.setItem('minimizedColumns', JSON.stringify(Array.from(minimizedColumns)))
      localStorage.setItem('frotasSelecionadas', JSON.stringify(Array.from(frotasSelecionadas)))
    } catch (error) {
      console.error('Error saving scenario config:', error)
      // Save to localStorage as fallback
      localStorage.setItem('columnOrder', JSON.stringify(columnOrder))
      localStorage.setItem('unidadeColors', JSON.stringify(unidadeColors))
      localStorage.setItem('minimizedColumns', JSON.stringify(Array.from(minimizedColumns)))
      localStorage.setItem('frotasSelecionadas', JSON.stringify(Array.from(frotasSelecionadas)))
      
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração do cenário",
        variant: "destructive",
      })
    }
  }, [user?.id, columnOrder, unidadeColors, minimizedColumns, frotasSelecionadas, toast])

  const carregarUnidades = async () => {
    if (!user || unidadesLoaded) return
    
    try {
      setIsLoading(true)
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
      setUnidades(unidadesData)

      // Load saved config
      const config = await loadScenarioConfig(user.id)
      
      if (config) {
        setColumnOrder(config.column_order || unidadesData.map(u => u.id))
        setUnidadeColors(config.column_colors?.current || generateDefaultColors(unidadesData))
        setMinimizedColumns(new Set(config.minimized_columns || []))
        
        if (config.selected_frotas && config.selected_frotas.length > 0) {
          setFrotasSelecionadas(new Set(config.selected_frotas))
        } else {
          const todasFrotas = new Set(
            unidadesData.flatMap(u => (u.frotas || []).map((frota: Frota) => frota.id))
          )
          setFrotasSelecionadas(todasFrotas)
        }
      } else {
        setColumnOrder(unidadesData.map(u => u.id))
        setUnidadeColors(generateDefaultColors(unidadesData))
        const todasFrotas = new Set(
          unidadesData.flatMap(u => (u.frotas || []).map((frota: Frota) => frota.id))
        )
        setFrotasSelecionadas(todasFrotas)
      }
      setConfigLoaded(true)
      setUnidadesLoaded(true)
    } catch (error) {
      console.error('Error loading unidades:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as unidades",
        variant: "destructive",
      })

      // Try loading from localStorage as fallback
      const savedOrder = localStorage.getItem('columnOrder')
      if (savedOrder) setColumnOrder(JSON.parse(savedOrder))
      
      const savedColors = localStorage.getItem('unidadeColors')
      if (savedColors) setUnidadeColors(JSON.parse(savedColors))
      
      const savedMinimized = localStorage.getItem('minimizedColumns')
      if (savedMinimized) setMinimizedColumns(new Set(JSON.parse(savedMinimized)))
      
      const savedFrotas = localStorage.getItem('frotasSelecionadas')
      if (savedFrotas) setFrotasSelecionadas(new Set(JSON.parse(savedFrotas)))
      
      setConfigLoaded(true)
    } finally {
      setIsLoading(false)
    }
  }

  const atualizarCenario = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Load unidades if not loaded yet
      if (!unidadesLoaded) {
        await carregarUnidades()
      }
      
      // Use a single query to get all paradas for the day and active paradas
      const startOfDay = new Date(data)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(data)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: todasParadas, error: paradasError } = await supabase
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
        .or(`inicio.gte.${startOfDay.toISOString()},and(inicio.lt.${startOfDay.toISOString()},fim.is.null)`)
        .lt('inicio', endOfDay.toISOString())

      if (paradasError) throw paradasError

      // Build status map
      const novoStatus = new Map<string, FrotaStatus>()

      // Get all frotas from unidades
      const todasFrotas = unidades.flatMap(u => u.frotas || [])

      todasFrotas.forEach(frota => {
        const hoje = new Date()
        hoje.setHours(hoje.getHours() - 3)
        const hojeISO = hoje.toISOString().split('T')[0]
        const isHistoricalData = data !== hojeISO
        
        const paradasFrota = todasParadas?.filter(p => 
          p.frota_id === frota.id && (!p.fim || isHistoricalData)
        ) || []

        paradasFrota.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())

        novoStatus.set(frota.id, {
          frota,
          parada_atual: paradasFrota[0] || null,
          historico_count: paradasFrota.length
        })
      })

      setStatusFrotas(novoStatus)
    } catch (error) {
      console.error('Error updating scenario:', error)
      setError('Erro ao atualizar cenário')
    } finally {
      setIsLoading(false)
    }
  }, [user, data, unidadesLoaded, carregarUnidades, unidades])

  // Update scenario when date changes
  useEffect(() => {
    if (user) {
      atualizarCenario()
    }
  }, [data, user, atualizarCenario])

  // Force reload unidades when needed
  const reloadUnidades = () => {
    setUnidadesLoaded(false)
  }

  const value = {
    data,
    setData,
    statusFrotas,
    unidades,
    isLoading,
    error,
    atualizarCenario,
    selectedUnidade,
    setSelectedUnidade,
    columnOrder,
    setColumnOrder,
    carregarUnidades,
    frotasSelecionadas,
    setFrotasSelecionadas,
    unidadeColors,
    setUnidadeColors,
    minimizedColumns,
    setMinimizedColumns,
    saveScenarioConfig,
    reloadUnidades,
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