"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { X, Clock } from "lucide-react"
import { TipoParada } from "@/types/paradas"
import { Frota } from "@/types/frotas"
import { paradasService } from "@/services/paradasService"
import { useParadas } from "@/contexts/ParadasContext"
import { toast } from "@/components/ui/use-toast"
import { renderIcon } from "@/utils/icon-utils"

interface ParadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frota: Frota
  onParadaRegistrada: () => void
}

export function ParadaModal({
  open,
  onOpenChange,
  frota,
  onParadaRegistrada
}: ParadaModalProps) {
  const { atualizarCenario, reloadUnidades } = useParadas()
  const [tiposParada, setTiposParada] = useState<TipoParada[]>([])
  const [tipoSelecionado, setTipoSelecionado] = useState("")
  const [motivo, setMotivo] = useState("")
  const [previsao, setPrevisao] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadTiposParada = useCallback(async () => {
    try {
      const tipos = await paradasService.buscarTiposParada()
      setTiposParada(tipos)
    } catch (error) {
      console.error('Error loading tipos de parada:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de parada",
        variant: "destructive",
      })
    }
  }, [])

  // Reset form and load tipos when modal opens
  useEffect(() => {
    if (open) {
      loadTiposParada()
    }
    // Reset form when modal closes
    if (!open) {
      setTipoSelecionado("")
      setMotivo("")
      setPrevisao("")
    }
  }, [open, loadTiposParada])

  const handleSubmit = async () => {
    if (!tipoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de parada",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // 1. Register the parada
      await paradasService.registrarParada({
        frota_id: frota.id,
        tipo_parada_id: tipoSelecionado,
        motivo,
        previsao_horario: previsao || undefined
      })

      // 2. Close the modal first to prevent state conflicts
      onOpenChange(false)

      // 3. Update the scenario
      await atualizarCenario()

      // 4. Notify success
      toast({
        title: "Sucesso",
        description: "Parada registrada com sucesso",
      })

      // 5. Call the callback last
      onParadaRegistrada()
    } catch (error: any) {
      console.error('Error registering parada:', error)
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível registrar a parada",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        aria-describedby="parada-modal-description"
      >
        <div id="parada-modal-description" className="sr-only">
          Modal para registrar uma nova parada
        </div>
        <DialogHeader className="h-12 border-b relative">
          <DialogTitle className="absolute inset-0 flex items-center justify-center text-base font-medium">
            Registrar Parada - {frota.frota}
          </DialogTitle>
          <DialogClose asChild>
            <Button 
              variant="outline"
              size="sm"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-md shadow-sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-2">
          {/* Left Column - Tipos de Parada */}
          <div className="border-r p-4">
            <h4 className="font-medium mb-4 text-center">Tipo de parada</h4>
            <RadioGroup value={tipoSelecionado} onValueChange={setTipoSelecionado} className="space-y-2">
              {tiposParada.map((tipo) => (
                <div key={tipo.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={tipo.id} id={tipo.id} />
                  <Label htmlFor={tipo.id} className="flex items-center gap-2 cursor-pointer">
                    {tipo.icone && renderIcon(tipo.icone, "h-4 w-4")}
                    <span>{tipo.nome}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Right Column - Informações */}
          <div className="p-4">
            <h4 className="font-medium mb-4 text-center">Informações</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Input
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descreva o motivo da parada"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previsao">Previsão de Liberação</Label>
                <div className="relative">
                  <Input
                    id="previsao"
                    type="time"
                    value={previsao}
                    onChange={(e) => setPrevisao(e.target.value)}
                    className="pr-10"
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-black hover:bg-black/90 text-white"
          >
            {isSubmitting ? "Registrando..." : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 