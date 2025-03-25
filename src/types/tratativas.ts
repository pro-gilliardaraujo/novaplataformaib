export interface Tratativa {
  id: number
  numero_tratativa: string
  setor: string
  status: string
  created_at: string
  updated_at: string
  funcionario: string
  cpf: string
  data_infracao: string
  descricao: string
  observacoes?: string
  hora_infracao: string
  codigo_infracao: string
  descricao_infracao: string
  penalidade: string
  lider: string
  texto_advertencia: string
  texto_limite: string
  url_documento_enviado: string
  url_documento_devolvido: string | null
  data_devolvida: string | null
  funcao: string
  analista: string
}

export interface TratativaDetailsProps extends Omit<Tratativa, 'id'> {
  id: string
} 