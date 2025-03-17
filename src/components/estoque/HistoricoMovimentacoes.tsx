"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface HistoricoMovimentacoesProps {
  itemId: string
}

interface Movimentacao {
  id: string
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  motivo: string
  observacoes?: string
  created_at: string
  responsavel?: {
    nome: string
  } | null
}

const MOTIVOS = {
  compra: 'Compra',
  devolucao: 'Devolução',
  uso: 'Uso em Operação',
  perda: 'Perda/Avaria',
  inventario: 'Ajuste de Inventário',
}

export function HistoricoMovimentacoes({ itemId }: HistoricoMovimentacoesProps) {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroMotivo, setFiltroMotivo] = useState<string>("todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("7")

  useEffect(() => {
    carregarMovimentacoes()
  }, [itemId, filtroTipo, filtroMotivo, filtroPeriodo])

  const carregarMovimentacoes = async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from('historico_estoque')
        .select(`
          id,
          tipo_movimentacao,
          quantidade,
          motivo,
          observacoes,
          created_at,
          responsavel:responsavel_id (
            nome:raw_user_meta_data->nome
          )
        `)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filtroTipo !== "todos") {
        query = query.eq('tipo_movimentacao', filtroTipo)
      }
      if (filtroMotivo !== "todos") {
        query = query.eq('motivo', filtroMotivo)
      }
      if (filtroPeriodo !== "todos") {
        const dias = parseInt(filtroPeriodo)
        const dataLimite = new Date()
        dataLimite.setDate(dataLimite.getDate() - dias)
        query = query.gte('created_at', dataLimite.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Transform the data to match the Movimentacao interface
      const movimentacoesData = (data || []).map(item => ({
        ...item,
        responsavel: item.responsavel?.[0] || null
      })) as Movimentacao[]

      setMovimentacoes(movimentacoesData)
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderIconeTipo = (tipo: 'entrada' | 'saida' | 'ajuste') => {
    switch (tipo) {
      case 'entrada':
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'saida':
        return <ArrowDown className="h-4 w-4 text-red-500" />
      case 'ajuste':
        return <ArrowUpDown className="h-4 w-4 text-yellow-500" />
    }
  }

  const getCorTipo = (tipo: 'entrada' | 'saida' | 'ajuste') => {
    switch (tipo) {
      case 'entrada':
        return 'text-green-600'
      case 'saida':
        return 'text-red-600'
      case 'ajuste':
        return 'text-yellow-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
              <SelectItem value="ajuste">Ajustes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Motivo</Label>
          <Select value={filtroMotivo} onValueChange={setFiltroMotivo}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os motivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os motivos</SelectItem>
              {Object.entries(MOTIVOS).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="todos">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <ScrollArea className="h-[400px] border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Nenhuma movimentação encontrada
          </div>
        ) : (
          <div className="divide-y">
            {movimentacoes.map((mov) => (
              <div key={mov.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {renderIconeTipo(mov.tipo_movimentacao)}
                    <div>
                      <p className="font-medium">
                        <span className={getCorTipo(mov.tipo_movimentacao)}>
                          {mov.tipo_movimentacao === 'entrada' ? 'Entrada' :
                           mov.tipo_movimentacao === 'saida' ? 'Saída' : 'Ajuste'}
                        </span>
                        {' - '}
                        {MOTIVOS[mov.motivo as keyof typeof MOTIVOS]}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(mov.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        {mov.responsavel?.nome && ` - por ${mov.responsavel.nome}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {mov.tipo_movimentacao === 'entrada' ? '+' :
                       mov.tipo_movimentacao === 'saida' ? '-' : ''}
                      {mov.quantidade}
                    </p>
                  </div>
                </div>
                {mov.observacoes && (
                  <p className="mt-2 text-sm text-gray-600 pl-10">
                    {mov.observacoes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
} 