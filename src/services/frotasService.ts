import { supabase } from "@/lib/supabase"
import { Frota } from "@/types/frotas"

export const frotasService = {
  async buscarFrotas(): Promise<Frota[]> {
    const { data, error } = await supabase
      .from("frotas")
      .select("*")
      .order("frota")

    if (error) {
      console.error("Erro ao buscar frotas:", error)
      throw error
    }

    return data
  },

  async criarFrota(frota: string, descricao: string, unidadeId: string): Promise<Frota> {
    const { data, error } = await supabase
      .from("frotas")
      .insert([{
        frota,
        descricao,
        unidade_id: unidadeId
      }])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar frota:", error)
      throw error
    }

    return data
  },

  async atualizarFrota(id: string, frota: string, descricao: string, unidadeId: string): Promise<Frota> {
    const { data, error } = await supabase
      .from("frotas")
      .update({
        frota,
        descricao,
        unidade_id: unidadeId
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar frota:", error)
      throw error
    }

    return data
  },

  async excluirFrota(id: string): Promise<void> {
    const { error } = await supabase
      .from("frotas")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir frota:", error)
      throw error
    }
  }
} 