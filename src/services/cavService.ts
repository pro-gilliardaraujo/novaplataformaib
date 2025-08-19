import { supabase } from "@/lib/supabase"
import { BoletimCav, BoletimCavAgregado, CavFormData } from "@/types/cav"

export const cavService = {
  // Buscar todos os boletins granulares
  async buscarBoletinsCav(): Promise<BoletimCav[]> {
    const { data, error } = await supabase
      .from("boletins_cav")
      .select("*")
      .order("data", { ascending: false })
      .order("frente")
      .order("frota")
      .order("turno")

    if (error) {
      console.error("Erro ao buscar boletins CAV:", error)
      throw error
    }

    return data || []
  },

  // Buscar boletins agregados
  async buscarBoletinsAgregados(): Promise<BoletimCavAgregado[]> {
    const { data, error } = await supabase
      .from("boletins_cav_agregado")
      .select("*")
      .order("data", { ascending: false })
      .order("frente")

    if (error) {
      console.error("Erro ao buscar boletins agregados:", error)
      throw error
    }

    return data || []
  },

  // Buscar por filtros específicos
  async buscarPorFiltros(filtros: {
    data_inicio?: string
    data_fim?: string
    frente?: string
    frota?: number
  }): Promise<BoletimCav[]> {
    let query = supabase
      .from("boletins_cav")
      .select("*")

    if (filtros.data_inicio) {
      query = query.gte("data", filtros.data_inicio)
    }

    if (filtros.data_fim) {
      query = query.lte("data", filtros.data_fim)
    }

    if (filtros.frente) {
      query = query.eq("frente", filtros.frente)
    }

    if (filtros.frota) {
      query = query.eq("frota", filtros.frota)
    }

    query = query.order("data", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Erro ao buscar com filtros:", error)
      throw error
    }

    return data || []
  },

  // Excluir boletim
  async excluirBoletim(id: number): Promise<void> {
    const { error } = await supabase
      .from("boletins_cav")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir boletim:", error)
      throw error
    }
  },

  // Buscar último código usado (para sugestão)
  async buscarUltimoCodigo(): Promise<string> {
    const { data, error } = await supabase
      .from("boletins_cav")
      .select("codigo")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar último código:", error)
      return ""
    }

    return data?.[0]?.codigo || ""
  }
}
