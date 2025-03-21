import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { UserPermissions, ResourcePermission, PermissionType } from "@/types/user"

interface RawPermission {
  base_profile: UserPermissions["base_profile"]
  unit_id: string | null
  resource_id: string
  resource_type: "category" | "page" | "panel"
  resource_name: string
  permissions: PermissionType[]
}

export function useUserPermissions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["permissions", user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase.rpc(
        "get_user_permissions",
        { user_id_param: user.id }
      )

      if (error) throw error

      // Transforma os dados brutos no formato esperado
      const rawPermissions = data as RawPermission[]
      if (!rawPermissions.length) return null

      // Agrupa os recursos por tipo
      const groupedResources = rawPermissions.reduce((acc, p) => {
        if (!p.resource_id) return acc

        const resource: ResourcePermission = {
          id: p.resource_id,
          type: p.resource_type,
          name: p.resource_name,
          permissions: p.permissions
        }

        if (!acc[p.resource_type]) {
          acc[p.resource_type] = []
        }

        acc[p.resource_type].push(resource)
        return acc
      }, {} as Record<string, ResourcePermission[]>)

      const permissions: UserPermissions = {
        base_profile: rawPermissions[0].base_profile,
        unit_id: rawPermissions[0].unit_id || undefined,
        resources: Object.values(groupedResources).flat(),
        groupedResources
      }

      return permissions
    },
    enabled: !!user
  })
} 