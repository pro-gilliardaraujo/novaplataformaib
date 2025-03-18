import { supabase } from "@/lib/supabase"
import { Unidade } from "@/types/unidades"

export const unidadesService = {
  async buscarUnidades(): Promise<Unidade[]> {
    const { data, error } = await supabase
      .from("unidades")
      .select("*")
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
  }
} 