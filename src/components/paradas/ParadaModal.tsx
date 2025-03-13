"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { ParadaModalProps } from "@/types/paradas"
import { paradasService } from "@/services/paradasService"
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

export function ParadaModal({ open, onOpenChange, frota, onParadaRegistrada }: ParadaModalProps) {
  const [tipoParadaId, setTipoParadaId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [previsao, setPrevisao] = useState("")
  const [tiposParada, setTiposParada] = useState<Array<{ id: string; nome: string; icone?: string }>>([])
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
      // Convert time string to minutes
      let previsaoMinutos: number | undefined = undefined
      if (previsao) {
        const [hours, minutes] = previsao.split(':').map(Number)
        previsaoMinutos = (hours * 60) + minutes
      }

      await paradasService.registrarParada(
        frota.id,
        tipoParadaId,
        motivo,
        previsaoMinutos
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
      setPrevisao("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[900px]">
        <DialogHeader className="flex flex-col items-center space-y-2 pb-4">
          <DialogTitle className="text-xl font-semibold">Registrar Parada {frota.frota}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Tipo de Parada */}
            <div className="space-y-2">
              <Label>Tipo de Parada</Label>
              <div className="border rounded-lg">
                <RadioGroup
                  value={tipoParadaId}
                  onValueChange={setTipoParadaId}
                  className="divide-y max-h-[300px] overflow-y-auto"
                >
                  {tiposParada.map(tipo => (
                    <div
                      key={tipo.id}
                      className={`flex items-center space-x-3 p-3 ${
                        tipoParadaId === tipo.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <RadioGroupItem value={tipo.id} id={tipo.id} />
                      <Label htmlFor={tipo.id} className="flex items-center gap-2 cursor-pointer">
                        {tipo.icone && getIconComponent(tipo.icone)}
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
                <Label htmlFor="previsao">Previsão (opcional)</Label>
                <Input
                  id="previsao"
                  type="time"
                  value={previsao}
                  onChange={(e) => setPrevisao(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
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