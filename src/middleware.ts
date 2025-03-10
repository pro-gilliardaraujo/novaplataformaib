import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })

    // Verifica se é a primeira requisição após o servidor iniciar
    const isFirstRequest = !request.cookies.get('permissions_initialized')

    if (isFirstRequest) {
      // Busca todos os recursos
      const { data: resources } = await supabase
        .from('resources')
        .select('*')

      if (resources && resources.length > 0) {
        // Busca todas as unidades
        const { data: units } = await supabase
          .from('units')
          .select('*')

        if (units && units.length > 0) {
          // Associa recursos às unidades
          for (const unit of units) {
            for (const resource of resources) {
              await supabase
                .from('resource_units')
                .upsert({
                  resource_id: resource.id,
                  unit_id: unit.id
                }, {
                  onConflict: 'resource_id,unit_id'
                })
            }
          }
        }

        // Busca todos os usuários
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')

        if (profiles && profiles.length > 0) {
          // Configura permissões para cada usuário
          for (const profile of profiles) {
            // Configura permissões base
            await supabase
              .from('user_permissions')
              .upsert({
                user_id: profile.user_id,
                base_profile: profile.adminProfile ? 'global_admin' : 'custom',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              })

            // Se for admin, configura todas as permissões
            if (profile.adminProfile) {
              const resourcePermissions = resources.map(resource => ({
                user_id: profile.user_id,
                resource_id: resource.id,
                resource_type: resource.type,
                permissions: ['view', 'edit', 'admin']
              }))

              await supabase
                .from('resource_permissions')
                .upsert(resourcePermissions, {
                  onConflict: 'user_id,resource_id'
                })
            }
          }
        }
      }

      // Marca que a inicialização foi feita
      res.cookies.set('permissions_initialized', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 dias
      })
    }

    return res
  } catch (error) {
    console.error('Erro no middleware:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 