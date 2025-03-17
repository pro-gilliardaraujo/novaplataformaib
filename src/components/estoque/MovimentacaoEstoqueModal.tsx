"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MovimentacaoEstoqueModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: string
    descricao: string
    codigo_fabricante: string
    quantidade_atual: number
  }
  onSuccess: () => void
}

type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'

interface Motivo {
  id: string
  descricao: string
  tipo: TipoMovimentacao
}

const MOTIVOS: Motivo[] = [
  { id: 'compra', descricao: 'Compra', tipo: 'entrada' },
  { id: 'devolucao', descricao: 'Devolução', tipo: 'entrada' },
  { id: 'uso', descricao: 'Uso em Operação', tipo: 'saida' },
  { id: 'perda', descricao: 'Perda/Avaria', tipo: 'saida' },
  { id: 'inventario', descricao: 'Ajuste de Inventário', tipo: 'ajuste' },
]

export function MovimentacaoEstoqueModal({
  open,
  onOpenChange,
  item,
  onSuccess
}: MovimentacaoEstoqueModalProps) {
  const [tipo, setTipo] = useState<TipoMovimentacao>('entrada')
  const [quantidade, setQuantidade] = useState("")
  const [motivo, setMotivo] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!quantidade || !motivo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const quantidadeNum = Number(quantidade)
    if (isNaN(quantidadeNum) || quantidadeNum <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser um número maior que zero",
        variant: "destructive",
      })
      return
    }

    // Para saídas, verifica se há quantidade suficiente
    if (tipo === 'saida' && quantidadeNum > item.quantidade_atual) {
      toast({
        title: "Quantidade insuficiente",
        description: "Não há quantidade suficiente em estoque para esta saída",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 1. Registra a movimentação
      const { error: historicoError } = await supabase
        .from('historico_estoque')
        .insert([
          {
            item_id: item.id,
            tipo_movimentacao: tipo,
            quantidade: quantidadeNum,
            motivo,
            observacoes: observacoes || null,
          }
        ])

      if (historicoError) throw historicoError

      // 2. Atualiza a quantidade do item
      const novaQuantidade = tipo === 'entrada'
        ? item.quantidade_atual + quantidadeNum
        : tipo === 'saida'
          ? item.quantidade_atual - quantidadeNum
          : quantidadeNum // ajuste

      const { error: itemError } = await supabase
        .from('items_estoque')
        .update({ quantidade_atual: novaQuantidade })
        .eq('id', item.id)

      if (itemError) throw itemError
      
      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      })

      onSuccess()
      handleOpenChange(false)
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a movimentação",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTipo('entrada')
      setQuantidade("")
      setMotivo("")
      setObservacoes("")
    }
    onOpenChange(open)
  }

  const motivosFiltrados = MOTIVOS.filter(m => m.tipo === tipo)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center">
            <div className="flex-1" />
            <DialogTitle className="text-xl font-semibold flex-1 text-center">
              Registrar Movimentação
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
        </DialogHeader>

        <div className="border-t mt-4" />

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Item</Label>
            <p className="text-sm text-gray-500 mt-1">
              {item.descricao} ({item.codigo_fabricante})
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Quantidade atual: {item.quantidade_atual}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimentação *</Label>
            <Select value={tipo} onValueChange={(value: TipoMovimentacao) => setTipo(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Digite a quantidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivosFiltrados.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre a movimentação"
              className="resize-none h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
              {isLoading ? "Registrando..." : "Registrar Movimentação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 