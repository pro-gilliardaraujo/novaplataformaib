import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { permissionService } from "@/services/permissionService"
import { resourceService } from "@/services/resourceService"
import { PermissionType, UserPermissions, ResourcePermission } from "@/types/user"

export function usePermissions() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [unitResources, setUnitResources] = useState<string[]>([])

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

        // Se for um perfil regional, busca os recursos da unidade
        if (data.unit_id && (data.base_profile === "regional_admin" || data.base_profile === "regional_viewer")) {
          const resources = await resourceService.getUnitResources(data.unit_id)
          setUnitResources(resources)
        }
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
    if (!user || !permissions) return false

    // Administradores globais têm acesso total
    if (permissions.base_profile === "global_admin") return true

    // Para perfis regionais, verifica se o recurso pertence à unidade
    if (permissions.unit_id && 
       (permissions.base_profile === "regional_admin" || permissions.base_profile === "regional_viewer")) {
      if (!unitResources.includes(resourceId)) return false

      // Administradores regionais têm acesso total aos recursos de sua unidade
      if (permissions.base_profile === "regional_admin") return true

      // Visualizadores regionais só podem visualizar
      if (permissions.base_profile === "regional_viewer") {
        return requiredPermission === "view"
      }
    }

    // Visualizadores globais só podem visualizar
    if (permissions.base_profile === "global_viewer") {
      return requiredPermission === "view"
    }

    // Para perfis customizados, verifica as permissões específicas
    if (permissions.base_profile === "custom") {
      const resource = permissions.resources.find(r => r.id === resourceId)
      return resource?.permissions.includes(requiredPermission) || false
    }

    return false
  }

  const isGlobalAdmin = permissions?.base_profile === "global_admin"
  const isRegionalAdmin = permissions?.base_profile === "regional_admin"
  const isGlobalViewer = permissions?.base_profile === "global_viewer"
  const isRegionalViewer = permissions?.base_profile === "regional_viewer"
  const isCustom = permissions?.base_profile === "custom"
  const userUnitId = permissions?.unit_id

  return {
    permissions,
    loading,
    checkPermission,
    isGlobalAdmin,
    isRegionalAdmin,
    isGlobalViewer,
    isRegionalViewer,
    isCustom,
    userUnitId,
    unitResources
  }
} 