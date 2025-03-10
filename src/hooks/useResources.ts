import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

interface Resource {
  id: string
  type: "category" | "page" | "panel"
  name: string
}

export function useResources() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id, type, name")
        .order("type")
        .order("name")

      if (error) throw error

      return data as Resource[]
    }
  })
} 