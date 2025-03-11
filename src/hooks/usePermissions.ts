import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { UserPermissions, ResourcePermission, PermissionType } from "@/types/user"

export function usePermissions(userId: string) {
  const query = useQuery({
    queryKey: ["permissions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select(`
          base_profile,
          unit_id,
          resources:resource_permissions(
            resource_id,
            permissions,
            resources(
              id,
              type
            )
          )
        `)
        .eq("user_id", userId)
        .single()

      if (error) {
        throw error
      }

      // Transform the data to match UserPermissions type
      const transformedData: UserPermissions = {
        base_profile: data.base_profile,
        unit_id: data.unit_id,
        resources: data.resources.map((r: any): ResourcePermission => ({
          id: r.resources.id,
          type: r.resources.type,
          permissions: r.permissions
        }))
      }

      return transformedData
    },
    enabled: !!userId,
  })

  const checkPermission = (resourceId: string, requiredPermission: PermissionType): boolean => {
    if (!query.data) return false
    if (query.data.base_profile === "global_admin") return true

    const resource = query.data.resources.find(r => r.id === resourceId)
    return resource?.permissions.includes(requiredPermission) || false
  }

  const isGlobalAdmin = query.data?.base_profile === "global_admin"
  const userUnitId = query.data?.unit_id
  const unitResources = query.data?.resources.filter(r => r.type === "unit") || []

  return {
    ...query,
    checkPermission,
    isGlobalAdmin,
    userUnitId,
    unitResources,
    loading: query.isLoading
  }
} 