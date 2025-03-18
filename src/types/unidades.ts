export interface Unidade {
  id: string
  nome: string
  codigo?: string
  created_at: string
  updated_at: string
  frotas?: Array<{
    id: string
    frota: string
    descricao: string
    unidade_id: string
    created_at: string
    updated_at: string
  }>
} 