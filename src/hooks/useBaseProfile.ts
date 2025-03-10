import { useUserPermissions } from "@/hooks/useUserPermissions"
import { UserPermissions } from "@/types/user"

type BaseProfile = UserPermissions["base_profile"]

export function useBaseProfile() {
  const { data: permissions } = useUserPermissions()

  const isGlobalAdmin = permissions?.base_profile === "global_admin"
  const isGlobalViewer = permissions?.base_profile === "global_viewer"
  const isRegionalAdmin = permissions?.base_profile === "regional_admin"
  const isRegionalViewer = permissions?.base_profile === "regional_viewer"
  const isCustom = permissions?.base_profile === "custom"
  const userUnitId = permissions?.unit_id

  const hasBaseProfile = (profile: BaseProfile) => {
    return permissions?.base_profile === profile
  }

  return {
    baseProfile: permissions?.base_profile,
    isGlobalAdmin,
    isGlobalViewer,
    isRegionalAdmin,
    isRegionalViewer,
    isCustom,
    userUnitId,
    hasBaseProfile
  }
} 