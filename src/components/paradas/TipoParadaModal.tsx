"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { tiposParadaService } from "@/services/tiposParadaService"
import { TipoParada } from "@/types/paradas"
import { useToast } from "@/components/ui/use-toast"
import * as HeroIconsOutline from "@heroicons/react/24/outline"
import * as HeroIconsSolid from "@heroicons/react/24/solid"
import * as HeroIconsMini from "@heroicons/react/20/solid"
import * as Pi from "phosphor-react"
import * as Fa from "react-icons/fa"
import * as Md from "react-icons/md"
import * as Io from "react-icons/io"
import * as Ri from "react-icons/ri"
import * as Bi from "react-icons/bi"
import { renderIcon } from "@/utils/icon-utils"

interface TipoParadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoParada: TipoParada | null
  onTipoParadaUpdated: () => void
}

const iconLibraries = [
  { label: "Heroicons", value: "heroicons" },
  { label: "Phosphor", value: "phosphor" },
  { label: "Material", value: "material" },
  { label: "Font Awesome", value: "fontawesome" },
  { label: "Remix Icons", value: "remixicon" },
  { label: "Box Icons", value: "boxicons" },
  { label: "Ionicons", value: "ionicons" }
]

const iconStyles = {
  heroicons: [
    { label: "Outline", value: "outline" },
    { label: "Solid", value: "solid" },
    { label: "Mini", value: "mini" }
  ],
  phosphor: [
    { label: "Regular", value: "regular" },
    { label: "Bold", value: "bold" },
    { label: "Light", value: "light" },
    { label: "Thin", value: "thin" }
  ],
  material: [
    { label: "Outlined", value: "outlined" },
    { label: "Filled", value: "filled" },
    { label: "Round", value: "round" },
    { label: "Sharp", value: "sharp" }
  ],
  fontawesome: [
    { label: "Regular", value: "regular" },
    { label: "Solid", value: "solid" },
    { label: "Light", value: "light" }
  ],
  remixicon: [
    { label: "Line", value: "line" },
    { label: "Fill", value: "fill" }
  ],
  boxicons: [
    { label: "Regular", value: "regular" },
    { label: "Solid", value: "solid" },
    { label: "Logo", value: "logo" }
  ],
  ionicons: [
    { label: "Outline", value: "outline" },
    { label: "Sharp", value: "sharp" },
    { label: "Filled", value: "filled" }
  ]
}

export function TipoParadaModal({
  open,
  onOpenChange,
  tipoParada,
  onTipoParadaUpdated
}: TipoParadaModalProps) {
  const [nome, setNome] = useState("")
  const [iconLibrary, setIconLibrary] = useState("heroicons")
  const [iconStyle, setIconStyle] = useState("outline")
  const [iconName, setIconName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (tipoParada) {
      setNome(tipoParada.nome)
      if (tipoParada.icone) {
        const [library, style, name] = tipoParada.icone.split('/')
        setIconLibrary(library)
        setIconStyle(style)
        setIconName(name)
      }
    } else {
      setNome("")
      setIconLibrary("heroicons")
      setIconStyle("outline")
      setIconName("")
    }
  }, [tipoParada])

  const handleSubmit = async () => {
    if (!nome) {
      toast({
        title: "Erro",
        description: "Digite o nome do tipo de parada",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const icone = iconName ? `${iconLibrary}/${iconStyle}/${iconName}` : ""

      if (tipoParada) {
        await tiposParadaService.atualizarTipo(tipoParada.id, nome, icone)
        toast({
          title: "Sucesso",
          description: "Tipo de parada atualizado com sucesso",
        })
      } else {
        await tiposParadaService.criarTipo(nome, icone)
        toast({
          title: "Sucesso",
          description: "Tipo de parada criado com sucesso",
        })
      }

      onTipoParadaUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar tipo de parada:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o tipo de parada",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tipoParada ? "Editar Tipo de Parada" : "Novo Tipo de Parada"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do tipo de parada"
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="iconLibrary" className="text-xs">Biblioteca</Label>
                <Select value={iconLibrary} onValueChange={setIconLibrary}>
                  <SelectTrigger id="iconLibrary">
                    <SelectValue placeholder="Selecione a biblioteca" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconLibraries.map((lib) => (
                      <SelectItem key={lib.value} value={lib.value}>
                        {lib.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="iconStyle" className="text-xs">Estilo</Label>
                <Select value={iconStyle} onValueChange={setIconStyle}>
                  <SelectTrigger id="iconStyle">
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {iconStyles[iconLibrary as keyof typeof iconStyles].map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="iconName" className="text-xs">Nome do Ícone</Label>
              <Input
                id="iconName"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
                placeholder="Ex: DocumentDuplicateIcon"
              />
            </div>

            {iconName && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">Prévia:</span>
                {renderIcon(`${iconLibrary}/${iconStyle}/${iconName}`, "h-5 w-5")}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {tipoParada ? "Salvar Alterações" : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 