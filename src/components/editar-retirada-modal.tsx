// Directory: /src/components/editar-retirada-modal.tsx

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { type Retirada } from "@/app/gerenciamento/painel/retiradas/columns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface EditarRetiradaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Retirada) => void
  retiradaData: Retirada
}

export function EditarRetiradaModal({
  isOpen,
  onClose,
  onSubmit,
  retiradaData,
}: EditarRetiradaModalProps) {
  const [formData, setFormData] = useState<Retirada>(retiradaData)

  useEffect(() => {
    setFormData(retiradaData)
  }, [retiradaData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value || "" }))
  }

  const handleStatusChange = (value: "Pendente" | "Devolvido") => {
    setFormData(prev => ({ ...prev, status: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <div className="flex items-center px-4 h-12 border-b relative">
          <div className="flex-1 text-center">
            <span className="text-xs text-muted-foreground block mb-0.5">/src/components/editar-retirada-modal.tsx</span>
            <span className="text-base font-medium">Editar Retirada #{retiradaData.codigo_patrimonio}</span>
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
                  value={formData.codigo_patrimonio || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retirado_por">Retirado por</Label>
                <Input
                  id="retirado_por"
                  name="retirado_por"
                  value={formData.retirado_por || ""}
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
                  value={formData.data_retirada || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frota_instalada">Frota Instalada</Label>
                <Input
                  id="frota_instalada"
                  name="frota_instalada"
                  value={formData.frota_instalada || ""}
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
                  value={formData.entregue_por || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes || ""}
                  onChange={handleChange}
                  className="h-20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Devolvido">Devolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.status === "Devolvido" && (
                <div className="space-y-2">
                  <Label htmlFor="data_devolucao">Data de Devolução</Label>
                  <Input
                    id="data_devolucao"
                    name="data_devolucao"
                    type="date"
                    value={formData.data_devolucao || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </div>
            {formData.status === "Devolvido" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="devolvido_por">Devolvido por</Label>
                  <Input
                    id="devolvido_por"
                    name="devolvido_por"
                    value={formData.devolvido_por || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recebido_por">Recebido por</Label>
                  <Input
                    id="recebido_por"
                    name="recebido_por"
                    value={formData.recebido_por || ""}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}
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