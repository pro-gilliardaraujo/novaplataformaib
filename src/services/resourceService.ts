import { supabase } from "@/lib/supabase"
import { Category, Page } from "@/types/pages"

export const resourceService = {
  async getResourcesByUnit(unitId: string | null = null) {
    try {
      if (!unitId) {
        // Se não houver unidade, busca recursos globais
        const { data: categories, error } = await supabase
          .from("categories")
          .select(`
            *,
            pages (*)
          `)
          .order("order_index")

        if (error) throw error
        return categories
      }

      // Busca recursos associados à unidade específica
      const { data: resources, error } = await supabase
        .from("resource_units")
        .select(`
          resource:resources (
            id,
            type,
            category:categories (
              *,
              pages (*)
            )
          )
        `)
        .eq("unit_id", unitId)

      if (error) throw error

      // Organiza os recursos por categoria
      const categories = resources.reduce((acc: Category[], item) => {
        if (item.resource.type === "category" && item.resource.category) {
          acc.push(item.resource.category)
        }
        return acc
      }, [])

      return categories
    } catch (error) {
      console.error("Erro ao buscar recursos:", error)
      throw error
    }
  },

  async associateResourceToUnit(resourceId: string, unitId: string) {
    try {
      const { error } = await supabase
        .from("resource_units")
        .insert({ resource_id: resourceId, unit_id: unitId })

      if (error) throw error
    } catch (error) {
      console.error("Erro ao associar recurso à unidade:", error)
      throw error
    }
  },

  async removeResourceFromUnit(resourceId: string, unitId: string) {
    try {
      const { error } = await supabase
        .from("resource_units")
        .delete()
        .match({ resource_id: resourceId, unit_id: unitId })

      if (error) throw error
    } catch (error) {
      console.error("Erro ao remover recurso da unidade:", error)
      throw error
    }
  },

  async getUnitResources(unitId: string) {
    try {
      const { data, error } = await supabase
        .from("resource_units")
        .select("resource_id")
        .eq("unit_id", unitId)

      if (error) throw error
      return data.map(item => item.resource_id)
    } catch (error) {
      console.error("Erro ao buscar recursos da unidade:", error)
      throw error
    }
  }
} 