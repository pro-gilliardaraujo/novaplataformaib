"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { NovoEquipamentoData } from "@/types/equipamento"
import { formatPatrimonioCode } from "@/utils/formatters"

interface NovoEquipamentoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: NovoEquipamentoData) => void
}

export function NovoEquipamentoModal({
  open,
  onOpenChange,
  onSubmit,
}: NovoEquipamentoModalProps) {
  const [formData, setFormData] = useState<NovoEquipamentoData>({
    codigo_patrimonio: "",
    descricao: "",
    num_serie: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "codigo_patrimonio") {
      // Remove caracteres não numéricos e limita a 6 dígitos
      const numericValue = value.replace(/\D/g, "").slice(0, 6)
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Formata o código de patrimônio apenas no momento do submit
      const formattedData = {
        ...formData,
        codigo_patrimonio: formData.codigo_patrimonio ? formatPatrimonioCode(formData.codigo_patrimonio) : ""
      }

      await onSubmit(formattedData)
      
      toast({
        title: "Sucesso",
        description: "Equipamento criado com sucesso!",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao criar equipamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar equipamento. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex items-center h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-base font-medium">Novo Equipamento</span>
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 absolute right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="codigo_patrimonio">Código Patrimônio</Label>
            <Input
              id="codigo_patrimonio"
              name="codigo_patrimonio"
              value={formData.codigo_patrimonio}
              onChange={handleInputChange}
              placeholder="000000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleInputChange}
              placeholder="Descrição do equipamento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="num_serie">Número de Série</Label>
            <Input
              id="num_serie"
              name="num_serie"
              value={formData.num_serie}
              onChange={handleInputChange}
              placeholder="Número de série do equipamento"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 