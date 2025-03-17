export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'

export interface Movimentacao {
  id: string
  tipo_movimentacao: TipoMovimentacao
  quantidade: number
  motivo: string
  observacoes?: string
  created_at: string
  item: {
    id: string
    descricao: string
    codigo_fabricante: string
    quantidade_atual: number
    categoria?: {
      id: string
      nome: string
    }
  }
  responsavel?: string | null
}

export interface MovimentacaoDetailsProps extends Omit<Movimentacao, 'id'> {
  id: string
}

export interface MovimentacaoStats {
  total: number
  entradas: number
  saidas: number
  ajustes: number
  porMotivo: Record<string, number>
} 