import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { permissionService } from "@/services/permissionService"
import { PermissionType, UserPermissions, ResourcePermission } from "@/types/user"

export function usePermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissions(null)
        setLoading(false)
        return
      }

      try {
        const data = await permissionService.getUserPermissions(user.id)
        const userPermissions: UserPermissions = {
          base_profile: data.base_profile,
          unit_id: data.unit_id,
          resources: data.resources.map((r: any): ResourcePermission => ({
            id: r.id,
            name: r.name || "",
            type: r.type,
            permissions: r.permissions
          }))
        }
        setPermissions(userPermissions)
      } catch (error) {
        console.error("Erro ao carregar permissões:", error)
        setPermissions(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [user])

  const checkPermission = async (resourceId: string, requiredPermission: PermissionType): Promise<boolean> => {
    if (!user) return false

    try {
      return await permissionService.checkPermission(user.id, resourceId, requiredPermission)
    } catch (error) {
      console.error("Erro ao verificar permissão:", error)
      return false
    }
  }

  const isGlobalAdmin = permissions?.base_profile === "global_admin"
  const isRegionalAdmin = permissions?.base_profile === "regional_admin"
  const isGlobalViewer = permissions?.base_profile === "global_viewer"
  const isRegionalViewer = permissions?.base_profile === "regional_viewer"
  const isCustom = permissions?.base_profile === "custom"

  return {
    permissions,
    loading,
    checkPermission,
    isGlobalAdmin,
    isRegionalAdmin,
    isGlobalViewer,
    isRegionalViewer,
    isCustom,
  }
} 