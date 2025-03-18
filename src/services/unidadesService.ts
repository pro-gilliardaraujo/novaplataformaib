import { supabase } from "@/lib/supabase"
import { Unidade } from "@/types/unidades"

export const unidadesService = {
  async buscarUnidades(): Promise<Unidade[]> {
    const { data, error } = await supabase
      .from("unidades")
      .select(`
        *,
        frotas (
          id,
          frota,
          descricao,
          unidade_id,
          created_at,
          updated_at
        )
      `)
      .order("nome")

    if (error) {
      console.error("Erro ao buscar unidades:", error)
      throw error
    }

    return data
  },

  async excluirUnidade(id: string): Promise<void> {
    const { error } = await supabase
      .from("unidades")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir unidade:", error)
      throw error
    }
  },

  async criarUnidade(unidade: Pick<Unidade, "nome" | "codigo">): Promise<Unidade> {
    const { data, error } = await supabase
      .from("unidades")
      .insert([unidade])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar unidade:", error)
      throw error
    }

    return data
  },

  async atualizarUnidade(id: string, unidade: Pick<Unidade, "nome" | "codigo">): Promise<Unidade> {
    const { data, error } = await supabase
      .from("unidades")
      .update(unidade)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar unidade:", error)
      throw error
    }

    return data
  }
} 