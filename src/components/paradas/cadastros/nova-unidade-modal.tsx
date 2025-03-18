"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface NovaUnidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnidadeUpdated: () => void
}

export function NovaUnidadeModal({
  open,
  onOpenChange,
  onUnidadeUpdated
}: NovaUnidadeModalProps) {
  const [nome, setNome] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!nome) {
      toast({
        title: "Erro",
        description: "Digite o nome da unidade",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("unidades")
        .insert([{ nome }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Unidade criada com sucesso",
      })

      onUnidadeUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao criar unidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a unidade",
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
            <DialogTitle className="flex-1 text-center">Nova Unidade</DialogTitle>
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
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da unidade"
            />
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