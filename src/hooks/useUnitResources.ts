import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

interface UnitResource {
  id: string
  type: "category" | "page" | "panel"
  name: string
}

export function useUnitResources(unitId: string | undefined) {
  return useQuery({
    queryKey: ["unit-resources", unitId],
    queryFn: async () => {
      if (!unitId) return []

      const { data, error } = await supabase
        .from("resources")
        .select(`
          id,
          type,
          name,
          resource_units!inner(unit_id)
        `)
        .eq("resource_units.unit_id", unitId)
        .order("type")
        .order("name")

      if (error) throw error

      return data.map(({ id, type, name }) => ({
        id,
        type,
        name
      })) as UnitResource[]
    },
    enabled: !!unitId
  })
} 