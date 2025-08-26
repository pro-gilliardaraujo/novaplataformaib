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
      .or(`nome.ilike.%${primeiro}%,funcao.ilike.%${primeiro}%,unidade.ilike.%${primeiro}%`)
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
      // Incluir nome completo, função e unidade no texto de busca
      const nomeCompleto = func.nome || "";
      const funcao = func.funcao || "";
      const unidade = func.unidade || "";
      
      // Separar o nome em partes (nome e sobrenomes)
      const partesDoCampoNome = nomeCompleto.split(" ");
      
      // Criar um texto completo para busca incluindo todas as informações
      const alvo = normalizar(`${nomeCompleto} ${funcao} ${unidade} ${partesDoCampoNome.join(" ")}`);
      
      // Verificar se todos os tokens de busca estão presentes
      return tokens.every(t => alvo.includes(normalizar(t)));
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