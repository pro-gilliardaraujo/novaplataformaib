import { supabase } from "@/lib/supabase"
import { ResourcePermission, PermissionType } from "@/types/user"

interface Resource {
  id: string
  name: string
  type: string
}

interface ResourcePermissionDB {
  id: string
  resource_id: string
  resource_type: string
  permissions: PermissionType[]
  resources: Resource
}

interface ResourcePermissionResponse {
  id: string
  resource_id: string
  resource_type: string
  permissions: PermissionType[]
  resources: {
    id: string
    name: string
    type: string
  }
}

export const permissionService = {
  async getUserPermissions(userId: string) {
    console.log("Buscando permissões para o usuário:", userId)
    
    try {
      // Primeiro busca as permissões base do usuário
      const { data: userPermission, error: userError } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", userId)
        .single()

      console.log("Permissões base do usuário:", userPermission)
      console.log("Erro nas permissões base:", userError)

      if (userError && userError.code !== 'PGRST116') {
        console.error("Erro ao buscar permissões do usuário:", userError)
        throw userError
      }

      let baseProfile = "custom"
      let unitId = null

      if (userPermission) {
        baseProfile = userPermission.base_profile
        unitId = userPermission.unit_id
        console.log("Perfil base encontrado:", baseProfile)
        console.log("Unidade encontrada:", unitId)
      } else {
        console.log("Usuário não tem permissões definidas, criando perfil padrão")
        // Se não existir, cria um perfil padrão
        const { data: newPermission, error: createError } = await supabase
          .from("user_permissions")
          .insert({
            user_id: userId,
            base_profile: "custom",
          })
          .select()
          .single()

        if (createError) {
          console.error("Erro ao criar permissões padrão:", createError)
          // Não lança erro, apenas loga e continua com o perfil padrão
          console.log("Continuando com perfil padrão sem persistir")
        } else {
          console.log("Permissões padrão criadas:", newPermission)
        }
      }

      // Busca todos os recursos disponíveis
      const { data: allResources, error: resourcesError } = await supabase
        .from("resources")
        .select(`
          id,
          name,
          type,
          unit_id,
          resource_units!left (
            unit_id
          )
        `)
        .order('type')
        .order('name')

      console.log("Recursos encontrados:", allResources)
      console.log("Erro ao buscar recursos:", resourcesError)

      if (resourcesError) {
        console.error("Erro ao buscar recursos:", resourcesError)
        return {
          base_profile: baseProfile as any,
          unit_id: unitId,
          resources: []
        }
      }

      // Busca as permissões de recursos do usuário
      const { data: resourcePermissions, error: resourceError } = await supabase
        .from("resource_permissions")
        .select(`
          id,
          resource_id,
          resource_type,
          permissions
        `)
        .eq("user_id", userId)

      console.log("Permissões de recursos do usuário:", resourcePermissions)
      console.log("Erro ao buscar permissões de recursos:", resourceError)

      if (resourceError) {
        console.error("Erro ao buscar permissões de recursos:", resourceError)
        return {
          base_profile: baseProfile as any,
          unit_id: unitId,
          resources: []
        }
      }

      // Mapeia todos os recursos, incluindo as permissões do usuário quando existirem
      const resources = allResources.map(resource => {
        const userPermission = resourcePermissions?.find(rp => rp.resource_id === resource.id)
        return {
          id: resource.id,
          name: resource.name,
          type: resource.type,
          unit_id: resource.unit_id,
          unit_ids: resource.resource_units?.map(ru => ru.unit_id) || [],
          permissions: userPermission?.permissions || []
        }
      })

      // Agrupa recursos por tipo para melhor organização
      const groupedResources = resources.reduce((acc, resource) => {
        const group = acc[resource.type] || []
        group.push(resource)
        acc[resource.type] = group
        return acc
      }, {} as Record<string, typeof resources>)

      console.log("Recursos mapeados:", resources)
      console.log("Recursos agrupados:", groupedResources)

      // Formata os dados para retornar
      return {
        base_profile: baseProfile as any,
        unit_id: unitId,
        resources: resources,
        groupedResources
      }
    } catch (error) {
      console.error("Erro completo ao buscar permissões:", error)
      // Retorna um objeto válido mesmo em caso de erro
      return {
        base_profile: "custom" as const,
        unit_id: null,
        resources: []
      }
    }
  },

  async updateUserPermissions(userId: string, permissions: {
    base_profile: string
    unit_id?: string
    resources: ResourcePermission[]
  }) {
    console.log("Atualizando permissões para o usuário:", userId)
    console.log("Novas permissões:", permissions)

    try {
      // Primeiro atualiza o perfil base e unidade
      const { error: updateError } = await supabase
        .from("user_permissions")
        .upsert({
          user_id: userId,
          base_profile: permissions.base_profile,
          unit_id: permissions.unit_id
        })

      if (updateError) {
        console.error("Erro ao atualizar permissões base:", updateError)
        throw updateError
      }

      // Atualiza as permissões de recursos
      const { error: deleteError } = await supabase
        .from("resource_permissions")
        .delete()
        .eq("user_id", userId)

      if (deleteError) {
        console.error("Erro ao limpar permissões de recursos:", deleteError)
        throw deleteError
      }

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

        if (insertError) {
          console.error("Erro ao inserir novas permissões de recursos:", insertError)
          throw insertError
        }
      }

      return true
    } catch (error) {
      console.error("Erro completo ao atualizar permissões:", error)
      throw error
    }
  },

  async checkPermission(
    userId: string,
    resourceId: string,
    requiredPermission: PermissionType
  ): Promise<boolean> {
    try {
      const { data: userPermission, error } = await supabase
        .from("user_permissions")
        .select(`
          base_profile,
          unit_id,
          resource_permissions!left (
            permissions
          )
        `)
        .eq("user_id", userId)
        .eq("resource_permissions.resource_id", resourceId)
        .single()

      if (error) {
        console.error("Erro ao verificar permissão:", error)
        return false
      }

      if (!userPermission) {
        console.log("Usuário não tem permissões definidas")
        return false
      }

      // Se é admin global, tem todas as permissões
      if (userPermission.base_profile === "global_admin") return true

      // Se é admin regional, verifica se o recurso pertence à sua unidade
      if (userPermission.base_profile === "regional_admin") {
        const { data: resource } = await supabase
          .from("resources")
          .select(`
            unit_id,
            resource_units!left (
              unit_id
            )
          `)
          .eq("id", resourceId)
          .single()

        if (resource) {
          // Verifica se o recurso pertence diretamente à unidade do usuário
          if (resource.unit_id === userPermission.unit_id) return true
          
          // Ou se está associado através da tabela resource_units
          if (resource.resource_units?.some(ru => ru.unit_id === userPermission.unit_id)) return true
        }
      }

      // Verifica permissões específicas
      if (!userPermission.resource_permissions || userPermission.resource_permissions.length === 0) {
        return false
      }

      return userPermission.resource_permissions.some(
        (rp: any) => rp.permissions && rp.permissions.includes(requiredPermission)
      )
    } catch (error) {
      console.error("Erro completo ao verificar permissão:", error)
      return false
    }
  }
} 