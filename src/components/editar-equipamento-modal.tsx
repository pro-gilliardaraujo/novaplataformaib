"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Equipamento, UpdateEquipamentoData } from "@/types/equipamento"

interface EditarEquipamentoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEquipamentoEdited: (updates: UpdateEquipamentoData) => void
  equipamentoData: Equipamento
}

export function EditarEquipamentoModal({
  open,
  onOpenChange,
  onEquipamentoEdited,
  equipamentoData,
}: EditarEquipamentoModalProps) {
  const [formData, setFormData] = useState<UpdateEquipamentoData>({
    descricao: equipamentoData.descricao,
    num_serie: equipamentoData.num_serie,
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onEquipamentoEdited(formData)
      
      toast({
        title: "Sucesso",
        description: "Equipamento atualizado com sucesso!",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao atualizar equipamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar equipamento. Por favor, tente novamente.",
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
            <span className="text-base font-medium">Editar Equipamento</span>
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
              value={equipamentoData.codigo_patrimonio}
              disabled
              className="bg-gray-50"
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
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 