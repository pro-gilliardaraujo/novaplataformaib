"use client"

import { useState, useEffect, useMemo } from "react"
import { useParadas } from "@/contexts/ParadasContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search, PlayCircle, StopCircle, Pencil } from "lucide-react"
import { EditParadaModal } from "./EditParadaModal"
import { paradasService } from "@/services/paradasService"
import { Parada } from "@/types/paradas"
import { formatDuration, formatDateTimeBR } from "@/utils/dateUtils"
import { useToast } from "@/components/ui/use-toast"
import { renderIcon } from "@/utils/icon-utils"

export function HistoricoParadasContent() {
  const [paradas, setParadas] = useState<Parada[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "ontime" | "delayed">("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [editingParada, setEditingParada] = useState<Parada | null>(null)
  const { data: selectedDate, selectedUnidade } = useParadas()
  const { toast } = useToast()

  const carregarParadas = async () => {
    try {
      const paradasData = await paradasService.buscarParadasDia(selectedDate)
      setParadas(paradasData)
    } catch (error) {
      console.error("Erro ao carregar paradas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de paradas",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    carregarParadas()
  }, [selectedDate])

  const handleParadaUpdated = () => {
    carregarParadas()
  }

  const formatarHorario = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    })
  }

  const paradasFiltradas = useMemo(() => {
    let filtered = [...paradas]

    // Filtrar por unidade
    if (selectedUnidade !== "todas") {
      filtered = filtered.filter(parada => parada.frota?.unidade_id === selectedUnidade)
    }

    // Filtrar por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(parada =>
        parada.frota?.frota.toLowerCase().includes(searchLower) ||
        parada.frota?.descricao.toLowerCase().includes(searchLower) ||
        parada.tipo?.nome.toLowerCase().includes(searchLower) ||
        parada.motivo?.toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por status
    if (filterStatus !== "all") {
      filtered = filtered.filter(parada => {
        if (!parada.previsao_horario) return true
        const agora = new Date()
        const previsao = new Date(parada.previsao_horario)
        const atrasado = !parada.fim && agora > previsao
        return filterStatus === "delayed" ? atrasado : !atrasado
      })
    }

    // Ordenar por horário
    filtered.sort((a, b) => {
      const timeA = new Date(a.inicio).getTime()
      const timeB = new Date(b.inicio).getTime()
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA
    })

    return filtered
  }, [paradas, selectedUnidade, searchTerm, filterStatus, sortOrder])

  const hoje = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0]

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
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
      <ScrollArea className="flex-1 bg-white rounded-lg border">
        <div className="p-4 space-y-4">
          {paradasFiltradas.map((parada) => {
            const tempoCorrido = formatDuration(parada.inicio, parada.fim)
            const dataParada = new Date(parada.inicio)
            const isToday = dataParada.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0] === hoje

            // Define colors based on status
            let tagColor = "bg-gray-500"
            let previsaoColor = "text-gray-600"

            if (parada.fim) {
              tagColor = "bg-green-500"
            } else if (parada.previsao_horario) {
              const previsao = new Date(parada.previsao_horario)
              const agora = new Date()
              if (agora > previsao) {
                tagColor = "bg-red-500"
                previsaoColor = "text-red-600"
              } else {
                tagColor = "bg-yellow-500"
                previsaoColor = "text-yellow-600"
              }
            }

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
      </ScrollArea>

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