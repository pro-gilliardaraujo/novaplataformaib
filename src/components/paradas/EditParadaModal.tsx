"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Parada, TipoParada } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"
import { Clock, ClipboardList, X } from "lucide-react"
import { renderIcon } from "@/utils/icon-utils"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface EditParadaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parada: Parada | null;
  onParadaUpdated: () => void;
}

export function EditParadaModal({ open, onOpenChange, parada, onParadaUpdated }: EditParadaModalProps) {
  const [tipoParadaId, setTipoParadaId] = useState<string>("")
  const [motivo, setMotivo] = useState<string>("")
  const [previsao, setPrevisao] = useState<string>("")
  const [tiposParada, setTiposParada] = useState<TipoParada[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Update state when parada changes
  useEffect(() => {
    if (parada) {
      setTipoParadaId(parada.tipo_parada_id)
      setMotivo(parada.motivo || "")
      if (parada.previsao_horario) {
        const previsaoDate = new Date(parada.previsao_horario)
        setPrevisao(previsaoDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }))
      } else {
        setPrevisao("")
      }
    }
  }, [parada])

  // Load tipos parada when modal opens
  useEffect(() => {
    const carregarTipos = async () => {
      try {
        const tipos = await paradasService.buscarTiposParada()
        setTiposParada(tipos)
      } catch (error) {
        console.error('Erro ao carregar tipos de parada:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tipos de parada",
          variant: "destructive",
        })
      }
    }

    if (open) {
      carregarTipos()
    }
  }, [open, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!parada) return

    if (!tipoParadaId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o tipo de parada",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Convert time-only value to full datetime
      let previsaoHorario: string | undefined = undefined
      if (previsao) {
        const today = new Date()
        const [hours, minutes, seconds] = previsao.split(':').map(Number)
        today.setHours(hours, minutes, seconds || 0)
        previsaoHorario = today.toISOString()
      }

      await paradasService.atualizarParada(
        parada.id,
        tipoParadaId,
        motivo,
        previsaoHorario
      )

      toast({
        title: "Parada atualizada",
        description: "A parada foi atualizada com sucesso",
      })

      onParadaUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao atualizar parada:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a parada",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if no parada is provided
  if (!parada) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px]">
        <div>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="text-xl font-semibold flex-1 text-center whitespace-nowrap">
              Editar Parada <span className="text-red-500">{parada.frota?.frota} - {parada.frota?.descricao}</span>
            </DialogTitle>
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

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Tipo de Parada */}
            <div className="space-y-2">
              <Label>Tipo de Parada</Label>
              <div className="border rounded-lg">
                <RadioGroup
                  value={tipoParadaId}
                  onValueChange={setTipoParadaId}
                  className="divide-y max-h-[264px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                >
                  {tiposParada.map(tipo => (
                    <div
                      key={tipo.id}
                      className={`flex items-center space-x-3 p-3 hover:bg-gray-50 ${
                        tipoParadaId === tipo.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <RadioGroupItem value={tipo.id} id={tipo.id} />
                      <Label htmlFor={tipo.id} className="flex items-center gap-2 cursor-pointer">
                        {tipo.icone && renderIcon(tipo.icone)}
                        <span>{tipo.nome}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Right Column - Motivo e Previsão */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Textarea
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descreva o motivo da parada"
                  className="resize-none h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previsao">Previsão de Liberação</Label>
                <Input
                  id="previsao"
                  type="time"
                  step="1"
                  value={previsao}
                  onChange={(e) => setPrevisao(e.target.value)}
                  className="resize-none"
                />
                <span className="text-sm text-gray-500">
                  Selecione a hora prevista para a liberação
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 