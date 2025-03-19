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

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updatedData = {
        ...formData,
        codigo_patrimonio: formatPatrimonioCode(formData.codigo_patrimonio || ""),
        retirado_por: formatName(formData.retirado_por || ""),
        entregue_por: formatName(formData.entregue_por || ""),
        devolvido_por: formData.devolvido_por || null,
        data_devolucao: formData.data_devolucao || null,
        recebido_por: formData.recebido_por || null,
        observacoes: formData.observacoes || null,
      }
      await onSubmit(retirada.id, updatedData)
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating retirada:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <DialogHeader className="px-6 h-12 border-b grid grid-cols-[48px_1fr_48px] items-center">
          <div /> {/* Spacer */}
          <DialogTitle className="text-center">Editar Retirada</DialogTitle>
          <div className="flex justify-end">
            <Button 
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-grow">
          <form id="editar-retirada-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            <SectionTitle title="Informações da Retirada" />
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="codigo_patrimonio">Código Patrimônio</Label>
                <Input
                  id="codigo_patrimonio"
                  name="codigo_patrimonio"
                  value={formData.codigo_patrimonio}
                  onChange={handleChange}
                  placeholder="Digite apenas números"
                  maxLength={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="retirado_por">Retirado por</Label>
                <Input
                  id="retirado_por"
                  name="retirado_por"
                  value={formData.retirado_por}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
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
            </div>

            <SectionTitle title="Detalhes da Instalação" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="frota_instalada">Frota Instalada</Label>
                <Input
                  id="frota_instalada"
                  name="frota_instalada"
                  value={formData.frota_instalada}
                  onChange={handleChange}
                  placeholder="Digite apenas números"
                  maxLength={4}
                />
              </div>
              <div>
                <Label htmlFor="entregue_por">Entregue por</Label>
                <Input
                  id="entregue_por"
                  name="entregue_por"
                  value={formData.entregue_por}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>

            <SectionTitle title="Status e Devolução" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="retirado">Status</Label>
                <Select
                  value={formData.retirado ? "retirado" : "devolvido"}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    retirado: value === "retirado"
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retirado">Retirado</SelectItem>
                    <SelectItem value="devolvido">Devolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="data_devolucao">Data de Devolução</Label>
                <Input
                  id="data_devolucao"
                  name="data_devolucao"
                  type="date"
                  value={formData.data_devolucao || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="devolvido_por">Devolvido por</Label>
                <Input
                  id="devolvido_por"
                  name="devolvido_por"
                  value={formData.devolvido_por || ""}
                  onChange={handleChange}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="recebido_por">Recebido por</Label>
                <Input
                  id="recebido_por"
                  name="recebido_por"
                  value={formData.recebido_por || ""}
                  onChange={handleChange}
                  placeholder="Nome completo"
                />
              </div>
            </div>

            <SectionTitle title="Observações" />
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
          </form>
        </ScrollArea>
        <div className="border-t bg-gray-50 p-4">
          <Button 
            form="editar-retirada-form" 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 