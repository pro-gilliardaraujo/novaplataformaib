import { supabase } from "@/lib/supabase"

export interface PagePermission {
  page_id: string
  page_name: string
  category_id: string
  category_name: string
  category_order: number
  can_access: boolean
}

export interface UserPermissions {
  user_id: string
  is_admin: boolean
  pages: PagePermission[]
}

class PermissionService {
  async initializeUserPermissions(userId: string, isAdmin: boolean): Promise<void> {
    const { error } = await supabase.rpc('initialize_user_page_permissions', {
      p_user_id: userId,
      p_is_admin: isAdmin
    })

    if (error) {
      console.error('Erro ao inicializar permissões:', error)
      throw error
    }
  }

  async getUserPermissions(userId: string): Promise<PagePermission[]> {
    const { data, error } = await supabase.rpc('get_user_accessible_pages', {
      p_user_id: userId
    })

    if (error) {
      console.error('Erro ao buscar permissões:', error)
      throw error
    }

    return data || []
  }

  async updateUserPermissions(userId: string, pageId: string, canAccess: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_page_permissions')
      .upsert({
        user_id: userId,
        page_id: pageId,
        can_access: canAccess
      }, {
        onConflict: 'user_id,page_id'
      })

    if (error) {
      console.error('Erro ao atualizar permissões:', error)
      throw error
    }
  }

  async updateMultiplePermissions(userId: string, permissions: { page_id: string, can_access: boolean }[]): Promise<void> {
    const { error } = await supabase
      .from('user_page_permissions')
      .upsert(
        permissions.map(p => ({
          user_id: userId,
          page_id: p.page_id,
          can_access: p.can_access
        })),
        {
          onConflict: 'user_id,page_id'
        }
      )

    if (error) {
      console.error('Erro ao atualizar múltiplas permissões:', error)
      throw error
    }
  }
}

export const permissionService = new PermissionService() 