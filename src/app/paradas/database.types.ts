export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      paradas_frotas: {
        Row: {
          id: string
          created_at: string
          codigo: string
          modelo: string
          unidade_id: string
          tipo: string
          ativo: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          codigo: string
          modelo: string
          unidade_id: string
          tipo: string
          ativo?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          codigo?: string
          modelo?: string
          unidade_id?: string
          tipo?: string
          ativo?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "paradas_frotas_unidade_id_fkey"
            columns: ["unidade_id"]
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          }
        ]
      }
      paradas_tipos: {
        Row: {
          id: string
          created_at: string
          nome: string
          ativo: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          nome: string
          ativo?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          ativo?: boolean
        }
        Relationships: []
      }
      paradas_registros: {
        Row: {
          id: string
          created_at: string
          frota_id: string
          tipo_id: string
          horario_inicio: string
          horario_fim: string | null
          previsao_minutos: number
          motivo: string
        }
        Insert: {
          id?: string
          created_at?: string
          frota_id: string
          tipo_id: string
          horario_inicio?: string
          horario_fim?: string | null
          previsao_minutos: number
          motivo: string
        }
        Update: {
          id?: string
          created_at?: string
          frota_id?: string
          tipo_id?: string
          horario_inicio?: string
          horario_fim?: string | null
          previsao_minutos?: number
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "paradas_registros_frota_id_fkey"
            columns: ["frota_id"]
            referencedRelation: "paradas_frotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paradas_registros_tipo_id_fkey"
            columns: ["tipo_id"]
            referencedRelation: "paradas_tipos"
            referencedColumns: ["id"]
          }
        ]
      }
      unidades: {
        Row: {
          id: string
          created_at: string
          nome: string
          codigo: string
          ativo: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          nome: string
          codigo: string
          ativo?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          nome?: string
          codigo?: string
          ativo?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 