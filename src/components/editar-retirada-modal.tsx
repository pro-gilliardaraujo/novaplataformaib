"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Retirada, NovaRetiradaData } from "@/types/retirada"
import { formatName, formatPatrimonioCode, normalizeText } from "@/utils/formatters"

interface EditarRetiradaModalProps {
  retirada: Retirada
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (id: string, updates: Partial<NovaRetiradaData>) => Promise<void>
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center mb-4">
      <div className="flex-grow h-px bg-gray-200"></div>
      <h3 className="text-base font-medium px-4">{title}</h3>
      <div className="flex-grow h-px bg-gray-200"></div>
    </div>
  )
}

export function EditarRetiradaModal({
  retirada,
  open,
  onOpenChange,
  onSubmit,
}: EditarRetiradaModalProps) {
  const [formData, setFormData] = useState<Partial<NovaRetiradaData>>({
    codigo_patrimonio: retirada.codigo_patrimonio,
    retirado_por: retirada.retirado_por,
    data_retirada: retirada.data_retirada,
    frota_instalada: retirada.frota_instalada,
    entregue_por: retirada.entregue_por,
    devolvido_por: retirada.devolvido_por || "",
    data_devolucao: retirada.data_devolucao || "",
    recebido_por: retirada.recebido_por || "",
    retirado: retirada.retirado,
    observacoes: retirada.observacoes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const updatedData = {
      ...formData,
      devolvido_por: formData.devolvido_por || null,
      data_devolucao: formData.data_devolucao || null,
      recebido_por: formData.recebido_por || null,
      observacoes: formData.observacoes || null,
    }
    await onSubmit(retirada.id, updatedData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Retirada</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_patrimonio">Código Patrimônio</Label>
              <Input
                id="codigo_patrimonio"
                value={formData.codigo_patrimonio}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    codigo_patrimonio: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frota_instalada">Frota Instalada</Label>
              <Input
                id="frota_instalada"
                value={formData.frota_instalada}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    frota_instalada: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retirado_por">Retirado por</Label>
              <Input
                id="retirado_por"
                value={formData.retirado_por}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    retirado_por: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entregue_por">Entregue por</Label>
              <Input
                id="entregue_por"
                value={formData.entregue_por}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    entregue_por: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_retirada">Data de Retirada</Label>
              <Input
                id="data_retirada"
                type="date"
                value={formData.data_retirada}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    data_retirada: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devolvido_por">Devolvido por</Label>
              <Input
                id="devolvido_por"
                value={formData.devolvido_por}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    devolvido_por: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_devolucao">Data de Devolução</Label>
              <Input
                id="data_devolucao"
                type="date"
                value={formData.data_devolucao}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    data_devolucao: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recebido_por">Recebido por</Label>
              <Input
                id="recebido_por"
                value={formData.recebido_por}
                onChange={(e) =>
                  setFormData((prev: Partial<NovaRetiradaData>) => ({
                    ...prev,
                    recebido_por: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData((prev: Partial<NovaRetiradaData>) => ({
                  ...prev,
                  observacoes: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 