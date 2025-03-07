import { supabase } from "@/lib/supabase"
import { Retirada, NovaRetiradaData, UpdateRetiradaData } from "@/types/retirada"

export const retiradaService = {
  async list() {
    const { data, error } = await supabase
      .from("controle_retiradas")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Retirada[]
  },

  async create(retirada: NovaRetiradaData) {
    const { data, error } = await supabase
      .from("controle_retiradas")
      .insert(retirada)
      .select()
      .single()

    if (error) throw error
    return data as Retirada
  },

  async update(id: string, updates: UpdateRetiradaData) {
    const { data, error } = await supabase
      .from("controle_retiradas")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data as Retirada
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("controle_retiradas")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error
    return data as Retirada
  },

  subscribeToChanges(callback: () => void) {
    const channel = supabase
      .channel('controle_retiradas_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'controle_retiradas'
        },
        callback
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
} 