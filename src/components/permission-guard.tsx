"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCheckPermission } from "@/hooks/useCheckPermission"
import { PermissionType } from "@/types/user"

interface PermissionGuardProps {
  resourceType: "category" | "page" | "panel"
  resourceName: string
  requiredPermission: PermissionType
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({
  resourceType,
  resourceName,
  requiredPermission,
  children,
  fallback
}: PermissionGuardProps) {
  const router = useRouter()
  const checkPermission = useCheckPermission()

  useEffect(() => {
    const verifyPermission = async () => {
      const hasPermission = await checkPermission(
        resourceType,
        resourceName,
        requiredPermission
      )

      if (!hasPermission && !fallback) {
        router.push("/unauthorized")
      }
    }

    verifyPermission()
  }, [resourceType, resourceName, requiredPermission, router, checkPermission, fallback])

  return children
} 