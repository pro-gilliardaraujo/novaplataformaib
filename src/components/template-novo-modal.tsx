// Directory: /src/components/nova-retirada-modal.tsx

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface NovaRetiradaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function NovaRetiradaModal({
  isOpen,
  onClose,
  onSubmit,
}: NovaRetiradaModalProps) {
  const [formData, setFormData] = useState({
    codigo_patrimonio: "",
    retirado_por: "",
    data_retirada: new Date().toISOString().split('T')[0],
    frota_instalada: "",
    entregue_por: "",
    observacoes: "",
    status: "Pendente",
    data_devolucao: "",
    devolvido_por: "",
    recebido_por: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground block mb-0.5">/src/components/nova-retirada-modal.tsx</span>
            <span className="text-base font-medium">Nova Retirada</span>
          </div>
          <DialogClose asChild>
            <Button 
              variant="outline"
              className="h-8 w-8 p-0 absolute right-2 top-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>
        <ScrollArea className="flex-grow px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_patrimonio">Código Patrimônio</Label>
                <Input
                  id="codigo_patrimonio"
                  name="codigo_patrimonio"
                  value={formData.codigo_patrimonio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retirado_por">Retirado por</Label>
                <Input
                  id="retirado_por"
                  name="retirado_por"
                  value={formData.retirado_por}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_retirada">Data de Retirada</Label>
                <Input
                  id="data_retirada"
                  name="data_retirada"
                  type="date"
                  value={formData.data_retirada}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frota_instalada">Frota Instalada</Label>
                <Input
                  id="frota_instalada"
                  name="frota_instalada"
                  value={formData.frota_instalada}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entregue_por">Entregue por</Label>
                <Input
                  id="entregue_por"
                  name="entregue_por"
                  value={formData.entregue_por}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  className="h-20"
                />
              </div>
            </div>
          </form>
        </ScrollArea>
        <div className="border-t bg-gray-50 p-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 