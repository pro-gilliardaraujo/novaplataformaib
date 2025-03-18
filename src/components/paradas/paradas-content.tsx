"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParadas } from "@/contexts/ParadasContext"
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
    setSelectedUnidade
  } = useParadas()

  const [frotaSelecionada, setFrotaSelecionada] = useState<Frota | null>(null)
  const [modalParada, setModalParada] = useState(false)
  const [modalHistorico, setModalHistorico] = useState(false)
  const [modalSeletor, setModalSeletor] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Load initial data
  useEffect(() => {
    carregarUnidades()
  }, [carregarUnidades])

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
    return unidades.reduce((acc, unidade) => {
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
  }, [unidades, selectedUnidade, frotasSelecionadas, searchTerm])

  // Filter out unidades without visible frotas
  const visibleUnidades = useMemo(() => {
    return unidades.filter(unidade => {
      const frotasUnidade = frotasPorUnidade[unidade.id]
      return frotasUnidade && frotasUnidade.length > 0
    })
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
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-hidden">
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
                              <div {...provided.dragHandleProps} className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-2">
                                <ColorPicker
                                  color={bgColor}
                                  onChange={(color: string | null) => {
                                    if (color) {
                                      if (!columnOrder.includes(unidade.id)) {
                                        setColumnOrder([...columnOrder, unidade.id]);
                                      }
                                      setUnidadeColors({
                                        ...unidadeColors,
                                        [unidade.id]: color,
                                      });
                                    } else {
                                      const newColors = { ...unidadeColors };
                                      delete newColors[unidade.id];
                                      setUnidadeColors(newColors);
                                    }
                                  }}
                                />
                                <h3 className="font-semibold text-center">
                                  {unidade.nome}
                                </h3>
                                <button
                                  onClick={() => toggleMinimized(unidade.id)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Minimize2 className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            )}
                          </div>
                          {!isMinimized && (
                            <div className="scroll-area-container">
                              <ScrollArea className="h-full">
                                <div className="scroll-area-content">
                                  {frotasPorUnidade[unidade.id].map((frota) => (
                                    <FrotaCard
                                      key={frota.id}
                                      frota={frota}
                                      onRegistrarParada={() => handleParar(frota)}
                                      onFrotaUpdated={() => handleLiberar(frota)}
                                      onHistorico={() => handleHistorico(frota)}
                                    />
                                  ))}
                                </div>
                                <ScrollBar orientation="vertical" />
                              </ScrollArea>
                            </div>
                          )}
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