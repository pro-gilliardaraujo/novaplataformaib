import { supabase } from "@/lib/supabase"
import { Equipamento, NovoEquipamentoData, UpdateEquipamentoData } from "@/types/equipamento"

export const equipamentoService = {
  async getEquipamentos(): Promise<Equipamento[]> {
    const { data, error } = await supabase
      .from("equipamentos")
      .select()
      .order("codigo_patrimonio", { ascending: true })

    if (error) throw error

    return data
  },

  async createEquipamento(equipamentoData: NovoEquipamentoData): Promise<void> {
    console.log("Iniciando criação do equipamento:", equipamentoData)
    try {
      const { error } = await supabase
        .from("equipamentos")
        .insert(equipamentoData)

      if (error) {
        console.error("Erro ao criar equipamento:", error)
        throw new Error(error.message)
      }

      console.log("Equipamento criado com sucesso")
    } catch (error) {
      console.error("Erro detalhado durante a criação:", error)
      throw new Error("Não foi possível criar o equipamento. Por favor, tente novamente.")
    }
  },

  async updateEquipamento(codigoPatrimonio: string, updates: UpdateEquipamentoData) {
    console.log("Iniciando atualização do equipamento:", { codigoPatrimonio, updates })

    try {
      const { error } = await supabase
        .from("equipamentos")
        .update(updates)
        .eq("codigo_patrimonio", codigoPatrimonio)

      if (error) {
        console.error("Erro ao atualizar equipamento:", error)
        throw new Error(error.message)
      }

      console.log("Equipamento atualizado com sucesso")
    } catch (error) {
      console.error("Erro detalhado na atualização:", error)
      throw error
    }
  },

  async deleteEquipamento(codigoPatrimonio: string): Promise<void> {
    console.log("Iniciando exclusão do equipamento:", codigoPatrimonio)
    try {
      const { error } = await supabase
        .from("equipamentos")
        .delete()
        .eq("codigo_patrimonio", codigoPatrimonio)

      if (error) {
        console.error("Erro ao deletar equipamento:", error)
        throw error
      }
      console.log("Equipamento removido com sucesso")
    } catch (error) {
      console.error("Erro detalhado durante a exclusão:", error)
      throw new Error("Não foi possível excluir o equipamento. Por favor, tente novamente.")
    }
  }
} 