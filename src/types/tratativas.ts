export interface Tratativa {
  id: number
  numero_tratativa: string
  funcionario: string
  data_infracao: string
  hora_infracao: string
  codigo_infracao: string
  descricao_infracao: string
  penalidade: string
  lider: string
  status: "ENVIADA" | "DEVOLVIDA" | "CANCELADA"
  created_at: string
  texto_limite: string
  texto_advertencia: string
  url_documento_enviado: string
  url_documento_devolvido: string | null
  data_devolvida: string | null
  justificativa: string | null
  funcao: string
  setor: string
  metrica: string
  valor_praticado: string
  mock: boolean
  data_formatada: string
  cpf: string | null
  advertido: string
  imagem_evidencia1: string | null
} 