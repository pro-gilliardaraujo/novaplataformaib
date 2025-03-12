export interface Frota {
  id: string
  frota: string
  descricao: string
  unidade_id: string
  created_at: string
  updated_at: string
}

export interface Unidade {
  id: string
  nome: string
  frotas?: Frota[]
  created_at: string
  updated_at: string
}

export interface TipoParada {
  id: string
  nome: string
  icone?: string
  created_at: string
  updated_at: string
}

export interface Parada {
  id: string
  frota_id: string
  tipo_parada_id: string
  motivo: string
  inicio: string // ISO string
  fim?: string | null // ISO string
  previsao_minutos?: number | null
  created_at: string
  updated_at: string
  // Campos expandidos via join
  tipo?: TipoParada
}

// Estado do card de frota
export interface FrotaStatus {
  frota: Frota
  parada_atual?: Parada | null
  historico_count: number
}

// Props para o modal de parada
export interface ParadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frota: Frota
  onParadaRegistrada: () => void
}

// Props para o modal de histórico
export interface HistoricoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  frota: Frota
}

// Props para o card de frota
export interface FrotaCardProps {
  status: FrotaStatus
  onParar: () => void
  onLiberar: () => void
  onHistorico: () => void
}

// Props para o seletor de frotas
export interface SeletorFrotasProps {
  unidades: Unidade[]
  frotasSelecionadas: Set<string>
  onSelectionChange: (frotaIds: Set<string>) => void
} 