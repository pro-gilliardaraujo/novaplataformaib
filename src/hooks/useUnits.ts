import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

interface Unit {
  id: string
  name: string
}

export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, name")
        .order("name")

      if (error) throw error

      return data as Unit[]
    }
  })
} 