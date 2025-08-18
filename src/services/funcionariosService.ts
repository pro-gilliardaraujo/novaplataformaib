import { supabase } from "@/lib/supabase"
import { Funcionario, FuncionarioSearchResult } from "@/types/funcionarios"

export const funcionariosService = {
  async buscarFuncionarios(query: string): Promise<FuncionarioSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const { data, error } = await supabase
      .from("funcionarios")
      .select("id, nome, cpf, funcao, unidade")
      .ilike("nome", `%${query.trim()}%`)
      .eq("ativo", true)
      .order("nome")
      .limit(10)

    if (error) {
      console.error("Erro ao buscar funcionários:", error)
      throw error
    }

    return data || []
  },

  async buscarFuncionarioPorId(id: number): Promise<FuncionarioSearchResult | null> {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("id, nome, cpf, funcao, unidade")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Erro ao buscar funcionário por ID:", error)
      return null
    }

    return data
  }
}