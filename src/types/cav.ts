// Tipos para o sistema de CAV

export interface BoletimCav {
  id?: number
  data: string // YYYY-MM-DD
  codigo: string // Ex: "12345-6789"
  frente: string // Ex: "Frente 1", "Ouroeste"
  frota: number // Ex: 6125
  turno: 'A' | 'B' | 'C'
  operador: string
  producao: number // Hectares
  observacoes?: string
  created_at?: string
  updated_at?: string
}

export interface BoletimCavAgregado {
  id?: number
  data: string // YYYY-MM-DD
  codigo: string
  frente: string
  total_producao: number // Soma de todas as produções
  total_viagens_feitas: number // Informado pelo usuário ou calculado
  total_viagens_orcadas: number // Calculado: (total_producao * lamina_alvo) / 60
  dif_viagens_perc: number // Calculado: 1 - (viagens_orcadas / viagens_feitas)
  lamina_alvo: number // Valor de referência (assumindo 2.5 por enquanto)
  lamina_aplicada: number // Calculado: (total_viagens_feitas * 60) / total_producao
  dif_lamina_perc: number // Calculado: 1 - (lamina_alvo / lamina_aplicada)
  created_at?: string
  updated_at?: string
}

// Interface para o formulário frontend
export interface CavFormData {
  data: string
  frente: string
  lamina_alvo: number // Usuário informa este valor
  total_viagens_feitas: number // Usuário informa este valor
  frotas: CavFrotaData[]
}

export interface CavFrotaData {
  frota: number
  turnos: CavTurnoData[]
}

export interface CavTurnoData {
  id: string // UUID para identificar turnos únicos
  turno: string // Pode ser A, B, C ou customizado
  operador: string
  producao: number
}

// Configurações de frentes com frotas padrão
export interface FrenteConfig {
  nome: string
  frotas_padrao: number[]
}

export const FRENTES_CONFIG: FrenteConfig[] = [
  { nome: "Frente 1", frotas_padrao: [6127, 6130] },
  { nome: "Frente 2", frotas_padrao: [6131, 6132] },
  { nome: "Frente 3", frotas_padrao: [6125, 6134] },
  { nome: "Frente 4", frotas_padrao: [6114] },
  { nome: "Iturama", frotas_padrao: [6144] },
  { nome: "Ouroeste", frotas_padrao: [6137, 6138] }
]
