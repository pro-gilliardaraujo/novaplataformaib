import { supabase } from "@/lib/supabase"
import { Parada, TipoParada } from "@/types/paradas"

export const paradasService = {
  async registrarParada(
    frotaId: string,
    tipoParadaId: string,
    motivo: string,
    previsaoMinutos?: number
  ): Promise<Parada> {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('paradas')
      .insert([{
        frota_id: frotaId,
        tipo_parada_id: tipoParadaId,
        motivo,
        previsao_minutos: previsaoMinutos,
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

  async liberarParada(paradaId: string): Promise<void> {
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('paradas')
      .update({ fim: now })
      .eq('id', paradaId)

    if (error) throw error
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
        )
      `)
      .eq('frota_id', frotaId)
      .gte('inicio', `${data}T00:00:00`)
      .lte('inicio', `${data}T23:59:59`)
      .order('inicio', { ascending: false })

    if (error) throw error
    return paradas
  },

  // Função auxiliar para calcular duração em minutos
  calcularDuracao(inicio: string, fim?: string | null): number {
    const inicioDate = new Date(inicio)
    const fimDate = fim ? new Date(fim) : new Date()
    return Math.floor((fimDate.getTime() - inicioDate.getTime()) / 60000)
  }
} 