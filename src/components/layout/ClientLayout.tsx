"use client"

import { useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loading } = useAuth()
  const isPublicRoute = pathname === '/login'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  if (isPublicRoute) {
    return children
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent">
        {children}
      </main>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 15, // 15 minutos
        refetchInterval: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LayoutContent>
          {children}
        </LayoutContent>
      </AuthProvider>
    </QueryClientProvider>
  )
} 