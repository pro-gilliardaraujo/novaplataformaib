"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, History, AlertTriangle, PlayCircle } from "lucide-react"
import { FrotaStatus, Parada } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"
import "@/styles/material-icons.css"

interface FrotaCardProps {
  status: FrotaStatus
  onParar: () => void
  onLiberar: () => void
  onHistorico: () => void
}

// Helper function to convert icon name to proper format
function formatIconName(iconPath: string) {
  if (!iconPath) return ''
  
  const [library, style, name] = iconPath.split('/')
  
  switch (library) {
    case 'material':
      // Convert from MdOutlineCleaningServices to cleaning_services
      return name
        .replace(/^Md/, '') // Remove Md prefix
        .replace(/^Outline/, '') // Remove Outline prefix
        .replace(/([A-Z])/g, (match, letter, offset) => 
          offset === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase()
        )
    
    case 'heroicons':
    case 'phosphor':
    case 'remixicon':
    case 'boxicons':
    case 'fontawesome':
    case 'ionicons':
      // For other libraries, just return the name as is
      return name
    
    default:
      return name
  }
}

// Helper function to get icon class based on library
function getIconClass(iconPath: string) {
  if (!iconPath) return ''
  
  const [library, style] = iconPath.split('/')
  
  switch (library) {
    case 'material':
      return 'material-icons-outlined text-[16px] leading-[16px]'
    case 'heroicons':
      return 'h-4 w-4'
    case 'phosphor':
      return 'h-4 w-4'
    case 'remixicon':
      return 'text-[16px] leading-[16px]'
    case 'boxicons':
      return 'text-[16px] leading-[16px]'
    case 'fontawesome':
      return 'text-[16px] leading-[16px]'
    case 'ionicons':
      return 'text-[16px] leading-[16px]'
    default:
      return 'h-4 w-4'
  }
}

export function FrotaCard({ status, onParar, onLiberar, onHistorico }: FrotaCardProps) {
  const isParada = status.parada_atual !== null

  if (!isParada) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Barra lateral verde indicando status */}
        <div className="flex">
          <div className="w-1 bg-green-500" />
          <div className="flex-1 p-3 space-y-2">
            {/* Título da frota */}
            <div className="font-medium">
              {status.frota.frota} - {status.frota.descricao}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PlayCircle className="h-4 w-4 text-gray-500" />
              <span>Em operação...</span>
            </div>

            {/* Botão de ação */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={onParar}
              >
                Parar
              </Button>
              <div /> {/* Empty div for grid alignment */}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Certifica que parada_atual existe
  const parada = status.parada_atual as Parada
  
  // Calcula o tempo de parada
  const inicio = new Date(parada.inicio)
  const agora = new Date()
  const horasParada = Math.floor((agora.getTime() - inicio.getTime()) / (1000 * 60 * 60))
  const minutosParada = Math.floor(((agora.getTime() - inicio.getTime()) % (1000 * 60 * 60)) / (1000 * 60))
  const tempoParada = `${horasParada.toString().padStart(2, '0')}:${minutosParada.toString().padStart(2, '0')}`

  // Calcula a previsão (se houver)
  let tempoPrevisao = ""
  if (parada.previsao_minutos) {
    const previsaoMinutos = parada.previsao_minutos
    const horasPrevisao = Math.floor(previsaoMinutos / 60)
    const minutosPrevisao = previsaoMinutos % 60
    tempoPrevisao = `${horasPrevisao.toString().padStart(2, '0')}:${minutosPrevisao.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Barra lateral vermelha indicando status */}
      <div className="flex">
        <div className="w-1 bg-red-500" />
        <div className="flex-1 p-3 space-y-2">
          {/* Título da frota */}
          <div className="font-medium">
            {status.frota.frota} - {status.frota.descricao}
          </div>

          {/* Linha de tempo */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Parada: {tempoParada}</span>
            </div>
            {tempoPrevisao && (
              <>
                <div className="flex items-center gap-1 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>Previsão: {tempoPrevisao}</span>
                </div>
              </>
            )}
          </div>

          {/* Tipo de parada */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {parada.tipo?.icone && (
              <span className={getIconClass(parada.tipo.icone)}>
                {formatIconName(parada.tipo.icone)}
              </span>
            )}
            <span>{parada.tipo?.nome || "Tipo não especificado"}</span>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-[1fr,auto] gap-2">
            <Button 
              variant="default" 
              onClick={onLiberar}
            >
              Liberar
            </Button>
            {status.historico_count > 0 ? (
              <Button
                variant="outline"
                size="icon"
                onClick={onHistorico}
              >
                <History className="h-4 w-4" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 