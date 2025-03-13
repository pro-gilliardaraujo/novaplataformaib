"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { HistoricoModalProps, Parada } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"
import { useParadas } from "@/contexts/ParadasContext"
import { Clock } from "lucide-react"

export function HistoricoModal({ open, onOpenChange, frota }: HistoricoModalProps) {
  const [paradas, setParadas] = useState<Parada[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { data: dataAtual } = useParadas()
  const { toast } = useToast()

  // Carregar histórico
  useEffect(() => {
    const carregarHistorico = async () => {
      setIsLoading(true)
      try {
        const historico = await paradasService.buscarHistorico(frota.id, dataAtual)
        setParadas(historico)
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

    if (open) {
      carregarHistorico()
    }
  }, [open, frota.id, dataAtual, toast])

  // Filtrar paradas
  const paradasFiltradas = paradas.filter(parada => {
    const searchFields = [
      parada.tipo?.nome,
      parada.motivo
    ].join(" ").toLowerCase()

    return searchFields.includes(searchTerm.toLowerCase())
  })

  // Formatar horário
  const formatarHorario = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Histórico de Paradas - {frota.frota}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder="Buscar por tipo ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : paradasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma parada registrada
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {paradasFiltradas.map((parada) => {
                  const duracao = paradasService.calcularDuracao(parada.inicio, parada.fim)
                  const horas = Math.floor(duracao / 60)
                  const minutos = duracao % 60

                  return (
                    <div
                      key={parada.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      {/* Tipo e duração */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {parada.tipo?.icone && (
                            <span className="text-gray-500">{parada.tipo.icone}</span>
                          )}
                          <span className="font-medium">{parada.tipo?.nome}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>
                            {horas > 0 && `${horas}h`}
                            {minutos.toString().padStart(2, '0')}min
                          </span>
                        </div>
                      </div>

                      {/* Motivo */}
                      <p className="text-sm text-gray-600">{parada.motivo}</p>

                      {/* Horários */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Início: {formatarHorario(parada.inicio)}</span>
                        {parada.fim && (
                          <span>Fim: {formatarHorario(parada.fim)}</span>
                        )}
                      </div>

                      {/* Previsão */}
                      {parada.previsao_minutos && (
                        <div className="text-sm text-gray-500">
                          Previsão: {Math.floor(parada.previsao_minutos / 60)}h
                          {(parada.previsao_minutos % 60).toString().padStart(2, '0')}min
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 