"use client"

import { useState, useEffect, useMemo } from "react"
import { useParadas, ParadasProvider } from "@/contexts/ParadasContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search, PlayCircle, StopCircle, Pencil } from "lucide-react"
import { EditParadaModal } from "@/components/paradas/EditParadaModal"
import { paradasService } from "@/services/paradasService"
import { Parada } from "@/types/paradas"
import { formatDuration, formatDateTimeBR } from "@/utils/dateUtils"
import { useToast } from "@/components/ui/use-toast"
import { renderIcon } from "@/utils/icon-utils"
import { supabase } from '@/lib/supabase'
import { pageService } from '@/services/pageService'
import { useQueryClient } from "@tanstack/react-query"

function HistoricoParadasContent() {
  const [paradas, setParadas] = useState<Parada[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingParada, setEditingParada] = useState<Parada | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ontime' | 'delayed'>('all')
  const [selectedUnidade, setSelectedUnidade] = useState<string>("todas")
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString())
  const { unidades } = useParadas()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Load history for all units
  const carregarHistorico = async () => {
    setIsLoading(true)
    try {
      const allParadas: Parada[] = []
      const frotasToLoad = selectedUnidade === "todas"
        ? unidades.flatMap(u => u.frotas || [])
        : unidades.find(u => u.id === selectedUnidade)?.frotas || []

      for (const frota of frotasToLoad) {
        const historico = await paradasService.buscarHistorico(frota.id, selectedDate)
        allParadas.push(...historico)
      }

      setParadas(allParadas)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarHistorico()
  }, [selectedDate, selectedUnidade])

  // Enhanced filtering
  const paradasFiltradas = useMemo(() => {
    return paradas.filter(parada => {
      const searchFields = [
        parada.tipo?.nome,
        parada.motivo,
        parada.frota?.frota,
        parada.frota?.descricao
      ].filter(Boolean).join(" ").toLowerCase()

      const matchesSearch = searchFields.includes(searchTerm.toLowerCase())
      
      if (filterStatus === 'all') return matchesSearch
      
      if (!parada.previsao_horario || !parada.fim) return false
      
      const previsaoDate = new Date(parada.previsao_horario).getTime()
      const fimDate = new Date(parada.fim).getTime()
      
      if (filterStatus === 'ontime') {
        return matchesSearch && fimDate <= previsaoDate
      } else {
        return matchesSearch && fimDate > previsaoDate
      }
    }).sort((a, b) => {
      const dateA = new Date(a.inicio).getTime()
      const dateB = new Date(b.inicio).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })
  }, [paradas, searchTerm, filterStatus, sortOrder])

  // Format time
  const formatarHorario = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    })
  }

  // Get previsão color based on end time
  const getPrevisaoColor = (previsao_horario: string | null | undefined, fim: string | null | undefined) => {
    if (!previsao_horario || !fim) return 'text-gray-600'
    
    const previsaoDate = new Date(previsao_horario).getTime()
    const fimDate = new Date(fim).getTime()
    
    return fimDate <= previsaoDate ? 'text-green-600' : 'text-red-600'
  }

  // Get tag color based on status
  const getTagColor = (parada: Parada) => {
    if (!parada.fim) return 'bg-red-500'
    if (!parada.previsao_horario) return 'bg-gray-600'
    
    const previsaoDate = new Date(parada.previsao_horario).getTime()
    const fimDate = new Date(parada.fim).getTime()
    
    return fimDate <= previsaoDate ? 'bg-green-500' : 'bg-red-500'
  }

  // Handle edit completion
  const handleParadaUpdated = () => {
    setEditingParada(null)
    carregarHistorico()
  }

  useEffect(() => {
    const setupHistoryPage = async () => {
      try {
        setIsLoading(true)
        console.log('Starting history page setup...')
        
        // First, check if the paradas category exists
        const { data: categories, error: categoryCheckError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', 'paradas')
          .single()

        let categoryId
        
        if (!categories) {
          console.log('Creating paradas category...')
          // Create the category
          const { data: newCategory, error: createCategoryError } = await supabase
            .from('categories')
            .upsert([{
              name: 'Paradas',
              slug: 'paradas',
              section: 'management',
              icon: 'heroicons/outline/StopCircleIcon',
              order_index: 1
            }])
            .select()
            .single()

          if (createCategoryError) {
            console.error('Error creating category:', createCategoryError)
            throw createCategoryError
          }
          categoryId = newCategory.id
          console.log('Created category:', newCategory)
        } else {
          categoryId = categories.id
          // Update the category if needed
          if (categories.name !== 'Paradas' || categories.section !== 'management') {
            console.log('Updating category...')
            const { data: updatedCategory, error: updateError } = await supabase
              .from('categories')
              .update({ 
                name: 'Paradas',
                section: 'management',
                icon: 'heroicons/outline/StopCircleIcon'
              })
              .eq('id', categoryId)
              .select()
              .single()

            if (updateError) {
              console.error('Error updating category:', updateError)
              throw updateError
            }
            console.log('Updated category:', updatedCategory)
          } else {
            console.log('Found existing category:', categories)
          }
        }

        // Now handle the history page
        const pageData = {
          name: 'Histórico',
          slug: 'historico',
          category_id: categoryId,
          icon: 'heroicons/outline/ClockIcon'
        }

        // Check if the page already exists
        const { data: existingPage, error: pageCheckError } = await supabase
          .from('pages')
          .select('*')
          .eq('category_id', categoryId)
          .eq('slug', 'historico')
          .maybeSingle()

        if (pageCheckError) {
          console.error('Error checking for existing page:', pageCheckError)
          throw pageCheckError
        }

        let result
        if (!existingPage) {
          console.log('Creating new history page...')
          const { data: createdPage, error: createError } = await supabase
            .from('pages')
            .insert([pageData])
            .select()
            .single()

          if (createError) {
            console.error('Error creating page:', createError)
            throw createError
          }
          result = createdPage
          console.log('Created new page:', createdPage)
        } else {
          console.log('Updating existing page...')
          const { data: updatedPage, error: updateError } = await supabase
            .from('pages')
            .update(pageData)
            .eq('id', existingPage.id)
            .select()
            .single()

          if (updateError) {
            console.error('Error updating page:', updateError)
            throw updateError
          }
          result = updatedPage
          console.log('Updated page:', updatedPage)
        }

        // Force refresh menu data
        await queryClient.invalidateQueries({ queryKey: ['menu-data'] })
        await queryClient.refetchQueries({ queryKey: ['menu-data'] })

        toast({
          title: 'Sucesso',
          description: 'Página de histórico configurada com sucesso.',
        })
      } catch (error: any) {
        console.error('Error setting up history page:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível configurar a página de histórico: ' + error.message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    setupHistoryPage()
  }, [toast, queryClient])

  if (isLoading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed header */}
      <div className="h-[64px] bg-white border-b flex items-center px-4 flex-shrink-0">
        <h1 className="text-xl font-semibold">Histórico de Paradas</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg border">
          <div className="flex-1">
            <Input
              placeholder="Buscar por frota, tipo ou motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas as unidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as unidades</SelectItem>
              {unidades.map((unidade) => (
                <SelectItem key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ontime">No prazo</SelectItem>
              <SelectItem value="delayed">Atrasados</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="w-10 h-10"
          >
            <Clock className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform`} />
          </Button>
        </div>

        {/* Paradas List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : paradasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
            Nenhuma parada registrada
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paradasFiltradas.map((parada) => {
              const tempoCorrido = formatDuration(parada.inicio, parada.fim)
              const previsaoColor = getPrevisaoColor(parada.previsao_horario, parada.fim)
              const tagColor = getTagColor(parada)
              const dataParada = new Date(parada.inicio)
              const isToday = dataParada.toLocaleDateString() === new Date().toLocaleDateString()

              return (
                <div
                  key={parada.id}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    <div className={`w-1 ${tagColor}`} />
                    <div className="flex-1 p-3 space-y-2">
                      {/* Frota Info */}
                      <div className="text-sm font-medium text-gray-900">
                        {parada.frota?.frota} - {parada.frota?.descricao}
                      </div>

                      {/* Header with date and duration */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {isToday ? 'Hoje' : formatDateTimeBR(dataParada)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{tempoCorrido}</span>
                        </div>
                      </div>

                      {/* Type and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {parada.tipo?.icone && renderIcon(parada.tipo.icone, "h-4 w-4 text-gray-500")}
                          <span className="font-medium">{parada.tipo?.nome}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setEditingParada(parada)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Times */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <PlayCircle className="h-4 w-4" />
                          <span>Início: {formatarHorario(parada.inicio)}</span>
                        </div>
                        {parada.fim && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <StopCircle className="h-4 w-4" />
                            <span>Fim: {formatarHorario(parada.fim)}</span>
                          </div>
                        )}
                      </div>

                      {/* Previsão */}
                      {parada.previsao_horario && (
                        <div className={`flex items-center gap-1 ${previsaoColor}`}>
                          <Clock className="h-4 w-4" />
                          <span>Previsão: {formatarHorario(parada.previsao_horario)}</span>
                        </div>
                      )}

                      {/* Motivo */}
                      {parada.motivo && (
                        <p className="text-sm text-gray-600 mt-2 border-t pt-2">
                          {parada.motivo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditParadaModal
        open={!!editingParada}
        onOpenChange={(open) => !open && setEditingParada(null)}
        parada={editingParada!}
        onParadaUpdated={handleParadaUpdated}
        isFromHistory={true}
      />
    </div>
  )
}

export default function HistoricoParadas() {
  return (
    <ParadasProvider>
      <HistoricoParadasContent />
    </ParadasProvider>
  )
} 