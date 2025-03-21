export interface Equipamento {
  id: string
  codigo_patrimonio: string
  descricao: string
  num_serie?: string
  created_at: string
  updated_at: string
}

export interface NovoEquipamentoData {
  codigo_patrimonio: string
  descricao: string
  num_serie?: string
}

export interface UpdateEquipamentoData {
  descricao?: string
  num_serie?: string
} 