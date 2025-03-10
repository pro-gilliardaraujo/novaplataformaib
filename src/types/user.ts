export interface User {
  id: string
  email: string
  created_at: string
  profile: UserProfile
}

export interface UserProfile {
  nome: string
  cargo?: string
  adminProfile: boolean
  firstLogin: boolean
  ultimo_acesso?: string
}

export interface NovoUsuarioData {
  nome: string
  cargo?: string
  tipo_usuario: boolean
  permissions?: Array<{
    page_id: string
    can_access: boolean
  }>
}

export interface UpdateUsuarioData {
  nome?: string
  cargo?: string
  tipo_usuario?: boolean
  permissions?: Array<{
    page_id: string
    can_access: boolean
  }>
}

export type PermissionType = "view" | "edit" | "admin"

export interface ResourcePermission {
  id: string
  name?: string
  type: "category" | "page" | "panel"
  permissions: PermissionType[]
}

export interface UserPermissions {
  base_profile: "global_admin" | "global_viewer" | "regional_admin" | "regional_viewer" | "custom"
  unit_id?: string
  resources: ResourcePermission[]
  groupedResources?: {
    category?: ResourcePermission[]
    page?: ResourcePermission[]
    panel?: ResourcePermission[]
  }
} 