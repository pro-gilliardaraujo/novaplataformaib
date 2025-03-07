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
import { Retirada } from "@/types/retirada"
import { formatName, formatPatrimonioCode, normalizeText } from "@/utils/formatters"

interface EditarRetiradaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetiradaEdited: (updates: Partial<Retirada>) => void
  retiradaData: Retirada
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
  open,
  onOpenChange,
  onRetiradaEdited,
  retiradaData,
}: EditarRetiradaModalProps) {
  const [formData, setFormData] = useState(retiradaData)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'codigo_patrimonio') {
      // Only allow numeric input and limit to 6 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 6)
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue
      }))
      return
    }

    if (name === 'frota_instalada') {
      // Only allow numeric input and limit to 4 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 4)
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    console.log('Form data before formatting:', formData)

    try {
      // Format all text fields before submission, handling null values
      const formattedData = {
        ...formData,
        codigo_patrimonio: formatPatrimonioCode(formData.codigo_patrimonio || ""),
        retirado_por: formatName(formData.retirado_por || ""),
        entregue_por: formatName(formData.entregue_por || ""),
        frota_instalada: formData.frota_instalada || "0", // Default to "0" if empty
        observacoes: formData.observacoes || "",
        devolvido_por: formData.devolvido_por ? formatName(formData.devolvido_por) : null,
        recebido_por: formData.recebido_por ? formatName(formData.recebido_por) : null,
      }

      console.log('Formatted data:', formattedData)
      const { id, created_at, ...updatedData } = formattedData
      console.log('Data to be submitted:', updatedData)
      
      await onRetiradaEdited(updatedData)
      onOpenChange(false)
      
      toast({
        title: "Sucesso",
        description: "Retirada atualizada com sucesso!",
      })
    } catch (error) {
      console.error("Error details:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      toast({
        title: "Erro",
        description: "Erro ao atualizar retirada. Por favor, tente novamente.",
        variant: "destructive",
      })
      setError(`Erro ao atualizar retirada: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <DialogHeader className="px-6 h-12 border-b grid grid-cols-[48px_1fr_48px] items-center">
          <div /> {/* Spacer */}
          <DialogTitle className="text-center">Detalhes da Retirada #{retiradaData.codigo_patrimonio}</DialogTitle>
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>

            <SectionTitle title="Status e Observações" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="retirado">Status</Label>
                <Select value={formData.retirado.toString()} onValueChange={(value) => handleSelectChange("retirado", value === "true")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Retirado</SelectItem>
                    <SelectItem value="false">Devolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes || ""}
                  onChange={handleInputChange}
                  className="h-20"
                />
              </div>
            </div>

            {!formData.retirado && (
              <>
                <SectionTitle title="Informações da Devolução" />
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="data_devolucao">Data de Devolução</Label>
                    <Input
                      id="data_devolucao"
                      name="data_devolucao"
                      type="date"
                      value={formData.data_devolucao || ""}
                      onChange={handleInputChange}
                      required={!formData.retirado}
                    />
                  </div>
                  <div>
                    <Label htmlFor="devolvido_por">Devolvido por</Label>
                    <Input
                      id="devolvido_por"
                      name="devolvido_por"
                      value={formData.devolvido_por || ""}
                      onChange={handleInputChange}
                      placeholder="Nome completo"
                      required={!formData.retirado}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recebido_por">Recebido por</Label>
                    <Input
                      id="recebido_por"
                      name="recebido_por"
                      value={formData.recebido_por || ""}
                      onChange={handleInputChange}
                      placeholder="Nome completo"
                      required={!formData.retirado}
                    />
                  </div>
                </div>
              </>
            )}

            {error && <div className="text-red-500 mt-4">{error}</div>}
          </form>
        </ScrollArea>
        <div className="border-t bg-gray-50 p-4">
          <Button 
            form="editar-retirada-form" 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 