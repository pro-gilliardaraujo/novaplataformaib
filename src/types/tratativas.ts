export interface Tratativa {
  id: string
  numero_tratativa: string
  funcionario: string
  data_infracao: string
  hora_infracao: string
  codigo_infracao: string
  descricao_infracao: string
  penalidade: string
  lider: string
  status: string
  created_at: string
  texto_advertencia: string
  texto_limite: string
  url_documento_enviado: string
  url_documento_devolvido: string | null
  data_devolvida: string | null
  funcao: string
  setor: string
  analista: string
}

export interface TratativaDetailsProps extends Omit<Tratativa, 'id'> {
  id: string
} 