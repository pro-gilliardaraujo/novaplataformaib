"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface PermissionGuardProps {
  children: React.ReactNode
  pageSlug: string
}

export function PermissionGuard({ children, pageSlug }: PermissionGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkPermission = async () => {
      if (!user) return

      // Verifica se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('adminProfile')
        .eq('id', user.id)
        .single()

      if (profile?.adminProfile) {
        return // Admin tem acesso a tudo
      }

      // Verifica permissão específica
      const { data: permission } = await supabase
        .from('user_page_permissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('page_slug', pageSlug)
        .single()

      if (!permission) {
        router.replace('/unauthorized')
      }
    }

    if (!loading) {
      checkPermission()
    }
  }, [user, loading, pageSlug, router])

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    router.replace('/login')
    return null
  }

  return <>{children}</>
} 