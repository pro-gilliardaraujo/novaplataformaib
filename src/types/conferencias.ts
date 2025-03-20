export interface ItemConferencia {
  id: string
  item_id: string
  codigo_patrimonio: string
  descricao: string
  quantidade_sistema: number
  quantidade_conferida: number
  diferenca: number
}

export interface Conferencia {
  id: string
  data_conferencia: string
  status: "em_andamento" | "concluida" | "cancelada"
  total_itens: number
  itens_conferidos: number
  itens_divergentes: number
  responsaveis: string
  created_at: string
  updated_at: string
  itens?: ItemConferencia[]
} 