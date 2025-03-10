export interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  profile: {
    id: string
    created_at: string
    user_id: string
    nome: string
    cargo: string
    adminProfile: boolean
    firstLogin: boolean
    user_email: string
    ultimo_acesso: string | null
    base_profile?: string
    unit_id?: string
  }
}

export interface UserProfile {
  id: string
  created_at: string
  user_id: string
  nome: string
  cargo: string
  adminProfile: boolean
  firstLogin: boolean
  user_email: string
  ultimo_acesso: string | null
  base_profile?: string
  unit_id?: string
}

export interface NovoUsuarioData {
  nome: string
  cargo?: string
  tipo_usuario: boolean
  email?: string // Opcional pois será gerado automaticamente
}

export interface UpdateUsuarioData {
  nome?: string
  cargo?: string
  adminProfile?: boolean
  base_profile?: string
  unit_id?: string
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