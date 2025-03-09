"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/hooks/usePermissions"
import { PermissionType } from "@/types/user"

interface PermissionGuardProps {
  resourceId: string
  requiredPermission: PermissionType
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({
  resourceId,
  requiredPermission,
  children,
  fallback
}: PermissionGuardProps) {
  const router = useRouter()
  const { checkPermission, loading, isGlobalAdmin } = usePermissions()
  const [hasPermission, setHasPermission] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verifyPermission = async () => {
      if (loading) return
      
      // Administradores globais têm acesso a tudo
      if (isGlobalAdmin) {
        setHasPermission(true)
        setIsChecking(false)
        return
      }

      try {
        const permitted = await checkPermission(resourceId, requiredPermission)
        setHasPermission(permitted)
      } catch (error) {
        console.error("Erro ao verificar permissão:", error)
        setHasPermission(false)
      } finally {
        setIsChecking(false)
      }
    }

    verifyPermission()
  }, [resourceId, requiredPermission, loading, isGlobalAdmin, checkPermission])

  if (isChecking || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Acesso Negado</h2>
          <p className="mt-2 text-gray-600">
            Você não tem permissão para acessar este recurso.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 