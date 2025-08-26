export interface DiarioCavFrotaData {
  h_motor: number;
  combustivel_consumido?: number;
  fator_carga_motor_ocioso?: number;
}

export interface DiarioCav {
  id: string;
  data: string;
  frente: string;
  dados: Record<string, DiarioCavFrotaData>;
  imagem_deslocamento: string | null;
  imagem_area: string | null;
  created_at: string;
}

export interface DiarioCavFormData {
  data: Date | undefined;
  frente: string;
  dadosFrotas: Record<string, DiarioCavFrotaData>;
  imagem_deslocamento: File | null;
  imagem_area: File | null;
}

// Interface para dados de boletins CAV granulares
export interface BoletimCavGranular {
  id: string;
  data: string;
  frente: string;
  frota: string;
  turno: string;
  operador: string;
  codigo: string;
  producao: number;
  lamina_alvo: number;
}

// Interface para dados de boletins CAV agregados
export interface BoletimCavAgregado {
  id: string;
  data: string;
  frente: string;
  codigo: string;
  setor: string;
  total_producao: number;
  total_viagens_feitas: number;
  total_viagens_orcadas: number;
  lamina_alvo: number;
  lamina_aplicada: number;
  dif_viagens_perc: number;
  dif_lamina_perc: number;
}

// Interface para dados de produção por frota/turno
export interface ProducaoFrotaTurno {
  frota: string;
  turno: string;
  codigo: string;
  producao: number;
}

// Interface para dados de prévia de boletins CAV
export interface PreviaBoletinsCav {
  dadosGranulares: ProducaoFrotaTurno[];
  dadosAgregados?: BoletimCavAgregado;
}
