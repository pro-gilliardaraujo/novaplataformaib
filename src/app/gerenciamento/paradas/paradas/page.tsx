"use client"

import { useState, useEffect, useMemo } from "react"
import { ParadasProvider } from "@/contexts/ParadasContext"
import { useParadas } from "@/contexts/ParadasContext"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { RefreshCw, Settings, Search, Minimize2, Maximize2, GripVertical } from "lucide-react"
import { FrotaCard } from "@/components/paradas/FrotaCard"
import { ParadaModal } from "@/components/paradas/ParadaModal"
import { HistoricoModal } from "@/components/paradas/HistoricoModal"
import { SeletorFrotasModal } from "@/components/paradas/SeletorFrotasModal"
import { ColorPicker } from "@/components/paradas/ColorPicker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Frota } from "@/types/paradas"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import "@/styles/columns.css"
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd"
import { toast } from "@/components/ui/use-toast"
import { paradasService } from "@/services/paradasService"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Lista de cores disponíveis para seleção aleatória inicial
const availableColors = [
  'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100',
  'bg-pink-100', 'bg-orange-100', 'bg-teal-100', 'bg-red-100',
  'bg-indigo-100', 'bg-cyan-100'
]

function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * availableColors.length)
  return availableColors[randomIndex]
}

function ParadasContent() {
  const { 
    unidades, 
    statusFrotas, 
    atualizarCenario, 
    isLoading,
    frotasSelecionadas,
    setFrotasSelecionadas,
    data,
    setData
  } = useParadas()

  const [frotaSelecionada, setFrotaSelecionada] = useState<Frota | null>(null)
  const [modalParada, setModalParada] = useState(false)
  const [modalHistorico, setModalHistorico] = useState(false)
  const [modalSeletor, setModalSeletor] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnidade, setSelectedUnidade] = useState<string>("todas")
  const [unidadeColors, setUnidadeColors] = useState<Record<string, string>>({})
  const [minimizedColumns, setMinimizedColumns] = useState<Set<string>>(new Set())
  const [columnOrder, setColumnOrder] = useState<string[]>([])

  // Load minimized columns state from localStorage
  useEffect(() => {
    const savedMinimized = localStorage.getItem('minimizedColumns')
    if (savedMinimized) {
      setMinimizedColumns(new Set(JSON.parse(savedMinimized)))
    }
  }, [])

  // Save minimized columns state
  const toggleMinimized = (unidadeId: string) => {
    const newMinimized = new Set(minimizedColumns)
    if (newMinimized.has(unidadeId)) {
      newMinimized.delete(unidadeId)
    } else {
      newMinimized.add(unidadeId)
    }
    setMinimizedColumns(newMinimized)
    localStorage.setItem('minimizedColumns', JSON.stringify(Array.from(newMinimized)))
  }

  // Load saved colors on mount or generate random ones
  useEffect(() => {
    const savedColors = localStorage.getItem('unidadeColors')
    if (savedColors) {
      setUnidadeColors(JSON.parse(savedColors))
    } else {
      // Generate random colors for units that don't have one
      const newColors = unidades.reduce((acc, unidade) => {
        if (!acc[unidade.id]) {
          acc[unidade.id] = getRandomColor()
        }
        return acc
      }, {} as Record<string, string>)
      setUnidadeColors(newColors)
      localStorage.setItem('unidadeColors', JSON.stringify(newColors))
    }
  }, [unidades])

  // Save colors when they change
  const updateUnidadeColor = (unidadeId: string, color: string) => {
    const newColors = { ...unidadeColors, [unidadeId]: color }
    setUnidadeColors(newColors)
    localStorage.setItem('unidadeColors', JSON.stringify(newColors))
  }

  // Load column order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('columnOrder')
    if (savedOrder) {
      setColumnOrder(JSON.parse(savedOrder))
    } else {
      // Initialize with current unidades order
      const initialOrder = unidades.map(u => u.id)
      setColumnOrder(initialOrder)
      localStorage.setItem('columnOrder', JSON.stringify(initialOrder))
    }
  }, [unidades])

  // Save column order
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newOrder = Array.from(columnOrder)
    const [reorderedItem] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, reorderedItem)

    setColumnOrder(newOrder)
    localStorage.setItem('columnOrder', JSON.stringify(newOrder))
  }

  // Sort unidades based on columnOrder
  const sortedUnidades = useMemo(() => {
    const orderMap = new Map(columnOrder.map((id, index) => [id, index]))
    return [...unidades].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? Number.MAX_VALUE
      const orderB = orderMap.get(b.id) ?? Number.MAX_VALUE
      return orderA - orderB
    })
  }, [unidades, columnOrder])

  // Handlers
  const handleParar = (frota: Frota) => {
    setFrotaSelecionada(frota)
    setModalParada(true)
  }

  const handleLiberar = async (frota: Frota) => {
    const status = statusFrotas.get(frota.id);
    if (!status?.parada_atual) return;

    try {
      await paradasService.liberarParada(status.parada_atual.id);
      await atualizarCenario();
    } catch (error) {
      console.error('Erro ao liberar parada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível liberar a parada",
        variant: "destructive",
      });
    }
  }

  const handleHistorico = (frota: Frota) => {
    setFrotaSelecionada(frota)
    setModalHistorico(true)
  }

  const handleParadaRegistrada = () => {
    setModalParada(false)
    atualizarCenario()
  }

  // Agrupar e filtrar frotas por unidade
  const frotasPorUnidade = unidades.reduce((acc, unidade) => {
    if (selectedUnidade !== "todas" && unidade.id !== selectedUnidade) {
      acc[unidade.id] = []
      return acc
    }

    const frotasFiltradas = (unidade.frotas || [])
      .filter(frota => frotasSelecionadas.has(frota.id))
      .filter(frota => 
        searchTerm === "" || 
        frota.frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
        frota.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      )

    acc[unidade.id] = frotasFiltradas
    return acc
  }, {} as Record<string, Frota[]>)

  const hoje = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0]
  const ontem = new Date(new Date().setDate(new Date().getDate() - 1))
    .toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
    .split(',')[0]

  const formatDisplayDate = (date: Date) => {
    if (date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0] === hoje) return "Hoje"
    if (date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0] === ontem) return "Ontem"
    return format(date, "dd/MM/yyyy")
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header com controles - mesma altura do logo */}
      <div className="h-[64px] bg-white border-b flex items-center px-2">
        <div className="flex items-center gap-6 w-full">
          {/* Barra de pesquisa - estilo Tratativas */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar frota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-gray-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-black/10"
            />
          </div>

          {/* Filtro de data */}
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="date"
              value={new Date(data).toISOString().split('T')[0]}
              onChange={(e) => {
                const date = new Date(e.target.value)
                setData(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0])
              }}
              max={new Date().toISOString().split('T')[0]}
              className="h-10 w-[200px] pl-9"
            />
          </div>

          {/* Filtro de unidade */}
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger className="h-10 w-[200px]">
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

          {/* Botão de ação */}
          <Button
            variant="outline"
            className="h-10 w-[200px]"
            onClick={() => setModalSeletor(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Cenário
          </Button>
        </div>
      </div>

      {/* Área de conteúdo com colunas */}
      <div className="flex-1 px-2 py-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns" direction="horizontal">
            {(provided: DroppableProvided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid-responsive"
              >
                {sortedUnidades.map((unidade, index) => {
                  const frotasUnidade = frotasPorUnidade[unidade.id]
                  if (!frotasUnidade?.length) return null

                  const bgColor = unidadeColors[unidade.id] || getRandomColor()
                  const isMinimized = minimizedColumns.has(unidade.id)

                  return (
                    <Draggable
                      key={unidade.id}
                      draggableId={unidade.id}
                      index={index}
                    >
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex flex-col rounded-lg ${bgColor} min-h-0 column-transition ${
                            isMinimized ? 'minimized-column' : ''
                          } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        >
                          <div className="column-header">
                            {isMinimized ? (
                              <div className="h-full flex flex-col justify-between">
                                <div className="flex justify-between">
                                  <div {...provided.dragHandleProps}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleMinimized(unidade.id)}
                                  >
                                    <Maximize2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ColorPicker
                                    color={unidadeColors[unidade.id] || getRandomColor()}
                                    onChange={(color) => updateUnidadeColor(unidade.id, color)}
                                  />
                                  <div>
                                    <h3 className="font-semibold inline">
                                      {unidade.nome}
                                    </h3>
                                    <span className="text-sm text-gray-500 ml-1">
                                      ({frotasUnidade.length} {frotasUnidade.length === 1 ? 'frota' : 'frotas'})
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div {...provided.dragHandleProps}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleMinimized(unidade.id)}
                                  >
                                    <Minimize2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="column-content">
                            {isMinimized ? (
                              <div className="column-title">
                                {unidade.nome}
                              </div>
                            ) : (
                              <ScrollArea className="flex-1">
                                <div className="p-2 space-y-2">
                                  {frotasUnidade.map((frota) => {
                                    const status = statusFrotas.get(frota.id)
                                    if (!status) return null

                                    return (
                                      <FrotaCard
                                        key={frota.id}
                                        status={status}
                                        onParar={() => handleParar(frota)}
                                        onLiberar={() => handleLiberar(frota)}
                                        onHistorico={() => handleHistorico(frota)}
                                      />
                                    )
                                  })}
                                </div>
                                <ScrollBar />
                              </ScrollArea>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Modais */}
      {frotaSelecionada && (
        <>
          <ParadaModal
            open={modalParada}
            onOpenChange={setModalParada}
            frota={frotaSelecionada}
            onParadaRegistrada={handleParadaRegistrada}
          />
          <HistoricoModal
            open={modalHistorico}
            onOpenChange={setModalHistorico}
            frota={frotaSelecionada}
          />
        </>
      )}

      <SeletorFrotasModal
        open={modalSeletor}
        onOpenChange={setModalSeletor}
        unidades={unidades}
        frotasSelecionadas={frotasSelecionadas}
        onSelectionChange={setFrotasSelecionadas}
      />
    </div>
  )
}

export default function ParadasPage() {
  return (
    <ParadasProvider>
      <ParadasContent />
    </ParadasProvider>
  )
} 