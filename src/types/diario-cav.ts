export interface DiarioCavFrotaData {
  h_motor: number;
  h_ociosa: number;
  h_trabalho: number;
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
