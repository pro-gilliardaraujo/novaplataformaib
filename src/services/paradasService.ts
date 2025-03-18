import { supabase } from "@/lib/supabase"
import { Parada, TipoParada } from "@/types/paradas"

interface RegistrarParadaParams {
  frota_id: string
  tipo_parada_id: string
  motivo: string
  previsao_horario?: string
}

export const paradasService = {
  async buscarParadasDia(data: string): Promise<Parada[]> {
    const { data: paradas, error } = await supabase
      .from("paradas")
      .select(`
        *,
        frota:frota_id(
          id,
          frota,
          descricao,
          unidade_id
        ),
        tipo:tipo_parada_id(
          id,
          nome,
          icone
        )
      `)
      .gte("inicio", `${data}T00:00:00`)
      .lte("inicio", `${data}T23:59:59`)
      .order("inicio", { ascending: false })

    if (error) {
      console.error("Erro ao buscar paradas:", error)
      throw error
    }

    return paradas
  },

  async registrarParada(params: RegistrarParadaParams): Promise<Parada> {
    // Get current time in America/Sao_Paulo timezone
    const now = new Date()
    now.setHours(now.getHours() - 3) // Adjust for America/Sao_Paulo timezone

    const { data, error } = await supabase
      .from("paradas")
      .insert([{
        frota_id: params.frota_id,
        tipo_parada_id: params.tipo_parada_id,
        motivo: params.motivo,
        inicio: now.toISOString(),
        previsao_horario: params.previsao_horario
      }])
      .select(`
        *,
        frota:frota_id(
          id,
          frota,
          descricao,
          unidade_id
        ),
        tipo:tipo_parada_id(
          id,
          nome,
          icone
        )
      `)
      .single()

    if (error) {
      console.error("Erro ao registrar parada:", error)
      throw error
    }

    return data
  },

  async liberarParada(paradaId: string): Promise<Parada> {
    // Get current time in America/Sao_Paulo timezone
    const now = new Date()
    now.setHours(now.getHours() - 3) // Adjust for America/Sao_Paulo timezone

    const { data, error } = await supabase
      .from("paradas")
      .update({ fim: now.toISOString() })
      .eq("id", paradaId)
      .select(`
        *,
        frota:frota_id(
          id,
          frota,
          descricao,
          unidade_id
        ),
        tipo:tipo_parada_id(
          id,
          nome,
          icone
        )
      `)
      .single()

    if (error) {
      console.error("Erro ao liberar parada:", error)
      throw error
    }

    return data
  },

  async buscarTiposParada(): Promise<TipoParada[]> {
    const { data, error } = await supabase
      .from('tipos_parada')
      .select('*')
      .order('nome')

    if (error) throw error
    return data
  },

  async buscarHistorico(
    frotaId: string,
    data: string
  ): Promise<Parada[]> {
    const { data: paradas, error } = await supabase
      .from('paradas')
      .select(`
        *,
        tipo:tipo_parada_id (
          id,
          nome,
          icone
        ),
        frota:frota_id (
          id,
          frota,
          descricao
        )
      `)
      .eq('frota_id', frotaId)
      .gte('inicio', `${data}T00:00:00`)
      .lte('inicio', `${data}T23:59:59`)
      .order('inicio', { ascending: false })

    if (error) throw error
    return paradas
  },

  async atualizarParada(
    paradaId: string,
    tipoParadaId: string,
    motivo: string,
    previsaoHorario?: string
  ): Promise<Parada> {
    const { data, error } = await supabase
      .from("paradas")
      .update({
        tipo_id: tipoParadaId,
        motivo,
        previsao_horario: previsaoHorario
      })
      .eq("id", paradaId)
      .select(`
        *,
        frota:frotas(*),
        tipo:tipos_parada(*)
      `)
      .single()

    if (error) {
      console.error("Erro ao atualizar parada:", error)
      throw error
    }

    return data
  },

  async atualizarParadaHistorico(
    paradaId: string,
    tipoParadaId: string,
    motivo: string,
    previsaoHorario?: string,
    inicioHorario?: string,
    fimHorario?: string
  ): Promise<Parada> {
    // Update all fields including fim
    const { data, error } = await supabase
      .from('paradas')
      .update({
        tipo_parada_id: tipoParadaId,
        motivo,
        previsao_horario: previsaoHorario,
        inicio: inicioHorario,
        fim: fimHorario
      })
      .eq('id', paradaId)
      .select(`
        *,
        frota:frota_id(
          id,
          frota,
          descricao,
          unidade_id
        ),
        tipo:tipo_parada_id(
          id,
          nome,
          icone
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  calcularDuracao(inicio: string, fim?: string | null): number {
    const inicioDate = new Date(inicio)
    const fimDate = fim ? new Date(fim) : new Date()
    return Math.floor((fimDate.getTime() - inicioDate.getTime()) / 1000)
  }
} 