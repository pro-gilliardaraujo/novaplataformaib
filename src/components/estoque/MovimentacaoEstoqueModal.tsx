"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X, ArrowUpSquare, ArrowDownSquare } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/AuthContext"

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

type TipoMovimentacao = 'entrada' | 'saida'

interface Motivo {
  id: string
  descricao: string
  tipo: TipoMovimentacao
}

interface Unidade {
  id: string
  nome: string
}

interface Frota {
  id: string
  frota: string
  descricao: string
  unidade_id: string
}

const MOTIVOS: Motivo[] = [
  { id: 'compra', descricao: 'Compra', tipo: 'entrada' },
  { id: 'devolucao', descricao: 'Devolução', tipo: 'entrada' },
  { id: 'uso', descricao: 'Uso em Operação', tipo: 'saida' },
  { id: 'perda', descricao: 'Perda/Avaria', tipo: 'saida' },
  { id: 'transferencia', descricao: 'Transferência entre Unidades', tipo: 'saida' }
]

export function MovimentacaoEstoqueModal({
  open,
  onOpenChange,
  item,
  onSuccess
}: MovimentacaoEstoqueModalProps) {
  const { user } = useAuth()
  const [tipo, setTipo] = useState<TipoMovimentacao>('entrada')
  const [quantidade, setQuantidade] = useState("")
  const [motivo, setMotivo] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [unidadeId, setUnidadeId] = useState("")
  const [frotaId, setFrotaId] = useState("none")
  const [notaFiscal, setNotaFiscal] = useState("")
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [frotas, setFrotas] = useState<Frota[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Carregar unidades apenas quando selecionar saída
  useEffect(() => {
    const fetchUnidades = async () => {
      if (tipo !== 'saida') return

      try {
        console.log('Buscando unidades...')
        const { data, error } = await supabase
          .from('unidades')
          .select('id, nome')
          .order('nome')

        if (error) throw error

        console.log('Unidades encontradas:', data)
        setUnidades(data || [])
      } catch (error) {
        console.error('Erro ao carregar unidades:', error)
      }
    }

    fetchUnidades()
  }, [tipo])

  // Carregar frotas quando selecionar uma unidade
  useEffect(() => {
    const fetchFrotas = async () => {
      if (!unidadeId) {
        setFrotas([])
        return
      }

      try {
        console.log('Buscando frotas da unidade:', unidadeId)
        const { data, error } = await supabase
          .from('frotas')
          .select('id, frota, descricao, unidade_id')
          .eq('unidade_id', unidadeId)
          .order('frota')

        if (error) throw error

        console.log('Frotas encontradas:', data)
        setFrotas(data || [])
      } catch (error) {
        console.error('Erro ao carregar frotas:', error)
      }
    }

    fetchFrotas()
  }, [unidadeId])

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

    // Validação adicional para entradas
    if (tipo === 'entrada' && !notaFiscal) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número da nota fiscal",
        variant: "destructive",
      })
      return
    }

    // Validação adicional para saídas
    if (tipo === 'saida' && !unidadeId) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione a unidade de destino",
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
      const unidadeSelecionada = unidades.find(u => u.id === unidadeId)
      const frotaSelecionada = frotaId !== "none" ? frotas.find(f => f.id === frotaId) : null

      const movimentacaoData = {
        item_id: item.id,
        tipo_movimentacao: tipo,
        quantidade: quantidadeNum,
        motivo,
        observacoes: observacoes || null,
        responsavel: user?.profile?.nome || user?.email || 'Sistema',
        ...(tipo === 'saida' ? {
          destino_movimentacao: unidadeSelecionada?.nome || null,
          frota_destino: frotaSelecionada?.frota || null,
          nota_fiscal: null
        } : {
          destino_movimentacao: null,
          frota_destino: null,
          nota_fiscal: notaFiscal || null
        })
      }

      console.log('Dados da movimentação:', movimentacaoData)

      // Registra a movimentação
      const { error: movimentacaoError } = await supabase
        .from('movimentacoes_estoque')
        .insert([movimentacaoData])

      if (movimentacaoError) {
        console.error('Erro ao registrar movimentação:', movimentacaoError)
        throw movimentacaoError
      }

      // Atualiza a quantidade do item
      const novaQuantidade = tipo === 'entrada'
        ? item.quantidade_atual + quantidadeNum
        : item.quantidade_atual - quantidadeNum

      const { error: itemError } = await supabase
        .from('itens_estoque')
        .update({ quantidade_atual: novaQuantidade })
        .eq('id', item.id)

      if (itemError) {
        console.error('Erro ao atualizar quantidade:', itemError)
        throw itemError
      }
      
      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error)
      toast({
        title: "Erro",
        description: error instanceof Error 
          ? `Não foi possível registrar a movimentação: ${error.message}`
          : "Não foi possível registrar a movimentação",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const motivosFiltrados = MOTIVOS.filter(m => m.tipo === tipo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="w-8" /> {/* Spacer */}
            <DialogTitle className="text-xl font-semibold text-center flex-1">
              Registrar Movimentação
            </DialogTitle>
            <DialogClose asChild>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      type="button"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => onOpenChange(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fechar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {item.descricao} ({item.codigo_fabricante}) - Quantidade atual: {item.quantidade_atual}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Movimentação *</Label>
              <RadioGroup
                value={tipo}
                onValueChange={(value: TipoMovimentacao) => {
                  setTipo(value)
                  if (value !== 'saida') {
                    setUnidadeId("")
                    setFrotaId("none")
                  }
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entrada" id="entrada" />
                  <Label htmlFor="entrada" className="flex items-center gap-2 cursor-pointer">
                    <ArrowDownSquare className="h-4 w-4" />
                    Entrada
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="saida" id="saida" />
                  <Label htmlFor="saida" className="flex items-center gap-2 cursor-pointer">
                    <ArrowUpSquare className="h-4 w-4" />
                    Saída
                  </Label>
                </div>
              </RadioGroup>
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

            <div className="grid grid-cols-1 gap-4">
              {tipo === 'entrada' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="notaFiscal">
                      Nota Fiscal {motivo === 'compra' ? '*' : ''}
                    </Label>
                    <Input
                      id="notaFiscal"
                      value={notaFiscal}
                      onChange={(e) => setNotaFiscal(e.target.value)}
                      placeholder="Digite o número da nota fiscal"
                    />
                  </div>
                  {/* Placeholder divs to maintain consistent height */}
                  <div className="h-[76px]" />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="unidade">Unidade *</Label>
                    <Select value={unidadeId} onValueChange={(value) => {
                      console.log('Unidade selecionada:', value)
                      setUnidadeId(value)
                      setFrotaId("none")
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
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

                  <div className="space-y-2">
                    <Label htmlFor="frota">Frota</Label>
                    <Select value={frotaId} onValueChange={setFrotaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {frotas.map((frota) => (
                          <SelectItem key={frota.id} value={frota.id}>
                            {frota.frota} - {frota.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
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

            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={isLoading} className="bg-black hover:bg-black/90">
                {isLoading ? "Registrando..." : "Registrar Movimentação"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 