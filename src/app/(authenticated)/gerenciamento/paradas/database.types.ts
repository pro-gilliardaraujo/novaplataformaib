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
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at?: string
          user_id: string
          user_email: string
          nome: string
          cargo?: string | null
          adminProfile: boolean
          firstLogin: boolean
          ultimo_acesso?: string | null
          base_profile?: "global_admin" | "global_viewer" | "regional_admin" | "regional_viewer" | "custom"
          unit_id?: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          user_email: string
          nome: string
          cargo?: string | null
          adminProfile?: boolean
          firstLogin?: boolean
          ultimo_acesso?: string | null
          base_profile?: "global_admin" | "global_viewer" | "regional_admin" | "regional_viewer" | "custom"
          unit_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          user_email?: string
          nome?: string
          cargo?: string | null
          adminProfile?: boolean
          firstLogin?: boolean
          ultimo_acesso?: string | null
          base_profile?: "global_admin" | "global_viewer" | "regional_admin" | "regional_viewer" | "custom"
          unit_id?: string | null
        }
        Relationships: []
      }
      paradas_frotas: {
        Row: {
          id: string
          codigo: string
          modelo: string
          unidade_id: string
          tipo: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          modelo: string
          unidade_id: string
          tipo: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          modelo?: string
          unidade_id?: string
          tipo?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_unidade"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          }
        ]
      }
      paradas_registros: {
        Row: {
          id: string
          frota_id: string
          tipo_id: string
          horario_inicio: string
          horario_fim: string | null
          previsao_minutos: number
          motivo: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          frota_id: string
          tipo_id: string
          horario_inicio: string
          horario_fim?: string | null
          previsao_minutos: number
          motivo: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          frota_id?: string
          tipo_id?: string
          horario_inicio?: string
          horario_fim?: string | null
          previsao_minutos?: number
          motivo?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paradas_registros_frota_id_fkey"
            columns: ["frota_id"]
            isOneToOne: false
            referencedRelation: "paradas_frotas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paradas_registros_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "paradas_tipos"
            referencedColumns: ["id"]
          }
        ]
      }
      paradas_tipos: {
        Row: {
          id: string
          nome: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
          id: string
          nome: string
          codigo: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          codigo: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
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