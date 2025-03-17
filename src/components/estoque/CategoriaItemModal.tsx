"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CategoriaItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria?: {
    id: string
    nome: string
    descricao?: string
    cor?: string
  }
  onSuccess: () => void
}

export function CategoriaItemModal({ open, onOpenChange, categoria, onSuccess }: CategoriaItemModalProps) {
  const [nome, setNome] = useState(categoria?.nome || "")
  const [descricao, setDescricao] = useState(categoria?.descricao || "")
  const [cor, setCor] = useState(categoria?.cor || "#000000")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nome) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da categoria é obrigatório",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (categoria) {
        // Update
        const { error } = await supabase
          .from('categorias_item')
          .update({
            nome,
            descricao,
            cor
          })
          .eq('id', categoria.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('categorias_item')
          .insert([
            {
              nome,
              descricao,
              cor
            }
          ])

        if (error) throw error
      }
      
      toast({
        title: "Sucesso",
        description: `Categoria ${categoria ? 'atualizada' : 'criada'} com sucesso`,
      })

      onSuccess()
      handleOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      toast({
        title: "Erro",
        description: `Não foi possível ${categoria ? 'atualizar' : 'criar'} a categoria`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNome("")
      setDescricao("")
      setCor("#000000")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[500px]">
        <div>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="text-xl font-semibold flex-1 text-center">
              {categoria ? 'Editar' : 'Nova'} Categoria
            </DialogTitle>
            <div className="flex-1 flex justify-end">
              <DialogClose asChild>
                <Button 
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </div>
          <div className="border-b mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da categoria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Digite uma descrição para a categoria"
              className="resize-none h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor">Cor</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                id="cor"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-[100px]"
              />
              <Input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
              {isLoading ? "Salvando..." : (categoria ? "Salvar" : "Criar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 