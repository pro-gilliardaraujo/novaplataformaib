import { supabase } from "@/lib/supabase"
import { ResourcePermission, PermissionType } from "@/types/user"

export const permissionService = {
  async getUserPermissions(userId: string) {
    const { data: permissions, error } = await supabase
      .from("user_permissions")
      .select(`
        id,
        user_id,
        base_profile,
        unit_id,
        resource_permissions (
          id,
          resource_id,
          resource_type,
          permissions
        )
      `)
      .eq("user_id", userId)
      .single()

    if (error) throw error

    return {
      base_profile: permissions.base_profile,
      unit_id: permissions.unit_id,
      resources: permissions.resource_permissions.map((rp: any) => ({
        id: rp.resource_id,
        type: rp.resource_type,
        permissions: rp.permissions
      }))
    }
  },

  async updateUserPermissions(userId: string, permissions: {
    base_profile: string
    unit_id?: string
    resources: ResourcePermission[]
  }) {
    const { error: deleteError } = await supabase
      .from("resource_permissions")
      .delete()
      .eq("user_id", userId)

    if (deleteError) throw deleteError

    // Atualiza o perfil base e unidade
    const { error: updateError } = await supabase
      .from("user_permissions")
      .upsert({
        user_id: userId,
        base_profile: permissions.base_profile,
        unit_id: permissions.unit_id
      })

    if (updateError) throw updateError

    // Insere as novas permissões de recursos
    if (permissions.resources.length > 0) {
      const { error: insertError } = await supabase
        .from("resource_permissions")
        .insert(
          permissions.resources.map(resource => ({
            user_id: userId,
            resource_id: resource.id,
            resource_type: resource.type,
            permissions: resource.permissions
          }))
        )

      if (insertError) throw insertError
    }
  },

  async checkPermission(
    userId: string,
    resourceId: string,
    requiredPermission: PermissionType
  ): Promise<boolean> {
    const { data: userPermission, error } = await supabase
      .from("user_permissions")
      .select(`
        base_profile,
        unit_id,
        resource_permissions!inner (
          permissions
        )
      `)
      .eq("user_id", userId)
      .eq("resource_permissions.resource_id", resourceId)
      .single()

    if (error) return false

    // Se é admin global, tem todas as permissões
    if (userPermission.base_profile === "global_admin") return true

    // Se é admin regional, verifica se o recurso pertence à sua unidade
    if (userPermission.base_profile === "regional_admin") {
      const { data: resource } = await supabase
        .from("resources")
        .select("unit_id")
        .eq("id", resourceId)
        .single()

      if (resource?.unit_id === userPermission.unit_id) return true
    }

    // Verifica permissões específicas
    return userPermission.resource_permissions.some(
      (rp: any) => rp.permissions.includes(requiredPermission)
    )
  }
} 