import { supabase } from "@/lib/supabase"
import { Parada, TipoParada } from "@/types/paradas"

export const paradasService = {
  async registrarParada(
    frotaId: string,
    tipoParadaId: string,
    motivo: string,
    previsaoHorario?: string
  ): Promise<Parada> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('paradas')
      .insert([{
        frota_id: frotaId,
        tipo_parada_id: tipoParadaId,
        motivo,
        previsao_horario: previsaoHorario,
        inicio: now,
      }])
      .select(`
        *,
        tipo:tipo_parada_id (
          id,
          nome,
          icone
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  async liberarParada(paradaId: string): Promise<Parada> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('paradas')
      .update({ fim: now })
      .eq('id', paradaId)
      .select(`
        *,
        tipo:tipo_parada_id (
          id,
          nome,
          icone
        )
      `)
      .single()

    if (error) throw error
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
    previsaoHorario?: string,
    inicioHorario?: string
  ): Promise<Parada> {
    const { data, error } = await supabase
      .from('paradas')
      .update({
        tipo_parada_id: tipoParadaId,
        motivo,
        previsao_horario: previsaoHorario,
        inicio: inicioHorario,
      })
      .eq('id', paradaId)
      .select(`
        *,
        tipo:tipo_parada_id (
          id,
          nome,
          icone
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Função auxiliar para calcular duração em minutos
  calcularDuracao(inicio: string, fim?: string | null): number {
    const inicioDate = new Date(inicio)
    const fimDate = fim ? new Date(fim) : new Date()
    return Math.floor((fimDate.getTime() - inicioDate.getTime()) / 60000)
  }
} 