"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface NovaFrotaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Unidade {
  id: string
  nome: string
}

export function NovaFrotaModal({
  open,
  onOpenChange,
  onSuccess
}: NovaFrotaModalProps) {
  const [frota, setFrota] = useState("")
  const [descricao, setDescricao] = useState("")
  const [unidadeId, setUnidadeId] = useState("")
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchUnidades()
    }
  }, [open])

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select("*")
        .order("nome")

      if (error) throw error
      setUnidades(data)
    } catch (error: any) {
      toast({
        title: "Erro ao carregar unidades",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCreate = async () => {
    if (!frota || !descricao || !unidadeId) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("frotas")
        .insert([{ 
          frota: frota,
          descricao,
          unidade_id: unidadeId
        }])

      if (error) throw error

      toast({
        title: "Frota criada",
        description: "A frota foi criada com sucesso.",
      })

      onSuccess()
      onOpenChange(false)
      setFrota("")
      setDescricao("")
      setUnidadeId("")
    } catch (error: any) {
      toast({
        title: "Erro ao criar frota",
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
            <DialogTitle>Nova Frota</DialogTitle>
            <DialogClose className="rounded-sm border border-gray-100 hover:bg-gray-50">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <div className="border-b mt-4" />
        </div>

        <div className="mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="frota">Frota</Label>
              <Input
                id="frota"
                value={frota}
                onChange={(e) => setFrota(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="unidade">Unidade</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map(unidade => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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