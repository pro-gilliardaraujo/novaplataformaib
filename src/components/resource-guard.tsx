"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/hooks/usePermissions"
import { PermissionType } from "@/types/user"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ResourceGuardProps {
  resourceId: string
  requiredPermission: PermissionType
  unitId?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ResourceGuard({
  resourceId,
  requiredPermission,
  unitId,
  children,
  fallback
}: ResourceGuardProps) {
  const router = useRouter()
  const { checkPermission, loading, isGlobalAdmin, userUnitId, unitResources } = usePermissions()
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

      // Se o recurso pertence a uma unidade específica, verifica se o usuário tem acesso
      if (unitId && userUnitId !== unitId) {
        setHasPermission(false)
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
  }, [resourceId, requiredPermission, unitId, loading, isGlobalAdmin, userUnitId, checkPermission])

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
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar este recurso.
          {unitId && userUnitId !== unitId && " Este recurso pertence a outra unidade."}
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
} 