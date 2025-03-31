"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  // Remover a lógica de autenticação
  // const { user, loading } = useAuth()
  // const router = useRouter()

  // useEffect(() => {
  //  if (!loading && user) {
  //    router.push("/")
  //  }
  // }, [user, loading, router])

  // if (loading) {
  //  return (
  //    <div className="min-h-screen flex items-center justify-center">
  //      <p>Carregando...</p>
  //    </div>
  //  )
  // }

  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
} 