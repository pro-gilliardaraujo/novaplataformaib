"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { IconSelectorDialog } from "@/components/icon-selector-dialog"
import { renderIcon } from "@/utils/icons"

interface NovoTipoParadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NovoTipoParadaModal({
  open,
  onOpenChange,
  onSuccess
}: NovoTipoParadaModalProps) {
  const [nome, setNome] = useState("")
  const [icone, setIcone] = useState("")
  const [showIconSelector, setShowIconSelector] = useState(false)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o tipo de parada.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("tipos_parada")
        .insert([{ 
          nome,
          icone 
        }])

      if (error) throw error

      toast({
        title: "Tipo de parada criado",
        description: "O tipo de parada foi criado com sucesso.",
      })

      onSuccess()
      onOpenChange(false)
      setNome("")
      setIcone("")
    } catch (error: any) {
      toast({
        title: "Erro ao criar tipo de parada",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleIconSelect = (iconName: string) => {
    setIcone(iconName)
    setShowIconSelector(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div>
            <div className="flex justify-between items-center">
              <DialogTitle>Novo Tipo de Parada</DialogTitle>
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

              <div>
                <Label>Ícone</Label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="w-10 h-10 border rounded-md flex items-center justify-center">
                    {icone ? renderIcon(icone) : "—"}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowIconSelector(true)}
                  >
                    Selecionar Ícone
                  </Button>
                </div>
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

      <IconSelectorDialog
        open={showIconSelector}
        onOpenChange={setShowIconSelector}
        onSelectIcon={handleIconSelect}
        itemName={nome || "Novo Tipo"}
        itemType="tipo"
      />
    </>
  )
} 