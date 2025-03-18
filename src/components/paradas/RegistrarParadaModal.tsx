"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { paradasService } from "@/services/paradasService"
import { tiposParadaService } from "@/services/tiposParadaService"
import { TipoParada } from "@/types/paradas"
import { Frota } from "@/types/frotas"
import { renderIcon } from "@/utils/icon-utils"

interface RegistrarParadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frota: Frota
  onParadaRegistrada: () => void
}

export function RegistrarParadaModal({
  open,
  onOpenChange,
  frota,
  onParadaRegistrada
}: RegistrarParadaModalProps) {
  const [tipoId, setTipoId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [previsao, setPrevisao] = useState("")
  const [tipos, setTipos] = useState<TipoParada[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const carregarTipos = async () => {
      try {
        const tiposData = await tiposParadaService.buscarTipos()
        setTipos(tiposData)
      } catch (error) {
        console.error("Erro ao carregar tipos de parada:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tipos de parada",
          variant: "destructive"
        })
      }
    }

    if (open) {
      carregarTipos()
    }
  }, [open, toast])

  const handleSubmit = async () => {
    if (!tipoId) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de parada",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      await paradasService.registrarParada(
        frota.id,
        tipoId,
        motivo || "",
        previsao || undefined
      )

      toast({
        title: "Sucesso",
        description: "Parada registrada com sucesso"
      })

      onParadaRegistrada()
      onOpenChange(false)
      
      // Reset form
      setTipoId("")
      setMotivo("")
      setPrevisao("")
    } catch (error) {
      console.error("Erro ao registrar parada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a parada",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="h-12 border-b relative">
          <DialogTitle className="absolute inset-0 flex items-center justify-center text-base font-medium">
            Registrar Parada - {frota.frota}
          </DialogTitle>
          <DialogClose asChild>
            <Button 
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 absolute right-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-2">
          {/* Left Column - Tipos de Parada */}
          <div className="border-r p-4">
            <h4 className="font-medium mb-4">Tipo de parada</h4>
            <RadioGroup value={tipoId} onValueChange={setTipoId} className="space-y-2">
              {tipos.map((tipo) => (
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
            <h4 className="font-medium mb-4">Informações</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Textarea
                  id="motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previsao">Previsão</Label>
                <div className="relative">
                  <input
                    id="previsao"
                    type="time"
                    value={previsao}
                    onChange={(e) => setPrevisao(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    placeholder="--:--"
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-black hover:bg-black/90 text-white"
          >
            Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 