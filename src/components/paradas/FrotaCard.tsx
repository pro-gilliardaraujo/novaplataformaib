"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, History, AlertTriangle, PlayCircle, ClipboardList, Pencil } from "lucide-react"
import { FrotaStatus, Parada } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"
import { renderIcon } from "@/utils/icon-utils"
import { EditParadaModal } from "./EditParadaModal"
import "@/styles/material-icons.css"
import { formatDuration } from "@/utils/dateUtils"

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
  const isParada = status.parada_atual !== null;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOverdue, setIsOverdue] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Reset overdue state when parada changes or is released
  useEffect(() => {
    setIsOverdue(false);
  }, [status.parada_atual]);

  // Update current time every second and check if parada is overdue
  useEffect(() => {
    if (!isParada) return;

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check if parada is overdue
      const parada = status.parada_atual as Parada;
      if (parada.previsao_horario) {
        const previsaoDate = new Date(parada.previsao_horario);
        const wasOverdue = isOverdue;
        const isNowOverdue = now.getTime() > previsaoDate.getTime();
        
        // If we just became overdue, play the sound
        if (!wasOverdue && isNowOverdue) {
          audioRef.current?.play();
        }
        
        setIsOverdue(isNowOverdue);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isParada, isOverdue, status.parada_atual]);

  // Get tag color based on status
  const getTagColor = (parada: Parada | null) => {
    if (!parada) return 'bg-green-500' // Not stopped
    if (!parada.fim) return 'bg-red-500' // Currently stopped
    if (!parada.previsao_horario) return 'bg-gray-600' // No prediction
    
    const previsaoDate = new Date(parada.previsao_horario).getTime()
    const fimDate = new Date(parada.fim).getTime()
    
    return fimDate <= previsaoDate ? 'bg-green-500' : 'bg-red-500'
  }

  // Get previsão text color
  const getPrevisaoColor = (parada: Parada) => {
    if (!parada.previsao_horario) return 'text-gray-600'
    if (!parada.fim) return 'text-gray-600' // Currently active
    
    const previsaoDate = new Date(parada.previsao_horario).getTime()
    const fimDate = new Date(parada.fim).getTime()
    
    return fimDate <= previsaoDate ? 'text-green-600' : 'text-red-600'
  }

  if (!isParada) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="flex">
          <div className="w-1 bg-green-500" />
          <div className="flex-1 p-3 space-y-2">
            <div className="font-medium">
              {status.frota.frota} - {status.frota.descricao}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <PlayCircle className="h-4 w-4 text-gray-500" />
              <span>Em operação...</span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                className="w-[120px]"
                onClick={onParar}
              >
                Parar
              </Button>
              <div className="flex-1" />
              {status.historico_count > 0 ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onHistorico}
                >
                  <History className="h-4 w-4" />
                </Button>
              ) : (
                <div className="w-9" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const parada = status.parada_atual as Parada;
  const tagColor = getTagColor(parada);
  const previsaoColor = getPrevisaoColor(parada);
  
  const inicio = new Date(parada.inicio);
  const tempoCorrido = parada ? formatDuration(parada.inicio, parada.fim) : "00:00:00"

  let tempoPrevisao = "";
  if (parada.previsao_horario) {
    const previsaoDate = new Date(parada.previsao_horario);
    tempoPrevisao = previsaoDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  }

  return (
    <>
      <audio 
        ref={audioRef}
        src="https://kjlwqezxzqjfhacmjhbh.supabase.co/storage/v1/object/public/sourcefiles//iPhoneNotification.mp3"
        preload="auto"
      />
      <div className={`bg-white rounded-lg shadow-sm border overflow-hidden group ${isOverdue ? 'animate-border-blink' : ''}`}>
        <div className="flex">
          <div className={`w-1 ${tagColor}`} />
          <div className="flex-1 p-3 space-y-2">
            <div className="font-medium">
              {status.frota.frota} - {status.frota.descricao}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              {parada.tipo?.icone && renderIcon(parada.tipo.icone)}
              <span>{parada.tipo?.nome || "Tipo não especificado"}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Início: {inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {parada.previsao_horario && (
                <div className="flex items-center gap-1">
                  <Clock className={`h-4 w-4 ${previsaoColor}`} />
                  <span className={previsaoColor}>
                    Previsão: {tempoPrevisao}
                  </span>
                </div>
              )}
            </div>

            {parada.motivo && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClipboardList className="h-4 w-4" />
                <span>{parada.motivo}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                className="w-[120px] bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  try {
                    await paradasService.liberarParada(parada.id);
                    onLiberar();
                  } catch (error) {
                    console.error('Erro ao liberar parada:', error);
                  }
                }}
              >
                Liberar
              </Button>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-red-500 font-medium text-xs">{tempoCorrido}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditModalOpen(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {status.historico_count > 0 && (
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
        onParadaUpdated={onLiberar}
      />
    </>
  );
} 