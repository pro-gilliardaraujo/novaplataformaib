export interface Retirada {
  id: string
  codigo_patrimonio: string
  retirado_por: string
  data_retirada: string
  frota_instalada: string
  devolvido_por: string | null
  data_devolucao: string | null
  created_at: string
  entregue_por: string
  recebido_por: string | null
  retirado: boolean
  observacoes: string | null
}

export type NovaRetiradaData = Omit<Retirada, "id" | "created_at">
export type UpdateRetiradaData = Partial<NovaRetiradaData> 