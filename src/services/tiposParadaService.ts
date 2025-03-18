import { supabase } from "@/lib/supabase"
import { TipoParada } from "@/types/paradas"

export const tiposParadaService = {
  async buscarTipos(): Promise<TipoParada[]> {
    const { data, error } = await supabase
      .from("tipos_parada")
      .select("*")
      .order("nome")

    if (error) {
      console.error("Erro ao buscar tipos de parada:", error)
      throw error
    }

    return data
  },

  async criarTipo(nome: string, icone: string): Promise<TipoParada> {
    const { data, error } = await supabase
      .from("tipos_parada")
      .insert([{ nome, icone }])
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar tipo de parada:", error)
      throw error
    }

    return data
  },

  async atualizarTipo(id: string, nome: string, icone: string): Promise<TipoParada> {
    const { data, error } = await supabase
      .from("tipos_parada")
      .update({ nome, icone })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar tipo de parada:", error)
      throw error
    }

    return data
  },

  async excluirTipo(id: string): Promise<void> {
    const { error } = await supabase
      .from("tipos_parada")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir tipo de parada:", error)
      throw error
    }
  }
} 