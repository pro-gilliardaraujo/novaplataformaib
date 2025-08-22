import { supabase } from "@/lib/supabase"
import { Funcionario, FuncionarioSearchResult } from "@/types/funcionarios"

export const funcionariosService = {
  async buscarFuncionarios(query: string): Promise<FuncionarioSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    const tokens = query.trim().split(/\s+/)

    // Primeiro token usado no servidor para reduzir resultado
    const primeiro = tokens[0]

    const { data, error } = await supabase
      .from("funcionarios")
      .select("id, nome, cpf, funcao, unidade")
      .or(`nome.ilike.%${primeiro}%,funcao.ilike.%${primeiro}%`)
      .eq("ativo", true)
      .order("nome")
      .limit(100)

    if (error) {
      console.error("Erro ao buscar funcionários:", error)
      throw error
    }

    // Filtrar no cliente para garantir que TODAS as palavras apareçam
    const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const filtrado = (data || []).filter(func => {
      const alvo = normalizar(`${func.nome} ${func.funcao || ""}`)
      return tokens.every(t => alvo.includes(normalizar(t)))
    })

    return filtrado.slice(0, 10)
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