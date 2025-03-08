export interface Equipamento {
  id: number
  codigo_patrimonio: string
  descricao: string
  num_serie: string
}

export interface NovoEquipamentoData {
  codigo_patrimonio: string
  descricao: string
  num_serie: string
}

export interface UpdateEquipamentoData {
  descricao?: string
  num_serie?: string
} 