"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface NovaUnidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NovaUnidadeModal({
  open,
  onOpenChange,
  onSuccess
}: NovaUnidadeModalProps) {
  const [nome, setNome] = useState("")
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a unidade.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("unidades")
        .insert([{ nome }])

      if (error) throw error

      toast({
        title: "Unidade criada",
        description: "A unidade foi criada com sucesso.",
      })

      onSuccess()
      onOpenChange(false)
      setNome("")
    } catch (error: any) {
      toast({
        title: "Erro ao criar unidade",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div>
          <div className="flex justify-between items-center">
            <DialogTitle>Nova Unidade</DialogTitle>
            <DialogClose className="rounded-sm border border-gray-100 hover:bg-gray-50">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <div className="border-b mt-4" />
        </div>

        <div className="mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="border-t mt-6">
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
            >
              Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 