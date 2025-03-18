"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { paradasService } from "@/services/paradasService"
import { tiposParadaService } from "@/services/tiposParadaService"
import { Frota } from "@/types/frotas"
import { TipoParada } from "@/types/paradas"
import { useToast } from "@/components/ui/use-toast"
import { renderIcon } from "@/utils/icon-utils"

interface ParadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frota: Frota | null
  onParadaRegistrada: () => void
}

export function ParadaModal({
  open,
  onOpenChange,
  frota,
  onParadaRegistrada
}: ParadaModalProps) {
  const [tipoParadaId, setTipoParadaId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [previsaoHorario, setPrevisaoHorario] = useState("")
  const [tiposParada, setTiposParada] = useState<TipoParada[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const carregarTiposParada = async () => {
      try {
        const tipos = await tiposParadaService.buscarTipos()
        setTiposParada(tipos)
      } catch (error) {
        console.error("Erro ao carregar tipos de parada:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tipos de parada",
          variant: "destructive",
        })
      }
    }

    if (open) {
      carregarTiposParada()
    }
  }, [open])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setTipoParadaId("")
      setMotivo("")
      setPrevisaoHorario("")
    }
  }, [open])

  const handleSubmit = async () => {
    if (!frota) {
      toast({
        title: "Erro",
        description: "Frota não selecionada",
        variant: "destructive",
      })
      return
    }

    if (!tipoParadaId) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de parada",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await paradasService.registrarParada(
        frota.id,
        tipoParadaId,
        motivo,
        previsaoHorario || undefined
      )

      toast({
        title: "Sucesso",
        description: "Parada registrada com sucesso",
      })

      onParadaRegistrada()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao registrar parada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a parada",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!frota) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar Parada - {frota.frota}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Parada</Label>
            <Select value={tipoParadaId} onValueChange={setTipoParadaId}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposParada.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    <div className="flex items-center gap-2">
                      {tipo.icone && renderIcon(tipo.icone, "h-4 w-4")}
                      <span>{tipo.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Digite o motivo da parada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="previsao">Previsão de Retorno</Label>
            <Input
              id="previsao"
              type="datetime-local"
              value={previsaoHorario}
              onChange={(e) => setPrevisaoHorario(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 