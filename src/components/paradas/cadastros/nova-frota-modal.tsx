"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useParadas } from "@/contexts/ParadasContext"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Frota } from "@/types/frotas"

interface NovaFrotaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFrotaUpdated: () => void
}

export function NovaFrotaModal({
  open,
  onOpenChange,
  onFrotaUpdated
}: NovaFrotaModalProps) {
  const { unidades } = useParadas()
  const [frota, setFrota] = useState("")
  const [descricao, setDescricao] = useState("")
  const [unidadeId, setUnidadeId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!frota || !descricao || !unidadeId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("frotas")
        .insert([
          {
            frota,
            descricao,
            unidade_id: unidadeId
          }
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Frota criada com sucesso",
      })

      onFrotaUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao criar frota:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a frota",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="flex-1 text-center">Nova Frota</DialogTitle>
            <div className="flex-1 flex justify-end">
              <Button 
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="border-b mt-4" />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frota">Frota</Label>
            <Input
              id="frota"
              value={frota}
              onChange={(e) => setFrota(e.target.value)}
              placeholder="Digite o código da frota"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite a descrição da frota"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade">Unidade</Label>
            <Select value={unidadeId} onValueChange={setUnidadeId}>
              <SelectTrigger id="unidade">
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            Criar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 