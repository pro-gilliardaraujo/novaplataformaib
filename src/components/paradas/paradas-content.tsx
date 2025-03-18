"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParadas, FrotaStatus } from "@/contexts/ParadasContext"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { RefreshCw, Settings, Search, Minimize2, Maximize2, GripVertical } from "lucide-react"
import { FrotaCard } from "./FrotaCard"
import { ParadaModal } from "./ParadaModal"
import { HistoricoModal } from "./HistoricoModal"
import { SeletorFrotasModal } from "./SeletorFrotasModal"
import { ColorPicker } from "./ColorPicker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Frota } from "@/types/paradas"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import "@/styles/columns.css"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { toast } from "@/components/ui/use-toast"
import { paradasService } from "@/services/paradasService"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type UnidadeColors = Record<string, string>;

interface FrotaCardProps {
  frota: Frota;
  status: FrotaStatus;
  onParar: () => void;
  onLiberar: () => void;
  onHistorico: () => void;
}

export function ParadasContent() {
  const { 
    unidades, 
    statusFrotas, 
    atualizarCenario, 
    isLoading,
    frotasSelecionadas,
    setFrotasSelecionadas,
    data,
    setData,
    unidadeColors,
    setUnidadeColors,
    columnOrder,
    setColumnOrder,
    minimizedColumns,
    setMinimizedColumns,
    carregarUnidades,
    selectedUnidade,
    setSelectedUnidade,
    saveScenarioConfig
  } = useParadas()

  const [frotaSelecionada, setFrotaSelecionada] = useState<Frota | null>(null)
  const [modalParada, setModalParada] = useState(false)
  const [modalHistorico, setModalHistorico] = useState(false)
  const [modalSeletor, setModalSeletor] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Save minimized columns state
  const toggleMinimized = (unidadeId: string) => {
    const newMinimized = new Set(minimizedColumns)
    if (newMinimized.has(unidadeId)) {
      newMinimized.delete(unidadeId)
    } else {
      newMinimized.add(unidadeId)
    }
    setMinimizedColumns(newMinimized)
  }

  // Agrupar e filtrar frotas por unidade
  const frotasPorUnidade = useMemo(() => {
    console.log('Debug - frotasSelecionadas:', Array.from(frotasSelecionadas))
    console.log('Debug - unidades:', unidades)
    console.log('Debug - selectedUnidade:', selectedUnidade)
    console.log('Debug - statusFrotas size:', statusFrotas.size)
    console.log('Debug - statusFrotas keys:', Array.from(statusFrotas.keys()))
    
    return unidades.reduce((acc, unidade) => {
      console.log(`Debug - Processing unidade: ${unidade.nome}`)
      if (selectedUnidade !== "todas" && unidade.id !== selectedUnidade) {
        acc[unidade.id] = []
        return acc
      }

      const frotasFiltradas = (unidade.frotas || [])
      console.log(`Debug - Frotas for ${unidade.nome}:`, unidade.frotas)
      
      const filtered = frotasFiltradas
        .filter(frota => {
          const isSelected = frotasSelecionadas.has(frota.id)
          const hasStatus = statusFrotas.has(frota.id)
          console.log(`Debug - Frota ${frota.frota} (${frota.id}): selected=${isSelected}, hasStatus=${hasStatus}`)
          return isSelected
        })
        .filter(frota => 
          searchTerm === "" || 
          frota.frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
          frota.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        )

      console.log(`Debug - Filtered frotas for ${unidade.nome}:`, filtered)
      acc[unidade.id] = filtered
      return acc
    }, {} as Record<string, Frota[]>)
  }, [unidades, selectedUnidade, frotasSelecionadas, searchTerm, statusFrotas])

  // Filter out unidades without visible frotas
  const visibleUnidades = useMemo(() => {
    const filtered = unidades.filter(unidade => {
      const frotasUnidade = frotasPorUnidade[unidade.id]
      const hasVisibleFrotas = frotasUnidade && frotasUnidade.length > 0
      console.log(`Debug - Unidade ${unidade.nome} has visible frotas:`, hasVisibleFrotas)
      return hasVisibleFrotas
    })
    console.log('Debug - Visible unidades:', filtered.map(u => u.nome))
    return filtered
  }, [unidades, frotasPorUnidade])

  // Sort unidades based on columnOrder with fallback
  const sortedUnidades = useMemo(() => {
    // Get visible unidade IDs
    const visibleUnidadeIds = unidades
      .filter(u => frotasPorUnidade[u.id]?.length > 0)
      .map(u => u.id)

    // Create a new array with ordered items first
    const orderedUnidades = columnOrder
      .filter(id => visibleUnidadeIds.includes(id))
      .map(id => unidades.find(u => u.id === id))
      .filter((u): u is NonNullable<typeof u> => u !== undefined)

    // Add any remaining visible unidades that aren't in the order
    const remainingUnidades = unidades.filter(u => 
      visibleUnidadeIds.includes(u.id) && 
      !columnOrder.includes(u.id)
    )

    // Update columnOrder to include any new visible columns
    const newColumnOrder = [
      ...columnOrder,
      ...remainingUnidades.map(u => u.id).filter(id => !columnOrder.includes(id))
    ]
    if (newColumnOrder.length !== columnOrder.length) {
      setColumnOrder(newColumnOrder)
    }

    return [...orderedUnidades, ...remainingUnidades]
  }, [unidades, columnOrder, frotasPorUnidade])

  // Save column order and handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.source.index === result.destination.index) return

    // Get all visible columns in their current order
    const visibleColumns = sortedUnidades.map(u => u.id)
    
    // Remove all visible columns from the current order
    const newOrder = columnOrder.filter(id => !visibleColumns.includes(id))
    
    // Reorder the visible columns based on the drag
    const [movedId] = visibleColumns.splice(result.source.index, 1)
    visibleColumns.splice(result.destination.index, 0, movedId)
    
    // Add all visible columns back in their new order
    setColumnOrder([...newOrder, ...visibleColumns])
  }

  // Handlers
  const handleParar = (frota: Frota) => {
    setFrotaSelecionada(frota)
    setModalParada(true)
  }

  const handleLiberar = async (frota: Frota) => {
    console.log('handleLiberar: Starting...', { frotaId: frota.id })
    const status = statusFrotas.get(frota.id);
    if (!status?.parada_atual) {
      console.log('handleLiberar: No active parada found')
      return
    }

    try {
      console.log('handleLiberar: Calling liberarParada...', { paradaId: status.parada_atual.id })
      await paradasService.liberarParada(status.parada_atual.id);
      console.log('handleLiberar: Calling atualizarCenario...')
      await atualizarCenario();
      console.log('handleLiberar: Complete')
      toast({
        title: "Sucesso",
        description: "Parada liberada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao liberar parada:', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível liberar a parada. Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  }

  const handleHistorico = (frota: Frota) => {
    setFrotaSelecionada(frota)
    setModalHistorico(true)
  }

  const handleParadaRegistrada = async () => {
    console.log('handleParadaRegistrada: Starting...')
    setModalParada(false)
    console.log('handleParadaRegistrada: Calling atualizarCenario...')
    await atualizarCenario()
    console.log('handleParadaRegistrada: Complete')
  }

  const hoje = new Date()
  hoje.setHours(hoje.getHours() - 3) // Adjust for America/Sao_Paulo timezone
  const hojeISO = hoje.toISOString().split('T')[0]

  const ontem = new Date(hoje)
  ontem.setDate(ontem.getDate() - 1)
  const ontemISO = ontem.toISOString().split('T')[0]

  const formatDisplayDate = (date: Date) => {
    const dateISO = date.toISOString().split('T')[0]
    if (dateISO === hojeISO) return "Hoje"
    if (dateISO === ontemISO) return "Ontem"
    return format(date, "dd/MM/yyyy")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar por frota ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione uma unidade" />
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
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDisplayDate(new Date(data))}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="p-2 border rounded-md"
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            className="h-10 w-[200px]"
            onClick={() => setModalSeletor(true)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Cenário
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={saveScenarioConfig}
            title="Salvar Configuração"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable content area */}
      <ScrollArea className="flex-1">
        <div className="h-full">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid-responsive"
                >
                  {sortedUnidades.map((unidade, index) => {
                    const bgColor = unidadeColors[unidade.id];
                    const isMinimized = minimizedColumns.has(unidade.id);
                    const frotasUnidade = frotasPorUnidade[unidade.id] || [];
                    
                    return (
                      <Draggable
                        key={unidade.id}
                        draggableId={unidade.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              background: bgColor || '#ffffff',
                              height: isMinimized ? 'auto' : '100%',
                            }}
                            className={`${
                              isMinimized ? 'minimized-column' : ''
                            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                          >
                            <div className="column-header">
                              {isMinimized ? (
                                <>
                                  <div className="writing-mode-vertical">
                                    {unidade.nome}
                                  </div>
                                  <div className="controls">
                                    <div className="flex items-center gap-2">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <button
                                        onClick={() => toggleMinimized(unidade.id)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                      >
                                        <Maximize2 className="w-4 h-4 text-gray-500" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-2">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="w-4 h-4 text-gray-500" />
                                      </div>
                                      <span className="font-medium">{unidade.nome}</span>
                                    </div>
                                    <button
                                      onClick={() => toggleMinimized(unidade.id)}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      <Minimize2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                  </div>
                                  {!isMinimized && (
                                    <div className="flex-1 overflow-y-auto">
                                      {frotasUnidade.map((frota: Frota) => {
                                        const status = statusFrotas.get(frota.id);
                                        console.log(`Debug - Rendering frota ${frota.frota} (${frota.id}), status:`, status)
                                        
                                        // Create a default status if none exists
                                        const defaultStatus: FrotaStatus = {
                                          frota,
                                          parada_atual: null,
                                          historico_count: 0
                                        }
                                        
                                        return (
                                          <FrotaCard
                                            key={frota.id}
                                            frota={frota}
                                            status={status || defaultStatus}
                                            onParar={() => handleParar(frota)}
                                            onLiberar={() => handleLiberar(frota)}
                                            onHistorico={() => handleHistorico(frota)}
                                          />
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>

      {/* Modals */}
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