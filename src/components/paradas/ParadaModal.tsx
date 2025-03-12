"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ParadaModalProps } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"

export function ParadaModal({ open, onOpenChange, frota, onParadaRegistrada }: ParadaModalProps) {
  const [tipoParadaId, setTipoParadaId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [previsaoHoras, setPrevisaoHoras] = useState("")
  const [previsaoMinutos, setPrevisaoMinutos] = useState("")
  const [tiposParada, setTiposParada] = useState<Array<{ id: string; nome: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Carregar tipos de parada
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
    if (!tipoParadaId || !motivo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tipo de parada e o motivo",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Calcular previsão em minutos
      let previsaoTotal: number | undefined = undefined
      if (previsaoHoras || previsaoMinutos) {
        previsaoTotal = (parseInt(previsaoHoras || "0") * 60) + parseInt(previsaoMinutos || "0")
      }

      await paradasService.registrarParada(
        frota.id,
        tipoParadaId,
        motivo,
        previsaoTotal
      )

      toast({
        title: "Parada registrada",
        description: "A parada foi registrada com sucesso",
      })

      onParadaRegistrada()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao registrar parada:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a parada",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Limpar form ao fechar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTipoParadaId("")
      setMotivo("")
      setPrevisaoHoras("")
      setPrevisaoMinutos("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Parada - {frota.codigo_patrimonio}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Parada</Label>
            <Select value={tipoParadaId} onValueChange={setTipoParadaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de parada" />
              </SelectTrigger>
              <SelectContent>
                {tiposParada.map(tipo => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da parada"
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Previsão (opcional)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  placeholder="Horas"
                  value={previsaoHoras}
                  onChange={(e) => setPrevisaoHoras(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Minutos"
                  value={previsaoMinutos}
                  onChange={(e) => setPrevisaoMinutos(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
              {isLoading ? "Registrando..." : "Registrar Parada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 