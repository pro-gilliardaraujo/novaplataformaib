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
          nome: string
          cargo: string | null
          adminProfile: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nome: string
          cargo?: string | null
          adminProfile?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cargo?: string | null
          adminProfile?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          name: string
          slug: string
          category_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          category_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_page_permissions: {
        Row: {
          id: string
          user_id: string
          page_id: string
          can_access: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          page_id: string
          can_access?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          page_id?: string
          can_access?: boolean
          created_at?: string
          updated_at?: string
        }
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 