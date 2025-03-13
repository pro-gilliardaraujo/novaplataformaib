"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { HistoricoModalProps, Parada } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"
import { useParadas } from "@/contexts/ParadasContext"
import { Clock, X, PlayCircle, StopCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Pi from "phosphor-react"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import { IconContext as PhosphorIconContext } from "phosphor-react"
import "@/styles/material-icons.css"

// Helper function to get icon component
function getIconComponent(iconPath: string | undefined) {
  if (!iconPath) return null

  const [library, style, name] = iconPath.split('/')
  let iconSet: Record<string, any>

  // Função auxiliar para renderizar ícone do Phosphor
  const renderPhosphorIcon = (Icon: any) => {
    return (
      <PhosphorIconContext.Provider
        value={{
          size: 16,
          weight: style as any,
          mirrored: false,
        }}
      >
        <Icon />
      </PhosphorIconContext.Provider>
    )
  }

  switch (library) {
    case 'heroicons':
      switch (style) {
        case 'solid':
          iconSet = HeroIconsSolid
          break
        case 'mini':
          iconSet = HeroIconsMini
          break
        default:
          iconSet = HeroIconsOutline
      }
      break
    case 'remixicon':
      iconSet = Ri
      break
    case 'boxicons':
      iconSet = Bi
      break
    case 'phosphor':
      const PhosphorIcon = Pi[name as keyof typeof Pi]
      if (PhosphorIcon) {
        return renderPhosphorIcon(PhosphorIcon)
      }
      return null
    case 'fontawesome':
      iconSet = Fa
      break
    case 'material':
      iconSet = Md
      break
    case 'ionicons':
      iconSet = Io
      break
    default:
      return null
  }

  const IconComponent = iconSet[name]
  if (IconComponent) {
    return <IconComponent className="h-4 w-4 text-gray-500" />
  }

  return null
}

export function HistoricoModal({ open, onOpenChange, frota }: HistoricoModalProps) {
  const [paradas, setParadas] = useState<Parada[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { data: dataAtual } = useParadas()
  const { toast } = useToast()

  // Update current time every second
  useEffect(() => {
    if (!open) return

    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [open])

  // Calculate duration between two dates or from start until now
  const calcularDuracaoAtual = useCallback((inicio: string, fim?: string | null) => {
    const startDate = new Date(inicio)
    const endDate = fim ? new Date(fim) : currentTime
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000) // in seconds

    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60

    return {
      hours,
      minutes,
      seconds,
      total: duration
    }
  }, [currentTime])

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

  // Calcular horário previsto
  const calcularHorarioPrevisto = (inicio: string, previsaoMinutos: number) => {
    const startDate = new Date(inicio)
    const previsaoDate = new Date(startDate.getTime() + previsaoMinutos * 60000)
    return formatarHorario(previsaoDate.toISOString())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px]">
        <div>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="flex-1 text-center whitespace-nowrap">Histórico de Paradas - {frota.frota}</DialogTitle>
            <div className="flex-1 flex justify-end">
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
          <div className="border-b mt-4" />
        </div>

        <div className="mt-6">
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
              <div className="space-y-2">
                {paradasFiltradas.map((parada) => {
                  const duracao = calcularDuracaoAtual(parada.inicio, parada.fim)
                  const isActive = !parada.fim

                  return (
                    <div
                      key={parada.id}
                      className="bg-white rounded-lg shadow-sm border overflow-hidden"
                    >
                      <div className="flex">
                        <div className={`w-1 ${isActive ? 'bg-red-500' : 'bg-green-500'}`} />
                        <div className="flex-1 p-3 space-y-2">
                          {/* Primeira linha: Tipo e Tempo Corrido */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {parada.tipo?.icone && getIconComponent(parada.tipo.icone)}
                              <span>{parada.tipo?.nome}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className={`h-4 w-4 ${isActive ? 'text-red-500' : ''}`} />
                              <span className={isActive ? 'text-red-500 font-medium' : 'text-gray-500'}>
                                {duracao.hours > 0 && `${duracao.hours}h`}
                                {duracao.minutes.toString().padStart(2, '0')}m
                                {isActive && `${duracao.seconds.toString().padStart(2, '0')}s`}
                              </span>
                            </div>
                          </div>

                          {/* Segunda linha: Início e Previsão */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                Parada: {formatarHorario(parada.inicio)}
                                {parada.fim && ` até ${formatarHorario(parada.fim)}`}
                              </span>
                            </div>
                            {parada.previsao_horario && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Previsão: {formatarHorario(parada.previsao_horario)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Motivo (se existir) */}
                          {parada.motivo && (
                            <p className="text-sm text-gray-600">{parada.motivo}</p>
                          )}
                        </div>
                      </div>
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