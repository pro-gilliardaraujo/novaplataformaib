export interface Equipamento {
  id: string
  codigo_patrimonio: string
  descricao: string
  num_serie?: string
  status?: "ATIVO" | "MANUTENCAO" | "INATIVO"
  created_at: string
  updated_at: string
}

export interface NovoEquipamentoData {
  codigo_patrimonio: string
  descricao: string
  num_serie?: string
  status?: "ATIVO" | "MANUTENCAO" | "INATIVO"
}

export interface UpdateEquipamentoData {
  descricao?: string
  num_serie?: string
  status?: "ATIVO" | "MANUTENCAO" | "INATIVO"
} 