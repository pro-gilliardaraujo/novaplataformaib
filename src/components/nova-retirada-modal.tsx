"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Retirada } from "@/types/retirada"
import { formatName, formatPatrimonioCode, normalizeText } from "@/utils/formatters"

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center mb-4">
      <div className="flex-grow h-px bg-gray-200"></div>
      <h3 className="text-base font-medium px-4">{title}</h3>
      <div className="flex-grow h-px bg-gray-200"></div>
    </div>
  )
}

type NovaRetiradaData = Omit<Retirada, 'id' | 'created_at'>

interface NovaRetiradaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: NovaRetiradaData) => void
}

export function NovaRetiradaModal({
  open,
  onOpenChange,
  onSubmit,
}: NovaRetiradaModalProps) {
  console.log('NovaRetiradaModal rendered with props:', { open, onSubmit: !!onSubmit })

  const [formData, setFormData] = useState({
    codigo_patrimonio: "",
    retirado_por: "",
    data_retirada: "",
    frota_instalada: "",
    entregue_por: "",
    observacoes: "",
    retirado: true,
    data_devolucao: null,
    devolvido_por: null,
    recebido_por: null
  })

  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log('Form submitted with data:', formData)

    try {
      // Format all text fields before submission
      const formattedData = {
        ...formData,
        codigo_patrimonio: formatPatrimonioCode(formData.codigo_patrimonio),
        retirado_por: formatName(formData.retirado_por),
        entregue_por: formatName(formData.entregue_por),
        frota_instalada: formData.frota_instalada ? formData.frota_instalada : "0", // Default to "0" if empty
        observacoes: formData.observacoes ? normalizeText(formData.observacoes) : "",
      }

      console.log('Data after formatting:', formattedData)
      console.log('Calling onSubmit function')
      await onSubmit(formattedData)
      console.log('onSubmit completed successfully')
      
      // Reset form after successful submission
      setFormData({
        codigo_patrimonio: "",
        retirado_por: "",
        data_retirada: "",
        frota_instalada: "",
        entregue_por: "",
        observacoes: "",
        retirado: true,
        data_devolucao: null,
        devolvido_por: null,
        recebido_por: null
      })

      toast({
        title: "Sucesso",
        description: "Retirada criada com sucesso!",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error details:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast({
        title: "Erro",
        description: "Erro ao criar retirada. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    console.log('handleChange called:', { name, value })
    
    if (name === 'codigo_patrimonio') {
      // Only allow numeric input and limit to 6 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 6)
      console.log('Formatted codigo_patrimonio:', numericValue)
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('Dialog onOpenChange called with:', newOpen)
      onOpenChange(newOpen)
    }}>
      <DialogContent className="sm:max-w-[900px] p-0 flex flex-col h-[90vh]">
        <DialogHeader className="px-6 h-12 border-b grid grid-cols-[48px_1fr_48px] items-center">
          <div /> {/* Spacer */}
          <DialogTitle className="text-center">Nova Retirada</DialogTitle>
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
          <form id="nova-retirada-form" onSubmit={handleSubmit} className="p-6 space-y-6">
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

            <SectionTitle title="Observações" />
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
          </form>
        </ScrollArea>
        <div className="border-t bg-gray-50 p-4">
          <Button 
            form="nova-retirada-form" 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Criando..." : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 