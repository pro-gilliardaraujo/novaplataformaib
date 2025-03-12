import type { Database } from "./database.types";

export type Unidade = Database["public"]["Tables"]["unidades"]["Row"];
export type TipoParada = Database["public"]["Tables"]["paradas_tipos"]["Row"];

export type ParadaRegistroRow = Omit<
  Database["public"]["Tables"]["paradas_registros"]["Row"],
  "created_at" | "updated_at" | "horario_fim"
> & {
  horario_fim?: string | null;
  created_at?: string;
  updated_at?: string;
  paradas_tipos: {
    nome: string;
  };
};

export type ParadaRegistro = Omit<ParadaRegistroRow, "created_at" | "updated_at"> & {
  tipo: string;
};

export interface Frota {
  id: string;
  codigo: string;
  modelo: string;
  unidade_id: string;
  tipo: string;
  status: "operando" | "parado";
  unidades: {
    id: string;
    nome: string;
    codigo: string;
  };
  parada?: {
    tipo: string;
    inicio: Date;
    previsao_minutos: number;
    motivo: string;
  };
} 