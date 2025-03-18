"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Clock, History, PlayCircle } from "lucide-react"
import { Frota } from "@/types/paradas"
import { useParadas } from "@/contexts/ParadasContext"
import { formatDuration } from "@/utils/dateUtils"
import { renderIcon } from "@/utils/icon-utils"
import { EditParadaModal } from "./EditParadaModal"
import { FrotaStatus } from "@/contexts/ParadasContext"

interface FrotaCardProps {
  frota: Frota;
  status: FrotaStatus;
  onParar: () => void;
  onLiberar: () => Promise<void>;
  onHistorico: () => void;
}

export function FrotaCard({ frota, status, onParar, onLiberar, onHistorico }: FrotaCardProps) {
  const { data: selectedDate, statusFrotas, reloadUnidades } = useParadas()
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Get today's date in America/Sao_Paulo timezone
  const hoje = new Date()
  hoje.setHours(hoje.getHours() - 3)
  const hojeISO = hoje.toISOString().split('T')[0]
  const isCurrentDate = selectedDate === hojeISO
  
  const parada = status?.parada_atual

  const handleLiberar = () => {
    reloadUnidades()
    onLiberar()
  }

  // If no parada, show the "Em operação" state
  if (!parada) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex">
          <div className="w-1 bg-green-500" />
          <div className="flex-1 p-3 space-y-2">
            <div className="font-medium">
              {frota.frota} - {frota.descricao}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PlayCircle className="h-4 w-4 text-gray-500" />
              <span>Em operação...</span>
            </div>

            <div className="flex items-center gap-2">
              {isCurrentDate && (
                <Button 
                  variant="destructive" 
                  className="w-[120px]"
                  onClick={onParar}
                >
                  Parar
                </Button>
              )}
              <div className="flex-1" />
              {(status?.historico_count ?? 0) > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onHistorico}
                >
                  <History className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show the parada state
  const inicio = new Date(parada.inicio)
  const tempoCorrido = formatDuration(parada.inicio, parada.fim)
  const isActive = !parada.fim

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex">
          <div className={`w-1 ${isActive ? 'bg-red-500' : 'bg-green-500'}`} />
          <div className="flex-1 p-3 space-y-2">
            <div className="font-medium">
              {frota.frota} - {frota.descricao}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              {parada.tipo?.icone && renderIcon(parada.tipo.icone)}
              <span>{parada.tipo?.nome || "Tipo não especificado"}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Início: {inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {parada.motivo && (
              <div className="text-sm text-gray-600">
                {parada.motivo}
              </div>
            )}

            <div className="flex items-center gap-2">
              {isCurrentDate && isActive && (
                <Button 
                  variant="default" 
                  className="w-[120px] bg-green-600 hover:bg-green-700"
                  onClick={handleLiberar}
                >
                  Liberar
                </Button>
              )}
              <div className="flex-1 flex items-center justify-center">
                <span className="text-red-500 font-medium text-xs">{tempoCorrido}</span>
              </div>
              <div className="flex items-center gap-2">
                {isCurrentDate && isActive && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
                {(status?.historico_count ?? 0) > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onHistorico}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditParadaModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        parada={parada}
        onParadaUpdated={handleLiberar}
        isFromHistory={false}
      />
    </>
  )
} 