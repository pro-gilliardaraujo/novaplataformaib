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