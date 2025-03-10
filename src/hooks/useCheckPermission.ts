import { useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { PermissionType } from "@/types/user"

export function useCheckPermission() {
  const { user } = useAuth()

  const checkPermission = useCallback(async (
    resourceType: "category" | "page" | "panel",
    resourceName: string,
    permission: PermissionType
  ): Promise<boolean> => {
    if (!user) return false

    const { data, error } = await supabase.rpc(
      "check_user_permission",
      {
        user_id_param: user.id,
        resource_type_param: resourceType,
        resource_name_param: resourceName,
        permission_param: permission
      }
    )

    if (error) {
      console.error("Erro ao verificar permissão:", error)
      return false
    }

    return data || false
  }, [user])

  return checkPermission
} 