"use client"

import { useEffect, useState } from "react"
import { useCheckPermission } from "@/hooks/useCheckPermission"
import { PermissionType } from "@/types/user"

interface PermissionGateProps {
  resourceType: "category" | "page" | "panel"
  resourceName: string
  requiredPermission: PermissionType
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({
  resourceType,
  resourceName,
  requiredPermission,
  children,
  fallback
}: PermissionGateProps) {
  const [hasPermission, setHasPermission] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const checkPermission = useCheckPermission()

  useEffect(() => {
    const verifyPermission = async () => {
      const permitted = await checkPermission(
        resourceType,
        resourceName,
        requiredPermission
      )
      setHasPermission(permitted)
      setIsChecking(false)
    }

    verifyPermission()
  }, [resourceType, resourceName, requiredPermission, checkPermission])

  if (isChecking) {
    return null
  }

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
} 