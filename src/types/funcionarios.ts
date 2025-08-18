export interface Funcionario {
  id: number
  nome: string
  cpf: string
  funcao: string
  ativo: boolean
  unidade: string
  created_at: string
  updated_at: string
}

export interface FuncionarioSearchResult {
  id: number
  nome: string
  cpf: string
  funcao: string
  unidade: string
}
